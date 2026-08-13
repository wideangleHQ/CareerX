# Start here

CareerX is the recruitment portal for Ruchi Foodline Pvt Ltd. It is one half of
a two-repository platform; the other half is RUCHI PerformX, which owns
identity, employees, and departments, and which has its own handbook at
`Ruchi-PerformX/docs`.

If you are new, read this page, then [Local setup](p1_setup.md), then
[Architecture](p1_architecture.md). If you are here specifically to work on the
login flow, read [Auth and SSO](p1_auth_sso.md) before anything else, because
CareerX has no login screen of its own and the reason why is not obvious from
the code.

Everything in the Phase 1 section describes what is in this repository today.
[Known gaps](p1_known_gaps.md) collects the places where the code does something
surprising, and it is worth reading early rather than discovering each item the
hard way.

## What it does

Two audiences, one deployment.

Candidates see a public job board, apply to a role, upload a resume, and book an
interview slot. They never log in.

HR sees an internal console: open positions, incoming applications, a candidate
database, interview scheduling, feedback capture, offer generation, and
reporting. They log in through PerformX and are handed a CareerX session.

The application moves through a status pipeline from `NEW` to `JOINED` or
`REJECTED`, and every transition is recorded in `status_history` and, where
relevant, emails the candidate.

## Relationship to PerformX

PerformX is the identity provider. CareerX has no password field anywhere in its
schema.

CareerX keeps a local cache of two things PerformX owns:

`departments` holds the same UUIDs as PerformX departments, plus an
`is_hiring_enabled` flag that only CareerX cares about.

`hr_employees` holds the same UUIDs as PerformX users, plus the raw PerformX
role string and an active flag.

Both are refreshed by a cron every six hours. Everything else in the CareerX
database belongs to CareerX and PerformX knows nothing about it.

The two systems talk over HTTP in one direction only: CareerX calls PerformX.
PerformX never calls CareerX.

## Stack

Next.js 16 on the client, NestJS 11 on the server, Prisma 7 against a
PostgreSQL database on Supabase, Redis for sessions and BullMQ queues, Supabase
Storage for files, and Resend for outbound email.

CareerX is the more built-out of the two backends. It has a queue system, worker
processes, health and readiness endpoints, an operations monitoring module,
correlation IDs, a global exception filter, and a response interceptor. PerformX
has none of those. Where the two repositories disagree about how to do something,
CareerX is usually the newer opinion.

## Phase status

Phase 1 is deployed and running. Public job listings, applications, candidate
records, interview slots and booking, feedback, HR notes, offer generation,
email notifications, reporting, and the PerformX SSO exchange.

Phase 2 does not rebuild any of it. The scope document is explicit: career portal
work is "limited to embedding it as a tab within PerformX and aligning its data
with the HR module, not rebuilding it." The work in this repository is small.
See [Plan and sequencing](p2_plan.md).

## Vocabulary

**Opportunity** is an open position. Table `hiring_opportunities`. It carries
both an internal view (position title, hiring manager, confidentiality) and a
public view (job title, location, salary band), which is why the table is large.

**Candidate** is a person. Table `candidates`. One person, many applications.

**Application** is one candidate applying to one opportunity. Table
`applications`. It carries the status pipeline and a human-readable
`application_code` like `RC-2026-00152`.

**Slot** is an interview time an HR user has made available. Table
`interview_slots`. A candidate books one and it becomes a `slot_assignments`
row.

**HR employee** is a cached PerformX user with career permissions. Table
`hr_employees`. Never created by CareerX, only synced.

**Permission** is one of six values in `permission_enum`, mapped from a PerformX
role through `hr_role_permissions`. CareerX authorises on permissions, not on
roles, which is the opposite of PerformX.

## How to read the rest of this book

Each Phase 1 page names the files, tables, and endpoints for one area. The Phase
2 pages are build specs for the small amount of work this repository needs in
the coming phase. Paths are relative to the repository root: `server/src/...`
for the API and `client/...` for the Next.js app.
