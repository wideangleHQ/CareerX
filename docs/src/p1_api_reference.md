# API reference

Base URL: `http://localhost:3000/api/v1` in development.

Authentication is the `career_at` cookie, or an `Authorization: Bearer` header
as a fallback. Guards are per controller, not global, so anything without
`@UseGuards(CareerJwtAuthGuard, ...)` is public.

`PermissionsGuard` requires **every** permission listed in `@Permissions(...)`,
not any of them. A method with no `@Permissions` decorator only needs a valid
session.

## Auth

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/auth/exchange` | takes a PerformX token, public |
| POST | `/auth/refresh` | `career_rt` cookie |
| POST | `/auth/logout` | `career_rt` cookie |
| GET | `/auth/me` | `career_at` |

## Opportunities

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/opportunities/public` | public, job board |
| GET | `/opportunities` | guarded |
| GET | `/opportunities/stats` | guarded |
| GET | `/opportunities/:id` | guarded |
| POST | `/opportunities` | guarded |
| PATCH | `/opportunities/:id` | guarded |
| PATCH | `/opportunities/:id/status` | guarded |
| DELETE | `/opportunities/:id` | guarded |

`GET /opportunities/public` returns only public fields. Verify the `select` if
you edit it.

## Candidates

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/candidates` | public, part of applying |
| GET | `/candidates` | guarded |
| GET | `/candidates/:id` | guarded |
| GET | `/candidates/:id/activity` | guarded |
| PATCH | `/candidates/:id` | guarded |
| DELETE | `/candidates/:id` | guarded |

## Applications

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/applications` | public, apply |
| GET | `/applications` | guarded |
| GET | `/applications/:id` | guarded |
| GET | `/applications/:id/timeline` | guarded |
| PATCH | `/applications/:id/status` | guarded |
| PATCH | `/applications/:id/assign` | guarded |
| DELETE | `/applications/:id` | guarded |
| POST | `/applications/bulk/status` | guarded |
| POST | `/applications/bulk/assign` | guarded |
| POST | `/applications/bulk/archive` | guarded |
| GET | `/applications/:id/offer` | guarded |
| POST | `/applications/:id/offer` | guarded |
| PATCH | `/applications/:id/offer/status` | guarded |

Offers are stored inside `hr_notes`, not in their own table. See
[The hiring pipeline](p1_hiring_pipeline.md#offers).

## Interview slots

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/interview-slots` | guarded |
| POST | `/interview-slots/bulk` | guarded |
| GET | `/interview-slots` | guarded |
| DELETE | `/interview-slots/:id` | guarded |
| GET | `/interview-slots/available` | public |
| POST | `/interview-slots/book` | public |

## Interview feedback

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/interview-feedback` | guarded |
| GET | `/interview-feedback` | guarded |
| GET | `/interview-feedback/:id` | guarded |
| PATCH | `/interview-feedback/:id` | guarded |
| DELETE | `/interview-feedback/:id` | guarded |

## HR notes

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/hr-notes` | guarded |
| GET | `/hr-notes/application/:applicationId` | guarded |
| PATCH | `/hr-notes/:id` | guarded |
| DELETE | `/hr-notes/:id` | guarded |

`GET /hr-notes/application/:id` returns offer documents too, since they are
stored as notes. Filter them out in the UI or the list shows raw JSON.

## Files

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/files/application/:applicationId` | guarded |
| GET | `/files/:id/download-url` | guarded, returns a signed URL |

`modules/resumes/` has a module, a service, and a DTO, but its controller file
is empty and `ResumesModule` is not imported into `AppModule`. There is no
`/resumes` route. Resume upload happens inside the application submission flow.

## Departments

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/departments/hiring` | public, job board filter |
| GET | `/departments` | `CAREER_VIEW` |
| PATCH | `/departments/:id/hiring` | `CAREER_ADMIN` |
| POST | `/departments/sync` | `CAREER_ADMIN`, manual sync trigger |

## Notifications

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/notifications` | guarded |
| PATCH | `/notifications/:id/read` | guarded |
| PATCH | `/notifications/read-all` | guarded |

`read-all` is declared after `:id/read` in the controller. It works because the
paths differ in shape, but keep literal routes above parameterised ones when you
add more.

## Email

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/email/send` | guarded |
| GET | `/email/logs` | guarded |
| GET | `/email/queue/stats` | guarded |
| GET | `/email/queue/failed` | guarded |

## Reports

All require `CAREER_REPORTS`, some also accept `CAREER_ADMIN`.

| Method | Path |
| --- | --- |
| GET | `/reports/applications` |
| GET | `/reports/interviews` |
| POST | `/reports/export` |
| GET | `/reports/dashboard-metrics` |
| GET | `/reports/hiring-funnel` |
| GET | `/reports/hr-performance` |
| GET | `/reports/department-analytics` |
| GET | `/reports/timeline-analytics` |
| GET | `/reports/opportunity-analytics` |
| GET | `/reports/interview-analytics` |

## Dashboard

| Method | Path |
| --- | --- |
| GET | `/dashboard/stats` |
| GET | `/dashboard/offers-stats` |

## Audit logs

`CAREER_ADMIN` only.

| Method | Path |
| --- | --- |
| GET | `/audit-logs` |
| GET | `/audit-logs/:id` |

## Health

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/health` | public |
| GET | `/health/ready` | public |
| GET | `/health/live` | public |
| GET | `/health/detailed` | guarded |

## Monitoring

All guarded. See
[Queues, workers, crons](p1_queues_and_crons.md#monitoring) for the full list.

## Response shape

`ResponseInterceptor` and `HttpExceptionFilter` are both present in
`common/`. Check whether they are applied to the controller you are working on;
the shape of a success response depends on it.

Errors from the exception filter are consistent. Errors from the validation pipe
carry a `message` array. The client's axios layer in `src/api/client.ts`
normalises both.

Every response carries a correlation ID from `CorrelationMiddleware`, which is
the value to quote when reporting a production problem.
