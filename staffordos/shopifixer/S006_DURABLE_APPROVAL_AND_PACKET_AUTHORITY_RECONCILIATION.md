# S006 Durable Approval and Packet Authority Reconciliation

Date: 2026-07-29

Mode: read-only authority discovery and implementation design.

## Gate

S006_AUTHORITY_MODEL_CERTIFIED

## Baseline

- Repository root: `/Users/rossstafford/projects/cart-agent`
- Branch: `main`
- HEAD: `cb13ecaf5696344282f8f03c9a4a46be37d5931f`
- origin/main: `cb13ecaf5696344282f8f03c9a4a46be37d5931f`
- Staged files: none
- Production Render service: `cart-agent-api`
- Latest observed live deployment: `dep-d9l3ocbm8hqs7396v8ig`
- Production `/health`: `200`
- Production database: `cart_agent_db`
- PostgreSQL: `17.9`
- Production migration reconciliation: 21 repository migrations, 21 successful unique production migration names, no unfinished migrations.
- Historical Prisma note: `20260310154047_add_jobs_and_system_events` has a rolled-back row followed by a successful row; this is retained in production history and is not a new pending migration.
- Local Prisma schema/migration drift: none observed under `web/prisma`.
- Packet authority source drift during S004/S005: none observed for `web/src/lib/packetRepository.js` or `web/src/routes/packetAuthority.esm.js`.
- S004/S005 local files: `web/src/lib/shopifixerRepairScopeAdapter.js`, `web/src/lib/shopifixerRepairScopeAdapter.test.js`, `web/src/lib/shopifixerExecutionPacketAdapter.js`, `web/src/lib/shopifixerExecutionPacketAdapter.test.js`, with route/test integration in `web/src/routes/shopifixerAuditRetrieval.esm.js` and `web/src/routes/shopifixerAuditRetrieval.test.js`.
- StaffordOS evidence artifacts present: `S004_MERCHANT_REPAIR_SCOPE_SELECTION_AND_APPROVAL.md`, `S005_EXECUTION_PACKET_GENERATION.md`.

## Canonical Packet Source Inventory

| Component | Behavior | Caller / Route | Authorization | Durable fields affected | Status |
| --- | --- | --- | --- | --- | --- |
| `web/prisma/schema.prisma` `Packet` model | Canonical Prisma mapping for `packets` | Prisma Client | Repository schema | `packet_id`, `store_domain`, `payment_reference`, lifecycle status fields, timestamps | Current |
| `web/src/lib/packetRepository.js` `ensurePacketTable` | Runtime table/index/column assurance by direct SQL | Packet repository calls | DATABASE_URL authority | `packets` table DDL if missing | Current but legacy-operational pattern |
| `web/src/lib/packetRepository.js` `createPacket` | Creates or updates a Packet by `packet_id`; generates random `packet_<store>_<suffix>` if no id supplied | `/api/packets/prepare`, public checkout | Route-level authority only | `packet_id`, `reservation_id`, `store_domain`, `payment_reference`, `status`, `updated_at` | Current production-reachable |
| `web/src/lib/packetRepository.js` `bindPacketPayment` | Inserts or updates Packet payment binding; preserves `payment_received` status | Public checkout, `/payment-return`, Stripe webhook | Route/webhook context | `reservation_id`, `store_domain`, `payment_reference`, `status`, `updated_at` | Current production-reachable |
| `web/src/lib/packetRepository.js` `getPacket` | Reads one Packet | Public Packet routes, webhook, S001 validation | None for public route; webhook-specific for Stripe path | None | Current production-reachable |
| `web/src/lib/packetRepository.js` `listPackets` | Lists recent Packets, optionally by store | `/api/operator/packets` | No explicit middleware in inspected route | None | Current production-reachable |
| `web/src/lib/packetRepository.js` `updatePacketLifecycle` | Updates Packet lifecycle strings | `POST /api/packets/:packetId/execution` | No explicit middleware in inspected route | `status`, `execution_status`, `proof_status`, `completion_status`, `updated_at` | Current production-reachable |
| `web/src/routes/packetAuthority.esm.js` | Mounts Packet prepare/read/list/execution/payment-return routes | Installed in `web/src/index.js` | No explicit auth on inspected Packet routes | Delegates to packet repository | Current production-reachable |
| `web/src/checkout-public.js` | Public checkout creates Packet, Stripe session, then binds payment reference | `POST /__public-checkout` | Public request plus Stripe credentials | Packet create/payment binding | Current production-reachable |
| `web/src/routes/stripeWebhook.esm.js` | Verified Stripe webhook locates Packet and marks `payment_received`; appends proof events | `POST /stripe/webhook` | Stripe signature + webhook secret | Packet payment status through `bindPacketPayment`; StaffordOS proof events | Current production-reachable |
| `web/src/lib/shopifixerDurableAuditAdapter.js` | Links a ShopiFixer audit to an existing Packet only when `packetId` is supplied and store matches | `POST /api/fix-audit` | Existing audit route; no Packet creation | `ShopifixerPacketLink`, `ShopifixerLeadEvent` payload | Current production-reachable |
| `web/src/lib/shopifixerDurableAuditRetrievalAdapter.js` | Reads existing Packet link and selected Packet fields | Internal S002/S003 routes | `internalOnly` | None | Current production-reachable |
| `web/src/lib/shopifixerRepairPlanAdapter.js` | Reads Packet state from retrieved durable links into plan output | Internal S003 route | `internalOnly` | None | Current production-reachable |
| `web/src/lib/shopifixerRepairScopeAdapter.js` | Local deterministic scope projection; no Packet mutation | Local S004 route | `internalOnly` if mounted | None | Local-only, uncommitted |
| `web/src/lib/shopifixerExecutionPacketAdapter.js` | Local deterministic execution manifest; no canonical Packet mutation | Local S005 route | `internalOnly` if mounted | None | Local-only, uncommitted |
| `web/src/jobs/repository.js`, `web/src/system-events.js`, `web/src/lib/decisionLogs.js` | Store `packetId` as correlation on non-Packet records | Job/event/decision writers | Caller-specific | Job/SystemEvent/DecisionLog only | Current correlation-only |

