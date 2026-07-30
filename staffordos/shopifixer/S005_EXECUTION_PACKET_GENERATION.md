# S005 Execution Packet Generation

## Gate

S005_IMPLEMENTED_LOCALLY

## Scope

Implemented a deterministic, non-persistent ShopiFixer Execution Packet layer
derived from an approved Repair Scope. This mission created planning artifacts
only. It did not execute Shopify changes, create Packet records, mutate Packet
authority, change schema, add migrations, deploy, commit, push, create payment
records, invoke webhooks, or contact customers.

## Packet Contract

Route:

`GET /internal/shopifixer/audits/:auditId/execution-packet`

Authorization:

existing `internalOnly` middleware using `x-internal-api-key`.

Required scope state:

- `approvalStatus=APPROVED`
- `executionReadiness=READY`
- at least one included repair

Because S004 approval persistence is not implemented, the internal route uses
the read-only `approvalStatus=APPROVED` query context to derive an approved
scope for packet generation. Any missing or non-approved status is rejected.

Packet fields:

- `packetId`
- `auditId`
- `scopeId`
- `merchant.store`
- `generatedAt`
- `packetVersion`
- `packetStatus`
- `executionBoundary`
- `approvedRepairs`
- `excludedRepairs`
- `deferredRepairs`
- `assumptions`
- `dependencies`
- `implementationSequence`
- `rollbackSequence`
- `verification`
- `authority`

## Authorization Model

The packet is generated only from an approved and ready Repair Scope. It records:

- `approvalState`
- `operatorAuthorization`
- `executionReadiness`
- `currentMissionExecutionAuthorized: false`
- future execution requirements:
  - separately governed execution mission;
  - this packet ID;
  - operator authorization;
  - before evidence capture;
  - rollback readiness.

S005 does not authorize execution. The packet is a planning contract for a
future mission.

## Execution Boundary

The packet explicitly separates:

- `AUTHORIZED`: only approved repairs from the included scope items.
- `NOT AUTHORIZED`: Shopify changes outside approved repairs, Packet table
  mutation, payment mutation, webhook invocation, customer communication, and
  broad redesign/refactor.
- `OUT OF SCOPE`: excluded and deferred scope items.

No engineering work may occur outside the packet.

## Ordering

Implementation steps are sorted by scope priority and stable item ID.
Rollback steps are generated in reverse implementation order.

## Verification

The packet includes:

- expected verification steps derived from each included repair;
- completion criteria;
- required evidence:
  - `pre_execution_scope_snapshot`
  - `implementation_change_log`
  - `post_execution_visual_or_behavioral_evidence`
  - `rollback_readiness_note`
  - `operator_completion_verification`

## Files Changed

- `web/src/lib/shopifixerExecutionPacketAdapter.js`
- `web/src/lib/shopifixerExecutionPacketAdapter.test.js`
- `web/src/routes/shopifixerAuditRetrieval.esm.js`
- `web/src/routes/shopifixerAuditRetrieval.test.js`
- `staffordos/shopifixer/S005_EXECUTION_PACKET_GENERATION.md`

No Prisma schema or migration file changed.

## Example Packet

Test data example only:

```json
{
  "packetId": "shopifixer_exec_packet_<stable_hash>",
  "auditId": "audit_123",
  "scopeId": "scope_<stable_hash>",
  "merchant": {
    "store": "no-kings-athletics.myshopify.com"
  },
  "packetVersion": "shopifixer.execution_packet.v1",
  "packetStatus": "PLANNING_ONLY",
  "executionBoundary": {
    "authorized": [
      {
        "title": "Shipping issue",
        "authorizedAction": "Clarify shipping, delivery, or late-stage purchase expectations in the affected purchase path."
      }
    ],
    "notAuthorized": [
      "Any Shopify mutation outside the approved repairs listed in this packet.",
      "Packet table creation, mutation, or lifecycle transition.",
      "Payment record creation or mutation.",
      "Webhook invocation.",
      "Customer or merchant communication.",
      "Theme redesign or broad refactor outside the approved repair items."
    ],
    "outOfScope": []
  },
  "authority": {
    "approvalState": "APPROVED",
    "executionReadiness": "READY",
    "currentMissionExecutionAuthorized": false
  }
}
```

## Verification Executed

- `node --test web/src/lib/shopifixerDurableAuditAdapter.test.js web/src/lib/shopifixerDurableAuditRetrievalAdapter.test.js web/src/lib/shopifixerRepairPlanAdapter.test.js web/src/lib/shopifixerRepairScopeAdapter.test.js web/src/lib/shopifixerExecutionPacketAdapter.test.js web/src/routes/shopifixerAuditRetrieval.test.js`
  - Result: 41 passing tests, 0 failures.
- `node --check web/src/lib/shopifixerExecutionPacketAdapter.js`
  - Result: passed.
- `node --check web/src/lib/shopifixerExecutionPacketAdapter.test.js`
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
  - S005 route without internal key: 401.
  - S005 route with wrong internal key: 401.
  - S005 route with local test key and invalid audit ID: 400 `invalid_audit_id`, proving the handler path is reached without a database write.

## Rollback Plan

1. Remove `GET /internal/shopifixer/audits/:auditId/execution-packet`.
2. Remove `buildShopifixerExecutionPacketHandler` from `shopifixerAuditRetrieval.esm.js`.
3. Remove `web/src/lib/shopifixerExecutionPacketAdapter.js`.
4. Remove `web/src/lib/shopifixerExecutionPacketAdapter.test.js`.
5. Revert S005 additions in `web/src/routes/shopifixerAuditRetrieval.test.js`.
6. Optionally remove this StaffordOS S005 artifact.

No database rollback is required because S005 performs no writes and introduces
no schema or migration change.

## Remaining Blockers

None for local S005 implementation. Durable approval persistence and production
promotion require separately authorized missions.
