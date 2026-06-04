# StaffordMedia.ai → ShopiFixer Conversion Path Alignment Audit v1

Repository truth basis:

- `web/src/public/index.html`
- `web/src/routes/pricing.esm.js`
- `web/src/routes/runAudit.esm.js`
- `web/src/routes/installShopify.esm.js`
- `web/src/routes/publicPages.esm.js`
- `abando-frontend/app/shopifixer/page.tsx`
- `web/src/routes/scorecard.esm.js`
- `web/src/routes/sendOffer.esm.js`
- `staffordos/shopifixer/shopifixer_commercial_definition_v1.md`
- `staffordos/authority/output/shopifixer_audit_authority_v1.md`
- `staffordos/authority/output/shopifixer_fulfillment_authority_v1.md`
- `staffordos/authority/output/shopifixer_first_sales_motion_v1.md`
- `staffordos/authority/output/shopifixer_sales_execution_v1.md`
- `staffordos/authority/output/shopifixer_revenue_capacity_lock_v1.md`
- `staffordos/commercial/offer_routing_rules_v1.json`
- `staffordos/clients/generate_shopifixer_offer_v1.mjs`
- `staffordos/clients/shopifixer_offer_latest.json`

Canonical truth already established:

- Product: `ShopiFixer Fix Sprint`
- Price: `$950 flat fee`
- Commercial authority: established
- Lifecycle authority: established

## A. Current Journey

The current merchant path is mostly Abando-first, not ShopiFixer-first.

1. Merchant lands on the StaffordMedia/Abando home page.
   - Brand: `Abando`
   - Main CTA options: `Try audit`, `Install Abando`, `Open demo`
   - Primary message: recover lost revenue from checkout drop-offs

2. Merchant clicks `Try audit` or `/fix`.
   - This goes to the public scorecard/audit flow.
   - The audit is benchmark-based and explicitly says it is not live telemetry yet.
   - If no generated scorecard exists, the next step is `Install Abando`.

3. Merchant clicks `Pricing` or `Buy`.
   - This goes to Abando subscription pricing.
   - Current public pricing is monthly Abando plans, not the canonical ShopiFixer fix sprint.

4. Merchant clicks `Install Abando`.
   - The install flow is also Abando-branded.
   - It positions Abando as a recovery app that tracks checkout signals and customer return.

5. Separate from the main site, there is a ShopiFixer page at `abando-frontend/app/shopifixer/page.tsx`.
   - It is branded as ShopiFixer.
   - It shows a synthetic audit result.
   - It has no canonical $950 checkout path.
   - It does not complete the commercial loop into a paid Fix Sprint.

6. The operator-side ShopiFixer offer path exists externally.
   - `generate_shopifixer_offer_v1.mjs` creates a merchant offer artifact.
   - `send_shopifixer_offer_v1.mjs` sends that offer by email.
   - That is not the same as a clean public merchant checkout path.

Bottom line: the visible journey leads merchants toward Abando install or a generic audit, not toward a clean ShopiFixer purchase.

## B. Conversion Blockers

1. The public home page is Abando-branded.
   - The merchant sees `Abando` before they ever see the canonical ShopiFixer fixed-fee offer.

2. The public audit flow is benchmark-oriented.
   - It frames value as an estimate or scorecard.
   - It does not present the canonical ShopiFixer sprint as the primary commercial object.

3. The public pricing page is the wrong product.
   - It shows Abando monthly plans.
   - It does not surface the ShopiFixer Fix Sprint or its fixed fee.

4. The install path is the wrong outcome.
   - `/install/shopify` is an Abando install flow.
   - It is not the canonical ShopiFixer payment path.

5. The ShopiFixer page is not a real offer path.
   - It is a demo-style audit page with a synthetic result.
   - It does not present a canonical checkout or a proof-backed paid offer.