No second unexplained canonical Packet creation authority was found. Multiple routes can create or bind Packets, but they converge on `packetRepository.js`.

## Packet Database Contract

Repository and production metadata agree on the canonical Packet surface:

- Physical table: `public.packets`
- Primary identifier: `packet_id` text primary key
- Store identity: `store_domain` text not null
- Payment authority field: `payment_reference` text nullable
- Status field: `status` text not null default `prepared`
- Lifecycle fields: `execution_status`, `proof_status`, `completion_status`, all text not null default `not_started`
- Reservation correlation: `reservation_id` text nullable
- Timestamps: `created_at`, `updated_at`
- Indexes: `packets_pkey`, `packets_store_domain_created_at_idx`, `packets_payment_reference_idx`
- Production row count observed: 16

ShopiFixer relations to Packet:

- `ShopifixerLeadEvent.packetId` -> `packets.packet_id`, `ON DELETE SET NULL`
- `ShopifixerPacketLink.packetId` -> `packets.packet_id`, `ON DELETE RESTRICT`
- `ShopifixerProofReference.packetId` -> `packets.packet_id`, `ON DELETE RESTRICT`

## Existing Packet Lifecycle

Packet lifecycle is string-field based and not constrained by enums.

Observed states and transitions:

- `prepared`: default status on Packet creation without payment reference.
- `payment_pending`: set by public checkout, payment return, or explicit create/bind input.
- `payment_received`: set by verified Stripe webhook after Packet lookup, store match, reservation id presence, and proof-event append.
- `execution_status`: defaults to `not_started`; route accepts caller-supplied values without an inspected enum gate.
- `proof_status`: defaults to `not_started`; route accepts caller-supplied values without an inspected enum gate.
- `completion_status`: defaults to `not_started`; route accepts caller-supplied values without an inspected enum gate.

Current Packet represents a combination of:

- payment authority: yes, through `payment_reference` and Stripe webhook updates;
- engineering execution tracking: partial, through mutable lifecycle fields;
- proof continuity: partial, through proof events and ShopiFixer proof references;
- audit continuity: indirect, through `ShopifixerPacketLink`;
- merchant repair approval: not proven.

## S004 Approval Authority Classification

