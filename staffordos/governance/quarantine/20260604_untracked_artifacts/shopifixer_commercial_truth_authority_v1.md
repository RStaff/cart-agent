# ShopiFixer Commercial Truth Authority Audit v1

Repository truth basis:

- [ShopiFixer commercial definition](../../shopifixer/shopifixer_commercial_definition_v1.md)
- [ShopiFixer audit authority](../../authority/output/shopifixer_audit_authority_v1.md)
- [ShopiFixer fulfillment authority](../../authority/output/shopifixer_fulfillment_authority_v1.md)
- [ShopiFixer first sales motion](../../authority/output/shopifixer_first_sales_motion_v1.md)
- [ShopiFixer sales execution](../../authority/output/shopifixer_sales_execution_v1.md)
- [ShopiFixer revenue capacity lock](../../authority/output/shopifixer_revenue_capacity_lock_v1.md)
- [Offer routing rules](../../commercial/offer_routing_rules_v1.json)
- [Merchant lifecycle state machine](../../commercial/merchant_lifecycle_state_machine_v1.json)
- [Merchant registry builder](../../commercial/build_merchant_registry_v1.mjs)
- [Client promotion runner](../../clients/promote_leads_to_clients_v1.mjs)
- [ShopiFixer offer generator](../../clients/generate_shopifixer_offer_v1.mjs)
- [ShopiFixer merchant offer output](../../clients/shopifixer_offer_latest.json)
- [Client registry operating model upgrader](../../clients/upgrade_client_registry_operating_model_v1.mjs)
- [CEO snapshot route](../../ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts)
- [Operator primary action loader](../../ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts)
- [Public pricing surfaces](../../../web/src/routes/pricing.esm.js) and [pricing HTML](../../../web/src/public/pricing/index.html)
- [ShopiFixer merchant page](../../../abando-frontend/app/shopifixer/page.tsx)

## A. Canonical Commercial Definition

The canonical ShopiFixer commercial definition is:

- **Product:** `ShopiFixer Fix Sprint`
- **Nature of offer:** a focused conversion-improvement sprint
- **Not:** a redesign, marketing retainer, consulting engagement, or multi-month roadmap

The authoritative definition is stated most directly in [shopifixer_commercial_definition_v1.md](../../shopifixer/shopifixer_commercial_definition_v1.md).

It is reinforced by:

- [shopifixer_audit_authority_v1.md](../../authority/output/shopifixer_audit_authority_v1.md)
- [shopifixer_first_sales_motion_v1.md](../../authority/output/shopifixer_first_sales_motion_v1.md)
- [shopifixer_sales_execution_v1.md](../../authority/output/shopifixer_sales_execution_v1.md)
- [shopifixer_fulfillment_authority_v1.md](../../authority/output/shopifixer_fulfillment_authority_v1.md)

## B. Canonical Pricing Authority

The canonical ShopiFixer price is:

- **$950 flat fee**

This price is explicitly defined in:

- [shopifixer_commercial_definition_v1.md](../../shopifixer/shopifixer_commercial_definition_v1.md)
- [offer_routing_rules_v1.json](../../commercial/offer_routing_rules_v1.json)
- [shopifixer_revenue_capacity_lock_v1.md](../../authority/output/shopifixer_revenue_capacity_lock_v1.md)
- [shopifixer_first_sales_motion_v1.md](../../authority/output/shopifixer_first_sales_motion_v1.md)
- [shopifixer_sales_execution_v1.md](../../authority/output/shopifixer_sales_execution_v1.md)
- [shopifixer_audit_authority_v1.md](../../authority/output/shopifixer_audit_authority_v1.md)
- [shopifixer_fulfillment_authority_v1.md](../../authority/output/shopifixer_fulfillment_authority_v1.md)

The pricing authority is not a subscription price and not a per-client dynamic amount. It is a fixed-fee sprint price.

## C. Canonical Deliverables

The canonical deliverables are the ones listed in the commercial definition and fulfillment authority:

1. Executive Summary
2. Findings Summary
3. Selected Sprint Issue
4. Before Evidence
5. Implementation
6. QA Validation
7. After Evidence
8. Merchant Proof Package
9. Completion Summary

The fulfillment authority also requires the paid sprint to produce:

- Intake Summary
- Fix Scope
- Before-State Evidence
- Execution Notes
- After-State Evidence
- Merchant-Facing Proof Package
- Completion Decision

These are the same commercial promise expressed at different levels of operational detail.

## D. Canonical Merchant Outcome

The merchant outcome promised by the canonical authority is:

- identify one specific, visible, explainable friction issue
- fix that issue in one focused sprint
- document what changed
- prove the change with before/after evidence
- give the merchant a proof package they can understand without a sales call

In plain terms, the merchant is buying a **focused Shopify conversion-improvement sprint with proof**.

## E. Systems Aligned

These systems align with the canonical $950 ShopiFixer definition:

- [shopifixer_commercial_definition_v1.md](../../shopifixer/shopifixer_commercial_definition_v1.md)
- [offer_routing_rules_v1.json](../../commercial/offer_routing_rules_v1.json)
- [shopifixer_revenue_capacity_lock_v1.md](../../authority/output/shopifixer_revenue_capacity_lock_v1.md)
- [shopifixer_first_sales_motion_v1.md](../../authority/output/shopifixer_first_sales_motion_v1.md)
- [shopifixer_sales_execution_v1.md](../../authority/output/shopifixer_sales_execution_v1.md)
- [shopifixer_audit_authority_v1.md](../../authority/output/shopifixer_audit_authority_v1.md)
- [shopifixer_fulfillment_authority_v1.md](../../authority/output/shopifixer_fulfillment_authority_v1.md)
- [clients/promote_leads_to_clients_v1.mjs](../../clients/promote_leads_to_clients_v1.mjs)
- [commercial/build_merchant_registry_v1.mjs](../../commercial/build_merchant_registry_v1.mjs)
- [clients/upgrade_client_registry_operating_model_v1.mjs](../../clients/upgrade_client_registry_operating_model_v1.mjs)
- [ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts](../../ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts)
- [ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts](../../ui/operator-frontend/lib/operator/loadPrimaryActionSnapshot.ts)
- [clients/client_registry_v1.json](../../clients/client_registry_v1.json)

These systems either directly encode the $950 offer or consume the ShopiFixer route as the first-touch commercial product.

## F. Systems Out Of Alignment

These systems do not present the canonical ShopiFixer authority cleanly:

- [web/src/routes/pricing.esm.js](../../../web/src/routes/pricing.esm.js)
  - public pricing is Abando monthly, not ShopiFixer $950

- [web/src/public/pricing/index.html](../../../web/src/public/pricing/index.html)
  - public pricing is Abando monthly, not ShopiFixer $950

- [abando-frontend/app/shopifixer/page.tsx](../../../abando-frontend/app/shopifixer/page.tsx)
  - ShopiFixer-branded page, but it is a synthetic audit demo rather than the canonical commercial definition and price authority

- [clients/generate_shopifixer_offer_v1.mjs](../../clients/generate_shopifixer_offer_v1.mjs)
  - generates a dynamic merchant offer based on recovered value instead of the canonical fixed-fee authority

- [clients/shopifixer_offer_latest.json](../../clients/shopifixer_offer_latest.json)
  - currently shows a `$150` one-time fix for `cart-agent-dev.myshopify.com`, which is not the canonical $950 authority

- [clients/send_shopifixer_offer_v1.mjs](../../clients/send_shopifixer_offer_v1.mjs)
  - sends the generated downstream offer artifact, so it inherits the pricing drift from the generator

## G. Required Convergence Actions

1. Keep [shopifixer_commercial_definition_v1.md](../../shopifixer/shopifixer_commercial_definition_v1.md) as the single commercial definition authority.
2. Keep `$950 flat fee` as the only canonical ShopiFixer price.
3. Treat [generate_shopifixer_offer_v1.mjs](../../clients/generate_shopifixer_offer_v1.mjs) and [shopifixer_offer_latest.json](../../clients/shopifixer_offer_latest.json) as downstream offer artifacts, not authority.
4. Align merchant-facing offer generation to the canonical definition so the public offer, proposal, and operator surfaces all say the same thing.
5. Remove or clearly separate any dynamic recovery-based pricing so it cannot override the canonical fixed-fee offer.
6. Keep ShopiFixer first-touch routing separate from Abando subscription positioning.

## Direct Answers

1. **What is the authoritative ShopiFixer definition?**
   - ShopiFixer Fix Sprint: a focused conversion-improvement sprint for one specific Shopify friction issue.

2. **What is the authoritative ShopiFixer price?**
   - `$950 flat fee`.

3. **What deliverables are included?**
   - Executive Summary, Findings Summary, Selected Sprint Issue, Before Evidence, Implementation, QA Validation, After Evidence, Merchant Proof Package, Completion Summary.

4. **What proof is expected?**
   - Before/after evidence and a merchant-facing proof package that explains what was found, what changed, and what to watch next.

5. **What merchant outcome is promised?**
   - One visible, explainable, fixable friction issue is fixed and proven in a single sprint.

6. **Where is this authority defined?**
   - Primarily in [shopifixer_commercial_definition_v1.md](../../shopifixer/shopifixer_commercial_definition_v1.md), reinforced by the ShopiFixer audit, fulfillment, sales, and revenue authority files.

7. **Which systems consume this authority?**
   - Lead promotion, merchant routing, client registry upgrading, CEO snapshot, operator action loading, and the ShopiFixer offer routing path.

8. **Which systems disagree with this authority?**
   - Public Abando pricing surfaces, the synthetic ShopiFixer demo page, and the dynamic `$150` generated merchant offer artifact.

9. **Why does the repository currently show a $950 definition and a $150 merchant offer?**
   - Because the canonical commercial authority is fixed at `$950`, but the generated merchant offer script computes a dynamic one-time fix price from recovered merchant value. For `cart-agent-dev.myshopify.com`, recovered value is `100`, so the script outputs `150`.

10. **Which definition is canonical?**
   - The `$950 ShopiFixer Fix Sprint` definition is canonical.

