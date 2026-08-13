# Phase 2 plan and sequencing

CareerX is not rebuilt in Phase 2. The scope document is explicit that career
portal work is "limited to embedding it as a tab within PerformX and aligning
its data with the HR module, not rebuilding it." The allocation is ₹10,000 for
career portal and visitor management integration combined, which is roughly a
week of one engineer across both.

That leaves room for two things: the integration work, and a small amount of
cleanup that the integration makes easier to justify.

## Scope

| Work | Repository | Page |
| --- | --- | --- |
| Fix the employee sync | PerformX serves, CareerX consumes | [Embedding in PerformX](p2_performx_embedding.md#fix-the-employee-sync-first) |
| Set `PERFORMX_JWT_SECRET` | CareerX config | [Embedding in PerformX](p2_performx_embedding.md) |
| Settle the production domain layout | Both | [Embedding in PerformX](p2_performx_embedding.md#cookies-and-domains) |
| Career tab inside the PerformX shell | Both clients | [Embedding in PerformX](p2_performx_embedding.md) |
| Selected candidate to PerformX employee | Both | [Candidate to employee handoff](p2_hr_handoff.md) |
| Normalise offers into a real table | CareerX | [Schema changes](p2_data_model.md#normalise-offers) |
| Rate limit the public write endpoints | CareerX | [Schema changes](p2_data_model.md#hardening) |

## Ordering

**Day 1 to 2: unblock the integration.**

Add `/internal/employees` to PerformX and confirm the CareerX employee sync
succeeds. This is a half-day fix on the PerformX side and everything else in the
handoff work assumes `hr_employees` is accurate.

Set `PERFORMX_JWT_SECRET` on CareerX in every environment and confirm the
exchange still works with local verification active.

Settle the production domain layout with whoever controls DNS. The cookie
transport needs both applications under one parent domain. This is the item most
likely to take calendar time rather than engineering time, so start it first.

**Day 3 to 5: the tab.**

Wire `client/app/(protected)/career/page.tsx` in PerformX to hand off to
CareerX. Show the nav item only for users with career access. Add a route back.

**Day 6 to 7: the handoff.**

A selected candidate's details pre-fill the PerformX user creation form. See
[Candidate to employee handoff](p2_hr_handoff.md).

**If there is time left: offers.**

Normalising offers out of `hr_notes` is contained work with a clear payoff, and
it is the only structural problem in this repository worth fixing this phase.
It needs a migration, so it also forces the migration setup that both
repositories are missing.

Rate limiting the three public write endpoints is an hour of work and should
happen regardless of what else fits.

## What is not in scope

**Do not merge the databases.** CareerX and PerformX are separate schemas on
purpose. CareerX caches `departments` and `hr_employees` and owns everything
else. That boundary is what lets the career portal be publicly reachable
without exposing employee data.

**Do not rebuild the HR screens inside PerformX.** The scope document rules it
out and there is no budget for it.

**Do not add a CareerX login screen.** PerformX is the identity provider. A
second way in is a second thing to keep secure.

**Do not build the WhatsApp channel here.** `notification_channel_enum` has a
`WHATSAPP` value and nothing uses it. If the WhatsApp add-on happens it belongs
in the PerformX notification engine, which is where every other module's
notifications will go.

## Open questions

**Which handoff mechanism?** Pre-filled form or service-to-service write. The
recommendation and the tradeoff are in
[Candidate to employee handoff](p2_hr_handoff.md#two-options).

**Who is HR in PerformX?** PerformX `role_enum` has no `HR` value, and Phase 2
introduces an HR dashboard with leave approval and document access. Whatever
that decision is, it changes which PerformX role should map to CareerX
permissions in `hr_role_permissions`. Track the decision on the PerformX side.

**What is `APP_RETENTION_DAYS` set to?** The nightly cleanup cron soft deletes
applications past that age. Candidate personal data retention is a policy
decision. Confirm the value with the client rather than shipping whatever is
currently in the environment.

## Risks

**The domain layout is not an engineering decision.** If the two applications
cannot share a parent domain, the cookie transport does not work and the
fallback puts the PerformX JWT somewhere JavaScript can read it. Find out early.

**The employee sync has been broken for a while.** `hr_employees` may be
missing people, and may show deactivated PerformX users as active. Once the sync
works, expect a batch of corrections on the first successful run. Check what
changes before assuming it is a clean fix.

**The offer migration touches live data.** Every existing offer is a JSON string
in a notes row. Parsing them into a table means handling malformed rows,
duplicate versions for one application, and both key spellings. Write the script
to be idempotent and dry-runnable, and keep the notes rows until the new table
has been verified.