Classification: `PLANNING_STATE_ONLY`

Evidence:

- `buildShopifixerRepairScope` accepts `approvalStatus` from options or input and defaults to `READY_FOR_REVIEW`.
- The route passes `req.query.approvalStatus` / `approval_status` into the adapter.
- Tests exercise `approvalStatus=APPROVED` and receive `executionReadiness: READY`.
- No durable approval record is written.
- No merchant identity authentication is performed.
- No approval timestamp, actor, approval evidence, scope version record, expiry, or revocation persistence exists.
- `scopeId` is deterministic, but it currently includes approval status and item partitions instead of referencing a persisted immutable scope version.

Weaknesses:

- An internal caller can request `APPROVED` as a query value.
- Approval does not survive as a durable authority record.
- Approval is not tied to a merchant-authenticated actor.
- Approval can be replayed by repeating the same request.
- Operators cannot distinguish merchant approval from test/request input without external evidence.

## S005 Packet Semantic Classification

Classification: `S005_IS_EXECUTION_MANIFEST`

Evidence:

- `packetId` is generated as `shopifixer_exec_packet_<hash>`.
- The identifier is derived from execution-packet version, audit id, scope id, store, and approved repair item ids.
- `generatedAt` does not affect identity.
- Identical inputs produce stable output.
- The adapter performs no database write and does not call Packet repository functions.
- Returned `packetStatus` is `PLANNING_ONLY`.
- Returned authority includes `currentMissionExecutionAuthorized: false`.
- The execution boundary explicitly says Packet table mutation is not authorized.

Relationship to canonical `packets.packet_id`:

- There is no current relationship. The S005 identifier is a planning identifier, not a row in `public.packets`.
- Collision risk is low by prefix and hash construction, but not database-enforced because no canonical Packet row is created.
- It must not be treated as canonical execution authority until linked to a durable approval and canonical Packet row.

## Authority Gap Summary

The blocking gaps before controlled merchant execution are:

- Repair Scope is not durable.
- Merchant approval is not durable.
- Approval actor, timestamp, evidence, expiry, and revocation are missing.
- Approved scope version/fingerprint is not persisted.
- Canonical Packet is not created or associated from durable approval.
- Packet lifecycle route lacks an inspected approval gate.
- S005 output is a manifest/preview, not canonical Packet authority.
- Shopify mutation authorization has no durable execution gate yet.

## Preferred Target Authority Model

Preserve `public.packets` as the canonical Packet table.

Add a durable ShopiFixer approval/scope layer that records:

- immutable repair scope snapshot and fingerprint;
- merchant or operator-mediated approval evidence;
- approval actor and timestamp;
- approval source and terms boundary;
- revocation/expiry state;
- idempotency key;
- link to source durable audit and merchant;
- link or bridge to canonical Packet through `ShopifixerPacketLink`.

Then create or associate the canonical Packet through the existing Packet repository authority, inside a transaction with the approval/link writes where feasible.

S005 should become:

- a preview before Packet creation; and
- after Packet creation, a projection of persisted canonical Packet + durable approved scope + durable approval evidence.

## Storage Option Analysis

| Option | Result | Reason |
| --- | --- | --- |
| A - Use existing Packet fields | Rejected | `packets` has only store, payment, status, lifecycle, and timestamp fields. It has no immutable scope, approval actor, evidence, expiry, or idempotency contract for ShopiFixer approval. |
| B - Existing ShopiFixer tables plus Packet link | Rejected as complete solution | `ShopifixerPacketLink` can associate audit and Packet and has useful authorization metadata, but it cannot represent immutable scope version or durable merchant approval without overloading `sourceMetadata`. |
| C - Additive approval and scope models | Selected | Provides explicit authority, immutable scope versioning, auditability, idempotency, revocation/expiry, and a clean bridge to canonical Packet without duplicating Packet authority. |
| D - JSON snapshot in existing field | Rejected | `ShopifixerAudit` JSON is audit evidence, not approval; `ShopifixerPacketLink.sourceMetadata` is not a governed approval store and would overload semantics. |

## Migration Decision

`ADDITIVE_MIGRATION_REQUIRED`

Proposed additions only:

