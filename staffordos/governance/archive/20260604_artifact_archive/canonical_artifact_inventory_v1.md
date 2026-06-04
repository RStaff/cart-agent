# Canonical Artifact Inventory v1

Generated: 2026-06-03

## Scope

This inventory reconciles the commercialization-relevant artifacts found by repository-wide search for StaffordOS, ShopiFixer, Abando, revenue, cockpit, lead/client lifecycle, proof, payment, fulfillment, referral, governance, and system-map terms.

Theme backups, generated Shopify theme assets, and repeated output logs are collapsed into artifact families when they serve the same purpose. No new framework, scoring model, audit template, or architecture is introduced here.

## Acquisition

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/leads/lead_registry_v1.json` | Acquisition source of truth for merchant leads. | REAL, active | Canonical | 23 ShopiFixer-routed leads; read by CEO snapshot and lead API. | `web/src/lib/shopifixerLeadRegistry.js`, `staffordos/ui/operator-frontend/app/api/operator/lead-registry/route.ts` | Older lead lists and commercial merchant registry. |
| `staffordos/leads/lead_state_machine_v1.json` | Lead lifecycle states and product routing rules. | REAL | Canonical support artifact | Defines cold/contact/approved/sent/engaged/qualified/customer/stopped and product routing. | Lead registry writers/readers. | `staffordos/commercial/merchant_lifecycle_state_machine_v1.json` uses a parallel merchant-stage model. |
| `staffordos/leads/lead_events_v1.json` | Event history for lead lifecycle changes. | REAL, partially clean | Canonical support artifact | 1,464 events found; recent events still include `.tmp/send_console_data.json` source and some null event types. | `web/src/lib/shopifixerLeadRegistry.js`, `web/src/lib/shopifixerLifecycleTracker.js` | Send logs, outcome logs. |
| `staffordos/leads/send_ledger_v1.json` | Proof ledger for outreach sends. | PARTIAL | Canonical for outreach proof only | 2 dry-run send proofs, 0 live sends. Used by CEO snapshot proof summary. | Operator mark-sent/send execution. | Execution proof register; not fulfillment proof. |
| `staffordos/leads/outreach_queue.json`, `approval_queue_v1.json`, `outcomes.json` | Older outreach funnel files used by revenue truth. | PARTIAL / legacy-support | Non-canonical for lifecycle | `staffordos/revenue/revenue_truth_v1.json` reads these. | Revenue truth generator. | Lead Registry now carries richer current lead state. |
| `staffordos/leads/candidate_stores.json`, `real_store_candidates.json`, `scored_stores.json`, `top_targets.json`, `contact_targets.json`, `qualified_targets.json` | Discovery/enrichment output families. | REAL generated outputs, currently dirty | Non-canonical inputs | Present in worktree as modified lead discovery outputs. | Discovery engine scripts. | Lead Registry once promoted; should not become a second lifecycle system. |
| `web/src/lib/shopifixerLeadRegistry.js` | Runtime writer from ShopiFixer intake into Lead Registry and Lead Events. | REAL | Canonical writer | `/api/fix-audit` calls `upsertShopifixerLead`. | `web/src/index.js` | Older `.tmp/fix_audit_leads.json`. |
| `web/src/lib/shopifixerLifecycleTracker.js` | Runtime tracker for audit/pricing/onboarding events. | REAL | Canonical writer for ShopiFixer lead engagement | `/api/shopifixer/track` and `/api/shopifixer/track-redirect`. | Lead Registry, Lead Events, `shopifixerScoring.js` | Separate lead scoring artifacts. |
| `web/src/index.js:/api/fix-audit` | Public ShopiFixer audit intake and lead creation. | REAL | Canonical runtime acquisition API | Creates local fix-audit lead, writes canonical Lead Registry, saves audit payload, optionally sends email. | `storeAnalyzer`, `shopifixerLeadRegistry`, email readiness. | `.tmp/fix_audit_leads.json` remains local support storage. |
| `staffordos/commercial/merchant_registry_v1.json` | Seeded merchant registry with one sample merchant and routing proof. | STALE / seed | Non-canonical | Contains `examplestore.com`; proof says built from canonical leads but not current live lifecycle. | Commercial mapping scripts. | Duplicates Lead Registry and Client Registry concepts. |

## Audit

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/audits/shopifixer_audit_standard_v1.md` | Required ShopiFixer audit sections. | REAL | Canonical audit standard | Defines executive summary, scorecard, findings, sprint recommendation, before evidence, proof plan. | ShopiFixer audit authority. | No new audit template needed. |
| `staffordos/authority/output/shopifixer_audit_authority_v1.md` | Authority for converting merchant trust into a $950 sprint decision. | REAL | Canonical audit authority | Requires visible, explainable, fixable, provable issue. | Audit standard, commercial definition. | Final No Kings audit follows this shape. |
| `staffordos/audits/no_kings/final_audit/no_kings_shopifixer_final_audit_v1.md` | Merchant-grade No Kings audit draft. | REAL, conditional | Canonical No Kings audit artifact | Includes scorecard, findings, before evidence summary, proposed after-state, scope, QA, proof plan, $950 rationale. | Before screenshots, scorecard, sprint validation. | Older readiness artifact still says final audit remains; this file supersedes that item. |
| `staffordos/audits/no_kings/no_kings_shopifixer_sprint_validation_v1.md` | Validates the selected No Kings sprint and QA/proof package contents. | REAL, conditional | Canonical No Kings sprint validation | States CONDITIONAL GO if theme access, product/collection, product image/price/link, and trust claims are confirmed. | Final audit, screenshots, scorecard. | Later scoring/mutation decision narrowed first implementation to Catalog Readiness. |
| `staffordos/audits/no_kings/evidence/before_evidence_record_v1.md` | Before evidence record for No Kings public proof store. | REAL | Canonical before evidence register | Store URL: `https://no-kings-athletics.myshopify.com`; desktop and mobile screenshots exist. | `capture_before_evidence_v1.mjs`, screenshot files. | Older `evidence_manifest_v1.md` says no screenshots and is stale. |
| `staffordos/audits/no_kings/evidence/before/*.png` | Desktop and mobile before screenshots. | REAL | Canonical before evidence | Referenced by final audit and sprint validation. | Playwright capture script. | None. |
| `staffordos/audits/no_kings/evidence/annotated/homepage_before_annotation_v1.md` | Annotated before evidence. | REAL | Canonical support evidence | Used by sprint validation. | Before screenshots. | Older readiness checklist may not reflect completion. |
| `staffordos/audits/no_kings/no_kings_scorecard_completion_v1.md` and `no_kings_scorecard_and_findings_v1.md` | Scorecard and findings inventory. | REAL | Canonical support evidence | Referenced by sprint validation and final audit. | Audit standard. | Revenue scoring artifact separately ranks implementation priority. |
| `staffordos/audits/no_kings/product_discovery/storefront_product_probe_v1.json` | Public storefront product discovery. | REAL | Canonical product evidence | Proves one public product, `AirL Fabric Tee`, price `0.00`, images `[]`. | Public Shopify storefront endpoints. | Catalog truth JSON duplicates same finding. |
| `staffordos/audits/no_kings/catalog_truth/products_250.json` | Captured public catalog truth. | REAL | Canonical support evidence | Confirms one product, zero-dollar price, no images. | Public products endpoint. | Product probe. |
| `staffordos/audits/no_kings/scoring/no_kings_revenue_impact_score_v1.md` | Applies existing ShopiFixer revenue scoring to No Kings findings. | REAL | Canonical No Kings scoring output | Selects Catalog Readiness as CRITICAL. | Existing revenue impact scoring model. | Final audit initially frames homepage clarity; scoring gates it with catalog readiness. |
| `staffordos/shopifixer/scoring/revenue_impact_scoring_model_v1.md` | Existing finding-priority model. | REAL | Canonical scoring model | Used by No Kings scoring. | ShopiFixer pattern/mutation artifacts. | Do not create a new scoring model. |

