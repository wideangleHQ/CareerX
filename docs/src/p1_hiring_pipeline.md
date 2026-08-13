# The hiring pipeline

From an open position to a joined employee. Four modules do the work:
`opportunities`, `candidates`, `applications`, and `interview-slots`.

## The flow

```
HR creates an opportunity            status DRAFT
        |
     publish
        v
Opportunity is live                  status PUBLISHED, visibility CAREER_PORTAL
        |
        v
Candidate applies                    candidates row + applications row
        |                            application status NEW
        v
Candidate books an interview slot    slot_assignments row
        |                            status SLOT_BOOKED
        v
Interview happens                    interview_feedback row
        |                            status INTERVIEWED
        v
HR shortlists                        status SHORTLISTED
        |
        v
HR selects                           status SELECTED
        |
        v
Offer generated and sent             status OFFER_RELEASED
        |
        v
Candidate joins                      status JOINED
```

`REJECTED` and `WITHDRAWN` are terminal and reachable from most states.

## Opportunities

Files: `server/src/modules/opportunities/`.

An opportunity carries an internal view and a public view of the same job. See
[Data model](p1_data_model.md#opportunities) for the full column list.

The rule that matters: `GET /opportunities/public` must never return an internal
field. Use an explicit `select` in the public query. A spread of the row leaks
`internal_notes`, `min_salary`, `hiring_manager_id`, and
`confidentiality_level` to anyone who can load the job board.

`status` controls the lifecycle (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`).
`visibility` controls where it appears (`INTERNAL`, `CAREER_PORTAL`,
`REFERRAL`, `THIRD_PARTY`). Both have to be right for a job to show publicly:
`PUBLISHED` and `CAREER_PORTAL`.

`confidentiality_level` is `STANDARD`, `HIGH`, or `STRICTLY_CONFIDENTIAL`.
Nothing in the code currently branches on it. It is metadata for HR, not an
access control. If the client expects it to hide requisitions from some HR
users, that is unbuilt.

## Applying

The public application flow is two writes, and the candidate never logs in.

`POST /candidates` creates or finds the person. There is no unique constraint on
`candidates.email`, so deduplication is application logic. A candidate applying
to a second role with a differently-capitalised email becomes a second person.

`POST /applications` creates the application, generates the
`application_code`, writes the initial `status_history` row, and enqueues the
acknowledgement email.

### Application codes

Format is `RC-<year>-<sequence>`, for example `RC-2026-00152`. The sequence is
derived by counting existing rows with the same year prefix:

```ts
const prefix = `RC-${year}-`;
// count applications where application_code startsWith prefix
```

Count-then-insert is not concurrency safe. Two simultaneous applications get the
same count and the second insert fails the unique constraint. See
[Known gaps](p1_known_gaps.md#application-code-generation-can-collide).

### File upload

Resumes and organisation proofs go to Supabase Storage, and only the bucket name
and storage path are stored in `candidate_files`. URLs are never persisted;
they are generated on demand as signed URLs with a 900 second default expiry.
See [Files and email](p1_files_and_email.md).

## Status changes

There is no state machine service. `PATCH /applications/:id/status` updates the
row and writes a `status_history` entry.

That means any status can move to any status. Nothing stops `NEW` jumping
straight to `JOINED`, or a `REJECTED` application being reopened.

PerformX has a proper transition table in
`task-lifecycle.service.ts` and it is worth copying if this ever causes a real
problem. Today it does not, because the HR console only offers the sensible next
steps in its UI. The gap is that the API accepts anything the UI would not send.

Bulk operations exist for the common HR actions:

```
POST /applications/bulk/status    change status on many at once
POST /applications/bulk/assign    assign an HR owner to many
POST /applications/bulk/archive   soft delete many
```

Each writes its own `status_history` rows.

### Assignment

`applications.assigned_hr_id` is the owning HR user. `canViewApplication()` in
the service checks it: a user sees an application if they are assigned to it or
if they hold an elevated permission (`CAREER_ADMIN` or `CAREER_REPORTS`).

Note what it throws when the check fails. `getOffer()` throws
`NotFoundException`, not `ForbiddenException`. That is deliberate: a 403 confirms
the application exists. Keep the pattern when you add endpoints here.

## Interview scheduling

Files: `server/src/modules/interview-slots/`.

HR publishes availability as slots. `slot_date` and `slot_time` are separate
columns, which makes date-based and time-based queries cheap and makes timezone
handling the application's job. The client helper is
`client/src/lib/slot-time.ts`.

```
POST /interview-slots          one slot
POST /interview-slots/bulk     generate a range, optionally recurring weekly
GET  /interview-slots          HR view of their own slots
GET  /interview-slots/available   public, what a candidate can pick
POST /interview-slots/book     public, book one
DELETE /interview-slots/:id    HR, remove an unbooked slot
```

Booking creates a `slot_assignments` row. Both `application_id` and `slot_id`
are unique on that table, so double booking is prevented by the database rather
than by a check. That is the right design and should not be replaced with
application-level locking.

`GET /interview-slots/available` and `POST /interview-slots/book` are public. A
candidate books from a link in their invitation email without logging in. There
is no token in that link scoping it to their own application, which is worth
noting; see
[Known gaps](p1_known_gaps.md#no-rate-limiting-on-public-write-endpoints).

Two crons support this module. `expired-slot.cron.ts` runs hourly and deletes
unbooked slots whose time has passed. `interview-reminder.cron.ts` runs every 15
minutes and queues reminder emails for upcoming interviews.

## Feedback

`POST /interview-feedback` records a rating from 1 to 5 with optional notes, one
row per interviewer per application. Multiple interviewers means multiple rows.
Nothing aggregates them into a decision; that is a judgement call HR makes on
the application detail screen.

## Offers

This is the part of the codebase that will surprise you.

**There is no offers table.** Offers are stored as JSON strings inside
`hr_notes.note`, prefixed with `{"type":"OFFER_DOCUMENT"`, and retrieved with a
`startsWith` query:

```ts
const latestOfferNote = await this.prisma.hr_notes.findFirst({
  where: { application_id: id, note: { startsWith: '{"type":"OFFER_DOCUMENT"' } },
  orderBy: { created_at: 'desc' },
});
const offerData = JSON.parse(latestOfferNote.note);
```

Each edit appends a new note rather than updating one, and the newest by
`created_at` wins. Versioning is a `Date.now()` value inside the JSON.

Consequences you have to work around:

- Offers cannot be queried by status, salary, or expiry without scanning and parsing
- Reports that need offer data cannot use SQL aggregates
- A malformed JSON string silently returns `null` from `getOffer()` rather than erroring
- Offer notes appear in the HR notes list unless filtered out
- There is no foreign key, no type safety, and no schema validation on the payload

The offer payload fields, as read by `getOffer()`: `status`, `salary`,
`currency`, `joiningDate`, `expiryDate`, `offerReference`, `employmentType`,
`location`, `reportingManager`, `remarks`. Both camelCase and snake_case are
accepted on read, which tells you the write side has been inconsistent.

Business rules that are enforced:

`generateOffer()` requires the caller to be the assigned HR user or hold
`CAREER_ADMIN` or `CAREER_REPORTS`.

The application must be in `SHORTLISTED`, `SELECTED`, or `OFFER_RELEASED`.
Anything else throws `ConflictException`.

Endpoints:

```
GET   /applications/:id/offer
POST  /applications/:id/offer
PATCH /applications/:id/offer/status
```

Normalising this into a real `offers` table is the single highest-value cleanup
in this repository. It is scoped in
[Schema changes](p2_data_model.md#normalise-offers).

## Timeline

`GET /applications/:id/timeline` assembles the application's history from
`status_history`, joined with the HR user who made each change. It is what the
detail page renders as a vertical timeline.

`status_history.changed_by_id` is nullable, because a candidate-initiated change
such as booking a slot has no HR actor. Render those as system events, not as
"changed by nobody."

## Retention

`application-cleanup.cron.ts` runs nightly and soft deletes applications older
than `APP_RETENTION_DAYS`. Check that variable is set to something the client
has actually agreed to before assuming the default is fine.
