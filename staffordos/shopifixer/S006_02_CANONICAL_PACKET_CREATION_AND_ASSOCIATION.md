# S006.02 Canonical Packet Creation And Association

Date: 2026-07-29

Mode: local implementation only.

## Gate

S006_02_IMPLEMENTED_LOCALLY

## Baseline

- Repository root: `/Users/rossstafford/projects/cart-agent`
- Branch: `main`
- HEAD and `origin/main`: `cb13ecaf5696344282f8f03c9a4a46be37d5931f`
- Pre-existing staged files: none
- Production `/health`: `200`
- Production latest successful migration: `20260727013000_add_shopifixer_durable_continuity`
- Production S006.01 applied: `false`
- Production S006.02 applied: `false`
- Production unfinished migrations: none
- Existing rolled-back production migration record observed: `20260310154047_add_jobs_and_system_events`

## Canonical Packet Creation Contract

The canonical Packet authority remains `public.packets`.

Repository creation authority used:

`web/src/lib/packetRepository.js`

Function:

`createPacket(...)`

Minimum S006.02 Packet input:

- `packet_id`: deterministic canonical Packet id derived from durable authority
- `store_domain`: normalized store from the immutable repair scope
- `status`: `prepared`

S006.02 does not call:

- `bindPacketPayment`
- `updatePacketLifecycle`
- Stripe APIs
- webhook code
- Shopify APIs

## Association Design

Selected design:

`ADDITIVE_PACKET_LINK_FIELDS_REQUIRED`

Reason:

`ShopifixerPacketLink` is already the ShopiFixer association authority for audit-to-Packet continuity, but it previously lacked first-class references to the immutable repair scope and durable approval. S006.02 adds nullable authority references and a unique authority fingerprint to that existing link instead of creating a second Packet model.

## Migration

Migration created:

`web/prisma/migrations/20260729193000_add_shopifixer_packet_authority_link/migration.sql`

Migration shape:

- adds nullable `repairScopeId` to `ShopifixerPacketLink`;
- adds nullable `repairApprovalId` to `ShopifixerPacketLink`;
- adds nullable unique `authorityFingerprint`;
- adds nullable `authorityVersion`;
- adds FK to `ShopifixerRepairScope`;
- adds FK to `ShopifixerRepairApproval`;
- adds indexes for scope and approval lookup;
- adds unique scope/approval/purpose association guard;
- does not alter `public.packets`;
- does not alter payment, Packet lifecycle, or Shopify execution fields;
- contains no destructive SQL.

## Idempotency Model

Authority fingerprint derives from:

- audit id;
- merchant id;
- normalized store;
- scope id;
- scope version;
- scope fingerprint;
- approval id;
- approval fingerprint;
- approved scope fingerprint;
- approved scope version;
- Packet purpose;
- S006.02 authority version.

Canonical Packet id:

- generated deterministically by S006.02;
- supplied to existing `createPacket`;
- stored only as canonical `public.packets.packet_id`;
- never derived from the S005 manifest id.

Replay behavior:

- existing association by idempotency key returns the existing Packet and link;
- existing association by authority fingerprint returns the existing Packet and link;
- repeated calls do not create duplicate Packets or PacketLinks;
- conflicting idempotency key reuse is rejected.

## Initial Packet State

Selected safe state:

- `status`: `prepared`
- `execution_status`: `not_started`
- `proof_status`: `not_started`
- `completion_status`: `not_started`
- payment reference: absent

This state preserves planning authority only. It does not authorize Shopify execution.

## Durable Approval Gate

Packet association requires:

- stored immutable scope exists;
- scope fingerprint recalculates;
- durable approval exists;
- approval references the exact stored scope;
- approval fingerprint and version match the scope;
- approval status is active;
- approval is not revoked;
- approval is not expired;
- approval evidence exists;
- actor and source are present.

Revoked or expired approvals are rejected before Packet creation.

## Packet Association Contract

`ShopifixerPacketLink` stores:

- canonical `packetId`;
- durable `auditId`;
- durable `merchantId`;
- durable `repairScopeId`;
- durable `repairApprovalId`;
- unique `authorityFingerprint`;
- `authorityVersion`;
- authorization source `durable_repair_scope_approval`;
- sanitized source metadata.

The S005 manifest id is not stored as `packetId`.

## Authority Evaluation

Updated evaluator checks:

- durable scope exists;
- scope fingerprint valid;
- durable approval exists;
- approval references scope;
- approval version and fingerprint match;
- approval active, not revoked, not expired;
- canonical Packet exists;
- Packet association exists;
- association matches scope and approval;
- Packet store matches scope store;
- Packet planning status is safe;
- rollback requirements exist;
- proof requirements exist;
- Packet execution status permits execution.

Expected S006.02 result after association:

```json
{
  "EXECUTION_AUTHORIZED": false,
  "failedConditions": [
    "packet_execution_not_permitted"
  ]
}
```

## Manifest Projection

S005 remains an execution manifest.

Manifest output now distinguishes:

- `canonicalPacketId`: from `public.packets.packet_id`
- `manifestId`: deterministic S005 projection id

The manifest no longer exposes `packetId` as an alias for its projection id.

## Internal Routes

Added:

- `POST /internal/shopifixer/scopes/:scopeId/canonical-packet`
- `GET /internal/shopifixer/scopes/:scopeId/canonical-packet`

Updated:

- `GET /internal/shopifixer/audits/:auditId/execution-packet`

All routes use `internalOnly`.

Internal authorization authenticates the operator/system caller only. Merchant approval authority comes from durable approval evidence, not from `x-internal-api-key`.

## Durable Events

Reused `ShopifixerLeadEvent` for:

- `canonical_packet_created`
- `canonical_packet_associated`

Event payloads contain sanitized ids and authority fingerprints only.

## Isolated Local Database Proof

Database:

`local_isolated_s00602_packet_authority`

Result:

```json
{
  "packetBefore": 0,
  "linkBefore": 0,
  "packetCreated": true,
  "associationCreated": true,
  "replayCreatedPacket": false,
  "replayCreatedAssociation": false,
  "packetAfterReplay": 1,
  "linkAfterReplay": 1,
  "packetAfterRevoke": 1,
  "linkAfterRevoke": 1,
  "manifestIdDistinctFromCanonicalPacketId": true,
  "packetStatus": "prepared",
  "packetExecutionStatus": "not_started",
  "paymentReferencePresent": false,
  "executionAuthorizedAfterAssociation": false,
  "failedAfterAssociation": [
    "packet_execution_not_permitted"
  ],
  "retrievedPacketMatches": true,
  "revoked": true,
  "executionAuthorizedAfterRevoke": false,
  "failedAfterRevoke": [
    "approval_not_active",
    "approval_revoked",
    "packet_execution_not_permitted"
  ],
  "eventTypes": [
    "audit_completed",
    "repair_scope_stored",
    "repair_scope_approved",
    "canonical_packet_created",
    "canonical_packet_associated",
    "repair_scope_revoked"
  ]
}
```

The isolated local PostgreSQL server and local app process were stopped after validation.

## Validation

- Focused S001-S006.02 tests: 61/61 passed.
- Changed-file syntax checks: passed.
- `npx prisma format --schema=prisma/schema.prisma`: passed.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed with Prisma Client 6.16.0.
- Local isolated `prisma migrate deploy`: 23 migrations applied successfully.
- Local isolated `prisma migrate status`: database schema up to date.
- Local `/health`: `200`.
- Local `/`: `200`.
- Local internal route with no key: `401`.
- Local internal route with wrong key: `401`.
- Local internal route with valid local key and missing scope: safe `404`.
- `git diff --check`: passed.
- Static safety scan found no Shopify API calls, payment mutation, webhook invocation, direct Packet insert, or manifest-id-as-packet-id path in S006.02 code.

## Rollback

Local rollback plan:

1. Remove S006.02 canonical Packet route handlers and route mounts.
2. Remove `web/src/lib/shopifixerCanonicalPacketAuthority.js`.
3. Revert authority evaluator additions that inspect canonical Packet association.
4. Revert S005 manifest projection naming changes.
5. Remove `repairScopeId`, `repairApprovalId`, `authorityFingerprint`, and `authorityVersion` from `ShopifixerPacketLink`.
6. Remove migration `20260729193000_add_shopifixer_packet_authority_link`.
7. Regenerate Prisma client.
8. Discard or recreate isolated local database.
9. Remove S006.02 focused tests and StaffordOS artifacts if desired.

Do not remove S006.01 scope/approval authority unless separately authorized.

No production rollback exists because no production change occurred.

## Remaining Blockers

- Packet lifecycle has not been transitioned into an execution-authorized state.
- Shopify mutation remains unauthorized.
- Payment requirements remain unchanged and are not coupled to S006.02.
- A future governed execution gate is still required before merchant work.

## Confirmation

No production data, environment variable, payment state, webhook, Shopify store, customer contact, commit, push, deployment, or Render configuration changed.
