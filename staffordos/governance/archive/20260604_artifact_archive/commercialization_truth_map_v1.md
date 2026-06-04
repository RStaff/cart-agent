# Commercialization Truth Map v1

Generated: 2026-06-03

## Rule

This map uses discovered repository reality only. Missing steps are marked missing or unproven rather than invented.

Current target chain:

Lead -> Audit -> Offer -> Payment -> Client Registry -> Fulfillment -> Proof Package -> Review -> Referral

## Truth Map

| Step | Artifact | Route | API | UI | Registry | Owner | Proof Source | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lead | `staffordos/leads/lead_registry_v1.json`; `web/src/lib/shopifixerLeadRegistry.js` | `POST /api/fix-audit` creates/updates ShopiFixer lead | `staffordos/ui/operator-frontend/app/api/operator/lead-registry/route.ts`; `POST /api/shopifixer/track` | Cockpit acquisition cards; operator lead surfaces | Lead Registry; Lead Events | StaffordOS acquisition / ShopiFixer runtime | 23 ShopiFixer-routed leads; 1,464 lead events | REAL |
| Audit | `staffordos/audits/shopifixer_audit_standard_v1.md`; `staffordos/audits/no_kings/final_audit/no_kings_shopifixer_final_audit_v1.md` | `GET /api/fix-audit?store=...` returns saved audit payload for runtime path | `POST /api/fix-audit`; `GET /api/fix-audit` | Audit/result page path implied by `/api/shopifixer/track-redirect` to `/audit-result?store=...` | Lead Registry stores problem summary and stage | ShopiFixer audit owner | No Kings before screenshots, scorecard, final audit | REAL but conditional for merchant proof |
| Offer | `staffordos/shopifixer/shopifixer_commercial_definition_v1.md`; `offer_routing_rules_v1.json`; `product_routing_authority_v1.md` | Email offer endpoint and manual sales motion | `POST /api/shopifixer/send-offer`; `/api/shopifixer/track-redirect?eventType=pricing_viewed` | Pricing path exists, but current `/pricing` is Abando monthly, not canonical ShopiFixer $950 | Lead Registry routing fields; Client Registry after promotion | StaffordOS / ShopiFixer operator | $950 commercial definition; first sales motion; send-offer route checks SMTP | PARTIAL |
| Payment | `web/src/checkout-public.js`; `stripeWebhook.esm.js`; `packetAuthority.esm.js`; `packetRepository.js` | `POST /__public-checkout`; `/payment-return`; `POST /stripe/webhook` | `/api/packets/prepare`; `/api/operator/packets`; `/api/packets/:packetId/execution` | Public checkout flow; cockpit does not yet include packet adapter | Postgres `packets` table; Client Registry payment fields underrepresented | Payment authority / packet authority | `$950` one-time checkout visually confirmed; packet stayed `payment_pending`; webhook path ready for signed event | CONDITIONAL |
| Client Registry | `staffordos/clients/client_registry_v1.json`; `client_registry_v1.mjs`; `client_promotion_authority_v1.md` | Promotion after qualification/product route; path not proven automated | `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts` | CEO Cockpit revenue/conversion cards | Client Registry | StaffordOS client lifecycle | One proof client exists; promotion gap file says Lead -> Client not proven | PARTIAL |
| Fulfillment | `shopifixer_fulfillment_authority_v1.md`; `shopifixer_first_full_loop_v1.md`; No Kings sprint validation | Packet -> Scope -> Before Evidence -> Fix Notes -> After Evidence -> Proof Package | `/api/packets/:packetId/execution` can update execution/proof/completion status | Cockpit fulfillment card, currently partial and missing packet adapter | Packet table plus future Client Registry packet/proof fields | ShopiFixer fulfillment owner | First loop says Discovery and Sprint Selection complete; Implementation/After/QA/Deliverable not started | NOT PROVEN |
| Proof Package | `execution_proof_register_v1.md`; `proof_evidence_scan_v1.md`; No Kings proof package target path | After implementation and QA | `staffordos/ui/operator-frontend/app/api/operator/send-proof/route.ts` only reports send-ledger proof; Abando proof route exists separately | Cockpit proof card reports outreach proof, not ShopiFixer fulfillment proof | Execution Proof Register; future Client Registry proof fields | StaffordOS proof owner | Proof register says all major proof categories partial; No Kings proof package missing | NOT PROVEN |
| Review | `revenue_success_gate_v1.md`; `staffordos_business_core_definition_of_done_v1.md` | After proof package delivery and merchant acceptance | No discovered live review API for ShopiFixer | Cockpit review/referral card displays zero reviews requested/received | Missing Client Registry `review_status` fields | Merchant success owner | Authority defines required review status, response, testimonial, satisfaction risk | MISSING OPERATIONAL PROOF |
| Referral | `revenue_success_gate_v1.md`; `staffordos_business_core_definition_of_done_v1.md` | Only after satisfied proof-complete merchant | No discovered live referral API for ShopiFixer | Cockpit review/referral card displays zero referral opportunities | Missing Client Registry `referral_status` fields | Merchant success owner | Authority defines referral opportunity and ask status | MISSING OPERATIONAL PROOF |

## Current Repository Reality

The repository already contains the acquisition spine, audit standard, ShopiFixer commercial definition, payment/packet authority, client registry, cockpit aggregator, fulfillment authority, and proof register.

The chain is not yet closed because the repository does not contain one completed ShopiFixer proof loop with:

- implementation
- after evidence
- QA validation
- merchant proof package
- review/referral state

## Highest-Leverage Executable Milestone

Complete the first ShopiFixer execution loop on the No Kings proof target using existing artifacts.

The shortest path is not another roadmap or framework. It is:

1. Lock the proof target: `no-kings-athletics.myshopify.com` for public evidence, or intentionally switch every evidence artifact to `no-kings-athletics-dev.myshopify.com` if dev is the only writable store.
2. Resolve product truth for the selected `AirL Fabric Tee`: real price, image, description, product URL, and purchasable status.
3. Re-run storefront product capture and keep it beside `storefront_product_probe_v1.json`.
4. Execute the minimal Horizon homepage/product-list or featured-product change already identified in `no_kings_theme_learning_v1.md`.
5. Capture after desktop and mobile screenshots at the paths named by sprint validation.
6. Run the existing QA checklist from `no_kings_shopifixer_sprint_validation_v1.md`.
7. Produce `staffordos/audits/no_kings/proof_package/no_kings_shopifixer_sprint_completion_v1.md`.
8. Update existing packet/client/proof fields only where current artifacts already define them.

This single milestone moves the system from discovery-proof to execution-proof without constructing a new operating layer.