- `ShopifixerRepairScope`
  - `id`
  - `merchantId`
  - `auditId`
  - `scopeId`
  - `scopeVersion`
  - `scopeFingerprint`
  - `status`
  - `sourceEvidenceVersion`
  - `scopeSnapshot`
  - `includedRepairIds`
  - `excludedRepairIds`
  - `deferredRepairIds`
  - `generatedAt`
  - `sealedAt`
  - `supersededAt`
  - `createdAt`
  - `updatedAt`
  - unique/index requirements: unique `scopeId`, unique `scopeFingerprint`, unique `[auditId, scopeVersion]`, indexes on `[merchantId, createdAt]`, `[auditId, createdAt]`, `[status, updatedAt]`.

- `ShopifixerMerchantApproval`
  - `id`
  - `merchantId`
  - `auditId`
  - `repairScopeId`
  - `approvalStatus`
  - `approvalSource`
  - `actorType`
  - `actorIdentifier`
  - `approvalEvidence`
  - `termsSnapshot`
  - `scopeFingerprint`
  - `idempotencyKey`
  - `approvedAt`
  - `revokedAt`
  - `expiresAt`
  - `createdAt`
  - `updatedAt`
  - unique/index requirements: unique `idempotencyKey`, indexes on `[merchantId, createdAt]`, `[auditId, createdAt]`, `[repairScopeId, createdAt]`, `[approvalStatus, updatedAt]`.

- `ShopifixerPacketLink` additive fields or an additional link model
  - preferred relationship fields: `repairScopeId`, `merchantApprovalId`, `executionManifestFingerprint`, `executionManifestSnapshot`
  - keep existing `packetId` as FK to `packets.packet_id`
  - retain existing unique `[auditId, packetId, purpose]`, `idempotencyKey`, and `activeKey` controls.

Compatibility:

- Existing Packet rows remain valid.
- Existing ShopiFixer audits remain valid.
- No backfill is required for old audits; they simply have no durable approval until selected.
- Rollback should disable new approval routes/application code; schema may remain because additions are non-destructive.

## Proposed Route and Transition Design

### Retrieve Scope Preview

- Actor: operator/system read.
- Route: `GET /internal/shopifixer/audits/:auditId/scope`
- Auth: `internalOnly`.
- Writes: none.
- Purpose: preview deterministic scope from durable audit evidence.

### Store Immutable Scope

- Actor: operator.
- Route: `POST /internal/shopifixer/audits/:auditId/repair-scopes`
- Auth: `internalOnly` plus operator identity evidence.
- Input: selected included/deferred/excluded repair item ids, scope version source, idempotency key.
- Validation: audit exists, store isolation, repair items derive from durable plan, no unsupported repair promoted silently.
- Transaction: create immutable scope row and event.
- Prohibited side effects: Packet creation, Shopify mutation, payment, webhook, customer contact.

### Record Merchant Approval

- Actor: merchant action or operator-mediated action.
- Initial recommended route: `POST /internal/shopifixer/repair-scopes/:scopeId/approvals`
- Auth: `internalOnly` plus operator identity; permitted only when operator records external merchant approval evidence.
- Future merchant-direct route requires merchant authentication and signed approval context.
- Input: scope id, approval decision, actor/evidence metadata, terms boundary, idempotency key.
- Transaction: create approval record, update approval state, append event.
- Prohibited side effects: Packet creation unless explicitly combined in a later governed transition, Shopify mutation, payment, webhook.

### Create or Associate Canonical Packet

- Actor: operator/system after durable approval.
- Route: `POST /internal/shopifixer/approvals/:approvalId/packet`
- Auth: `internalOnly` plus operator/system authority.
- Input: approval id, optional existing packet id, idempotency key.
- Validation: approval is approved, not expired/revoked, scope fingerprint matches, audit/store match, no active conflicting link.
- Transaction: call existing Packet creation/association authority, create `ShopifixerPacketLink`, store manifest fingerprint/snapshot, append event.
- Prohibited side effects: Shopify mutation, payment initiation, customer contact.

### Retrieve Canonical Execution Packet

- Actor: operator/system read.
- Route: `GET /internal/shopifixer/packets/:packetId/execution-manifest`
- Auth: `internalOnly`.
- Reads: canonical Packet, durable approval, immutable scope, manifest snapshot.
- Writes: none.

