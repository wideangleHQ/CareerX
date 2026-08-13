# Queues, workers, crons

Everything that happens outside a request. All of it runs in the same Node
process as the API; there is no separate worker deployment.

# Queues

Files: `server/src/common/queue/` and `server/src/workers/`.

## Configuration

`QueueConfigModule` is `@Global` and calls `BullModule.forRootAsync()`. It
parses `REDIS_URL` into host, port, username, password, and TLS, handling
`rediss://` for TLS connections and defaulting the port to 6380 for TLS or 6379
otherwise.

When `REDIS_URL` is missing it logs an error and returns a lazy-connect stub
pointed at localhost with `retryStrategy: () => null`. The application boots,
but no job ever runs. If background work seems to do nothing, check the logs for:

```
REDIS_URL is not set. BullMQ queues will not function.
```

`QueuesModule` is the single registration point for every queue. The comment in
the file explains why it exists: calling `BullModule.registerQueue()` in
several places creates several `Queue` instances, each holding its own Redis
connection. Import `QueuesModule` rather than registering a queue locally.

## The four queues

| Queue | Attempts | Backoff | Keeps completed | Keeps failed |
| --- | --- | --- | --- | --- |
| `email` | 3 | exponential from 2s | 100 | 50 |
| `notifications` | 3 | exponential from 2s | 100 | 50 |
| `resume-parser` | 2 | fixed 5s | 50 | 25 |
| `reports` | 2 | fixed 3s | 25 | 10 |

Retention limits keep Redis from growing without bound. Failed jobs are kept
longer relative to their volume so they can be inspected and retried.

## Workers

`WorkerModule` registers three of the four:

```
EmailWorker         modules/workers/email/email.worker.ts
NotificationWorker  modules/workers/notifications/notification.worker.ts
ReportWorker        modules/workers/reports/report.worker.ts
```

`ResumeWorker` is deliberately not registered. The comment in `worker.module.ts`
is worth reading before you "fix" it:

> ResumeWorker is intentionally NOT registered: its process() is a placeholder
> and no producer anywhere enqueues to the 'resume-parser' queue, so running the
> worker only generates idle Redis polling. Re-add it to providers when resume
> parsing is implemented.

That is the correct call. A worker polling an empty queue costs Redis round
trips for nothing.

There are also two stray worker files at the top level of `workers/`:
`reminder.worker.ts` and `resume-parse.worker.ts`, which duplicate the
subdirectory versions. See [Known gaps](p1_known_gaps.md#duplicate-worker-files).

`WorkerHealthService` exposes worker state to the health endpoint.

# Crons

Files: `server/src/scheduler/`. All registered by `SchedulerModule`, which calls
`ScheduleModule.forRoot()`.

| Job | Schedule | What it does |
| --- | --- | --- |
| `DepartmentSyncCron` | `0 */6 * * *` | Pull departments from PerformX |
| `EmployeeSyncCron` | `0 */6 * * *` plus on startup | Pull employees from PerformX |
| `InterviewReminderCron` | `*/15 * * * *` | Queue reminder emails for upcoming interviews |
| `ExpiredSlotCron` | `0 * * * *` | Delete unbooked slots whose time has passed |
| `ApplicationCleanupCron` | daily at midnight | Soft delete applications past `APP_RETENTION_DAYS` |

`SchedulerHealthService` tracks the last run of each job and feeds the health
endpoint, so you can tell from `/health` whether a cron has stopped firing.

## Department sync

Calls `PerformxClient.getDepartments()` against
`GET {PERFORMX_API_URL}/api/v1/internal/departments` with the
`x-internal-api-key` header, then upserts each department by id, preserving the
local `is_hiring_enabled` flag.

This one works. PerformX serves that endpoint.

## Employee sync

Calls `PerformxClient.getEmployees()` against
`GET {PERFORMX_API_URL}/api/v1/internal/employees`.

**PerformX does not serve that endpoint.** It has only
`/internal/departments`. The call gets a 404, the client converts non-2xx into
`ServiceUnavailableException`, and the sync fails every six hours. It also runs
on startup, so the failure appears in the boot log.

`hr_employees` is therefore populated by `ensureHrEmployee()` during the SSO
exchange, which upserts a row for whoever logs in. That works for active users
and means the table never learns about anyone who has not logged in recently,
and never learns that somebody was deactivated in PerformX.

The fix is on the PerformX side and is described in
[Known gaps](p1_known_gaps.md#the-employee-sync-calls-an-endpoint-that-does-not-exist).

The CareerX client is already tolerant about the response shape: it accepts a
bare array or a `{ data: [...] }` envelope, and accepts `fullName` or
`full_name`, `departmentId` or `department_id`, `isActive` or `is_active`. So
the PerformX side can return whichever is convenient.

## Interview reminders

Runs every 15 minutes, finds interviews in the upcoming window, and enqueues
reminder emails. Fifteen minutes is a reasonable granularity for interview
reminders and cheap enough at this volume.

Make sure the job records that a reminder was sent, or a candidate whose
interview sits in the window across two runs gets two emails. Verify this before
Phase 2 rather than after a complaint.

## Expired slots

Hourly, deletes `interview_slots` rows where the slot time has passed and
`is_booked` is false. Booked slots are kept, because they are the historical
record of when an interview happened.

## Application cleanup

Nightly, soft deletes applications older than `APP_RETENTION_DAYS`. Soft delete,
so the rows stay and `deleted_at` is set.

Confirm `APP_RETENTION_DAYS` is set to a value the client has agreed to. Data
retention for candidate personal information is a policy decision, not a default.

# Monitoring

`modules/monitoring/` exposes operational detail that PerformX has no equivalent
of:

```
GET  /monitoring/dashboard              overview
GET  /monitoring/statistics             counts
GET  /monitoring/database/metrics       database
GET  /monitoring/queues                 all queues
GET  /monitoring/queues/:name           one queue
GET  /monitoring/queues/:name/failed    failed jobs
GET  /monitoring/queues/:name/delayed   delayed jobs
GET  /monitoring/queues/:name/active    active jobs
POST /monitoring/queues/:name/jobs/:jobId/retry   retry one job
POST /monitoring/queues/:name/clean     clean a queue
GET  /monitoring/performance            timing metrics
GET  /monitoring/security/events        security events
GET  /monitoring/security/summary       security summary
```

All permission guarded. The retry endpoint is the useful one during an incident:
a failed email batch can be replayed without a deploy.

# Health

```
GET /api/v1/health           overall
GET /api/v1/health/ready     readiness, checks database and Redis
GET /api/v1/health/live      liveness, 200 if the process is up
GET /api/v1/health/detailed  per component, requires auth
```

`HealthService` checks six things in parallel: database (`SELECT 1` plus a few
counts), Redis (set, get, delete a test key), queues, workers, the email
provider, and the scheduler.

The queue check reports `degraded` on high load or failure count and
`unavailable` on critical failures. Point the platform's health probe at
`/health/ready` for readiness and `/health/live` for liveness, not at `/health`,
which is a slower aggregate.
