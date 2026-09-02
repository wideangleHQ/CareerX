# Decision log

Newest at the bottom. An entry goes in the same commit as the change it
describes.

Write one whenever you pick between two reasonable options: schema shape, auth
flow, queue topology, a new dependency, a pattern other modules will copy, or
anything a future reader would otherwise have to reverse engineer from a diff.
Skip it for renames, typo fixes, and anything the diff explains on its own.

The shape:

```markdown
## YYYY-MM-DD Short title

**Decision.** One sentence, present tense.
**Why.** The constraint that forced it.
**Instead of.** What was rejected, and what was wrong with it.
**Costs.** What this makes harder later, or "none known".
```

Nothing is deleted from this file. A decision that turns out wrong gets a new
entry that supersedes the old one by date and says so.

The Phase 1 decisions that predate this log are described in their chapters:
identity in [Auth and SSO](p1_auth_sso.md), the offer-in-a-note pattern and the
missing employee endpoint in [Known gaps](p1_known_gaps.md).

---

## 2026-08-16 Decisions live in the handbook, not in a separate file

**Decision.** The decision log is a handbook chapter, so it builds, searches,
and gets read alongside everything else.
**Why.** A `DECISIONS.md` at the repository root would be a second place to keep
current, and the handbook is already the thing people are told to read first.
**Instead of.** A root file, which drifts, or one file per decision, which is
process for a repository with a single active developer.
**Costs.** Every entry needs `just docs-build` to pass, so a malformed entry
breaks the docs build rather than sitting there quietly.

## 2026-09-01 Position creator is default interviewer via hiring_manager_id

**Decision.** `hiring_manager_id` is set from `user.sub` on position creation
and auto-populates `assigned_hr_id` on new applications, making the position
creator the default interviewer.
**Why.** The business needs the person who opens a position to own its interviews
by default, without relying on department HOD or random HR assignment.
**Instead of.** A new `position_owner_id` column, which would duplicate what
`hiring_manager_id` already represents. Also rejected: increasing the
transaction timeout on bulk employee sync (addressed separately).
**Costs.** If a position is created through a code path that does not supply a
user (e.g. a future bulk import), `hiring_manager_id` stays null and the
application gets no default interviewer.

## 2026-09-01 Interview reassignment via slot_assignments, not interview_slots.hr_id

**Decision.** Reassigning an interviewer updates `slot_assignments.assigned_hr_id`
and `applications.assigned_hr_id` without touching `interview_slots.hr_id`.
**Why.** `interview_slots.hr_id` represents who owns the calendar slot (the slot
creator). The slot can exist independently of any specific assignment.
Modifying slot ownership would invalidate the unique constraint
`(hr_id, slot_date, slot_time)` and could corrupt other bookings on the same
slot owner's calendar.
**Instead of.** Changing `interview_slots.hr_id` on reassignment, which breaks
the slot uniqueness model and creates ghost slots.
**Costs.** After reassignment, `slot_assignments.assigned_hr_id` differs from
`interview_slots.hr_id`. Queries that display the interviewer must read from
`slot_assignments`, not from `interview_slots`.

## 2026-09-01 Interview reassignment notifies via the existing EventEmitter

**Decision.** `reassignInterviewer` emits an `InterviewReassigned` event after
its transaction commits; `NotificationsService` handles it the same way it
handles `StatusChanged` and `InterviewBooked`, sending one in-app notification
to the previous interviewer and one to the new interviewer.
**Why.** The service already routes every application-lifecycle notification
through one `EventEmitter` and one listener registered in
`NotificationsService.onModuleInit`. A second notification path for
reassignment would duplicate that wiring for no benefit.
**Instead of.** Writing `notification_logs` rows directly inside the
reassignment transaction, which would couple the applications module to the
notifications schema and fire even if the transaction later rolled back.
**Costs.** The event fires outside the transaction, so a process crash between
commit and emit drops the notification silently. Acceptable because in-app
notifications are best-effort, not an audit record — the audit trail is the
`audit_logs` row written inside the transaction.

## 2026-09-01 Only the position owner may reassign the interviewer

