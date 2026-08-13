# Data model

Source of truth is `server/prisma/schema.prisma`. Unlike PerformX, this schema
was written by hand rather than introspected, so the naming is consistent:
snake_case tables, snake_case columns, plural table names.

## Cached from PerformX

Two tables are mirrors. CareerX never creates rows in them outside the sync.

```prisma
model departments {
  id                String   @id @db.Uuid   // same UUID as the PerformX department
  name              String   @unique @db.VarChar(100)
  is_hiring_enabled Boolean  @default(false)
  synced_at         DateTime @default(now())
}

model hr_employees {
  id            String   @id @db.Uuid       // same UUID as the PerformX user
  full_name     String
  email         String
  department_id String?  @db.Uuid
  performx_role String                      // raw string: HOD, MD, EMPLOYEE
  is_active     Boolean  @default(true)
  synced_at     DateTime @default(now())
}
```

Sharing the primary key with PerformX is the design decision that makes the rest
work. A foreign key from `applications.assigned_hr_id` points at a row whose id
is also a valid PerformX user id, so cross-referencing needs no translation.

`performx_role` is stored as a raw string, not an enum. That is deliberate:
PerformX can add a role without breaking the CareerX schema. The mapping from
role to CareerX permissions lives in `hr_role_permissions`.

```prisma
model hr_role_permissions {
  performx_role String
  permission    permission_enum
  @@unique([performx_role, permission])
}
```

This table is the authorisation model. A PerformX role gets whichever CareerX
permissions are listed for it here. It is seeded manually; there is no admin UI
for it.

`permission_enum` has six values:

```
CAREER_VIEW       read applications and candidates
CAREER_EDIT       change status, assign HR, write notes
CAREER_EXPORT     download exports
CAREER_ADMIN      everything, including audit logs and department config
CAREER_REPORTS    analytics endpoints
CAREER_INTERVIEW  create slots and record feedback
```

## Opportunities

`hiring_opportunities` is the largest table in the schema, because it holds two
views of the same job.

Internal, visible only to HR: `internal_position`, `department_id`,
`number_of_openings`, `hiring_priority`, `hiring_type`,
`confidentiality_level`, `hiring_manager_id`, `reporting_manager_id`,
`internal_notes`.

Public, visible to candidates: `public_title`, `career_level`, `work_mode`,
`location`, `min_experience_years`, `max_experience_years`,
`educational_qualification`, `min_salary`, `max_salary`,
`application_deadline`, `about`, `responsibilities`, `benefits`,
`career_growth`.

Requirements and configuration: `preferred_industry`, `preferred_languages`
(a string array), `certifications` (array), `age_limit`, `resume_required`,
`employment_proof_required`, `interview_rounds`, `interview_location`,
`meeting_link`.

Publication: `status` (`DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`) and
`visibility` (`INTERNAL`, `CAREER_PORTAL`, `REFERRAL`, `THIRD_PARTY`).

The split matters. `GET /opportunities/public` must return only the public
fields. Leaking `internal_notes` or `min_salary` on a confidential requisition
is the failure mode this table's shape exists to prevent. Use an explicit
`select`, never a spread of the whole row.

`skills` and `opportunity_skills` are a many-to-many tag list.

## Candidates and applications

```prisma
model candidates {
  id              String @id
  full_name       String
  email           String
  mobile_number   String
  whatsapp_number String?
  deleted_at      DateTime?
}
```

No unique constraint on `email`. One person can appear more than once if they
apply with a different capitalisation or through a different route. Deduplication
is application logic, not a database guarantee.

```prisma
model applications {
  id                    String @id
  application_code      String @unique   // RC-2026-00152
  candidate_id          String
  department_id         String
  hiring_opportunity_id String?          // nullable for older rows
  self_description      String
  experience_years      Int?
  previous_org_proof_url String?
  status                application_status_enum @default(NEW)
  assigned_hr_id        String?
  rejection_reason      String?
  deleted_at            DateTime?
}
```

`application_code` is human readable and generated as `RC-<year>-<sequence>`.
The sequence comes from counting existing rows with that year prefix, which is
not concurrency safe; see
[Known gaps](p1_known_gaps.md#application-code-generation-can-collide).

`hiring_opportunity_id` is nullable because applications existed before
opportunities did. New applications should always carry one.

`application_status_enum`:

```
NEW -> SLOT_BOOKED -> INTERVIEWED -> SHORTLISTED -> SELECTED
    -> OFFER_RELEASED -> JOINED
REJECTED and WITHDRAWN are terminal and reachable from most states
```

There is no state machine service. Status changes are plain updates with a
`status_history` row written alongside. See
[The hiring pipeline](p1_hiring_pipeline.md).

`candidate_files` holds uploaded documents typed by `candidate_file_type_enum`
(`RESUME`, `ORG_PROOF`, `CERTIFICATE`, `OFFER_LETTER`, `JOINING_LETTER`,
`OTHER`), with a bucket name and a storage path rather than a URL. URLs are
generated on demand as signed URLs.

## Interviews

```prisma
model interview_slots {
  hr_id         String
  department_id String?    // null means any department
  slot_date     DateTime @db.Date
  slot_time     DateTime @db.Time
  is_booked     Boolean  @default(false)
  is_recurring  Boolean  @default(false)
  @@unique([hr_id, slot_date, slot_time], map: "uq_hr_slot")
}
```

Date and time are separate columns rather than one timestamp. That makes
"all slots on Tuesday" and "all 3pm slots" cheap, and makes timezone handling
entirely the application's problem. The client helper is
`client/src/lib/slot-time.ts`; use it rather than composing dates by hand.

The unique key on `(hr_id, slot_date, slot_time)` is what stops one HR user
having two slots at the same moment.

```prisma
model slot_assignments {
  application_id String @unique
  slot_id        String @unique
  assigned_hr_id String
}
```

Both foreign keys are unique, which enforces one slot per application and one
application per slot at the database level. That is the right way to do it; the
booking endpoint cannot double-book even under a race.

`interview_feedback` is a rating from 1 to 5 with optional notes, one row per
interviewer per application.

`hr_notes` is free-form notes on an application. It is also, unfortunately,
where offers are stored.

## Communication logs

`email_logs` records every outbound email: recipient, template name, status
(`QUEUED`, `SENT`, `FAILED`), an error message, and a sent timestamp. This is
the audit trail for candidate communication and it is what the email queue
writes to.

`notification_logs` is the in-app notification for HR users, with a
`notification_channel_enum` of `IN_APP`, `EMAIL`, `WHATSAPP`. Only `IN_APP` is
used today.

`status_history` records every application status change: from, to, who, and
why. It is the timeline shown on the application detail page.

## Audit

```prisma
model audit_logs {
  actor_id   String?   // hr_employees.id, null means system or candidate
  action     String
  entity     String
  entity_id  String
  old_value  String?
  new_value  String?
  ip_address String?
}
```

Mirrors the PerformX audit table by design, so that a future combined view is
possible. `actor_id` is nullable because candidate-initiated actions have no HR
actor.

There is an `AuditLogInterceptor` in `common/interceptors/`. Check whether it is
applied to the controller you are editing before writing audit rows by hand.

## Indexes

The composite indexes are all filter-then-sort, matching real queries:

```
applications  (status, deleted_at, created_at)
applications  (department_id, status, deleted_at)
applications  (hiring_opportunity_id, status, deleted_at)
applications  (assigned_hr_id, status)
interview_slots (slot_date, slot_time, is_booked)
notification_logs (recipient_hr_id, read_at, created_at)
```

If you add a listing with a different filter, add an index that leads with it.
The application list is the most-hit query in the product.
