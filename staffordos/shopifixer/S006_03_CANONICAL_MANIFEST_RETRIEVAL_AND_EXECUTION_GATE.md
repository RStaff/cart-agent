# S006.03 - Canonical Manifest Retrieval And Execution-Gate Verification

Generated: 2026-07-30T01:20:53Z

## Gate

S006_03_IMPLEMENTED_LOCALLY

## Baseline

- Repository root: `/Users/rossstafford/projects/cart-agent`
- Branch: `main`
- Local HEAD: `cb13ecaf5696344282f8f03c9a4a46be37d5931f`
- Upstream: `origin/main`
- Ahead/behind: `0/0`
- No staged files were present.
- Production `/health`: `200`
- Production migration history: reconciled; zero unfinished migrations.
- Production S006.01 migration rows: `0`
- Production S006.02 migration rows: `0`
- S006.03 migration decision: `NO_NEW_MIGRATION_REQUIRED`

## Authority Graph

The read-side authority graph is reconstructed from durable storage:

1. `public.packets.packet_id`
2. `ShopifixerPacketLink.packetId`
3. `ShopifixerPacketLink.auditId`
4. `ShopifixerPacketLink.merchantId`
5. `ShopifixerPacketLink.repairScopeId`
6. `ShopifixerPacketLink.repairApprovalId`
7. `ShopifixerRepairScope.auditId`
8. `ShopifixerRepairScope.merchantId`
9. `ShopifixerRepairScope.scopeFingerprint`
10. `ShopifixerRepairApproval.repairScopeId`
11. `ShopifixerRepairApproval.approvedScopeFingerprint`
12. `ShopifixerRepairApproval.approvedScopeVersion`

Expected cardinality remains:

- one audit may have multiple immutable scope versions;
- one scope may have historical approvals;
- one active approval is enforced by `activeKey`;
- one canonical Packet association exists per exact scope and approval authority;
- Packet and PacketLink history remains after approval revocation.

## Canonical Lookup

Implemented read-side function:

`getCanonicalShopifixerExecutionAuthority({ canonicalPacketId, prisma, now })`

Supported canonical lookup identifier:

`canonicalPacketId`, sourced from `public.packets.packet_id`.

The function loads the canonical Packet, active ShopiFixer PacketLink, audit, merchant, immutable scope, durable approval, and sanitized events. It performs no writes, creates no Packet, creates no PacketLink, records no event, and calls no Shopify, Stripe, payment, webhook, or customer-communication path.

## Manifest Route

Canonical route added:

`GET /internal/shopifixer/packets/:packetId/execution-manifest`

Authorization:

existing `internalOnly` middleware using `x-internal-api-key`.

Route behavior:

- missing or incorrect internal key returns `401`;
- valid internal key reaches handler;
- missing Packet returns `404 canonical_packet_missing`;
- integrity conflicts return sanitized conflict errors;
- successful lookup returns a sanitized execution manifest and execution gate.

## Integrity Checks

S006.03 verifies:

- PacketLink points to the loaded Packet;
- PacketLink points to the loaded audit, merchant, scope, and approval;
- all loaded records share the same merchant/store authority;
- scope audit matches linked audit;
- approval scope matches linked scope;
- scope fingerprint recalculates from stored normalized snapshot;
- approval-copied fingerprint and version match the scope;
- PacketLink authority fingerprint matches the canonical transition fingerprint;
- duplicate active PacketLink associations fail closed;
- missing audit, merchant, scope, approval, Packet, or PacketLink is reported explicitly.

## Approval State

Approval state is evaluated without mutation:

- `ACTIVE`: status is approved, not revoked, not expired, actor/source/evidence present.
- `REVOKED`: status or `revokedAt` indicates revocation.
- `EXPIRED`: `expiresAt` is in the past.
- `INVALID`: required actor, source, evidence, fingerprint, version, or repair ID contract is missing or conflicting.

Operator-mediated approval remains operator-mediated evidence. It is not relabeled as merchant-authenticated approval.

## Packet Lifecycle

Existing Packet lifecycle values remain repository-owned.

Current S006.02 Packet state:

- `status`: `prepared`
- `executionStatus`: `not_started`
- `proofStatus`: `not_started`
- `completionStatus`: `not_started`
- payment condition: not applicable for this gate unless future repository authority requires it

The current state does not authorize Shopify execution.

## Execution Gate

Implemented pure evaluator:

`evaluateShopifixerExecutionGate(authority)`

Current required result:

- `executionAuthorized`: `false`
- failed condition includes: `packet_execution_not_permitted`

Caller-supplied execution flags, approval state, Packet state, repair lists, or scope content are ignored by the canonical read path.

## Manifest Projection

S005 manifest projection now supports canonical durable authority:

- `canonicalPacketId`: value from `public.packets.packet_id`
- `manifestId`: deterministic planning/projection identifier
- `manifestId` is never treated as `packet_id`
- `currentMissionExecutionAuthorized`: `false`
- authorized/excluded/deferred repairs are reconstructed from the durable scope snapshot
- rollback sequence, verification criteria, and required evidence are derived from stored scope contents

## Isolated Local Proof

Database:

- isolated PostgreSQL cluster under `/private/tmp`
- database: `cart_agent_s00603_rerun`
- migrations applied: `23`
- migration status: up to date

Proof result:

- created one test durable merchant, lead, audit, scope, approval, Packet, and PacketLink for the healthy chain;
- retrieved by canonical Packet ID;
- recalculated scope fingerprint successfully;
- confirmed canonical Packet ID matches `public.packets.packet_id`;
- confirmed manifest ID is distinct from canonical Packet ID;
- confirmed `executionAuthorized=false`;
- confirmed failed conditions: `packet_execution_not_permitted`;
- repeated retrieval returned stable manifest and failed-condition fields;
- table counts were unchanged by retrieval;
- revocation was detected on read as `approval_revoked`;
- Packet and PacketLink history remained after revocation;
- tampered PacketLink authority fingerprint failed closed with `packet_authority_fingerprint_mismatch`.

## Validation

- Focused S001-S006.03 node tests: `69/69 pass`
- S006.03 service tests: `11/11 pass`
- S006.03 route tests: included in focused suite
- Syntax checks: pass for changed service and route files
- Prisma validate: pass
- Prisma generate: pass, Prisma Client `6.16.0`
- Prisma format: completed; no S006.03 migration added
- Isolated migration deploy: pass
- Isolated migration status: up to date
- `git diff --check`: pass
- Local `/health`: `200`
- Local `/`: `200`
- Missing-key route probe: `401`
- Incorrect-key route probe: `401`
- Valid-key missing Packet probe: `404 canonical_packet_missing`
- Static safety scan: no S006.03 GET write path, no Shopify mutation import, no payment mutation, no webhook dispatch, no email/customer communication path.

## Rollback

Local rollback:

1. remove `GET /internal/shopifixer/packets/:packetId/execution-manifest`;
2. revert `getCanonicalShopifixerExecutionAuthority`;
3. revert `evaluateShopifixerExecutionGate`;
4. revert canonical manifest projection changes;
5. remove S006.03 focused tests;
6. optionally remove S006.03 StaffordOS artifacts;
7. recreate or discard the isolated local database.

Do not remove S006.01 durable scope/approval authority or S006.02 Packet association unless separately authorized.

No production rollback is required because no production change occurred.

## Remaining Blockers

Shopify execution remains intentionally unauthorized. Future execution requires a separately governed mission that defines the Packet lifecycle state and operator authorization required to permit mutation.