### Revoke or Expire Approval Before Execution

- Actor: merchant or operator-mediated.
- Route: `POST /internal/shopifixer/approvals/:approvalId/revoke` or scheduled expiry system action.
- Preconditions: no execution started, Packet lifecycle permits cancellation.
- Transaction: mark approval revoked/expired, cancel/supersede active link, append event.
- Prohibited side effects: Shopify mutation or payment mutation unless separately authorized.

## Execution Gate Contract

```json
{
  "EXECUTION_AUTHORIZED": false,
  "failed_conditions": [
    "repair_scope_not_durable",
    "merchant_approval_not_durable",
    "approved_scope_version_not_persisted",
    "canonical_packet_not_created_or_linked_to_approval",
    "s005_manifest_not_backed_by_canonical_packet",
    "packet_status_execution_gate_not_implemented",
    "shopify_mutation_authority_not_established"
  ]
}
```

Future execution must require:

- durable source audit;
- deterministic repair plan;
- immutable repair scope;
- durable approval;
- canonical Packet;
- Packet linked to approved scope;
- Packet status permitting execution;
- operator execution authorization;
- exact target store;
- exact authorized repair item ids;
- implementation sequence;
- rollback sequence;
- proof requirements;
- no expiry or revocation;
- payment condition only if current business authority requires it.

## S004/S005 Promotion Recommendation

`HELD_UNTIL_DURABLE_AUTHORITY_EXISTS`

Reason:

- S004 can present `APPROVED` from query/input without durable merchant approval.
- S005 uses Packet terminology but does not create or project a canonical Packet row.
- Promoting unchanged routes risks confusing planning output with durable execution authority.

Safe future promotion path:

- Rename or document S005 as an execution manifest/preview until canonical Packet creation exists.
- Gate any `APPROVED` state behind durable approval records.
- Expose canonical Packet projection only after approval and Packet link are persisted.

## Implementation Sequence

### S006.01 Durable Approval and Immutable Scope Storage

- Objective: persist immutable repair scope and durable approval evidence.
- Expected files: Prisma schema/migration, scope persistence adapter, approval adapter, focused tests.
- Schema impact: additive models and indexes.
- Route impact: internal scope-storage and approval-recording routes.
- Prohibited actions: Packet creation, Shopify mutation, payment, webhook.
- Production proof: create controlled scope/approval for NoKings only after governed deployment.
- Rollback: disable routes; additive tables may remain.

### S006.02 Canonical Packet Creation and Association

- Objective: create or associate canonical Packet only from durable approval.
- Expected files: Packet association service, internal route, tests, optional additive link fields.
- Schema impact: additive link fields if selected in S006.01 migration.
- Route impact: `POST /internal/shopifixer/approvals/:approvalId/packet`.
- Prohibited actions: Shopify mutation, payment initiation, customer contact.
- Production proof: controlled NoKings approval creates or links exactly one Packet and one active Packet link.
- Rollback: application rollback; no database delete by default.

### S006.03 Authorized Retrieval and Authority Gate Verification

- Objective: retrieve canonical execution manifest from persisted Packet + scope + approval and compute execution gate.
- Expected files: manifest projection adapter, gate adapter, internal read route, tests.
- Schema impact: none expected after S006.01/S006.02.
- Route impact: canonical manifest read route.
- Prohibited actions: Shopify mutation.
- Production proof: `EXECUTION_AUTHORIZED` remains false unless all durable conditions pass.
- Rollback: remove route/projection code.

### S006.04 Controlled Production Promotion and Proof

- Objective: deploy approval/scope/Packet association capabilities and verify controlled NoKings flow.
- Expected files: governed source commit and production evidence artifacts.
- Schema impact: deploy already-reviewed additive migration if required.
- Route impact: production internal routes only.
- Prohibited actions: Shopify mutation.
- Production proof: durable scope, durable approval, canonical Packet link, no Shopify write.
- Rollback: application rollback; database recovery only if an additive migration unexpectedly harms production.

## Confirmation

No source code, schema, migration, Packet record, production data, environment variable, Shopify store, payment state, webhook, customer contact, commit, push, or deployment was changed during S006.
