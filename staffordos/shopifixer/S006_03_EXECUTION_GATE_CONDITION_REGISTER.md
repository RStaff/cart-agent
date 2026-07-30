# S006.03 Execution Gate Condition Register

Generated: 2026-07-30T01:20:53Z

## Current Gate

- Evaluator: `evaluateShopifixerExecutionGate(authority)`
- Version: `shopifixer.execution_gate.v1`
- Current expected result: `executionAuthorized=false`
- Current expected failed condition: `packet_execution_not_permitted`

## Required Conditions

| Condition | Failure Code | Source |
| --- | --- | --- |
| durable audit exists | `audit_missing` | `ShopifixerAudit` |
| merchant identity valid | `merchant_missing` | `ShopifixerMerchant` |
| normalized store consistent | `packet_store_mismatch` | durable authority graph |
| immutable scope exists | `scope_missing` | `ShopifixerRepairScope` |
| scope fingerprint valid | `scope_fingerprint_invalid` | `ShopifixerRepairScope.scopeFingerprint` |
| approval exists | `approval_missing` | `ShopifixerRepairApproval` |
| approval matches scope | `approval_scope_mismatch` | `ShopifixerRepairApproval.repairScopeId` |
| approval fingerprint matches | `approval_fingerprint_mismatch` | `ShopifixerRepairApproval.approvedScopeFingerprint` |
| approval version matches | `approval_version_mismatch` | `ShopifixerRepairApproval.approvedScopeVersion` |
| approval evidence exists | `approval_evidence_missing` | `ShopifixerRepairApproval.approvalEvidence` |
| approval actor/source valid | `approval_actor_source_missing` | `ShopifixerRepairApproval.actorType/actorId/approvalSource` |
| approval active | `approval_not_active` | approval lifecycle |
| approval not revoked | `approval_revoked` | approval lifecycle |
| approval not expired | `approval_expired` | approval lifecycle |
| canonical Packet exists | `canonical_packet_missing` | `public.packets` |
| PacketLink exists | `packet_link_missing` | `ShopifixerPacketLink` |
| PacketLink matches audit | `packet_audit_mismatch` | `ShopifixerPacketLink.auditId` |
| PacketLink matches merchant | `packet_merchant_mismatch` | `ShopifixerPacketLink.merchantId` |
| PacketLink matches scope | `packet_scope_mismatch` | `ShopifixerPacketLink.repairScopeId` |
| PacketLink matches approval | `packet_approval_mismatch` | `ShopifixerPacketLink.repairApprovalId` |
| Packet store matches merchant | `packet_store_mismatch` | `Packet.storeDomain` |
| Packet lifecycle state recognized | `packet_status_invalid` | `Packet.status` |
| Packet execution status recognized | `packet_execution_status_invalid` | `Packet.executionStatus` |
| implementation sequence exists | `implementation_sequence_missing` | execution manifest |
| rollback sequence exists | `rollback_requirements_missing` | execution manifest |
| verification criteria exist | `proof_requirements_missing` | execution manifest |
| required evidence exists | `required_evidence_missing` | execution manifest |
| no unresolved authority conflict | `authority_integrity_conflict` | canonical authority lookup |
| Packet execution status permits execution | `packet_execution_not_permitted` | Packet lifecycle authority |

## Integrity Failures

The read-side lookup can return sanitized integrity failures before route-level manifest success:

- `audit_missing`
- `merchant_missing`
- `scope_missing`
- `approval_missing`
- `packet_link_conflict`
- `scope_fingerprint_invalid`
- `approval_scope_mismatch`
- `approval_fingerprint_mismatch`
- `approval_version_mismatch`
- `approval_included_repairs_mismatch`
- `packet_audit_mismatch`
- `packet_merchant_mismatch`
- `packet_scope_mismatch`
- `packet_approval_mismatch`
- `packet_store_mismatch`
- `scope_audit_mismatch`
- `packet_authority_fingerprint_mismatch`

## Current Packet Interpretation

`prepared` plus `not_started` means the canonical Packet exists for planning and association. It does not permit Shopify execution in S006.03.
