# Commercialization Gaps v1

Generated: 2026-06-03

## Rule

Only genuine missing or unproven commercialization gaps are listed. Existing components are not relisted as gaps.

## Not Gaps

- Lead Registry exists and is populated.
- Lead Events exist.
- Lead State Machine exists.
- ShopiFixer audit standard exists.
- ShopiFixer commercial definition exists.
- No Kings before evidence exists.
- No Kings final audit and sprint validation exist.
- Product/revenue scoring already exists.
- Theme pull and theme learning are proven for the dev store.
- Stripe checkout, webhook, packet authority, and packet repository exist.
- Client Registry exists.
- CEO Cockpit and CEO snapshot API exist.
- Execution Proof Register exists.

## Genuine Gaps

| Gap | Why It Is A Gap | Evidence It Is Missing | Business Impact | Priority | Exact Fix Required |
| --- | --- | --- | --- | --- | --- |
| No Kings execution target ambiguity | Public proof evidence and theme access do not point to the same store. | Public evidence uses `no-kings-athletics.myshopify.com`; theme access/pull uses `no-kings-athletics-dev.myshopify.com`; public homepage has a different theme id than dev pull. | A before/after proof package is weak if "before" and "after" are not the same store. | P0 | Lock one proof target. Prefer public store if write access exists. Otherwise recapture all proof evidence on dev and label it as dev-store proof. |
| Product/catalog truth prevents honest execution | Selected No Kings blocker is Catalog Readiness, but the product has no commercial proof. | Product probe and catalog truth show one product, price `0.00`, images `[]`; mutation decision says HOLD until catalog truth corrected or confirmed as proof-store limitation. | A homepage product-path fix cannot justify $950 if the product remains commercially invalid. | P0 | Correct the AirL Fabric Tee product manually in Shopify Admin or prove product write access; then recapture product JSON. |
| Product admin/write capability not proven | ShopiFixer cannot yet programmatically perform the selected catalog fix. | `product_admin_truth_v1.md` says product admin/write access not proven; mutation gap says product query/mutation/media/price/inventory updates are not proven and scopes are missing. | Implementation stalls at discovery unless the fix is done manually or write scope is proven. | P0 | Confirm existing Shopify app scopes or add/prove `read_products`/`write_products` only if needed; otherwise perform manual admin correction for first proof loop. |
| First complete ShopiFixer execution loop missing | Discovery and sprint selection are complete, but execution proof does not exist. | `shopifixer_first_full_loop_v1.md` marks Implementation, After Evidence, QA Validation, Merchant Deliverable as NOT STARTED. | ShopiFixer cannot claim full delivery readiness or support aggressive outreach. | P0 | Complete one No Kings loop: implementation, after desktop/mobile screenshots, QA checklist, proof package. |
| Verified payment event not completed | Checkout and packet are ready, but no signed Stripe event has moved a packet to paid. | S2H snapshots show `$950` one-time checkout and packet `payment_pending`; payment was paused and no `payment_received` proof exists. | Fulfillment cannot safely start for a real buyer, and payment claims remain unproven. | P1 | Use first real buyer or explicitly approved controlled payment to prove `payment_pending -> payment_received` by verified `checkout.session.completed` webhook. |
| Cockpit missing packet adapter | CEO Cockpit shows fulfillment as partial but does not include packet table truth. | `/api/operator/ceo-snapshot` note says packet truth is not included; fulfillment status is `partial_missing_packet_adapter`. | Operator still needs packet lookup outside the cockpit for payment/fulfillment/proof decisions. | P1 | Add packet read-only summary from existing packet API/repository into CEO snapshot; do not build a new dashboard. |
| Lead-to-client promotion not proven | Lead Registry and Client Registry exist, but promotion between them is not operationally proven. | `lead_to_client_promotion_gap_v1.md` says Client Registry has one client only and promotion from lead to client is not proven. | Qualified merchants may remain in acquisition files instead of the lifecycle object used for payment, fulfillment, proof, review, and referral. | P1 | Use `client_promotion_authority_v1.md`: promote a qualified/product-routed merchant into Client Registry with existing required fields. |
| Client lifecycle lacks packet/proof/review/referral fields | Client Registry is canonical but underrepresents the full commercial loop. | `client_registry_canonical_lifecycle_gap_v1.md` lists missing packet_id, packet_status, proof_status, proof_package_ref, merchant_success_status, review_status, referral_status. | Cockpit cannot close the lifecycle without terminal archaeology or ad hoc proof files. | P1 | Add only the fields already named in the canonical lifecycle gap when the first execution loop needs them. |
| Live outreach proof not proven | Send infrastructure exists, but current proof ledger is dry-run only. | `send_ledger_v1.json` has 2 dry-run proofs and 0 live sends; send-offer route requires SMTP readiness. | Aggressive outreach can create unsupported claims about delivery or follow-up status. | P2 | Perform one controlled provider-backed ShopiFixer offer send and record it in existing send ledger/events. |
| Review/referral loop not operational | Authorities define review/referral, but no runtime or registry proof exists. | Cockpit reports zero reviews requested/received and zero referral opportunities; business-core DOD says fields are missing/needed. | Proof cannot compound into testimonials/referrals after delivery. | P2 | After first proof package delivery, record review request, merchant response, satisfaction status, referral opportunity in Client Registry. |