## Offer

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/shopifixer/shopifixer_commercial_definition_v1.md` | Defines the $950 ShopiFixer Fix Sprint offer. | REAL | Canonical offer definition | Audit is sales asset; Fix Sprint is product; deliverables include implementation, QA, before/after evidence, proof package. | Audit authority, fulfillment authority. | `shopifixer_first_sales_motion_v1.md`, `daily_sales_checklist`. |
| `staffordos/commercial/offer_routing_rules_v1.json` | Product routing between ShopiFixer and Abando. | REAL | Canonical support artifact, but not lifecycle source | ShopiFixer first for conversion/dev/audit issues; Abando only after recovery interest or post-sprint upsell. | Product routing authority. | Lead Registry routing fields. |
| `staffordos/authority/output/product_routing_authority_v1.md` | Authority for selecting ShopiFixer, Abando, Consulting, or Disqualify. | REAL | Canonical product routing authority | Requires evidence-based routing and one StaffordOS lifecycle. | Lead/Client Registry. | Offer routing JSON. |
| `web/src/routes/sendOffer.esm.js` | Runtime endpoint to send ShopiFixer offer by SMTP. | REAL, unproven live in current evidence | Canonical offer-send route if SMTP ready | Returns `email_not_configured` if SMTP missing; sends via Nodemailer if ready. | SMTP env, email readiness. | Send ledger does not yet show live provider offer sends. |
| `staffordos/authority/output/shopifixer_first_sales_motion_v1.md` | First-sale messaging and close motion. | REAL guidance | Non-canonical operational checklist | Defines one real $950 ShopiFixer close motion. | Payment and fulfillment gates. | Daily checklist; should not override proof gates. |
| `staffordos/authority/output/shopifixer_daily_sales_checklist_v1.md` | Daily sales checklist. | REAL guidance | Non-canonical checklist | Tells operator to send checkout link only after interest, verify packet before work. | First sales motion, revenue gate. | Outreach readiness; not proof. |

## Payment

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `web/src/checkout-public.js` | Creates Stripe Checkout sessions and payment-pending packets. | REAL | Canonical checkout creation path | Uses mode `payment`, `client_reference_id`, `metadata.packet_id`, `metadata.store_domain`; writes packet as `payment_pending`. | Stripe env, packet repository. | Legacy Abando `/buy` and pricing routes. |
| `web/src/routes/stripeWebhook.esm.js` | Verifies Stripe webhook and moves packet to `payment_received`. | REAL, not runtime-proven for current ShopiFixer packet | Canonical payment proof authority | Requires raw body, Stripe signature, `STRIPE_WEBHOOK_SECRET`, pre-existing packet. | Stripe, packet repository. | Payment-return route explicitly not proof. |
| `web/src/routes/packetAuthority.esm.js` | Packet preparation, operator packet reads, lifecycle updates, payment-return binding. | REAL | Canonical packet API | Provides `/api/packets/prepare`, `/api/operator/packets`, `/api/packets/:packetId/execution`, `/payment-return`. | Packet repository. | CEO snapshot does not yet read packet truth. |
| `web/src/lib/packetRepository.js` | Postgres packet persistence. | REAL | Canonical packet store abstraction | Creates `packets` table with payment, execution, proof, completion statuses. | `DATABASE_URL`. | Client Registry has payment fields but not packet table state. |
| `staffordos/authority/output/s2g_packet_binding_readiness_v1.md` | Payment/packet binding readiness. | REAL | Canonical payment readiness evidence | Status `READY_FOR_SIGNED_COMPLETED_EVENT`; remaining proof is real Stripe-signed event. | Checkout, webhook, packet repository. | S2H snapshots. |
| `staffordos/authority/output/s2h_checkout_visual_confirmation_v1.md` | Visual confirmation of live checkout. | REAL | Canonical checkout proof snapshot | Verified `$950.00`, ShopiFixer Fix Sprint, one-time payment, packet `payment_pending`. | Live Stripe session. | `s2h_paused_no_payment_v1.md`. |
| `staffordos/authority/output/s2h_paused_no_payment_v1.md` | Paused validation record. | REAL | Canonical safety record | Payment not completed; packet remains payment_pending; no execution starts. | S2H checkout visual confirmation. | Payment readiness snapshot. |
| `staffordos/authority/output/s2h_real_payment_readiness_snapshot_v1.md` | Required real-payment validation. | REAL | Canonical next payment proof requirement | Requires controlled payment to prove `payment_pending -> payment_received` by verified webhook. | Stripe, packet authority. | Current roadmap lock. |
| `web/src/routes/pricing.esm.js` and `web/src/routes/publicPages.esm.js` | Abando pricing/buy pages. | REAL, product-mismatched for ShopiFixer commercialization | Non-canonical for ShopiFixer $950 offer | Pricing page is Abando monthly; `/buy` is Abando plan checkout. | Stripe env. | Must not be treated as ShopiFixer buying flow. |

## Client

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/clients/client_registry_v1.json` | Merchant lifecycle and client source of truth. | REAL, underpopulated | Canonical client system | One proof client, `cart-agent-dev.myshopify.com`, status `proof_client`, payment `not_billable`, lifecycle `proposal_sent`. | Client registry module and cockpit APIs. | Commercial merchant registry, revenue truth, lead registry. |
| `staffordos/clients/client_registry_v1.mjs` | Client registry read/write module. | REAL | Canonical client registry code | Lifecycle audit identifies purpose: separates Stafford revenue, ShopiFixer service truth, Abando merchant performance truth. | Client registry JSON. | Local scripts that read JSON directly. |
| `staffordos/authority/output/client_promotion_authority_v1.md` | Rule for promoting lead to Client Registry. | REAL | Canonical promotion authority | Lead becomes client after qualification and selected product; payment not required. | Lead Registry, Client Registry. | `lead_to_client_promotion_gap_v1.md`. |
| `staffordos/authority/output/client_registry_canonical_lifecycle_gap_v1.md` | Gap analysis for extending Client Registry lifecycle fields. | REAL | Canonical convergence guidance | Says Client Registry should be merchant lifecycle object; missing packet/proof/review/referral fields. | Client Registry, cockpit. | Avoids new merchant registry. |
| `staffordos/lifecycle_audit/lead_to_client_promotion_gap_v1.md` | Evidence that promotion from lead to client is not yet proven. | REAL | Canonical gap evidence | Lead Registry has acquisition data; Client Registry has one client only. | Promotion authority. | Commercial merchant registry should not replace it. |
| `staffordos/clients/operator_dashboard_snapshot_v1.json` | Derived operator summary from Client Registry. | REAL, stale/narrow | Canonical dashboard snapshot input | One internal proof client, $0 Stafford revenue, $100 merchant recovered. | Client Registry. | CEO snapshot and revenue truth. |

