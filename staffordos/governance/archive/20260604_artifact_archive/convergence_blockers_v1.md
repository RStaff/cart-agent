# Convergence Blockers v1

Generated: 2026-06-03

## Rule

Only blockers that prevent StaffordOS UI from operating the business are listed. ShopiFixer service gaps are included only when they block the UI from carrying business state.

## Blockers

| Blocker | Evidence | File / Route | Severity | Business Impact |
| --- | --- | --- | --- | --- |
| CEO Cockpit does not ingest packet/payment lifecycle truth | CEO snapshot fulfillment section explicitly notes packet truth is not included. Packet authority already exists elsewhere. | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`; `web/src/routes/packetAuthority.esm.js`; `web/src/lib/packetRepository.js` | Critical | Ross cannot operate from UI after checkout. Payment pending/received, execution, proof, and completion status still require separate lookup. |
| Client Registry is not bound to packet/proof/review/referral state | Canonical lifecycle gap lists missing `packet_id`, `packet_status`, `proof_status`, `proof_package_ref`, `merchant_success_status`, `review_status`, `referral_status`. | `staffordos/authority/output/client_registry_canonical_lifecycle_gap_v1.md`; `staffordos/clients/client_registry_v1.json` | Critical | The cockpit can show clients, but cannot close the Lead -> Payment -> Fulfillment -> Proof -> Revenue loop from one merchant record. |
| Lead-to-client promotion is not proven | Existing gap artifact says Lead Registry has acquisition data and Client Registry has one client only; promotion from lead to client is not proven. | `staffordos/lifecycle_audit/lead_to_client_promotion_gap_v1.md`; `client_promotion_authority_v1.md` | High | Qualified merchants can remain in lead state and never become controllable business lifecycle records. |
| ShopiFixer offer/payment surface is not cleanly converged | Revenue flow validator passes with warnings: missing optional ShopiFixer signal in run-audit and missing optional `950` in pricing. Current `/pricing` route is Abando monthly; `$950` checkout exists through packet checkout proof. | `staffordos/operator_daemon/output/revenue_flow_logic_validator_v1.json`; `web/src/routes/pricing.esm.js`; `web/src/checkout-public.js`; `s2h_checkout_visual_confirmation_v1.md` | High | A merchant can reach payment infrastructure, but the UI/business chain does not yet present a clean ShopiFixer acquisition -> $950 payment path as one operating surface. |
| Proof state in UI is outreach proof, not fulfillment proof | CEO snapshot and send-proof API read `send_ledger_v1.json`; No Kings proof package output is missing. | `/api/operator/send-proof`; `/api/operator/ceo-snapshot`; `staffordos/leads/send_ledger_v1.json`; `staffordos/audits/no_kings/proof_package/` | High | Cockpit can report dry-run send proof but cannot show whether a paid sprint has before/after evidence, QA, completion, or merchant proof. |
| Revenue Command is not canonical business control | Revenue Command page is lead registry plus send proof; Revenue Truth is old outreach-funnel truth. CEO Cockpit is the current canonical surface. | `/operator/revenue-command`; `staffordos/revenue/revenue_truth_v1.json`; `canonical_artifact_inventory_v1.md` | Medium | If Ross uses Revenue Command as the business UI, payment, fulfillment, proof, and client lifecycle are invisible or stale. |
| Product overview has ShopiFixer placeholder | Products page has real Abando summary logic but states no ShopiFixer product summary endpoint is connected. | `staffordos/ui/operator-frontend/app/operator/products/page.tsx` | Medium | StaffordOS cannot summarize ShopiFixer as an operating product through Products; however, CEO Cockpit can still be the canonical business surface. |
| Execution Proof Register blocks runtime proof promotion | All major proof items remain `PARTIALLY_PROVEN_REQUIRES_RUNTIME_CONFIRMATION`, including ShopiFixer paid path and revenue truth reconciliation. | `staffordos/system_inventory/output/execution_proof_register_v1.json` | Medium | The UI must not claim live revenue/proof readiness until runtime proof exists. This is a truthfulness blocker, not a reason to build a new proof system. |

## Non-Blockers For UI Convergence

| Item | Why It Is Not The Next UI Blocker |
| --- | --- |
| New roadmap | Existing artifacts already define lifecycle, offer, payment, fulfillment, proof, and cockpit requirements. |
| New architecture | Existing Lead Registry, Client Registry, Packet Authority, Proof Register, and CEO Cockpit are enough. |
| New scoring model | Revenue impact scoring already exists and was applied to No Kings. |
| New audit template | ShopiFixer audit standard and audit authority already exist. |
| LLM router | The current blocker is deterministic state convergence, not intent routing. |
| Ollama | Local model runtime does not create payment, packet, proof, or client lifecycle visibility. |
