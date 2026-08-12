# Known gaps and dead code

Verified against the code, not inferred from a specification. Ordered roughly by
how much damage each one causes.

## Offers live inside HR notes

There is no `offers` table. An offer is a JSON string written into
`hr_notes.note`, prefixed with `{"type":"OFFER_DOCUMENT"`, and retrieved with:

```ts
where: { application_id: id, note: { startsWith: '{"type":"OFFER_DOCUMENT"' } },
orderBy: { created_at: 'desc' }
```

Each edit appends a new note. Versioning is a `Date.now()` value inside the
payload. The newest note wins.

What this costs:

- Offers cannot be filtered or aggregated in SQL. Any offer report scans and parses
- A malformed JSON string makes `getOffer()` return `null` silently
- Offer notes appear in the HR notes list unless the UI filters them
- No foreign key, no type safety, no validation on the payload
- Both camelCase and snake_case keys are accepted on read, which means the write side has been inconsistent

This is the highest-value cleanup available in this repository. It is scoped in
[Schema changes](p2_data_model.md#normalise-offers) and it is a contained piece
of work: one table, one migration script, one service rewrite.

## The employee sync calls an endpoint that does not exist

`integrations/performx/performx.client.ts` has `getEmployees()`, calling:

```
GET {PERFORMX_API_URL}/api/v1/internal/employees
```

PerformX serves only `/api/v1/internal/departments`. There is no employees
endpoint.

`scheduler/employee-sync.cron.ts` runs on startup and every six hours. Each run
gets a 404, which `PerformxClient` converts to
`ServiceUnavailableException`, and the sync fails.

`hr_employees` stays populated because `ensureHrEmployee()` upserts a row during
every SSO exchange. So active users are correct and:

- Users who have not logged in recently are missing or stale
- A user deactivated in PerformX stays `is_active = true` in CareerX until they log in again
- Department reassignments do not propagate

The fix is on the PerformX side: add an internal employees controller behind
`InternalApiGuard`. The CareerX client is already tolerant about the response
shape, accepting a bare array or a `{ data: [...] }` envelope and either
camelCase or snake_case keys.

## Local JWT verification is optional

`SSOExchangeService.preVerifyPerformxJwt()` starts with:

```ts
const secret = process.env.PERFORMX_JWT_SECRET;
if (!secret || secret.trim().length === 0) return;
```

With the secret unset, signature, expiry, and issuer checks are all skipped, and
the only remaining verification is the remote call to PerformX.

The code comment says this keeps development unblocked before the secret is
shared. In production it means the exchange has one check instead of two, and a
degraded PerformX degrades the security posture rather than failing closed.

Set `PERFORMX_JWT_SECRET` in every environment. Consider making the service
throw at startup when it is missing and `NODE_ENV === 'production'`.

## Empty CORS_ORIGINS allows every origin

`main.ts`:

```ts
if (allowedOrigins.length === 0) {
  return callback(null, true);
}
```

An unset or empty `CORS_ORIGINS` permits every origin. That is convenient
locally and wrong in production. Confirm the variable is set before any deploy.

## No rate limiting on public write endpoints

Three endpoints accept writes from the open internet with no authentication and
no throttling:

```
POST /candidates
POST /applications
POST /interview-slots/book
```

`POST /applications` also triggers a file upload to Supabase and enqueues an
email. A script can fill the database, the storage bucket, and the Resend quota.

PerformX has `@nestjs/throttler` as a dependency and uses it on the HOD score
controller. CareerX does not have it installed. Adding it and putting a strict
limit on these three endpoints is a small, high-value change.

`POST /interview-slots/book` has a second problem: the booking link in an
invitation email carries no token scoping it to that application, so knowing an
application id is enough to book on someone's behalf.

## Application code generation can collide

`applications.service.ts` builds `RC-<year>-<sequence>` by counting existing
rows with the year prefix:

```ts
const prefix = `RC-${year}-`;
// count where application_code startsWith prefix, then increment
```

Two concurrent applications read the same count and produce the same code. The
unique constraint on `application_code` catches it, so the second insert fails
with a 500 rather than creating a duplicate. The data stays correct; the
candidate sees an error.

Fixes, in order of preference: a Postgres sequence per year, or a retry loop on
unique violation, or a transaction with a row lock on a counter table. A
sequence is the cleanest and does not need application logic.

## No application status state machine

`PATCH /applications/:id/status` accepts any target status. Nothing prevents
`NEW` going straight to `JOINED`, or a `REJECTED` application being reopened.

The HR console only offers sensible transitions, so this has not caused a
problem. The gap is that the API accepts what the UI would never send.
PerformX has a transition table in `task-lifecycle.service.ts` worth copying if
this becomes real.

## No real migrations

`prisma/migrations/migration_lock.toml` exists but there are no migration
directories. Schema changes have been applied with `prisma db push`, which
records no history and offers no rollback.

Same problem as PerformX. If Phase 2 normalises offers, that is a data migration
against a live table and it needs a migration file, not a push.

## Duplicate worker files

```
workers/reminder.worker.ts
workers/resume-parse.worker.ts
workers/reminder/...          (does not exist)
workers/resume-parser/resume.worker.ts
```

`reminder.worker.ts` and `resume-parse.worker.ts` sit at the top level of
`workers/` alongside the subdirectory versions. `WorkerModule` registers
`EmailWorker`, `NotificationWorker`, and `ReportWorker` from their
subdirectories and neither top-level file. They are dead. Delete them.

`ResumeWorker` in `workers/resume-parser/` is also unregistered, but that one is
deliberate and documented in a comment: its `process()` is a placeholder and
nothing enqueues to the queue. Leave it and its comment alone.

## Two empty controllers

`modules/permissions/permissions.controller.ts` and
`modules/resumes/resumes.controller.ts` are both zero-byte files. Run
`just public-routes` to see them.

For permissions, the mapping is read directly by `AuthService` from
`hr_role_permissions`, so nothing is broken. There is simply no way to view or
edit the role-to-permission mapping except by writing SQL. For a table that
decides who can see candidate data, a read-only admin endpoint would be worth
having.

For resumes, `ResumesModule` is also not imported into `AppModule`, so the whole
module is dead. Upload happens inside `applications.service.ts` during
submission. Either delete the directory or finish it; leaving a module that
looks like an upload endpoint but is not one will mislead the next person.

## `hr_role_permissions` is seeded by hand

No seed script and no admin UI. If the table is empty, every user falls through
to the `canAccessCareerHR` bypass or gets zero permissions and is rejected.

Document the intended seed in the repository. Right now the mapping exists only
in the production database.

## No unique constraint on candidate email

`candidates.email` has an index but no unique constraint. The same person
applying twice with different capitalisation becomes two candidate records with
separate application histories.

Deduplication is application logic. Verify it normalises case before comparing.

## `confidentiality_level` does nothing

`hiring_opportunities.confidentiality_level` has three values and no code
branches on it. If HR expects `STRICTLY_CONFIDENTIAL` requisitions to be hidden
from some HR users, that is unbuilt and should be raised rather than assumed.

## Interview reminder duplication

`interview-reminder.cron.ts` runs every 15 minutes and queues reminders for
upcoming interviews. Confirm it records that a reminder was sent. If it does
not, an interview whose reminder window spans two runs generates two emails.

## No tests, no linting, no CI

Neither `package.json` configures a test runner. The client has a `lint` script
with no config file. Nothing runs on push.

If Phase 2 normalises offers, the migration script is the one thing that should
get a test before it runs against production data.