## Highest-Leverage Executable Milestone

Complete the No Kings Catalog Readiness -> Homepage Product Value proof loop.

This is the shortest path because it turns already-proven discovery, theme intelligence, theme pull, storefront discovery, revenue scoring, and mutation-gap knowledge into the first complete ShopiFixer execution proof.

## Exact Technical Steps

1. Lock target store identity.
   - Canonical proof target: `no-kings-athletics.myshopify.com`.
   - If only `no-kings-athletics-dev.myshopify.com` is writable, re-run before evidence and storefront discovery against dev before implementation.

2. Confirm implementation path.
   - If product write/admin scopes are unavailable, use manual Shopify Admin correction for the first proof loop.
   - If programmatic execution is required, prove Admin GraphQL product query/write/media/price capability first.

3. Correct the selected product truth.
   - Product: `No Kings Athletics AirL Fabric Tee`.
   - Required after state: non-zero price, at least one image, useful description, working product URL, available/purchasable state.

4. Recapture storefront product evidence.
   - Re-run product JSON capture beside `staffordos/audits/no_kings/product_discovery/storefront_product_probe_v1.json`.
   - Confirm product title, price, image count, product URL, availability.

5. Apply the minimal homepage change already identified.
   - Use existing Horizon section structure from `staffordos/shopifixer/learning/no_kings_theme_learning_v1.md`.
   - Preserve hero.
   - Improve product-list merchandising or insert/configure existing featured-product/custom-liquid section directly below hero.
   - Do not redesign the site.

6. Capture after evidence.
   - `staffordos/audits/no_kings/evidence/after/homepage_desktop_after.png`
   - `staffordos/audits/no_kings/evidence/after/homepage_mobile_after.png`

7. Run the existing QA checklist.
   - Desktop layout.
   - Mobile layout.
   - Product image/title/price.
   - Primary CTA.
   - Secondary CTA.
   - Product path toward cart/checkout.
   - Verified trust statements only.

8. Produce the merchant proof package.
   - Path: `staffordos/audits/no_kings/proof_package/no_kings_shopifixer_sprint_completion_v1.md`.
   - Include before evidence, implementation summary, sections changed, final copy, QA pass/fail, after evidence, before/after comparison, and unsupported-claims note.

9. Reconcile existing lifecycle truth.
   - Mark the proof package in the existing Client Registry/proof fields when the fields are added.
   - If a packet exists, update only existing packet lifecycle statuses through packet authority.
   - Do not create a new registry.
