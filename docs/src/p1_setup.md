# Local setup

Two processes plus a Redis instance, against a hosted database. Redis is not
optional here, unlike PerformX: sessions, refresh tokens, the PerformX circuit
breaker, and all four BullMQ queues depend on it.

## Prerequisites

Node 20 or newer. Bun lockfiles are committed in both `server` and `client`;
pick bun or npm and stay with it.

Redis, either locally or a hosted instance:

```bash
docker run -d -p 6379:6379 --name careerx-redis redis:7-alpine
```

You also need the Supabase connection string and service role key, a Resend API
key, and the two shared secrets with PerformX (`PERFORMX_JWT_SECRET` and
`PERFORMX_INTERNAL_API_KEY`). Ask the team lead.

You need a running PerformX API too, or at least reachable one, because the
login flow calls it. Nothing in the HR console works without it. The public job
board does.

## Server

```bash
cd server
bun install
npx prisma generate
bun run dev
```

Default port is 3000 (`PORT ?? 3000`). Global prefix is `api/v1`, so the local
base URL is `http://localhost:3000/api/v1`.

### Server environment

`server/.env`:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Supabase Postgres |
| `REDIS_URL` | yes | Sessions and queues both die without it |
| `CAREER_JWT_SECRET` | yes | Signs the `career_at` access token |
| `PERFORMX_API_URL` | yes | Defaults to `https://api.ruchiperformx.in` |
| `PERFORMX_JWT_SECRET` | see note | Enables local pre-verification of PerformX tokens |
| `PERFORMX_INTERNAL_API_KEY` | yes | Sent as `x-internal-api-key` on sync calls |
| `CORS_ORIGINS` | yes | Comma separated. Empty means allow everything |
| `AUTH_COOKIE_DOMAIN` | production | Parent domain shared with PerformX |
| `AUTH_COOKIE_SECURE` | production | `true` in production |
| `RESEND_API_KEY` | yes | Outbound email |
| `EMAIL_FROM` | yes | Verified sender |
| `SUPABASE_URL` | yes | Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Storage, server side only |
| `SUPABASE_STORAGE_BUCKET_CANDIDATE` | no | Defaults to `candidate-documents` |
| `SUPABASE_STORAGE_BUCKET_OFFERS` | no | Defaults to `offer-documents` |
| `SUPABASE_STORAGE_BUCKET_INTERVIEWS` | no | Defaults to `interview-assets` |
| `SUPABASE_STORAGE_BUCKET_ORGANIZATION` | no | Defaults to `organization-assets` |
| `SUPABASE_STORAGE_BUCKET_EXPORTS` | no | Defaults to `exports` |
| `SIGNED_URL_EXPIRY` | no | Seconds, defaults to 900 |
| `MAX_UPLOAD_SIZE_MB` | no | Defaults to 10 |
| `APP_RETENTION_DAYS` | no | Used by the nightly application cleanup cron |
| `NEXT_PUBLIC_APP_URL` | yes | Read on the server for email links |
| `PORT` | no | Defaults to 3000 |

Two of these deserve attention in development.

**`CORS_ORIGINS` empty means allow every origin.** `main.ts` treats an empty
list as permissive. Convenient locally, wrong in production. Confirm it is set
before any deploy.

**`PERFORMX_JWT_SECRET` unset means no local verification.** `SSOExchangeService`
skips signature, expiry, and issuer checks entirely when the secret is missing
and relies on the remote call to PerformX instead. That was a deliberate
allowance so development could start before the secret was shared. Set it.

## Client

```bash
cd client
bun install
bun run dev
```

Runs on port 3001.

### Client environment

`client/.env.local`:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_PERFORMX_LOGIN_URL` | Where to send an unauthenticated HR user |
| `NEXT_PUBLIC_CANDIDATE_DOMAIN` | Production only, see below |
| `NEXT_PUBLIC_HR_DOMAIN` | Production only, see below |

## The two domains

`client/middleware.ts` splits one deployment across two hostnames in production:

The candidate domain serves only `/`, `/jobs`, `/jobs/:id`, `/apply`,
`/apply/success`, and `/book-interview`. Anything else redirects to `/`.

The HR domain serves everything, and `/` redirects to `/dashboard`.

`/auth/*` is exempt on both, so the SSO exchange works regardless of which host
the browser landed on.

The middleware returns early when `NODE_ENV !== 'production'`, so locally every
route is reachable on `localhost:3001` and the split does not apply. That means
a routing bug in the domain logic will not show up until deploy. If you touch
`middleware.ts`, test it with `NODE_ENV=production bun run build && bun start`.

## Database

```bash
cd server
npx prisma generate
npx prisma db push
npx prisma studio
```

There is a `prisma/migrations/migration_lock.toml` but no actual migration
directories. Schema changes have been applied with `db push`. Same problem as
PerformX; see [Known gaps](p1_known_gaps.md#no-real-migrations).

## Verifying the setup

The public side first, because it needs nothing but the database:

1. `http://localhost:3001/jobs` should list published opportunities.
2. `http://localhost:3001/apply` should accept an application.

Then the HR side, which needs PerformX running:

3. Log in to PerformX at `http://localhost:4001`.
4. Navigate to the CareerX exchange route with the PerformX token.
5. You should land on `/dashboard` with a `career_at` cookie set.

Server logs to watch for: `Application is running on: http://[::1]:3000` at
boot, `BullMQ connecting to <host>:<port>` from `QueueConfigModule`, and
`Department Sync Started` from the scheduler shortly after startup.

If you see `REDIS_URL is not set` in the logs, the queues are running against a
lazy-connect stub and no background job will ever execute.

## Health endpoints

Useful while setting up:

```
GET /api/v1/health           overall status
GET /api/v1/health/ready     readiness, checks database and Redis
GET /api/v1/health/live      liveness, always 200 if the process is up
GET /api/v1/health/detailed  per-component detail, requires auth
```

`/health` reports on the database, Redis, the queues, the workers, the email
provider, and the scheduler. It is the fastest way to find out which dependency
is missing.
