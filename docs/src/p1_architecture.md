# Architecture

## The pieces

```
Candidate browser  ------\
                          >--  Next.js 16 (port 3001, two hostnames in prod)
HR browser  -------------/          |
                                    |  axios, career_at cookie or Bearer
                                    v
                          NestJS 11 API (port 3000, prefix /api/v1)
                                    |
    +-------------------------------+-------------------------------+
    |            |            |            |            |           |
 Prisma 7     Redis      BullMQ x4   Supabase Storage  Resend   PerformX API
    |            |            |            |            |           |
 Postgres   sessions,    email,      5 buckets       email    verify token,
 (Supabase) breaker,   notifications,                          sync depts,
            queue data  reports,                               sync employees
                        resume-parser
```

Everything runs in one Node process, including the BullMQ workers. There is no
separate worker deployment. The queues give you retry, backoff, and observability
inside a single process, not horizontal scale.

## Request path

`main.ts` sets the global prefix to `api/v1` and configures CORS from
`CORS_ORIGINS`. An empty allowlist permits every origin, which is a development
convenience that must not reach production.

`AppModule` registers `CorrelationMiddleware` on every route and
`LoggingInterceptor` as a global interceptor. Every request gets a correlation ID
that flows into the structured logger, so a single request can be traced through
the log output. PerformX does not have this.

Authorization is two decorators deep, and unlike PerformX the guards are not
global:

`CareerJwtAuthGuard` reads the `career_at` cookie first, then falls back to an
`Authorization: Bearer` header. It verifies the token with `CAREER_JWT_SECRET`
and puts the payload on `request.user`.

`PermissionsGuard` reads `@Permissions(...)` metadata and checks that
`request.user.permissions` contains every required permission. Note `every`, not
`some`: listing two permissions on a handler requires both.

Because the guards are not global, an endpoint without `@UseGuards` is fully
public. That is how the candidate-facing endpoints work, and it means forgetting
the decorator silently publishes an endpoint rather than locking it. Check every
new controller method against [the API reference](p1_api_reference.md).

## Module layout

```
server/src/
  main.ts                    bootstrap, prefix, CORS
  app.module.ts              module wiring, correlation middleware, logging interceptor
  prisma/                    PrismaService
  redis/                     RedisService
  storage/                   Supabase wrapper and bucket config
  common/
    decorators/              @Permissions, @Public, @CurrentUser
    guards/                  CareerJwtAuthGuard, PermissionsGuard
    interceptors/            logging, response, audit-log
    filters/                 http-exception filter
    middleware/              correlation ID
    queue/                   BullMQ root config and queue registration
    events/                  career events module
    types/                   CareerJwtPayload, PerformxJwtPayload
    utils/                   structured logger
  integrations/performx/     client, department sync, employee sync
  modules/
    auth/                    SSO exchange, refresh, logout, me
    opportunities/           job postings, public and internal views
    candidates/              person records
    applications/            the pipeline, offers
    interview-slots/         availability and booking
    interview-feedback/      post-interview ratings
    hr-notes/                free-form notes, and offers (see below)
    files/                   candidate document access
    email/                   Resend wrapper plus ten templates
    notifications/           in-app notification log
    departments/             cached from PerformX, hiring toggle
    reports/                 analytics and exports
    audit-logs/              admin-only trail
    permissions/             role to permission mapping
    resumes/                 upload endpoint
    dashboard/               HR home aggregates
    health/                  health, ready, live, detailed
    monitoring/              queue and performance metrics
  scheduler/                 five cron jobs
  workers/                   four BullMQ workers
```

Two modules are worth flagging up front.

`hr-notes` stores offers. Offer documents are written as JSON strings into
`hr_notes.note` with a `{"type":"OFFER_DOCUMENT"` prefix and retrieved with a
`startsWith` query. There is no offers table. See
[Known gaps](p1_known_gaps.md#offers-live-inside-hr-notes).

`permissions` has a module and a service but its controller file is empty. The
permission mapping is read directly by `AuthService` during the exchange.

## Client layout

```
client/
  middleware.ts        domain split, production only
  app/
    (public)/          job board, job detail, apply, apply success, book interview
    (hr)/              dashboard, opportunities, applications, candidates,
                       interviews, offers, reports, notifications,
                       departments, settings, auth/exchange
  src/
    api/               one file per backend domain
    hooks/             TanStack Query wrappers
    context/           AuthContext
    config/            queryClient
    lib/               validation, slot-time helpers
  components/ui/       shadcn primitives
```

`(public)` and `(hr)` are route groups, not URL segments. The real separation
between the two audiences is `middleware.ts` plus the guards on the API.

`app/(hr)/auth/exchange/page.tsx` is the landing page of the SSO handshake. It
takes the PerformX token, calls `POST /auth/exchange`, and redirects to the
dashboard.

## Sessions

CareerX issues two tokens.

`career_at` is a signed JWT with a 15 minute lifetime, delivered as an HTTP-only
cookie. It carries `sub`, `email`, `departmentId`, `permissions`, and
`canAccessCareerHR`.

`career_rt` is an opaque random string with a 7 day lifetime, stored in Redis
under `career:rt:<token>`. Refreshing rotates it.

Rotation has a 30 second reuse grace window rather than deleting the old token
immediately. The comment in `auth.service.ts` explains why: multiple browser
tabs share one cookie jar and refresh independently, and single-use deletion
means the tab that loses the race gets a spurious 401 and dies. The grace window
is a deliberate tradeoff of a small replay window against a real usability bug.

`AuthService.refresh()` also distinguishes "token revoked" from "Redis is down."
A missing key when Redis is reachable is a 401. A missing key when Redis does
not respond to `ping` is a 503. That distinction matters: without it, a Redis
outage logs out every user at once.

## Circuit breaker

`PerformxCircuitBreaker` in `modules/auth/utils/circuit-breaker.util.ts` wraps
calls to the PerformX API. Failure counts and the open flag live in Redis under
`career:performx:breaker:*`, with a 30 second window and a 30 second open
period.

If PerformX is down, CareerX stops hammering it and fails fast with a 503
instead of holding requests open until the 8 second fetch timeout. Existing
CareerX sessions keep working for their 15 minute access token lifetime, so a
short PerformX outage is invisible to HR users already logged in.

Verified PerformX tokens are also cached in Redis for 60 seconds under
`career:verify:<hash>`, which cuts repeat verification traffic during a burst
of tab openings.

## Data ownership

CareerX owns everything in its database except two cached tables.

`departments` and `hr_employees` mirror PerformX. Their primary keys are the
same UUIDs as the PerformX rows, deliberately, so that a foreign key in CareerX
points at a real PerformX entity without a translation table. `synced_at`
records the last refresh.

Never create rows in either table by hand outside the sync. If a user is missing
from `hr_employees`, the fix is in the sync, not an insert.

## Where CareerX is ahead of PerformX

If you move between the two repositories, these exist here and not there:

- BullMQ queues with retry and exponential backoff
- Health, readiness, and liveness endpoints
- An operations monitoring module with queue and performance metrics
- Correlation IDs and a structured logger
- A global exception filter and a response interceptor
- HTML email templates
- A circuit breaker on an external dependency
- Refresh tokens with rotation

When PerformX needs one of these in Phase 2, copy the CareerX implementation
rather than inventing a second one.
