# Stafford Media Blueprint Onboarding Step 4A Decision Checkpoint v1

Status: **APPROVED BY ROSS FOR STEP 4A IMPLEMENTATION — 2026-10-05**

Scope: the seven onboarding policies below and Ross's binding clarifications. This approval does not authorize UI, messaging, delivery, implementation, credit application, production migration, deployment, or changes to the public offer.

## Frozen authority and commercial boundaries

- Step 3 durable authority is `StaffordosBlueprintEngagement` plus immutable `StaffordosBlueprintPaymentEvent`; onboarding extends that engagement rather than creating another CRM, payment, or engagement authority.
- Provider buyer evidence, email, and claimed inquiry references are not identity authority. `clientId` and `inquiryId` remain optional, and neither is populated from a match without Ross's explicit decision.
- Governed changes require the existing server-derived operator subject and `staffordos.revenue_operations.write`; actor identity or permission in a request body is ignored.
- The public terms remain $750, one workflow, all six promised deliverables, delivery within five business days after interview and required information, the existing implementation credit, stated exclusions, and separately scoped/approved implementation.
- Missing inputs permit readiness only when all six deliverables remain achievable, limitations are recorded, and the client agrees. A scope exception or partial fulfillment is never full completion of the original offer.

## Approved policy decisions

| Policy | Approved Step 4A rule |
|---|---|
| Buyer identity | Ross confirms a safe operating contact and records one of: confirm existing client, establish a new identity through the existing authority, leave unassociated pending, or reject claimed association. Inquiry association is a separate optional explicit decision. Candidates, evidence, actor, and time are audited. Buyers without an inquiry may proceed. |
| Workflow boundary | Exactly one active, versioned workflow boundary records trigger, terminal outcome, included work/roles/teams/systems, exclusions/adjacent work, known exceptions, human controls, client owner, Stafford Media owner, and rationale. Client confirmation evidence is required before interview readiness. |
| Inputs/readiness | An engagement-specific versioned checklist records item owner, rationale, status, evidence/received time, and limitations. Unavailable inputs require limitation evidence, client agreement, and an affirmative finding that all six deliverables remain achievable. Ross records readiness. |
| Interview | Ross's authenticated record is sufficient. Record completion date, participants/roles, and evidence reference. It proves the interview occurred; it is not Blueprint acceptance. |
| State allowlist | Only `PAID_IDENTITY_REVIEW → ONBOARDING`; `ONBOARDING → WAITING_FOR_CLIENT_INPUT | READY_FOR_INTERVIEW`; `WAITING_FOR_CLIENT_INPUT → ONBOARDING | READY_FOR_INTERVIEW`; `READY_FOR_INTERVIEW → INTERVIEW_COMPLETE | WAITING_FOR_CLIENT_INPUT`; `INTERVIEW_COMPLETE → WAITING_FOR_CLIENT_INPUT | DELIVERY_READY`; and governed `DELIVERY_READY → ONBOARDING` for an explicitly agreed material workflow change. Each change records previous/next state, server-derived actor, timestamp, reason, and evidence. |
| Material workflow changes | Preserve original scope and original interview/readiness/clock/due dates. A material revision requires explicit Ross and client agreement to the revised boundary and deadline effect. Never silently reset the clock. Without agreement, retain original scope with stated limitations or separately scope the request. |
| Delivery clock | `America/New_York`; the later local date of interview completion and required-input readiness is day zero. Day one is the next business day. Deadline is 5:00 p.m. New York time on business day five, excluding weekends and observed U.S. federal holidays under a versioned OPM calendar. Explicitly approved revisions preserve original dates. Client response after artifact delivery does not change recorded delivery timeliness. |

The exact allowlist was reviewed before implementation and does not conflict with Ross's clarifications.

## Step 4A acceptance criteria

1. Additive onboarding data references `StaffordosBlueprintEngagement.id`; payment facts/events remain unchanged and unrelated engagements are isolated.
2. A buyer without an inquiry can progress; no email/reference matching automatically associates a client or inquiry.
3. Workflow, checklist, limitation agreement, interview evidence, calendar version, original/current dates, and material revisions are durable and versioned.
4. The allowlist and readiness gates fail closed. `DELIVERY_READY` requires identity review, confirmed workflow, interview evidence, readiness evidence, and continued feasibility of all six deliverables.
5. Every successful command atomically appends an immutable audit event. Failed, unauthorized, invalid, or stale commands append nothing.
6. Optimistic version checks reject sequential and concurrent stale changes.
7. Deadline tests cover weekends, observed holidays, year boundaries, and both daylight-saving changes.
8. No Step 4A operation sends messages, creates deliverables, starts delivery/implementation, applies credit, or alters payment authority.

## Implementation checkpoint

Base verified once: GitHub `main` and deployed Render source both `57a41aa8a04aabfd970eaba3eb179c69cc8aaa11` on 2026-10-05.

Isolated worktree: `/private/tmp/cart-agent-blueprint-onboarding-step4a` on `codex/blueprint-onboarding-step4a`.

Implemented local patch files:

- `web/prisma/schema.prisma`
- `web/prisma/migrations/20261005120000_add_staffordos_blueprint_onboarding_authority/migration.sql`
- `web/src/lib/blueprintOnboardingAuthority.js`
- `web/src/lib/blueprintOnboardingCalendar.js`
- `web/src/routes/blueprintOnboarding.esm.js`
- `web/src/index.js`
- `web/src/lib/blueprintOnboardingCalendar.test.js`
- `web/src/routes/blueprintOnboarding.integration.test.js`

Disposable PostgreSQL evidence: all 31 migrations applied successfully. Fourteen selected tests passed across the Step 4A governed HTTP lifecycle, calendar boundaries, Step 3 payment replay/persistence, signed webhook failure behavior, and existing inquiry-review authorization. The Step 4A integration test was rerun after adding explicit wrong-permission coverage and passed. Prisma validation, JavaScript syntax checks, and `git diff --check` passed.

The executable proof covers authorized persistence/readback, no-inquiry identity review, missing service identity/permission rejection, invalid and incomplete transitions, client workflow confirmation, limitation agreement and six-deliverable feasibility, concurrent stale rejection, atomic append-only audit history, payment immutability, engagement isolation, material-change agreement/history, weekends, observed holidays, year boundaries, and both daylight-saving changes.

Review hardening: an existing-client association now fails closed unless a trusted server-side verifier confirms the exact identifier; the deployed route supplies no verifier because no compatible production-durable client authority exists. Non-confirmation outcomes cannot persist a `clientId`. Ready-checklist rewrites preserve the original readiness instant, interview evidence cannot be overwritten, and workflow replacement is rejected after interview readiness. A pre-interview workflow revision remains client-confirmed, versions the boundary, preserves the prior boundary in audit history, and invalidates its old input checklist. The affected disposable-PostgreSQL HTTP integration test passed after these changes; one initial rerun could not connect during PostgreSQL startup, then passed with single-test concurrency after readiness was confirmed.

Remaining limitations: this patch deliberately provides no operator UI or client view; it accepts only governed server-to-server calls through the established internal-key/operator-header boundary. Client-authority lookup/creation is not added, so existing-client confirmation is unavailable rather than accepting a dangling identifier; buyers can proceed safely with an unassociated identity decision. Calendar closure overrides, if ever used, must be supplied by trusted server configuration; none are added here. No production migration, customer mutation, message, or runtime verification was performed.
