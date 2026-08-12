# Code conventions

CareerX is the more carefully built of the two repositories. Where PerformX and
CareerX disagree, CareerX is usually the newer opinion, and its patterns are the
ones to carry forward.

## Backend

### Module shape

Four files per feature, and the repository layer is the difference from
PerformX:

```
feature/
  feature.module.ts
  feature.controller.ts
  feature.service.ts       business rules
  feature.repository.ts    Prisma queries
  dto/
```

The service holds decisions. The repository holds queries. Not every module
follows this (`opportunities`, `departments`, and `dashboard` skip the
repository), but the ones that do are the ones with real query complexity, and
new modules of that kind should follow it.

### Controllers

Guards go on the class or the method explicitly. There are no global guards:

```ts
@Controller('things')
@UseGuards(CareerJwtAuthGuard, PermissionsGuard)
export class ThingsController {
  @Get()
  @Permissions(permission_enum.CAREER_VIEW)
  findAll() {}
}
```

Leaving off `@UseGuards` makes the endpoint public. That is how the candidate
endpoints work, and it is also the easiest mistake to make in this codebase.
When you add a controller method, decide explicitly whether it is public and
write the decorator either way.

`@Permissions` requires **all** listed permissions. Two permissions means both
are needed.

Literal routes before parameterised ones.

### Repositories

Prisma calls only. No HTTP exceptions, no business rules. A repository method
returns data or null; the service decides whether null means 404.

### Services

Throw Nest HTTP exceptions. One nuance worth copying: when a permission check
fails on a record lookup, throw `NotFoundException`, not
`ForbiddenException`. `applications.service.ts` does this deliberately, because
a 403 confirms the record exists.

Ownership checks go in the service. `canViewApplication()` is the pattern:
assigned HR user, or an elevated permission. `PermissionsGuard` cannot express
per-record rules.

### DTOs

`class-validator` decorators. Separate DTOs for create, update, filter, and
response. The response DTOs are what keep internal fields out of public
payloads, which matters most on `hiring_opportunities`.

### Logging

`common/utils/structured-logger.ts` plus `CorrelationMiddleware`. Every request
carries a correlation ID that appears in every log line for that request. Use
the structured logger, not bare `console.log`, or the correlation ID is lost.

### Queues

Import `QueuesModule` to inject a queue. Do not call
`BullModule.registerQueue()` locally; the comment in `queues.module.ts` explains
that duplicate registrations create duplicate Redis connections.

Producers enqueue and return. Workers do the slow work. Anything that calls an
external service and does not need to block the response belongs in a queue.

### External calls

`PerformxClient` is the model: an `AbortController` timeout, explicit handling
of 401 and 403 as `UnauthorizedException`, everything else as
`ServiceUnavailableException`, and validation of the response shape before
trusting it.

Wrap repeated external calls in a circuit breaker. `PerformxCircuitBreaker` is
there to copy.

### Storage

Never persist a URL. Store `bucket` and `storage_path` and generate a signed URL
on demand. Verify the object exists after an upload reports success.

## Frontend

Same conventions as PerformX: one api file per domain in `src/api/`, hooks in
`src/hooks/`, TanStack Query for server state, `react-hook-form` with `zod`,
shadcn primitives in `components/ui/`.

Two things specific to this repository:

**The public and HR sides share one Next.js app** and are separated by
`middleware.ts` on hostname in production. The middleware returns early when
`NODE_ENV !== 'production'`, so a routing bug there will not show up locally.
Test it with a production build if you touch it.

**`src/lib/slot-time.ts`** exists because `interview_slots` stores date and time
in separate columns. Use it. Composing dates by hand is where the timezone bugs
come from.

## Git

Commit history here is inconsistent (`Fixed_Bugs_12`, `CarreX_Fixes`). Do not
copy it. Conventional commits going forward:

```
feat(offers): normalise offers into their own table
fix(sync): handle missing employee endpoint gracefully
docs(p2): add PerformX embedding spec
```

Scopes: `auth`, `opportunities`, `applications`, `candidates`, `interviews`,
`offers`, `files`, `email`, `reports`, `sync`, `queues`, `client`, `schema`,
`docs`.

## What this repository does not have

No tests. No test runner configured.

No linter config, though the client has a `lint` script.

No real migrations, despite `prisma/migrations/migration_lock.toml` existing.

No CI.

The offer-in-a-note pattern, which is the one structural thing that should not
be copied anywhere. See
[The hiring pipeline](p1_hiring_pipeline.md#offers).
