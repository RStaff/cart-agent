# S006.01 Durable Scope and Approval Storage

Date: 2026-07-29

Mode: local implementation only.

## Gate

S006_01_IMPLEMENTED_LOCALLY

## Baseline

- Repository root: `/Users/rossstafford/projects/cart-agent`
- Branch: `main`
- HEAD and `origin/main`: `cb13ecaf5696344282f8f03c9a4a46be37d5931f`
- Pre-existing staged files: none
- Production `/health`: `200`
- Production migration history: reconciled; latest successful migration remained `20260727013000_add_shopifixer_durable_continuity`
- Pre-existing Prisma schema/migration diff: none
- Pre-existing Packet authority source diff: none
- Existing local S004/S005 files were present and treated as approved local capability inputs.

## Schema Additions

Added two additive Prisma models:

- `ShopifixerRepairScope`
- `ShopifixerRepairApproval`

Added relation arrays to:

- `ShopifixerMerchant.repairScopes`
- `ShopifixerMerchant.repairApprovals`
- `ShopifixerAudit.repairScopes`
- `ShopifixerAudit.repairApprovals`

No `Packet` model fields or `public.packets` semantics were changed.

## Migration

Migration created:

`web/prisma/migrations/20260729190000_add_shopifixer_scope_approval_authority/migration.sql`

Migration shape:

- creates `ShopifixerRepairScope`;
- creates `ShopifixerRepairApproval`;
- adds FKs to `ShopifixerMerchant`, `ShopifixerAudit`, and `ShopifixerRepairScope`;
- adds unique constraints for scope id, scope fingerprint/version, approval id, approval idempotency key, and active approval key;
- adds indexes for merchant/audit/status/fingerprint lookup;
- contains no destructive SQL;
- does not alter `public.packets`;
- does not backfill or mutate existing data.

## Scope Contract

`ShopifixerRepairScope` stores one immutable scope snapshot for one durable audit and merchant:

- `scopeId`
- `scopeVersion`
- `scopeFingerprint`
- `auditId`
- `merchantId`
- `sourceEvidenceVersion`
- `sourceRepairPlanVersion`
- included, excluded, and deferred repair JSON
- implementation assumptions, dependencies, boundaries, verification criteria, rollback expectations
- full normalized snapshot
- creation actor
- created timestamp

The scope row does not store approval status.

## Fingerprint Contract

Implemented in:

`web/src/lib/shopifixerScopeAuthorityRepository.js`

Function:

`calculateRepairScopeFingerprint(...)`

Fingerprint properties:

- SHA-256 over a stable canonical JSON representation;
- includes audit id, normalized store, scope version, source evidence version, repair contents, boundaries, dependencies, verification criteria, rollback expectations, and implementation size;
- excludes request-time metadata such as `generatedAt`;
- normalizes object key order;
- normalizes non-semantic array ordering;
- changes when authority-bearing repair content or boundaries change.

## Scope Immutability

Application enforcement:

- `storeRepairScope(...)` only creates or returns an existing identical row.
- It never updates a stored scope snapshot.
- Reuse of the same `scopeId` with a different fingerprint is rejected as `repair_scope_identity_conflict`.
- Reuse of the same audit/fingerprint returns the existing row.

Database support:

- unique `scopeId`;
- unique `[auditId, scopeVersion]`;
- unique `[auditId, scopeFingerprint]`.

## Approval Contract

`ShopifixerRepairApproval` stores durable approval for one exact stored scope:

- `approvalId`
- `approvalIdempotencyKey`
- `approvalFingerprint`
- `repairScopeId`
- `approvedScopeFingerprint`
- `approvedScopeVersion`
- derived approved included repair ids
- actor type and actor id
- approval source
- operator-mediated flag
- merchant-authenticated flag
- approval evidence
- approved terms boundary
- status: `APPROVED`, `REVOKED`, or computed `EXPIRED`
- approved timestamp
- optional expiry
- revocation fields

Planning states such as `DRAFT` are not persisted as approval records.

## Actor and Source Model

Allowed actor types:

- `operator`
- `merchant`
- `system`

Approval requires:

- actor type;
- actor id;
- approval source;
- approval evidence;
- approved terms boundary.

Operator-mediated approval is explicitly distinguishable and is not treated as merchant authentication.

## Idempotency

Scope:

- duplicate identical scope storage returns the same row;
- conflicting content for the same identity is rejected.

Approval:

- duplicate approval idempotency key with identical content returns the same approval;
- reuse of the same idempotency key with different evidence/content is rejected;
- active approval key prevents multiple active approvals for the same exact scope context.

## Revocation and Expiry

Revocation:

- `revokeRepairScopeApproval(...)` targets one approval;
- requires actor type, actor id, and reason;
- stores `revokedAt`, revocation actor, reason, and clears active key;
- records `repair_scope_revoked`;
- repeated identical revocation is idempotent;
- approval evidence is retained.

Expiry:

- implemented as computed expiry;
- `expiresAt` in the past makes an approval inactive without a write;
- materialized expiry is left for a later governed function if needed.

