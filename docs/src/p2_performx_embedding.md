# Embedding in PerformX

Phase 2 makes the career portal a tab inside PerformX. The scope document is
explicit that this is embedding, not rebuilding: existing features and flows
stay as they are.

The work spans both repositories. This page covers it from the CareerX side; the
PerformX handbook has a matching page.

## Fix the employee sync first

Nothing else in this section is worth starting until `hr_employees` is accurate.

`PerformxClient.getEmployees()` calls
`GET {PERFORMX_API_URL}/api/v1/internal/employees`. PerformX does not serve that
endpoint. The sync has been failing on startup and every six hours since it was
written. See
[Known gaps](p1_known_gaps.md#the-employee-sync-calls-an-endpoint-that-does-not-exist).

The fix lands in PerformX:

```ts
@ApiExcludeController()
@Public()
@Controller('internal/employees')
@UseGuards(InternalApiGuard)
export class InternalEmployeesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getEmployees() {
    return this.usersService.findInternal();
  }
}
```

Return `{ id, fullName, email, departmentId, role, isActive }` per user. Filter
out soft-deleted users. Do not filter out inactive ones, because CareerX needs
to know somebody was deactivated in order to deactivate their `hr_employees`
row, which is the whole point of the sync.

The CareerX client accepts a bare array or a `{ data: [...] }` envelope, and
either camelCase or snake_case keys, so the shape is forgiving.

Expect the first successful run to produce a batch of corrections. Users who
have never logged in will appear, deactivated users will be marked inactive, and
department changes will propagate. Look at what changes before assuming it is a
clean fix.

## Set PERFORMX_JWT_SECRET

`SSOExchangeService.preVerifyPerformxJwt()` returns immediately when the secret
is unset, skipping signature, expiry, and issuer checks. Only the remote call to
PerformX remains.

Set it in every environment. Consider making the service throw at startup when
it is missing in production, so the degraded mode cannot survive a deploy.

## Cookies and domains

The production transport for the PerformX token is the `px_at` HTTP-only cookie.
That requires both applications under one parent domain, with
`AUTH_COOKIE_DOMAIN` set on the CareerX side and `AUTH_COOKIE_SECURE` true.

A layout that works:

```
app.ruchiperformx.in        PerformX client
api.ruchiperformx.in        PerformX API
careers.ruchiperformx.in    CareerX HR console
jobs.ruchiperformx.in       CareerX public job board
careers-api.ruchiperformx.in  CareerX API
AUTH_COOKIE_DOMAIN=.ruchiperformx.in
```

If the domains cannot be arranged this way, the fallback is the
`Authorization: Bearer` header transport, which means the PerformX JWT has to be
readable by JavaScript in order to be sent. That is a meaningful downgrade from
an HTTP-only cookie.

This is a DNS and hosting decision, not an engineering one, so raise it in week
one of the phase. It is the item most likely to take calendar time.

The two public hostnames also have to match `NEXT_PUBLIC_CANDIDATE_DOMAIN` and
`NEXT_PUBLIC_HR_DOMAIN`, which drive `client/middleware.ts`. The middleware
returns early when `NODE_ENV !== 'production'`, so test any change to it with a
production build.

## How the tab works

Three options, in order of preference.

### Same-tab navigation, with a way back

The Career nav item in PerformX navigates the browser to the CareerX HR host.
CareerX renders its own shell with a "back to PerformX" link.

This is what the existing SSO exchange already does. No iframe, no cross-origin
frame problems, no chromeless variant to build and maintain. The user visibly
leaves PerformX, which for a tab HR uses for a stretch at a time rather than
glancing at is acceptable.

Take this one.

### An iframe

Looks more integrated. Requires CareerX to serve a variant without its own
navigation, `frame-ancestors` configured in the CSP, and cookies that survive an
iframe in every browser the client uses. Not worth it at this budget.

### Rebuilding the screens in PerformX

Explicitly out of scope.

## The PerformX side

`Ruchi-PerformX/client/app/(protected)/career/page.tsx` already exists as a
stub. Wire it to:

1. Read the current PerformX session
2. Navigate to the CareerX exchange route with the token attached, by cookie in
   production or by parameter in development
3. Let CareerX complete the exchange and redirect to its dashboard

Show the Career nav item only when the user has career access. The signal is
`users.can_access_career_hr` on the PerformX side, which is already returned by
`/auth/verify` as `careerAccess`, or the user's role being mapped in CareerX's
`hr_role_permissions`.

The simplest version is to gate on `can_access_career_hr`, which PerformX
already knows without asking CareerX anything. A nav item that 403s on click
reads as broken software, so gate it rather than letting everyone try.

## The CareerX side

`app/(hr)/auth/exchange/page.tsx` is the landing page. It already calls
`POST /auth/exchange` and redirects to `/dashboard`.

Two additions:

**A return link.** A visible way back to PerformX, using
`NEXT_PUBLIC_PERFORMX_LOGIN_URL` or a dedicated
`NEXT_PUBLIC_PERFORMX_APP_URL`. HR should not have to use the browser back
button.

**Better failure handling.** Today every exchange failure is an opaque
`Unauthorized`. That is correct for the API response but unhelpful on screen.
The exchange page should distinguish, for the user, between "your PerformX
session expired, sign in again" and "you do not have career access, ask your
administrator." The API can keep returning the same opaque error; the page can
branch on the HTTP status.

## Verifying it works

Once wired, check by hand:

1. Log in to PerformX as a user with `can_access_career_hr = true`. The Career
   nav item appears. Click it. You land on the CareerX dashboard with a
   `career_at` cookie set.
2. Log in as a user without career access. The nav item does not appear.
3. Navigate directly to the CareerX exchange route with an expired PerformX
   token. You get a readable message, not a blank page.
4. Stop the PerformX API and repeat step 1. You should get a 503 quickly, not an
   8 second hang, because the circuit breaker opens.
5. Wait past the 15 minute access token lifetime with the CareerX tab open. The
   refresh should happen transparently.
6. Open CareerX in three tabs at once and let them all refresh. None should be
   logged out. This is what the 30 second reuse grace window protects.

Write these down in the pull request. There is no test suite to catch a
regression here.