## Fulfillment

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md` | Minimum authority to deliver one $950 Fix Sprint. | REAL | Canonical fulfillment authority | Fulfillment starts only after `payment_received`; required artifacts: intake, scope, before evidence, execution notes, after evidence, proof package, completion decision. | Packet/payment authority. | First full loop and sprint validation. |
| `staffordos/authority/output/shopifixer_next_execution_gate_v1.md` | Current execution gate. | REAL | Canonical gate status | Planning-stage dry run complete; implementation, after evidence, proof package, merchant satisfaction not proven. | Fulfillment authority. | Launch readiness score. |
| `staffordos/shopifixer/execution/shopifixer_first_full_loop_v1.md` | Stage tracker for first complete ShopiFixer loop. | REAL | Canonical execution loop tracker | Discovery and sprint selection complete; implementation, after evidence, QA, deliverable not started. | No Kings artifacts. | Current roadmap/authority outputs. |
| `staffordos/audits/no_kings/execution/no_kings_execution_brief_v1.md` | No Kings execution brief. | REAL support artifact | Canonical support for first loop | Identifies Horizon/theme/product context. | Theme access, audit, scoring. | Sprint validation. |
| `staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md` | Theme access evidence. | REAL | Canonical theme-access proof | Confirms `no-kings-athletics-dev.myshopify.com` Horizon theme access. | Shopify CLI. | Public proof store evidence uses non-dev domain. |
| `staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt` | Theme pull proof. | REAL | Canonical theme-pull proof | Pull succeeded for dev Horizon theme `#150895657158`. | Shopify CLI. | Local theme backup. |
| `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158/` | Pulled Horizon theme source. | REAL | Canonical local theme source for dev store | Includes `templates/index.json`, `sections/product-list.liquid`, `sections/featured-product.liquid`. | Theme pull. | Public live homepage has separate theme id `166489554980` in captured HTML. |
| `staffordos/audits/no_kings/product_admin_truth/product_admin_truth_v1.md` | Product mutation readiness truth. | REAL | Canonical admin-write gap evidence | Theme pull and storefront read proven; product admin/write not proven. | Shopify app scopes/Admin GraphQL. | Mutation gap. |
| `staffordos/shopifixer/capability_gaps/shopifixer_admin_mutation_gap_v1.md` | ShopiFixer mutation capability gap. | REAL | Canonical mutation gap | Product query/mutation/media/price/inventory updates not proven; missing `read_products`/`write_products`. | Shopify app scopes. | Product admin truth. |

