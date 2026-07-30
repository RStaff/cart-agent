# S006 Target Authority Model

Date: 2026-07-29

## Principle

`public.packets` remains the canonical Packet authority. ShopiFixer may create or associate a Packet only after a durable merchant approval references an immutable repair scope. S005 output remains an execution manifest or preview until it is backed by a canonical Packet row and durable approval evidence.

## Durable Transition

```text
Durable Audit
  -> Deterministic Repair Plan
  -> Immutable Repair Scope
  -> Durable Merchant Approval
  -> Canonical Packet
  -> ShopifixerPacketLink
  -> Execution Manifest Projection
  -> Future Shopify execution gate
```

## Proposed Contracts

### Immutable Repair Scope

- Tied to one `ShopifixerAudit`.
- Tied to one `ShopifixerMerchant`.
- Stores `scopeId`, `scopeVersion`, and `scopeFingerprint`.
- Stores a complete immutable scope snapshot.
- Stores included, excluded, and deferred repair ids.
- Records source evidence version.
- Does not authorize Shopify mutation by itself.
- May be superseded, but a Packet must reference the exact approved scope version.

### Durable Merchant Approval

- References one immutable repair scope.
- Records approving actor, actor type, approval source, approval timestamp, approval evidence, and terms snapshot.
- Records approval status: approved, rejected, revoked, expired, or pending-review equivalent.
- Includes expiry and revocation where applicable.
- Is idempotent by a stable approval idempotency key.
- Does not silently change when scope generation logic changes.

### Canonical Packet Relationship

- Canonical Packet identity is `packets.packet_id`.
- Packet creation/association must use the existing Packet repository authority or a narrow wrapper around it.
- ShopiFixer linkage must be durable through `ShopifixerPacketLink`.
- Packet link should reference the approved scope and approval record.
- Packet creation must be idempotent.
- Existing Packet rows remain compatible.

### S005 Manifest Role

Before canonical Packet creation:

- S005 is an execution manifest preview.
- It can show proposed work, rollback sequence, and verification requirements.
- It is not execution authority.

After canonical Packet creation:

- S005-compatible output should be projected from persisted Packet, immutable scope, and durable approval records.
- The returned identifier should either be the canonical `packet_id` or clearly distinguish `manifestId` from `packetId`.

## Route Transitions

| Transition | Actor | Route Shape | Writes | Prohibited Side Effects |
| --- | --- | --- | --- | --- |
| Preview scope | Operator/system | `GET /internal/shopifixer/audits/:auditId/scope` | None | Packet, Shopify, payment, webhook |
| Store scope | Operator | `POST /internal/shopifixer/audits/:auditId/repair-scopes` | Scope row + event | Packet, Shopify, payment, webhook |
| Record approval | Merchant or operator-mediated | `POST /internal/shopifixer/repair-scopes/:scopeId/approvals` | Approval row + event | Packet unless separately authorized, Shopify, payment, webhook |
| Create/associate Packet | Operator/system | `POST /internal/shopifixer/approvals/:approvalId/packet` | Packet row and link | Shopify, payment initiation, webhook, customer contact |
| Retrieve manifest | Operator/system | `GET /internal/shopifixer/packets/:packetId/execution-manifest` | None | Any mutation |
| Revoke/expire approval | Merchant/operator/system | `POST /internal/shopifixer/approvals/:approvalId/revoke` or scheduled expiry | Approval/link status update + event | Shopify, payment mutation |

Merchant-direct approval must not use `x-internal-api-key` alone. If the first implementation is operator-mediated, the operator route must capture external merchant approval evidence and operator identity.

## Idempotency Model

- Scope storage: unique `scopeFingerprint` and `[auditId, scopeVersion]`.
- Approval storage: unique approval `idempotencyKey`.
- Packet creation: deterministic Packet id or deterministic PacketLink idempotency key tied to approval id and scope fingerprint.
- Packet link: existing `idempotencyKey`, unique `[auditId, packetId, purpose]`, and active-link key.

## Revocation and Expiry

- Approval may be revoked or expired only before execution begins.
- Revocation updates approval state and cancels/supersedes active Packet link if no execution has started.
- Once execution starts, revocation becomes an incident/recovery review, not a silent status flip.

## Execution Gate

Execution requires all of:

- durable source audit exists;
- repair plan can be regenerated from stored evidence;
- immutable repair scope exists;
- durable approval exists and is approved;
- approval references the exact scope fingerprint;
- approval is not expired or revoked;
- canonical Packet exists;
- Packet is linked to the approved scope and approval;
- Packet status and execution status permit execution;
- operator execution authorization exists;
- exact target store matches the durable merchant;
- approved repair ids match the scope snapshot;
- implementation and rollback sequence is present;
- proof requirements are present;
- payment condition is satisfied only if current business authority requires payment before execution.

Current result:

```json
{
  "EXECUTION_AUTHORIZED": false,
  "failed_conditions": [
    "repair_scope_not_durable",
    "durable_merchant_approval_missing",
    "canonical_packet_not_linked_to_approval",
    "shopify_execution_gate_not_implemented"
  ]
}
```

## Selected Storage Option

`OPTION C - ADDITIVE APPROVAL AND SCOPE MODELS`

Reason: it preserves existing Packet authority without overloading Packet status, audit snapshots, or `ShopifixerPacketLink.sourceMetadata`.

## Promotion Recommendation

`HELD_UNTIL_DURABLE_AUTHORITY_EXISTS`

S004 and S005 are useful local planning slices, but they should not be promoted unchanged as production authority because request-time `APPROVED` and `execution-packet` terminology can be misread as durable approval and canonical Packet creation.

## Implementation Sequence

1. S006.01: Add durable immutable scope and merchant approval storage.
2. S006.02: Add canonical Packet creation/association from durable approval.
3. S006.03: Add canonical manifest retrieval and execution-gate verification.
4. S006.04: Governed production promotion and controlled proof, still without Shopify mutation.

Shopify execution remains a later separately authorized mission.
