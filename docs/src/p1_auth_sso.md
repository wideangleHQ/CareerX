# Auth and SSO

CareerX has no login screen and no password column. Every HR user signs in to
PerformX and exchanges that session for a CareerX one. Candidates never
authenticate at all.

Files: `server/src/modules/auth/`, especially `sso-exchange.service.ts`,
`auth.service.ts`, and `utils/`.

## The exchange, step by step

```
1. User is signed in to PerformX and clicks through to CareerX
2. Browser arrives at CareerX carrying the PerformX token
3. POST /api/v1/auth/exchange
4. resolveIncomingToken()   pull the token from cookie or header
5. preVerifyPerformxJwt()   local: HS256 signature, expiry, issuer
6. PerformxClient.verifyToken()  remote: POST to PerformX /auth/verify
7. getPermissions(role)     local: hr_role_permissions lookup
8. ensureHrEmployee(user)   local: upsert the cached employee row
9. issueSession()           sign career_at, store career_rt in Redis
10. Redirect to /dashboard
```

### Step 4: where the token comes from

`resolveIncomingToken()` is the only place in the codebase that reads a PerformX
token. It checks two transports, in this order:

The `px_at` cookie, which is the production path. It requires both applications
on the same parent domain so the browser sends the cookie automatically.

An `Authorization: Bearer` header, which is the development path.

If neither is present it throws a bare `UnauthorizedException('Unauthorized')`.
Every failure in this service throws the same opaque message. That is
deliberate: a specific error tells an attacker which check failed. It also makes
debugging harder, so when a legitimate exchange fails, work through the steps in
order rather than reading the response.

### Step 5: local pre-verification

`preVerifyPerformxJwt()` verifies the token without a network call: algorithm
must be HS256, the HMAC must match using `timingSafeEqual`, and `exp` must be in
the future.

**It returns immediately and does nothing when `PERFORMX_JWT_SECRET` is unset.**
The comment in the code says this keeps early development unblocked before the
secret is shared. In production it means a PerformX outage degrades to no
verification rather than to a failure, because step 6 is the only remaining
check. Set the secret. See [Known gaps](p1_known_gaps.md).

### Step 6: remote verification

`PerformxClient.verifyToken()` posts to
`{PERFORMX_API_URL}/api/v1/auth/verify` with an 8 second timeout, and expects:

```json
{
  "userId": "...",
  "email": "...",
  "role": "HOD",
  "departmentId": "...",
  "departmentName": "...",
  "careerAccess": true
}
```

401 or 403 becomes `UnauthorizedException`. Anything else, including a timeout,
becomes `ServiceUnavailableException`. A missing or malformed field also becomes
`UnauthorizedException`, which is the right default: an unparseable response is
not a valid identity.

This is where the circuit breaker sits. Verified tokens are cached in Redis for
60 seconds under `career:verify:<sha256 of token>`, so opening five tabs makes
one call rather than five.

### Step 7: permissions

`getPermissions(role)` reads `hr_role_permissions` for the PerformX role string
and returns the matching `permission_enum` values.

There is a bypass: if `careerAccess` is true and the role maps to no
permissions, `getAllHRPermissions()` grants everything. `careerAccess` is
`users.can_access_career_hr` on the PerformX side. It is the manual override for
a user whose role is not mapped but who should have access.

That means a user with `can_access_career_hr = true` and an unmapped role gets
full CareerX permissions including `CAREER_ADMIN`. Be careful with the flag.

### Step 8: employee cache

`ensureHrEmployee()` upserts the `hr_employees` row from the verified PerformX
data. This is why a brand new HR user can log in before the six-hourly employee
sync has run.

### Step 9: session

`issueSession()` signs a `career_at` JWT and generates an opaque `career_rt`
refresh token stored in Redis.

| Token | Type | Lifetime | Storage |
| --- | --- | --- | --- |
| `career_at` | signed JWT | 15 minutes | HTTP-only cookie |
| `career_rt` | opaque random | 7 days | Redis, `career:rt:<token>` |

The PerformX token is never stored, never logged, and never returned to the
caller. That invariant is stated in the service header comment and is worth
preserving.

## Refresh

`POST /auth/refresh` reads the `career_rt` cookie, looks up the Redis record,
and issues a fresh pair.

Two details in `AuthService.refresh()` are worth understanding before you edit
it.

**Rotation uses a grace window, not immediate deletion.** The old refresh token
stays valid for 30 seconds (`AUTH_TTL_SECONDS.refreshReuseGrace`) rather than
being deleted. The reason is in the code comment: multiple tabs share one cookie
jar and refresh independently, so single-use deletion means the tab that loses
the race gets a false 401 and its page dies. The tradeoff is a 30 second replay
window against a real, frequent usability failure.

**Redis being down is a 503, not a 401.** If the key is missing, the code pings
Redis. No response means `ServiceUnavailableException`. A response means the
token really is gone, so `UnauthorizedException`. Without this, a Redis blip
logs out every user simultaneously and they all have to go back through PerformX.

Permissions are re-read from `hr_role_permissions` on every refresh, so a
permission change takes effect within 15 minutes rather than at the next full
login.

## Guards

`CareerJwtAuthGuard` reads `career_at` from the cookie, falls back to a Bearer
header, verifies with `CAREER_JWT_SECRET`, and sets `request.user`.

`PermissionsGuard` reads `@Permissions(...)` and requires that the user has
**every** listed permission, not any of them:

```ts
const allowed = required.every((p) => permissions.includes(p));
```

Two permissions on one handler means both are needed. If you want "either of
these," list one permission and handle the other case in the service.

Neither guard is registered globally. A controller method with no `@UseGuards`
is public. That is how the candidate endpoints work and it is also the easiest
way to accidentally publish something. When you add an endpoint, decide
explicitly and write the decorator.

## Public endpoints

Reachable with no authentication at all:

| Method | Path | Why |
| --- | --- | --- |
| GET | `/opportunities/public` | the job board |
| GET | `/departments/hiring` | department filter on the job board |
| POST | `/candidates` | apply |
| POST | `/applications` | apply |
| GET | `/interview-slots/available` | slot picker |
| POST | `/interview-slots/book` | booking |
| GET | `/health`, `/health/ready`, `/health/live` | infrastructure |

`POST /applications` and `POST /interview-slots/book` are the two that accept
writes from the open internet. They need rate limiting, which they do not have.
See [Known gaps](p1_known_gaps.md#no-rate-limiting-on-public-write-endpoints).

## The `careerAccess` flag

Worth restating because it is the thing most likely to surprise you.

`users.can_access_career_hr` lives in the PerformX database, is returned as
`careerAccess` by `/auth/verify`, and does two things in CareerX:

1. It bypasses `validateHRResult`, which otherwise rejects a user with zero
   permissions.
2. It grants all HR permissions when the role maps to none.

To give someone CareerX access, either map their PerformX role in
`hr_role_permissions` (preferred, because it is role-based and repeatable) or
set the flag on their PerformX user (a manual override that grants everything).

## Cookies in production

`AUTH_COOKIE_DOMAIN` must be the parent domain shared with PerformX for the
`px_at` cookie transport to work. `AUTH_COOKIE_SECURE` must be `true`.

If the domains cannot be arranged that way, the fallback is the header
transport, which means the PerformX JWT travels somewhere JavaScript can read
it. That is a meaningful downgrade. Settle the domain layout before Phase 2
embeds the portal in the PerformX shell; see
[Embedding in PerformX](p2_performx_embedding.md).