## Proof

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/system_inventory/output/execution_proof_register_v1.md` and `.json` | Capability proof register. | REAL | Canonical proof system | No capability may be PROVEN without runtime evidence; six proof areas are partial. | Proof evidence scanner. | Send ledger, proof runs. |
| `staffordos/system_inventory/output/proof_evidence_scan_v1.md` and `.json` | Repository evidence scan. | REAL | Canonical support artifact | Scanned 1,492 files; all major proof IDs still require runtime confirmation. | Execution proof register. | Not a proof package. |
| `web/src/lib/staffordosProofRegister.js` | Runtime proof-register helper. | REAL | Canonical runtime support | Used by web/runtime proof paths. | Web app. | System inventory proof register. |
| `staffordos/proof_loop/merchant_proof_loop_completion_pack.md` | Abando merchant proof loop completion steps. | REAL, Abando-specific | Canonical Abando proof loop | Locks production frontend/backend and No Kings as primary target for Abando recovery proof. | `app.abando.ai`, `cart-agent-api.onrender.com`, real checkout/email/return. | Not the ShopiFixer sprint proof package. |
| `staffordos/audits/no_kings/proof_store_plan/no_kings_proof_store_correction_plan_v1.md` | Minimum proof-store correction plan. | REAL | Canonical first-loop correction plan | Requires real title, price, image, description, URL, inventory before homepage mutation. | Product admin/write or manual admin correction. | Mutation decision and scoring. |
| `staffordos/audits/no_kings/mutation_decision/no_kings_mutation_complexity_decision_v1.md` | Mutation complexity decision. | REAL | Canonical mutation decision | HOLD until catalog truth corrected or proof-store limitation confirmed. | Theme learning, product truth. | Sprint validation conditional GO. |
| `staffordos/audits/no_kings/proof_package/` | Intended No Kings proof package location. | MISSING output | Canonical target path | Sprint validation recommends `no_kings_shopifixer_sprint_completion_v1.md`; not found as complete output. | Implementation, QA, after screenshots. | Merchant deliverable. |

## Referral

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/authority/output/revenue_success_gate_v1.md` | Defines review/referral readiness gate. | REAL | Canonical review/referral authority | Requires review request, referral ask, proof package reuse, and merchant satisfaction before referral motion. | Proof package, client lifecycle. | Launch readiness score. |
| `staffordos/authority/output/staffordos_business_core_definition_of_done_v1.md` | Defines Review and Referral DONE states. | REAL | Canonical business-core authority | Requires review request status, merchant response, testimonial status, referral opportunity, ask status, next action. | Client Registry/cockpit. | Client lifecycle gap. |
| Client Registry review/referral fields | Review/referral state on merchant lifecycle object. | MISSING / underrepresented | Should be canonical when added | `client_registry_canonical_lifecycle_gap_v1.md` identifies `review_status`, `referral_status`, repeat revenue fields as missing. | Client Registry. | No separate referral registry should be created yet. |

