# S006 Authority Gap Matrix

Date: 2026-07-29

| Authority Area | Current Authority | Persistence Location | Route / Function | Authorization | Idempotency | Status | Gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Durable audit evidence | S001 durable adapter | `ShopifixerAudit` | `persistShopifixerAudit` via `POST /api/fix-audit` | Existing audit route | `ShopifixerAudit.idempotencyKey` | PROVEN | None for audit evidence |
| Durable merchant | S001 durable adapter | `ShopifixerMerchant` | `persistShopifixerAudit` | Existing audit route | unique normalized domain | PROVEN | Merchant actor auth not established for approval |
| Durable lead | S001 durable adapter | `ShopifixerLead` | `persistShopifixerAudit` | Existing audit route | unique lead idempotency key | PROVEN | None for lead continuity |
| Repair-plan generation | S003 adapter | Derived from `ShopifixerAudit` evidence | `buildShopifixerRepairPlan` | `internalOnly` route | deterministic repair item ids | PROVEN | Plan itself is not separately persisted |
| Repair-scope generation | S004 adapter | None; request-time projection | `buildShopifixerRepairScope` | `internalOnly` if mounted | deterministic `scopeId` | LOCAL_ONLY | Scope is not durable or immutable |
| Scope selection | S004 request/query options | None | `/internal/shopifixer/audits/:auditId/scope` | `internalOnly` | none durable | PLANNING_ONLY | No durable selected scope |
| Merchant identity | Merchant record + normalized store | `ShopifixerMerchant` | S001/S002 adapters | Route-specific | unique normalized domain | PROVEN for store record; MISSING for approving actor | No merchant-authenticated approval actor |
| Merchant approval | Request-time `approvalStatus` only | None | S004/S005 local routes | `internalOnly` if mounted | none durable | MISSING | No approval actor, timestamp, evidence, expiry, or revocation |
| Approval timestamp | None | None | None | None | None | MISSING | Must be recorded durably |
| Approval evidence | None | None | None | None | None | MISSING | Must record terms/source/evidence |
| Approved scope version | S004 deterministic hash only | None | S004 adapter | `internalOnly` if mounted | hash only | PLANNING_ONLY | Must persist immutable scope version/fingerprint |
| Approval revocation | None | None | None | None | None | MISSING | Must support revoke/expire before execution |
| Payment authority | Packet + Stripe webhook | `packets.payment_reference`, `packets.status`, proof events | public checkout, `/payment-return`, `/stripe/webhook` | Stripe signature for webhook; public checkout path | Packet id/payment ref | PROVEN | Keep separate from repair approval unless business rule requires coupling |
| Packet creation | Packet repository | `packets` | `createPacket`, `bindPacketPayment` | Route-specific | `packet_id` primary key | PROVEN | Must only create ShopiFixer execution Packet after durable approval |
| Packet identity | Packet repository / DB PK | `packets.packet_id` | Packet routes/repository | Route-specific | primary key | PROVEN | S005 planning id is not canonical Packet identity |
| Audit-to-Packet link | S001 optional link | `ShopifixerPacketLink` | `persistShopifixerAudit` | Existing audit route | `ShopifixerPacketLink.idempotencyKey`; unique `[auditId, packetId, purpose]` | PROVEN for existing Packet link | No approval/scope reference |
| Execution authorization | Packet lifecycle fields | `packets.execution_status`, `ShopifixerPacketLink.status` | `updatePacketLifecycle` route | No explicit approval gate found | none beyond packet id | AMBIGUOUS | Must gate on durable approval + Packet link before Shopify mutation |
| Shopify mutation authorization | None in S001-S005 | None | Future mission only | Not implemented | None | MISSING | Must be denied until execution gate passes |
| Proof storage | ShopiFixer proof table and StaffordOS proof events | `ShopifixerProofReference`, StaffordOS proof event artifacts | No S006 write route inspected for ShopiFixer proof creation | Route-specific | proof idempotency keys in schema | PROVEN as schema surface; route authority PARTIAL | Need execution proof writer later |
| Completion state | Packet lifecycle fields | `packets.completion_status` | `updatePacketLifecycle` route | No explicit approval gate found | none beyond packet id | PROVEN as field; AMBIGUOUS as authority | Must bind to execution gate and proof requirements |

## Controlled Execution Blockers

- No durable immutable repair scope.
- No durable merchant approval.
- No persisted approval evidence, timestamp, actor, expiry, or revocation.
- No canonical Packet created from approved scope.
- No bridge from approved scope/approval to `ShopifixerPacketLink`.
- S005 identifier is not `packets.packet_id`.
- Existing Packet lifecycle mutation is not yet gated by durable approval.
- No Shopify mutation gate exists.

Current conceptual result:

```json
{
  "EXECUTION_AUTHORIZED": false,
  "reason": "durable approval and canonical Packet linkage are not yet implemented"
}
```
