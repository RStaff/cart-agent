# S004 Merchant Repair Scope Selection and Approval

## Gate

S004_IMPLEMENTED_LOCALLY

## Scope

Implemented a deterministic, non-persistent Repair Scope layer derived from
the durable audit retrieval and deterministic repair plan. This mission did not
perform execution, Shopify mutation, Packet creation, payment, webhook,
customer communication, schema change, migration, deployment, commit, or push.

## Repair Scope Contract

Route:

`GET /internal/shopifixer/audits/:auditId/scope`

Authorization:

existing `internalOnly` middleware using `x-internal-api-key`.

Input:

- `auditId` path parameter;
- optional store isolation query: `store`, `storeDomain`, or `store_domain`;
- optional read-only approval-state query: `approvalStatus` or `approval_status`.

Output:

- `auditId`
- `store`
- `scopeId`
- `generatedAt`
- `sourceEvidenceVersion`
- `sourceAuditCompletedAt`
- `totalFindings`
- `includedRepairs`
- `excludedRepairs`
- `deferredRepairs`
- `estimatedImplementationSize`
- `approvalStatus`
- `approvalModel`
- `executionReadiness`
- `executionReadinessReasons`
- `implementationAssumptions`
- `implementationDependencies`
- `notInScope`
- `packetState`

Each scope repair item includes:

- `scopeItemId`
- `sourceRepairItemId`
- `sourceFindingId`
- `priorityRank`
- `title`
- `reason`
- `evidence`
- `recommendedImplementation`
- `estimatedComplexity`
- `implementationDependency`
- `verificationCriteria`
- `rollbackExpectation`
- `included`
- `excluded`
- `scopeDisposition`
- `inclusionReason`
- `actionableStatus`
- `merchantNotes`

## Approval Model

Supported states:

- `DRAFT`
- `READY_FOR_REVIEW`
- `READY_FOR_MERCHANT_APPROVAL`
- `APPROVED`
- `REJECTED`
- `EXPIRED`

Transitions are deterministic and local to the returned scope:

- `DRAFT` -> `READY_FOR_REVIEW`, `REJECTED`, `EXPIRED`
- `READY_FOR_REVIEW` -> `DRAFT`, `READY_FOR_MERCHANT_APPROVAL`, `REJECTED`, `EXPIRED`
- `READY_FOR_MERCHANT_APPROVAL` -> `APPROVED`, `REJECTED`, `EXPIRED`
- `APPROVED` -> `EXPIRED`
- `REJECTED` -> `DRAFT`
- `EXPIRED` -> `DRAFT`

No approval state is persisted in S004.

## Execution Readiness Model

Readiness values:

- `READY`
- `BLOCKED`
- `REQUIRES_CONFIRMATION`
- `REQUIRES_DISCOVERY`

Rules:

- `REJECTED` or `EXPIRED` scopes are `BLOCKED`.
- Scopes with no included repairs and discovery-only deferred work are `REQUIRES_DISCOVERY`.
- Scopes with included repairs but no `APPROVED` status are `REQUIRES_CONFIRMATION`.
- `APPROVED` scopes with included actionable repairs are `READY`; deferred repairs remain outside the implementation boundary.

This is planning only. It does not authorize Shopify mutation or Packet
creation.

## Implementation Boundary

Files changed:

- `web/src/lib/shopifixerRepairScopeAdapter.js`
- `web/src/lib/shopifixerRepairScopeAdapter.test.js`
- `web/src/routes/shopifixerAuditRetrieval.esm.js`
- `web/src/routes/shopifixerAuditRetrieval.test.js`
- `staffordos/shopifixer/S004_MERCHANT_REPAIR_SCOPE_SELECTION_AND_APPROVAL.md`

No Prisma schema or migration file changed.

## Example Scope

Test data example only:

```json
{
  "auditId": "audit_123",
  "store": "no-kings-athletics.myshopify.com",
  "approvalStatus": "APPROVED",
  "executionReadiness": "READY",
  "estimatedImplementationSize": "small",
  "includedRepairCount": 1,
  "deferredRepairCount": 0,
  "excludedRepairCount": 0,
  "includedRepairs": [
    {
      "title": "Shipping issue",
      "included": true,
      "scopeDisposition": "INCLUDED",
      "recommendedImplementation": "Clarify shipping, delivery, or late-stage purchase expectations in the affected purchase path.",
      "rollbackExpectation": "Revert only the bounded change approved by the future execution packet."
    }
  ],
  "notInScope": [
    "Shopify mutation",
    "Packet creation",
    "Payment action",
    "Webhook invocation",
    "Customer communication",
    "Unbounded redesign"
  ]
}
```

## Verification

Focused validation executed locally:

- `node --test web/src/lib/shopifixerDurableAuditAdapter.test.js web/src/lib/shopifixerDurableAuditRetrievalAdapter.test.js web/src/lib/shopifixerRepairPlanAdapter.test.js web/src/lib/shopifixerRepairScopeAdapter.test.js web/src/routes/shopifixerAuditRetrieval.test.js`
  - Result: 32 passing tests, 0 failures.
- `node --check web/src/lib/shopifixerRepairScopeAdapter.js`
  - Result: passed.
- `node --check web/src/lib/shopifixerRepairScopeAdapter.test.js`
  - Result: passed.
- `node --check web/src/routes/shopifixerAuditRetrieval.esm.js`
  - Result: passed.
- `node --check web/src/routes/shopifixerAuditRetrieval.test.js`
  - Result: passed.
- `npx prisma validate --schema=prisma/schema.prisma`
  - Result: schema valid; no database command executed.
- `git diff --check`
  - Result: passed.
- Temporary local app on port 8094:
  - `/health`: 200.
  - `/`: 200.
  - S004 route without internal key: 401.
  - S004 route with wrong internal key: 401.
  - S004 route with local test key and invalid audit ID: 400 `invalid_audit_id`, proving the handler path is reached without a database write.

## Rollback Plan

1. Remove `GET /internal/shopifixer/audits/:auditId/scope` route registration.
2. Remove `buildShopifixerRepairScopeHandler` from `shopifixerAuditRetrieval.esm.js`.
3. Remove `web/src/lib/shopifixerRepairScopeAdapter.js`.
4. Remove `web/src/lib/shopifixerRepairScopeAdapter.test.js`.
5. Revert S004 additions in `web/src/routes/shopifixerAuditRetrieval.test.js`.
6. Optionally remove this StaffordOS S004 artifact.

No database rollback is required because S004 performs no writes and introduces
no schema or migration change.

## Remaining Blockers

None for local S004 implementation. Production promotion and merchant approval
persistence, if needed, require separately authorized missions.
