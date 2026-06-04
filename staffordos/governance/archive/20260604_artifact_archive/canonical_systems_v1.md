# Canonical Systems v1

Generated: 2026-06-03

## Canonical Decisions

| System | Canonical Source of Truth | Current Status | Duplicates / Non-Canonical Overlaps | Recommendation |
| --- | --- | --- | --- | --- |
| Lead system | `staffordos/leads/lead_registry_v1.json` with `lead_state_machine_v1.json` and `lead_events_v1.json` | REAL | `candidate_stores.json`, `real_store_candidates.json`, `scored_stores.json`, `top_targets.json`, `contact_targets.json`, `qualified_targets.json`, `outreach_queue.json`, `staffordos/commercial/merchant_registry_v1.json` | Keep Lead Registry as acquisition truth. Promote discovery outputs into it; do not make discovery files lifecycle truth. |
| Revenue system | Payment/packet authority for payment state: `web/src/checkout-public.js`, `web/src/routes/stripeWebhook.esm.js`, `web/src/routes/packetAuthority.esm.js`, `web/src/lib/packetRepository.js`; Client Registry for merchant revenue lifecycle | CONDITIONAL | `staffordos/revenue/revenue_truth_v1.json` is outreach-funnel partial/stale; Abando pricing/buy routes are product-mismatched for ShopiFixer | Use packet table for payment/execution/proof status and Client Registry for merchant lifecycle. Treat `revenue_truth_v1` as historical support until regenerated from canonical sources. |
| Proof system | `staffordos/system_inventory/output/execution_proof_register_v1.json/.md` plus No Kings audit evidence/proof package workspace | REAL but proof incomplete | `send_ledger_v1.json` proves outreach dry-runs only; Abando proof loop pack is Abando-specific; No Kings proof package output missing | Keep proof register. First missing proof is ShopiFixer implementation/after/QA/proof package, not a new proof framework. |
| Fulfillment system | `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md` and `staffordos/shopifixer/execution/shopifixer_first_full_loop_v1.md` | NOT PROVEN end to end | Older execution packets, optimization packets, Abando proof loop, and planning artifacts | Use the existing fulfillment authority. Complete one manual proof-backed sprint before adding automation. |
| Cockpit system | `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx` and `/api/operator/ceo-snapshot` | CONDITIONAL | Legacy `/operator/revenue-command`, analytics, capacity, placeholder lead queue, broad command-center artifacts | Keep CEO Cockpit canonical. Add packet/proof/review truth into existing snapshot path; do not build another dashboard. |
| Client system | `staffordos/clients/client_registry_v1.json` and `client_registry_v1.mjs` | REAL but underpopulated | `staffordos/commercial/merchant_registry_v1.json`, old revenue truth, lead registry used beyond acquisition | Client Registry is merchant lifecycle truth after qualification/product routing. Fill missing packet/proof/review/referral fields only as defined by current authority. |

## No Kings Proof Store Reconciliation

Canonical proof store for public evidence: `no-kings-athletics.myshopify.com`.

Supporting evidence:

- Screenshot capture script uses `https://no-kings-athletics.myshopify.com`.
- Before evidence record names `https://no-kings-athletics.myshopify.com`.
- Storefront product probe reads `https://no-kings-athletics.myshopify.com/products.json`, collection products, and product `.js`.
- Product candidates use `no-kings-athletics.myshopify.com`.
- Captured homepage/catalog truth includes public theme id `166489554980` and the public store domain.

Execution/theme access evidence:

- `execution_access_result_v1.md` confirms access for `no-kings-athletics-dev.myshopify.com`.
- `theme_pull_test_v2.txt` proves Horizon theme `#150895657158` was pulled from the dev store.
- `no_kings_theme_learning_v1.md` documents local backup `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158`.

Remaining ambiguity:

- Public proof evidence and product truth are on `no-kings-athletics.myshopify.com`.
- Confirmed theme pull/write-adjacent evidence is on `no-kings-athletics-dev.myshopify.com`.
- Public live homepage reports a different theme id than the pulled dev theme.

Recommended store for first ShopiFixer execution loop:

Use `no-kings-athletics.myshopify.com` as the canonical proof target only if write/admin access can be aligned to that exact store. If only the dev store is writable, explicitly re-capture before evidence, storefront discovery, product truth, and after evidence on `no-kings-athletics-dev.myshopify.com` before claiming the loop as proof.

## Duplicate / Stale / Abandoned Systems

| Area | Duplicate or Stale Artifact | Reason |
| --- | --- | --- |
| Merchant lifecycle | `staffordos/commercial/merchant_registry_v1.json` | Sample merchant; duplicates Lead/Client Registry responsibilities. |
| Revenue command | `staffordos/revenue/revenue_truth_v1.json`; legacy `/operator/revenue-command` | Partial/outreach-funnel view; does not represent current packet/payment/client lifecycle fully. |
| Proof | `staffordos/leads/send_ledger_v1.json` | Valid for outreach proof, not fulfillment proof or merchant proof package. |
| Cockpit | Analytics/capacity/revenue-command placeholder routes | Older boundary audit marks them placeholder/mixed. CEO Cockpit supersedes them. |
| Payment | Abando `/pricing` and `/buy` surfaces | Real Abando billing pages, not canonical ShopiFixer $950 checkout proof. |
| ShopiFixer mutation | Product admin/write artifacts | Current state is gap evidence, not a proven mutation system. |
| Discovery sync | `discovery_sync_manifest_v1.md` | Manual scripted sync only; does not block first manual proof loop. |

## Canonical Source Rule

Do not create another merchant registry, lead lifecycle, revenue cockpit, proof register, audit template, or scoring model unless the artifacts above are proven unable to hold the required truth.
