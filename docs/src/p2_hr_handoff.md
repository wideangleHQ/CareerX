# Candidate to employee handoff

When an application reaches `SELECTED` or `JOINED`, the person's details should
flow into PerformX as a new employee without HR retyping them. The scope
document asks for "selected candidates' data can be handed off directly into the
HR onboarding flow, avoiding re-entry."

## What CareerX has

By the time an application reaches `SELECTED`, CareerX holds:

| Field | Source |
| --- | --- |
| Full name | `candidates.full_name` |
| Email | `candidates.email` |
| Mobile | `candidates.mobile_number` |
| Department | `applications.department_id`, the same UUID PerformX uses |
| Position | `hiring_opportunities.internal_position` |
| Joining date | the offer payload |
| Reporting manager | the offer payload |
| Documents | `candidate_files`, in the `candidate-documents` bucket |

The department UUID matching PerformX is the piece that makes this work at all.
No lookup table, no name matching.

## What PerformX needs

`POST /users` on the PerformX side, admin only, takes a full name, username,
email, role, and department. The account is created with
`must_change_password: true`.

The gap between the two lists is small: a username has to be chosen, a role has
to be picked, and mobile number and joining date map across directly.

## Two options

### Pre-filled form

CareerX shows a "create PerformX employee" action on a `SELECTED` application.
It navigates to the PerformX user creation screen with query parameters
carrying the name, email, mobile, and department id. HR reviews, picks a role
and username, and submits.

What it costs: nothing new on the server. A link and a form that reads query
parameters.

What it gives up: HR still clicks submit, and the two records are not linked
unless CareerX is told the result.

### Service-to-service write

CareerX calls a new `POST /internal/users` on PerformX, behind
`InternalApiGuard`, when an application moves to `JOINED`. PerformX creates the
account and returns the user id, which CareerX stores in
`applications.performx_user_id`.

What it costs: a new internal endpoint that creates accounts, and a decision
about what role and username to assign without a human in the loop.

What it gives up: containment. Today the internal API is read-only. Adding a
write means a compromise of CareerX, which is the internet-facing half of the
platform, can create PerformX accounts.

## Recommendation

Take the pre-filled form for Phase 2.

The security tradeoff is real and the volume does not justify it. A company
hiring a handful of people a month does not need automated account creation, and
the internal API staying read-only is worth more than saving HR a form
submission. Revisit if hiring volume grows.

## The pre-filled flow

**In CareerX.** On an application detail page where the status is `SELECTED`,
`OFFER_RELEASED`, or `JOINED`, show an "onboard to PerformX" action. It builds
a URL:

```
{PERFORMX_APP_URL}/admin/users/new
  ?fullName=...
  &email=...
  &mobile=...
  &departmentId=...
  &sourceApplication=RC-2026-00152
```

Do not put anything sensitive in the query string. Name, email, mobile, and a
department UUID are the data HR is about to type anyway. Salary, offer terms,
and document links are not.

**In PerformX.** The admin user creation form reads those parameters and
pre-fills. HR picks the role and username and submits. `sourceApplication` is
displayed so HR can see where the record came from.

**Back in CareerX, optionally.** After the PerformX user is created, HR marks
the application as onboarded. That sets `applications.onboarded_at` and, if HR
pastes or the flow returns it, `applications.performx_user_id`.

The link back is nice to have, not required. If it is skipped, the two systems
simply do not know about each other's record, which is the situation today.

## Schema

Two nullable columns on `applications`:

```prisma
performx_user_id String?   @db.Uuid
onboarded_at     DateTime? @db.Timestamptz(6)
```

No foreign key. That user lives in the PerformX database. Treat
`performx_user_id` as a reference that may point at a user who has since been
deleted, and never join on it.

## Documents

The scope document's handover flow is about employees leaving, not joining, and
lives in the PerformX assets module. But a joining employee's documents are
already in CareerX's `candidate-documents` bucket, and HR will ask about them.

Options, in order of effort:

**Leave them in CareerX.** HR downloads from the application record when
needed. Zero work. The documents stay associated with the hiring record, which
is arguably where they belong.

**Copy on onboarding.** A server-side copy from the CareerX bucket to a PerformX
bucket, triggered when the application is marked onboarded. Needs both Supabase
service keys in one place, which means one service reaching into the other's
storage.

**Reference by signed URL.** PerformX stores a link that expires. Useless as a
record.

Take the first for Phase 2. If HR asks for documents inside the PerformX
employee profile later, that is a scoped piece of work, and by then the assets
module from Phase 2 will exist to hold them.

## Reverse direction: offboarding

Out of scope, but worth writing down so it is not rediscovered.

When an employee leaves, PerformX runs the handover of their company assets and
passwords. CareerX has no role in that. There is no reason for offboarding to
touch this repository.

The only overlap is that a departing employee's `hr_employees` row should become
`is_active = false`, which the employee sync handles automatically once it works
again. That is another reason to fix the sync first.

## What HR actually asked for

The scope document's HR dashboard flow says HR "opens Career Portal tab, reviews
new applications, updates candidate status, initiates onboarding for selected
hires."

Three of those four already work today inside CareerX. Only "initiates
onboarding" is new, and the pre-filled form covers it. Do not scope more than
that into this phase.
