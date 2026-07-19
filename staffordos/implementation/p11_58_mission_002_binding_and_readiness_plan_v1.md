# P11.58 - Mission 002 Binding And Readiness Plan

Document Type:
Mission 002 governance plan

Mission:
M002.02_MISSION002_BINDING_READINESS_AND_PAYMENT_AUTHORITY_RECONCILIATION

Created:
2026-07-19T14:02:01Z

## Purpose

Create the Mission 002 governance layer required before any engineering
implementation begins.

Mission 002 is defined by
`staffordos/implementation/p11_57_mission_002_authority_definition_v1.md` as
`mission_002_shopifixer_merchant_execution_readiness`.

This plan establishes the binding, readiness model, validator, and authority
registry reconciliation needed to move from discovery into separately governed
engineering slices.

## Repository Authority

Current governed authority:

- `staffordos/implementation/p11_57_mission_002_authority_definition_v1.md`
- `staffordos/implementation/p11_53_mission_001_completion_certification_v1.md`
- `staffordos/implementation/p11_55_governed_production_typo_restoration_v1.md`
- `STAFFORDOS_CANONICAL_CONTINUITY_ROUTE_AUDIT_V1.md`
- `STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md`
- `staffordos/authority/payment_lifecycle_registry_v1.md`
- `staffordos/authority/authority_registry_v1.json`
- `staffordos/authority/authority_registry_v1.md`
- `staffordos/authority/output/payment_authority_source_validation_v1.json`
- `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`

Supporting operational documents:

- `SHOPIFIXER_FIRST_CUSTOMER_EVIDENCE_PACKAGE_TEMPLATE_V1.md`
- `SHOPIFIXER_FIRST_CUSTOMER_OPERATIONS_RUNBOOK_V1.md`
- `SHOPIFIXER_PRODUCTION_PILOT_DECISION_RECORD_V1.md`
- `STAFFORDOS_OPERATOR_SURFACE_INVENTORY_V1.md`
- `STAFFORDOS_OPERATOR_DAILY_WORKFLOW_V1.md`
- `STAFFORDOS_OPERATOR_GAP_CLOSURE_PLAN_V1.md`
- `staffordos/operations/operator_design_system_v1.md`
- `staffordos/operations/operator_visibility_architecture_v1.md`

## Missing Artifact Inventory

P11.57 required these artifacts before Mission 002 implementation:

| Path | Purpose | Pre-M002.02 status | Dependency |
|---|---|---|---|
| `staffordos/missions/mission_002_shopifixer_merchant_execution_readiness_binding_v1.json` | Canonical Mission 002 binding | Missing | P11.57 |
| `staffordos/qa/evaluate_mission_002_shopifixer_execution_readiness_v1.mjs` | Mission 002 readiness evaluator | Missing | Binding, Mission 001 readiness, payment authority, continuity authority |
| `staffordos/qa/validate_mission_002_shopifixer_execution_binding_v1.mjs` | Mission 002 binding/readiness validator | Missing | Evaluator and persisted readiness output |
| `staffordos/qa/output/mission_002_shopifixer_execution_readiness_v1.json` | Current Mission 002 readiness output | Missing | Evaluator |
| `staffordos/implementation/p11_58_mission_002_binding_and_readiness_plan_v1.md` | Mission 002 binding/readiness plan | Missing | P11.57 and M002.01 discovery |

## Payment Authority Reconciliation

M002.01 found a stale authority conflict:

- `staffordos/authority/authority_registry_v1.json` still reported
  `S2F_STRIPE_AUTHORITY_UNIFICATION` as the active blocker.
- `staffordos/authority/authority_registry_v1.md` still required merging Stripe
  verification authority into the canonical webhook path.
- `staffordos/authority/payment_lifecycle_registry_v1.md` still said the
  canonical webhook needed Stripe signature verification.

Later repository authority proves S2F source authority is complete:

- `web/src/routes/stripeWebhook.esm.js` requires `STRIPE_WEBHOOK_SECRET`, uses
  `stripe.webhooks.constructEvent`, and transitions `payment_received` only for
  verified `checkout.session.completed` events after packet checks.
- `web/src/index.js` mounts `installStripeWebhook(app)` before global JSON
  parsing.
- `staffordos/authority/output/payment_authority_source_validation_v1.json`
  reports `status: passed` and `current_blocker: null`.
- `staffordos/authority/output/s2f_completion_report_v1.md` records S2F complete.

The replacement current authority is:

- S2F source authority blocker: none.
- Current next phase: `S2H_CONTROLLED_REAL_PAYMENT_VALIDATION`.
- Real payment validation requires separate explicit payment authority.
- Paid packet execution, merchant execution, Shopify mutation, and proof package
  creation remain blocked until verified payment and separate execution
  authority exist.

## Readiness Model

Mission 002 governance readiness passes only when:

- Mission 001 remains complete.
- Mission 002 definition exists.
- Mission 002 binding exists.
- Mission 002 readiness evaluator, validator, and output exist.
- Payment authority registry no longer carries the stale S2F source blocker.
- Payment source validation output passes.
- Packet authority preserves the `payment_received` boundary.
- `/fix-status` is recognized as canonical continuity authority.
- The missing `/fix-status` implementation is recorded as an engineering gap,
  not hidden.
- Fulfillment-start gates and proof-package requirements are present.
- Competency score remains deferred at 38 until deterministic scoring authority
  exists.

## Implementation Boundaries

This plan authorizes no application behavior changes.

Not permitted by this plan:

- application code changes
- Next.js route changes
- React component changes
- Stripe writes
- Shopify mutation
- packet or reservation mutation
- database migration
- deployment
- environment variable changes
- merchant execution

## First Engineering Slice Policy

The first engineering slice after this governance layer should be separately
authorized and should prefer read-side work.

Candidate supported by M002.01:

- establish the canonical `/fix-status` continuity surface or compatibility
  route using existing packet-read authority

This plan does not authorize that implementation.

## Validation

Required validation for this governance layer:

```bash
node --check staffordos/qa/evaluate_mission_002_shopifixer_execution_readiness_v1.mjs
node --check staffordos/qa/validate_mission_002_shopifixer_execution_binding_v1.mjs
node staffordos/qa/evaluate_mission_002_shopifixer_execution_readiness_v1.mjs
node staffordos/qa/validate_mission_002_shopifixer_execution_binding_v1.mjs
node staffordos/authority/validate_authority_registry_v1.mjs
node staffordos/authority/validate_payment_authority_source_v1.mjs
```

## Rollback

Rollback for this governance layer is repository-only:

```bash
git revert <M002.02_COMMIT_SHA>
```

Rollback does not mutate Shopify, Stripe, packets, databases, or production.

## Decision

GO for Mission 002 governance binding after the listed artifacts exist and the
validators pass.

CONDITIONAL GO for the first engineering slice until that slice has its own
explicit authority, file scope, validation procedure, rollback procedure, and
evidence capture plan.