**Decision.** `PATCH /applications/:id/reassign-interviewer` requires only the
baseline `CAREER_VIEW` permission at the route level; the real check —
`requester.sub === hiring_opportunity.hiring_manager_id` — is enforced inside
`ApplicationsService.reassignInterviewer` against the requester's JWT `sub`,
never a client-supplied id. A mismatch throws `ForbiddenException` (403). The
frontend disables the interviewer dropdown for non-owners as a UX convenience,
but the server enforces this independent of any client state.
**Why.** The permission table only expresses "can this role touch interview
data at all," not "does this specific requester own this specific position."
Two different HR employees can both hold `CAREER_INTERVIEW`; only one of them
opened this position and should be able to hand its interview to someone else.
Gating on `CAREER_INTERVIEW` alone would let any interviewer reassign any
other application's interview, not just their own.
**Instead of.** Keeping the `CAREER_INTERVIEW` permission requirement on the
route (rejected — permission-based, not ownership-based, so it does not
express "only the owner") or adding a `CAREER_ADMIN` bypass (rejected — not
requested, and it would reopen the exact hole this decision closes; an admin
who needs to intervene should reassign via direct DB access with an audit
trail, or a future dedicated admin-override endpoint if that need becomes
real).
**Costs.** If a position's `hiring_manager_id` is null (position created
before this feature, or through a path that never set an owner), nobody can
reassign its interviews through this endpoint — not even `CAREER_ADMIN`. This
is intentional: inventing an owner for orphaned positions was explicitly out
of scope, so those applications keep whatever interviewer they already have
until the position is given an owner some other way.

## 2026-09-02 Allow PENDING applications to book interview slots

**Decision.** `POST /interview-slots/book` accepts applications in `PENDING`
or `ACCEPTED` status, not just `ACCEPTED`.
**Why.** The candidate application form includes an interview slot picker, but
the booking silently failed because applications are created with `PENDING`
status and `book()` only accepted `ACCEPTED`. The selected date and time
never persisted, and the client swallowed the error. The slot picker was
effectively dead UI.
**Instead of.** Storing the selected slot on the application and auto-booking
on status transition to `ACCEPTED` (rejected -- adds a deferred-booking
pipeline for something the existing `book()` endpoint already does, and
the slot could be taken by the time the transition happens). Also rejected:
removing the slot picker from the application form (rejected -- the
business wants candidates to self-schedule at application time).
**Costs.** A `PENDING` application can now hold a booked slot. If the
application is later rejected, the slot must be released (the existing
rejection flow already handles this via `releaseSlot`).

## 2026-09-02 Displayed interviewer falls back to assigned HR before a slot exists

**Decision.** `toListItem`'s `interviewer` field resolves to
`slot_assignment.assigned_hr` when a slot is scheduled, and falls back to
`applications.assigned_hr` (the position owner, by default) when it isn't —
previously it was `null` whenever no slot existed, even when `assigned_hr`
was set. `interviewDate` / `interviewTime` are untouched by this and remain
`null` until a real slot exists. The frontend's `InterviewerDropdown` gained a
`hasScheduledSlot` prop so it only renders as an editable control when a slot
exists; before that it renders the resolved name as plain text, because
`reassignInterviewer` itself still requires a slot and would 409 otherwise.
**Why.** Position Owner and Assigned HR are meant to be the same person from
the moment a candidate applies (`create()` already sets
`assigned_hr_id = hiring_opportunity.hiring_manager_id`), but the UI was
reading only the slot's interviewer, so every application without a scheduled
interview showed no interviewer at all — reported against
`RC-2026-000009` / opportunity `940fb680-ce73-4566-aa3e-0f625ce54c92`, where
the underlying data (`assigned_hr_id`, `hiring_manager_id`) was already
correct and only the read-side mapping was wrong. No data repair was needed
or performed.
**Instead of.** Backfilling a `slot_assignments` row or a fake interview date
for applications with no scheduled slot (rejected — `slot_assignments` must
only exist for a real booked slot, and inventing a date was an explicit
non-goal), or adding a new API field alongside `interviewer` (rejected — the
existing field's contract naturally extends to "who is responsible for this
candidate's interview, scheduled or not" without a schema or type change).
**Costs.** `interviewer` no longer implies "a slot exists" on its own —
callers must check `interviewStatus === 'SCHEDULED'` (or a non-null
`interviewDate`) to know whether the returned name is for a real, scheduled
interview or just the responsible assigned HR.

## 2026-09-02 Deduplicate eligible interviewers by trimmed name

**Decision.** `getEligibleInterviewers` deduplicates employees by
`full_name.trim().toLowerCase()`, keeping the first occurrence. The
`InterviewerDropdown` client component applies the same dedup as a safety
net and trims display names.
**Why.** PerformX sync creates duplicate employee records for the same
person (different UUIDs, identical or whitespace-variant names). The
interviewer dropdown rendered every record, showing the same name two or
more times. Deduplication by name is the correct filter because the
business treats same-name records as the same person for interview
assignment.
**Instead of.** Fixing the duplicates at the PerformX sync layer (rejected
-- the sync is a bulk upsert keyed on `employee_code`, and the duplicates
come from upstream data quality; deduping at read time is cheaper and does
not risk breaking the sync contract). Also rejected: deduplicating by
employee ID (does not catch same-person duplicates with different IDs).
**Costs.** If two genuinely different employees share the same
`full_name` (after trim and lowercasing), only the first one appears in
the dropdown. Acceptable because HR would need to disambiguate by some
other field (email, department) if that ever occurs, and no such case
exists in the current dataset.
