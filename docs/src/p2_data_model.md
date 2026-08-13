# Phase 2 schema changes

CareerX needs very little new schema in Phase 2. One table, one column, and a
data migration.

## Set up migrations first

`prisma/migrations/migration_lock.toml` exists but there are no migration
directories. Everything has been applied with `db push`. Before any change that
touches existing data, establish a baseline:

```bash
cd server
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
npx prisma migrate resolve --applied 0_init
```

From then on `prisma migrate dev` locally and `prisma migrate deploy` on
release. Verify the whole sequence against a restored copy of production before
running it for real.

## Normalise offers

The one structural change worth making. Today an offer is a JSON string inside
`hr_notes.note`. See
[Known gaps](p1_known_gaps.md#offers-live-inside-hr-notes) for what that costs.

### The table

```prisma
model offers {
  id                String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  application_id    String            @db.Uuid
  offer_reference   String            @unique @db.VarChar(50)
  status            offer_status_enum @default(DRAFT)
  salary            Decimal           @db.Decimal(12, 2)
  currency          String            @default("INR") @db.VarChar(3)
  employment_type   String?           @db.VarChar(50)
  location          String?           @db.VarChar(255)
  reporting_manager String?           @db.VarChar(255)
  joining_date      DateTime?         @db.Date
  expiry_date       DateTime?         @db.Date
  remarks           String?
  document_path     String?           @db.VarChar(500)
  generated_by_id   String            @db.Uuid
  created_at        DateTime          @default(now()) @db.Timestamptz(6)
  updated_at        DateTime          @default(now()) @db.Timestamptz(6)

  application  applications @relation(fields: [application_id], references: [id], onDelete: Cascade)
  generated_by hr_employees @relation(fields: [generated_by_id], references: [id], onDelete: NoAction)

  @@index([application_id, created_at])
  @@index([status, expiry_date])
}

enum offer_status_enum {
  DRAFT
  SENT
  ACCEPTED
  DECLINED
  EXPIRED
  WITHDRAWN
}
```

`application_id` is not unique, so an application can have several offers over
time, with the newest by `created_at` being current. That matches the existing
append-only behaviour without the string parsing.

`offer_reference` is unique and defaults to `OFFER-<application_code>` in the
current code. Multiple offers per application means the second one collides.
Either append a version suffix or drop the unique constraint. A suffix is
better; a duplicate reference on paper offers is confusing.

`document_path` points into the `offer-documents` bucket, so a generated PDF has
somewhere to live. Nothing generates one today.

### The migration script

Read every `hr_notes` row whose `note` starts with `{"type":"OFFER_DOCUMENT"`,
parse it, and insert an `offers` row.

Handle these cases, because the data will contain all of them:

- Malformed JSON. Log the note id and skip; do not abort the run
- Both camelCase and snake_case keys. The read path already accepts both, so the writes have been inconsistent
- Multiple notes for one application. Insert all of them, ordered by `created_at`, so history is preserved
- Missing `salary`. It is non-nullable in the new table; decide on 0 with a flag or skip the row
- Missing `status`. The old read path defaults to `DRAFT`

Make it idempotent and dry-runnable. Something like:

```bash
bun run scripts/migrate-offers.ts --dry-run
bun run scripts/migrate-offers.ts
```

Keep the `hr_notes` rows after migrating. Do not delete them in the same
release. Verify the new table against the old data in production, then remove
the notes in a later change.

### Code changes

`getOffer()` becomes a `findFirst` on `offers` ordered by `created_at desc`.
`generateOffer()` becomes an insert. Both lose their JSON parsing and their
key-spelling tolerance.

`GET /hr-notes/application/:id` should exclude offer notes for as long as they
remain in the table, so the notes list stops showing raw JSON.

`GET /dashboard/offers-stats` and any offer reporting can become real SQL
aggregates instead of scan-and-parse.

## Handoff tracking

If the candidate-to-employee handoff records that a candidate became a PerformX
user, one column on `applications`:

```prisma
performx_user_id String? @db.Uuid   // set when the candidate becomes an employee
onboarded_at     DateTime? @db.Timestamptz(6)
```

No foreign key. That user lives in the PerformX database and a cross-database
foreign key is not possible. The column is a reference, and the application code
must treat it as one that may point at a deleted user.

See [Candidate to employee handoff](p2_hr_handoff.md).

## Hardening

Small changes worth making in the same phase.

### Rate limiting

Three endpoints accept unauthenticated writes:

```
POST /candidates
POST /applications
POST /interview-slots/book
```

Install `@nestjs/throttler`, which PerformX already uses, and apply a strict
limit to each. Something like 5 requests per hour per IP on `/applications`, and
20 per hour on the other two.

```ts
@Throttle({ default: { limit: 5, ttl: 3600000 } })
@Post()
create(@Body() dto: CreateApplicationDto) {}
```

IP-based limiting behind a proxy needs `trust proxy` set on the Express instance
or every request appears to come from the load balancer.

### Scope the booking link

The interview invitation email links to `/book-interview` with no token. Knowing
an application id is enough to book on someone's behalf.

Add a short-lived signed token to the link and verify it in
`POST /interview-slots/book`. The token can be a JWT signed with
`CAREER_JWT_SECRET` carrying the application id and an expiry matching the slot.
No new dependency and no new table.

### Candidate email uniqueness

`candidates.email` has an index and no unique constraint. Before adding one,
find out how many duplicates already exist and how HR wants them merged.

The safer version for this phase is normalising case on write and on lookup, so
new duplicates stop appearing, and leaving the existing ones for a dedup pass
later.

### Application code sequence

Replace the count-then-insert with a Postgres sequence per year:

```sql
CREATE SEQUENCE IF NOT EXISTS application_code_seq_2026 START 1;
```

Or a single sequence with the year as a prefix and no per-year reset, which
avoids creating a sequence every January. Either way the generation stops being
concurrency dependent. See
[Known gaps](p1_known_gaps.md#application-code-generation-can-collide).

## What not to add

**No new modules.** The Phase 2 budget covers integration, not features.

**No offers UI rebuild.** Normalising the table is a backend change; the
existing offer screens keep working against the same endpoints.

**No `WHATSAPP` implementation.** The enum value exists. If the WhatsApp add-on
happens it belongs in the PerformX notification engine, not here.

**No merging with the PerformX schema.** The two databases stay separate.