## Durable Events

Reused existing `ShopifixerLeadEvent` for:

- `repair_scope_stored`
- `repair_scope_approved`
- `repair_scope_revoked`

No second event system was introduced.

## Internal Routes

Added:

- `POST /internal/shopifixer/audits/:auditId/scopes`
- `POST /internal/shopifixer/scopes/:scopeId/approvals`
- `POST /internal/shopifixer/approvals/:approvalId/revoke`
- `GET /internal/shopifixer/scopes/:scopeId`
- `GET /internal/shopifixer/approvals/:approvalId`

All use `internalOnly`.

Route documentation and responses preserve the distinction:

- internal authorization identifies operator/system access;
- internal authorization does not prove merchant authentication;
- merchant approval authority must be represented through explicit source and evidence fields.

## S004 Integration

Updated S004 scope identity:

- `scopeVersion` is included;
- planning approval status is excluded from `scopeId`;
- generatedAt does not affect identity;
- scope route rejects request-time `APPROVED` as `durable_approval_required`.

Pure planning approval-state utilities remain available for local planning tests, but durable approval comes only from `ShopifixerRepairApproval`.

## S005 Integration

S005 remains an execution manifest, not canonical Packet authority.

The existing internal execution-packet route no longer accepts request-time `approvalStatus`. It requires a durable `scopeId` and durable `approvalId`, builds a manifest from stored authority, and returns `EXECUTION_AUTHORIZED=false` until canonical Packet association exists.

## Authority Evaluation

Implemented:

`evaluateRepairScopeAuthority(...)`

It reports explicit failed conditions for:

- durable scope existence;
- scope fingerprint validity;
- durable approval existence;
- approval/scope match;
- version/fingerprint match;
- active approval status;
- revocation;
- expiry;
- canonical Packet association;
- Packet execution permission.

Current expected result:

```json
{
  "EXECUTION_AUTHORIZED": false,
  "failedConditions": [
    "canonical_packet_missing",
    "packet_execution_not_permitted"
  ]
}
```

## Local Database Proof

Database:

`local_isolated_s00601_scope_authority`

Result:

```json
{
  "scopeStored": true,
  "approvalStored": true,
  "scopeRetrieved": true,
  "approvalRetrieved": true,
  "scopeFingerprintMatchesApproval": true,
  "scopeVersionMatchesApproval": true,
  "executionAuthorizedBeforeRevoke": false,
  "failedBeforeRevoke": [
    "canonical_packet_missing",
    "packet_execution_not_permitted"
  ],
  "revoked": true,
  "executionAuthorizedAfterRevoke": false,
  "failedAfterRevoke": [
    "approval_not_active",
    "approval_revoked",
    "canonical_packet_missing",
    "packet_execution_not_permitted"
  ],
  "packetBefore": 0,
  "packetAfter": 0,
  "packetLinkBefore": 0,
  "packetLinkAfter": 0,
  "eventTypes": [
    "repair_scope_stored",
    "repair_scope_approved",
    "repair_scope_revoked"
  ]
}
```

The local temporary PostgreSQL server was stopped after validation.

## Validation

- Focused S001-S006 tests: 55/55 passed.
- `npx prisma format --schema=prisma/schema.prisma`: passed and formatted schema.
- `npx prisma validate --schema=prisma/schema.prisma`: passed.
- `npx prisma generate --schema=prisma/schema.prisma`: passed with Prisma Client 6.16.0.
- Local isolated `prisma migrate deploy`: 22 migrations applied successfully.
- Local isolated `prisma migrate status`: database schema up to date.
- Changed-file syntax checks: passed.
- `git diff --check`: passed.
- Local `/health`: `200`.
- Local `/`: `200`.
- Local internal route with no key: `401`.
- Local internal route with wrong key: `401`.
- Local internal route with valid local key and missing scope: safe `404`.
- S006.01 Packet/Shopify scan: no prohibited Packet creation/update calls or Shopify mutation path added.

## Rollback

Local rollback plan:

1. Remove `installShopifixerScopeAuthority` import and mount from `web/src/index.js`.
2. Remove `web/src/routes/shopifixerScopeAuthority.esm.js`.
3. Remove `web/src/lib/shopifixerScopeAuthorityRepository.js`.
4. Remove S006.01 focused tests.
5. Revert S004/S005 route integration changes.
6. Remove `ShopifixerRepairScope` and `ShopifixerRepairApproval` models and relation arrays from `schema.prisma`.
7. Remove `web/prisma/migrations/20260729190000_add_shopifixer_scope_approval_authority/`.
8. Regenerate Prisma client.
9. Recreate the isolated local test database if local test data cleanup is required.

No production rollback exists because no production change occurred.

## Remaining Blockers

- Canonical Packet creation/association from durable approval is not implemented.
- Execution authority remains false until a canonical Packet is associated and Packet lifecycle gate exists.
- Shopify mutation remains unauthorized.

## Confirmation

No production data, environment variable, Packet record, payment, webhook, Shopify store, customer contact, commit, push, deployment, or Render configuration changed.
