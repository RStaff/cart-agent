# Convergence Dependency Graph v1

Generated: 2026-06-03

## Rule

This graph maps only discovered dependencies. It does not invent missing routes, registries, or APIs.

## Business Dependency Chain

StaffordMedia.ai -> Lead -> Audit -> Offer -> Payment -> Client -> Fulfillment -> Proof -> Revenue -> CEO Cockpit

## Actual Discovered Dependencies

| From | To | Actual Dependency | Evidence | Status |
| --- | --- | --- | --- | --- |
| StaffordMedia.ai | Lead | `/shopifixer` production surface submits through existing form flow and fix-audit bridge; local runtime also writes ShopiFixer leads from `/api/fix-audit`. | `staffordos/surfaces/staffordmedia_shopifixer_prod_surface_change_packet_v1.json`; `web/src/index.js:/api/fix-audit`; `web/src/lib/shopifixerLeadRegistry.js` | PARTIAL, production surface external to this repo |
| Lead | Audit | Lead intake stores problem summary and saved audit payload; runtime audit can be fetched by store. | `staffordos/leads/lead_registry_v1.json`; `.tmp/fix_audit_payloads.json`; `GET /api/fix-audit?store=...`; `staffordos/audits/shopifixer_audit_standard_v1.md` | REAL |
| Audit | Offer | ShopiFixer commercial definition turns audit into $950 Fix Sprint offer; email offer route exists. | `staffordos/shopifixer/shopifixer_commercial_definition_v1.md`; `staffordos/authority/output/shopifixer_audit_authority_v1.md`; `web/src/routes/sendOffer.esm.js` | PARTIAL, live offer send not proven |
| Offer | Payment | Checkout creation exists and creates payment-pending packet; public/pricing surface is product-mismatched in current repo. | `web/src/checkout-public.js`; `web/src/routes/pricing.esm.js`; `s2h_checkout_visual_confirmation_v1.md`; `revenue_flow_logic_validator_v1.json` warning missing optional `950` signal | CONDITIONAL |
| Payment | Client | Packet payment state exists in packet table; Client Registry has payment fields but packet binding is underrepresented. | `web/src/lib/packetRepository.js`; `web/src/routes/stripeWebhook.esm.js`; `staffordos/clients/client_registry_v1.json`; `client_registry_canonical_lifecycle_gap_v1.md` | PARTIAL |
| Client | Fulfillment | Fulfillment starts after `payment_received`; packet lifecycle exposes execution/proof/completion status. | `shopifixer_fulfillment_authority_v1.md`; `web/src/routes/packetAuthority.esm.js`; `client_registry_v1.json` | PARTIAL |
| Fulfillment | Proof | Fulfillment authority requires before evidence, execution notes, after evidence, proof package, completion decision. | `shopifixer_first_full_loop_v1.md`; `no_kings_shopifixer_sprint_validation_v1.md`; `execution_proof_register_v1.json` | NOT PROVEN |
| Proof | Revenue | Proof register requires runtime proof before promotion; revenue reconciliation proof remains partial. | `execution_proof_register_v1.json` proof `proof_revenue_truth_reconciliation`; `staffordos/revenue/revenue_truth_v1.json` | PARTIAL |
| Revenue | CEO Cockpit | CEO snapshot reads Client Registry, Lead Registry, dashboard snapshot, send ledger; does not read packet truth yet. | `/api/operator/ceo-snapshot`; `operator_dashboard_snapshot_v1.json`; `send_ledger_v1.json` | PARTIAL |

## UI Dependency Chain

| UI Surface | Reads | Missing For Convergence |
| --- | --- | --- |
| CEO Cockpit | Lead Registry, Client Registry, dashboard snapshot, send ledger | Packet/payment lifecycle, ShopiFixer proof package state, review/referral state |
| Lead Command | Lead Registry, Lead Events, send queue, send ready, send console, send ledger | Live provider send proof |
| Revenue Command | Lead Registry and send proof | Client lifecycle, packet payment, fulfillment, proof, revenue reconciliation |
| Products | Abando merchant summary API; ShopiFixer placeholder | ShopiFixer product summary endpoint or existing service status projection |
| System Map | Read-only system map API and manifest | Not intended to run merchant lifecycle |
| Command Center | Primary action snapshot, preflight, QA, unit work snapshot | Not intended to be the merchant revenue lifecycle cockpit |

## Dependency Interpretation

The missing dependency is not a new framework. It is an adapter/convergence layer over existing state:

- packet table status
- Client Registry lifecycle status
- proof package status
- review/referral status

Those must appear in the existing CEO Cockpit if StaffordOS UI is going to operate the business.
