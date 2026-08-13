# CareerX

Recruitment portal for Ruchi Foodline Pvt Ltd. A public job board and
application flow for candidates, and an internal console for HR covering
opportunities, applications, interview scheduling, feedback, offers, and
reporting.

NestJS API plus a Next.js client against PostgreSQL on Supabase, with Redis for
sessions and BullMQ queues. There is no login screen: HR signs in to RUCHI
PerformX and exchanges that session for a CareerX one.

Phase 1 is deployed. Phase 2 embeds this portal as a tab inside PerformX and
does not rebuild any of it.

## Read the handbook first

```bash
just docs
```

Serves the engineering handbook at <http://localhost:3081>. Start with "Start
here", then "Local setup", then "Architecture".

If you are here to work on login, read `docs/src/p1_auth_sso.md` before touching
anything. CareerX has no password field and the reason is not obvious from the
code.

`docs/src/p1_known_gaps.md` is worth ten minutes. Offers are stored as JSON
strings inside HR notes, the employee sync calls an endpoint that does not
exist, and three public endpoints accept unauthenticated writes with no rate
limit.

## Quick start

You need Node 20 or newer, [`just`](https://github.com/casey/just), `bun` or
`npm`, and Redis. You also need a reachable PerformX API, because the HR login
flow calls it. The public job board works without it.

```bash
just setup     # install deps, generate the Prisma client, check your env files
just redis     # start Redis in Docker
just doctor    # confirm Redis and PerformX are reachable
just dev       # run the API on 3000 and the client on 3001
```

Check the public side first, since it needs nothing but the database:
<http://localhost:3001/jobs>.

Then the HR side, which needs PerformX running: log in to PerformX, then follow
the career link. You should land on `/dashboard` with a `career_at` cookie set.

Redis is not optional here. Sessions, refresh tokens, the PerformX circuit
breaker, and all four queues depend on it. Without it the app boots and no
background job ever runs.

## Everything just can do

Run `just` with no arguments for the live list. The short version:

### Setting up

| Command | What it does |
| --- | --- |
| `just setup` | Install, generate the Prisma client, check the environment |
| `just install` | Dependencies in `server` and `client` |
| `just check-env` | Report missing environment variables and stop |
| `just doctor` | Check Redis, PerformX, and the CareerX API |
| `just redis` | Start Redis in Docker |
| `just redis-stop` | Stop it |

### Running

| Command | What it does |
| --- | --- |
| `just dev` | API and client together, Ctrl-C stops both |
| `just dev-server` | API only, watch mode, port 3000 |
| `just dev-client` | Client only, port 3001 |
| `just kill-ports` | Free 3000 and 3001 after a crashed run |

### Building

| Command | What it does |
| --- | --- |
| `just build` | Build both for production |
| `just build-server` | API only, runs `prisma generate` first |
| `just build-client` | Client only |
| `just start-server` | Run the built API |
| `just start-client` | Run the built client |
| `just prod-preview` | Build and serve the client with `NODE_ENV=production` |
| `just clean` | Remove `dist`, `.next`, and the built handbook |

`just prod-preview` matters more than it looks. `client/middleware.ts` returns
early outside production, so the candidate and HR domain split does not apply
locally. A routing bug there will not appear until you deploy unless you use
this recipe.

### Database

| Command | What it does |
| --- | --- |
| `just db-generate` | Regenerate the Prisma client, needed after every schema edit |
| `just db-push` | Push schema changes to the database |
| `just db-studio` | Browse the data in Prisma Studio |
| `just db-models` | List every model and enum with line numbers |

### Operations

| Command | What it does |
| --- | --- |
| `just health` | Database, Redis, queues, workers, email, scheduler |
| `just ready` | Readiness probe |
| `just queues` | Queue depth and failure counts |

`just health` is the fastest way to find out which dependency is missing when
something is not working.

### Docs

| Command | What it does |
| --- | --- |
| `just docs` | Serve the handbook on 3081 with live reload |
| `just docs-build` | Build it to `docs/book` |

### Checking

| Command | What it does |
| --- | --- |
| `just lint` | Lint the client. The server has no linter configured |
| `just typecheck` | Type check both without emitting |
| `just routes` | Every API route with its guards and permissions |
| `just public-routes` | Controllers with no `@UseGuards` anywhere |

`just public-routes` exists because the guards in this repository are per
controller, not global. A controller method without `@UseGuards` is reachable by
anyone on the internet. Run it before every pull request that adds an endpoint.

### Using npm instead of bun

```bash
just pm=npm install
just pm=npm dev
```

Pick one and stay with it.

## Layout

```
server/           NestJS API, port 3000, global prefix /api/v1
  src/modules/    one directory per feature
  src/integrations/performx/   client and sync jobs
  src/common/     guards, interceptors, queue config
  src/workers/    BullMQ consumers
  src/scheduler/  five cron jobs
  prisma/         schema.prisma
client/           Next.js 16, port 3001
  middleware.ts   candidate and HR domain split, production only
  app/(public)/   job board, apply, book interview
  app/(hr)/       HR console
docs/             mdbook handbook, the p1_ and p2_ chapters
```

## Relationship to PerformX

PerformX owns identity. CareerX caches two tables from it, `departments` and
`hr_employees`, keyed by the same UUIDs so no translation is needed. Everything
else in the CareerX database belongs to CareerX.

Traffic goes one way: CareerX calls PerformX, never the reverse.

Sessions are a 15 minute `career_at` JWT in an HTTP-only cookie plus a 7 day
opaque `career_rt` refresh token in Redis. Rotation has a 30 second reuse grace
window so that multiple browser tabs refreshing at once do not log each other
out.

## Things that will trip you up

Guards are not global. A controller method with no `@UseGuards` is fully public.
That is how the candidate endpoints work and it is also the easiest mistake to
make here. `just public-routes` checks it.

`@Permissions(...)` requires **every** listed permission, not any of them.

An empty `CORS_ORIGINS` allows every origin. Convenient locally, wrong in
production. Confirm it is set before any deploy.

An unset `PERFORMX_JWT_SECRET` skips local token verification entirely and
relies only on the remote call to PerformX. Set it in every environment.

The employee sync has been failing since it was written. It calls
`/api/v1/internal/employees` on PerformX, which PerformX does not serve.
`hr_employees` stays populated only because logging in upserts a row. The fix is
on the PerformX side and is the first task of Phase 2.

Offers have no table. They are JSON strings inside `hr_notes.note` found with a
`startsWith` query. Do not copy that pattern anywhere. Normalising it is scoped
in `docs/src/p2_data_model.md`.

There are no tests, no linter config on the server, and no CI.

## Contributing

Conventional commits:

```
feat(offers): normalise offers into their own table
fix(sync): handle missing employee endpoint gracefully
docs(p2): add PerformX embedding spec
```

Scopes: `auth`, `opportunities`, `applications`, `candidates`, `interviews`,
`offers`, `files`, `email`, `reports`, `sync`, `queues`, `client`, `schema`,
`docs`.

Conventions are in `docs/src/p1_conventions.md`. The patterns worth copying from
this repository into PerformX, since it does not have them, are the BullMQ
setup, the health endpoints, the correlation IDs, the circuit breaker, and the
HTML email templates.