6. There is no unified merchant journey from audit to purchase.
   - The site shows value discovery.
   - It does not show a direct ShopiFixer fix sprint purchase step.

## C. Trust Blockers

1. Brand mismatch.
   - The public site reads as Abando.
   - The canonical commercial authority reads as ShopiFixer Fix Sprint.

2. Outcome mismatch.
   - The public site promises recovery tracking and install.
   - The canonical offer promises a focused fix sprint with proof.

3. Proof is not tied to the purchase path.
   - The ShopiFixer page shows an example audit result.
   - It does not show a merchant-ready proof package or a real paid loop.

4. The page-level trust story is incomplete.
   - The site says the audit is directional or benchmark-based.
   - It does not show the exact before/after evidence chain that justifies the fixed fee.

5. The merchant cannot verify the full paid outcome on-site.
   - The site does not present a visible canonical ShopiFixer checkout or proof completion flow.

## D. Proof Gaps

1. No public completed ShopiFixer case study.
2. No visible before/after evidence chain on the acquisition path.
3. No merchant-facing proof package summary on the public site.
4. No visible paid ShopiFixer checkout path on the public site.
5. No public flow that shows `issue -> fix -> proof -> payment_received` as one merchant journey.

Internal proof artifacts exist in the repository, but they are not surfaced where merchants make the decision.

## E. Sitemap Misalignments

1. The site hierarchy is Abando-first.
   - Home, pricing, install, onboarding, demo, support all reinforce Abando.

2. The canonical ShopiFixer offer is not the main navigation object.
   - There is no clear top-level merchant path that says: audit -> fix sprint -> pay $950 -> proof.

3. The public pricing pages conflict with the canonical commercial definition.
   - `web/src/routes/pricing.esm.js`
   - `web/src/public/pricing/index.html`
   - Both present monthly Abando pricing.

4. The public audit route hands off to Abando install.
   - `web/src/routes/runAudit.esm.js` routes merchants to install when it lacks a public scorecard.

5. The ShopiFixer page is detached from the main merchant journey.
   - `abando-frontend/app/shopifixer/page.tsx` is not integrated into the main conversion hierarchy.

6. The public install flow is the wrong commercial promise.
   - It says Abando helps recover lost checkout revenue.
   - That is not the canonical ShopiFixer Fix Sprint.

## F. Highest ROI Conversion Improvements

These are the highest-value changes without redesigning StaffordOS:

1. Make the public merchant journey explicitly ShopiFixer-first for conversion issues.
   - The visitor should be able to move from audit value to the canonical Fix Sprint without being redirected into Abando by default.

2. Surface the canonical ShopiFixer offer where the decision is made.
   - The audit result, offer page, and follow-up should all point to the same $950 fix sprint definition.

3. Add a visible proof package summary near the offer.
   - Before evidence
   - Fix scope
   - After evidence
   - Merchant proof package

4. Replace the synthetic ShopiFixer demo feel with proof-backed merchant language.
   - Keep the audit focus.
   - Stop making the primary page feel like a toy example.

5. Separate Abando recovery positioning from ShopiFixer first-touch conversion.
   - Abando can remain the recovery product.
   - It should not be the first commercial answer for a conversion/fix issue.

6. Make the path to payment obvious.
   - The merchant should not have to infer that a real purchase exists elsewhere in the repo.

## Shortest Path From Visitor → Paid ShopiFixer Client

Using the current site as-is, there is not a clean on-site paid ShopiFixer path.

The shortest practical path is:

1. Visitor lands on the home page.
2. Visitor clicks `Try audit` or views the ShopiFixer demo page.
3. Merchant sees a specific issue and the value of fixing it.
4. Operator sends the generated ShopiFixer offer externally.
5. Merchant receives the canonical ShopiFixer fixed-fee offer.
6. Merchant pays.
7. Payment is confirmed through the existing payment/packet authority path.

The problem is that steps 4-7 are not presented as one coherent public path on the site today.