## Executive Control

| Artifact | Purpose | Status | Canonical | Last Known Usage / Evidence | Dependencies | Overlaps |
| --- | --- | --- | --- | --- | --- | --- |
| `staffordos/ui/operator-frontend/app/operator/cockpit/page.tsx` | CEO Cockpit UI. | REAL, partial | Canonical cockpit surface | Fetches `/api/operator/ceo-snapshot`; answers next action, revenue, blockers, audit, fulfillment, proof, review/referral. | CEO snapshot API. | Legacy revenue-command/control pages. |
| `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | Cockpit truth aggregator. | REAL, partial | Canonical executive summary API | Reads Lead Registry, Client Registry, dashboard snapshot, send ledger; explicitly says packet truth not included yet. | Registry files. | Dashboard snapshot API, revenue truth. |
| `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts` | Client Registry API. | REAL | Canonical client UI API | Normalizes clients, payment, audit/fix status, blockers, next action. | Client Registry. | CEO snapshot. |
| `staffordos/ui/operator-frontend/app/api/operator/lead-registry/route.ts` | Lead Registry API. | REAL | Canonical lead UI API | Loads operator leads through `loadOperatorLeads`. | Lead Registry. | Older lead queue API. |
| `staffordos/ui/operator-frontend/app/api/operator/dashboard-snapshot/route.ts` | Dashboard snapshot API. | REAL | Canonical support API | Reads generated snapshot. | Client Registry snapshot. | CEO snapshot. |
| `staffordos/revenue/revenue_truth_v1.json` and `.md` | Older revenue funnel truth. | PARTIAL / stale for current commercialization | Non-canonical for current revenue execution | Shows outreach queue 7, send ledger 2, customers 0; uses older queues. | Outreach queue, approval queue, send ledger, outcomes. | Client Registry and packet authority supersede for payment/merchant lifecycle. |
| `staffordos/system_inventory/output/system_map_truth_graph_v1.json` | Broad system truth graph. | REAL, older snapshot | Canonical system-map evidence, not live commercialization state | Marks Lead Registry REAL, send proof PARTIAL, revenue truth PARTIAL. | System inventory outputs. | Newer client/payment artifacts not fully reflected. |
| `staffordos/system_inventory/output/data_ownership_matrix_v1.md` | Ownership of critical artifacts. | REAL, older | Canonical support audit | Identifies lead registry, send ledger, revenue truth, system map writers/readers. | System inventory. | Needs update after current client/payment convergence. |
| `staffordos/system_inventory/output/discovery_sync_manifest_v1.md` | Discovery sync readiness. | REAL | Canonical sync-status artifact | Status `MANUAL_SCRIPTED_NOT_SCHEDULED`; scheduled sync not proven. | Discovery sync agents. | Does not block first manual execution loop. |
| `AUDIT_system_boundary_report.md` | Older boundary audit for Abando, Shop Fixer Analyzer, StaffordOS. | REAL, superseded in parts | Non-canonical current state, useful duplicate evidence | Identifies placeholder revenue-command/analytics/capacity and boundary coupling. | Repo audit as of 2026-03-23. | Newer cockpit/client/payment authority files supersede current state. |
