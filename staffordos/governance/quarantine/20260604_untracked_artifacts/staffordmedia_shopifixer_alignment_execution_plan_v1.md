# StaffordMedia.ai → ShopiFixer Alignment Execution Plan v1

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
- `staffordos/clients/send_shopifixer_offer_v1.mjs`
- `staffordos/clients/shopifixer_offer_latest.json`

Canonical truth:

- Product: `ShopiFixer Fix Sprint`
- Price: `$950 flat fee`
- Commercial authority: established
- Lifecycle authority: established

## A. Current Visitor Journey

Current path:

1. Visitor lands on an Abando-branded home page.
2. Visitor is offered `Try audit`, `Install Abando`, or `Open demo`.
3. Visitor clicks audit and enters a benchmark-style scorecard flow.
4. If there is no generated scorecard, the visitor is routed toward Abando install.
5. Visitor clicks pricing and sees Abando monthly plans.
6. Visitor may see a separate ShopiFixer demo page, but it is detached from the main flow.
7. The actual ShopiFixer offer is produced externally through operator-generated offer artifacts.

Current problem:

- value is shown
- proof is hinted at
- the canonical ShopiFixer purchase path is not the primary visible path

## B. Desired Visitor Journey

Target path:

Visitor
-> Problem
-> Trust
-> Proof
-> ShopiFixer Fix Sprint
-> $950 Purchase Decision

What that means in practice:

1. Visitor lands on a merchant-facing page that clearly frames the conversion problem.
2. Visitor sees a specific visible issue, not a generic recovery promise.
3. Visitor sees proof that the issue matters and that the fix is scoped.
4. Visitor sees the canonical ShopiFixer Fix Sprint as the answer.
5. Visitor sees the canonical `$950 flat fee` offer.
6. Visitor has a clear path to purchase without being redirected into Abando by default.

## C. Required Sitemap Changes

The sitemap should be reordered so ShopiFixer is the conversion path for conversion issues.

Required changes:

1. Make `ShopiFixer` a first-class top-level destination.
2. Make `Audit` a ShopiFixer entry point, not only a benchmark demo.
3. Make `Proof` a first-class page or section tied to ShopiFixer proof packages.
4. Keep `Abando` as the recovery product, but not the default first-touch answer for a conversion issue.
5. Keep `Support` and legal pages where they are.
6. Ensure `Pricing` does not act as the primary offer page for ShopiFixer unless it is rewritten to show the canonical $950 Fix Sprint.

Minimum sitemap direction:

- Home
- ShopiFixer
- ShopiFixer Audit
- ShopiFixer Proof
- ShopiFixer Pricing / Purchase
- Abando Recovery
- Support

## D. Required Navigation Changes

Navigation must stop steering the merchant into Abando before they understand ShopiFixer.

Required changes:

1. Add a visible `ShopiFixer` nav item on the public site.
2. Add a visible `Proof` nav item or proof access point.
3. Keep `Abando` nav items, but move them to secondary positioning.
4. Remove the current behavior where the primary nav only presents `Try audit`, `Install Abando`, and `Open demo`.
5. Ensure the primary nav labels match the canonical product language.

Recommended nav priority:

1. ShopiFixer
2. Audit
3. Proof
4. Pricing / Purchase
5. Abando
6. Support

## E. Required CTA Changes

The current CTAs are Abando-first and generic.

Required changes:

1. Replace the main home CTA set with ShopiFixer-first actions.
2. Make the primary CTA `Run ShopiFixer Audit`.
3. Make the secondary CTA `See proof`.
4. Make the tertiary CTA `Get the $950 Fix Sprint`.
5. Keep Abando install as a secondary recovery CTA, not the default action.
6. Remove CTA language that implies the audit itself is the final product.

CTA hierarchy:

1. `Run ShopiFixer Audit`
2. `See proof`
3. `Get the $950 Fix Sprint`
4. `Install Abando` as secondary recovery option

## F. Required Proof Presentation Changes

The merchant needs to see proof before paying.

Required changes:

1. Present a proof package summary on the public ShopiFixer path.
2. Show the proof package elements defined by authority:
   - before evidence
   - implementation summary
   - QA summary
   - after evidence
   - completion report
3. Tie proof to the same issue the merchant is being asked to buy.
4. Stop relying on synthetic example audit output as the main proof story.
5. Surface proof adjacent to the offer, not hidden in operator files.

What proof should say:

- what was found
- why it mattered
- what changed
- what evidence supports the change
- what the merchant should watch next

## G. Required Page Changes

1. Home page
   - Reframe from Abando-first to ShopiFixer-first for conversion issues.
   - Keep Abando recovery as a secondary path.

2. Pricing page
   - Either add a ShopiFixer purchase section or stop using pricing as the first commercial answer for merchants with conversion issues.
   - Current Abando subscription pricing should not be the primary answer for ShopiFixer intent.

3. Audit page
   - Make the audit clearly lead into the canonical ShopiFixer Fix Sprint.
   - Show the `$950 flat fee` offer after the issue is identified.

4. ShopiFixer page
   - Turn the page from a synthetic demo into a proof-backed commercial page.
   - Keep the audit focus.
   - Add the canonical offer and proof package.

5. Install page
   - Keep it as an Abando recovery installation path.
   - Do not let it replace the ShopiFixer purchase path.

6. Offer path
   - Ensure generated merchant offers point back to the canonical ShopiFixer definition and price, not a dynamic value that conflicts with it.

## H. Exact Implementation Sequence

1. Update the public home page copy and CTA hierarchy so ShopiFixer is the first answer for conversion problems.
2. Update navigation so ShopiFixer and proof are first-class, and Abando is secondary.
3. Update the public audit flow so it leads to the canonical ShopiFixer offer instead of defaulting to Abando install.
4. Update the ShopiFixer page so it includes the canonical `$950 Fix Sprint` offer and proof package.
5. Update pricing or purchase presentation so ShopiFixer is visible as a fixed-fee offer.
6. Update proof presentation so the merchant sees before/after evidence and a merchant-ready proof package.
7. Update generated offer presentation so operator-generated merchant offers do not conflict with the canonical commercial definition.
8. Re-check the full visitor path from home -> audit -> proof -> offer -> purchase.

## I. Highest ROI Changes

1. Put `ShopiFixer Fix Sprint` on the home page as the primary conversion answer.
2. Add a visible proof package near the offer.
3. Make the audit flow point to the `$950` fix sprint, not Abando install.
4. Reorder navigation so the merchant sees ShopiFixer before Abando.
5. Make the ShopiFixer page a real commercial page instead of a synthetic demo.

## J. Changes That Should NOT Be Made

1. Do not redesign StaffordOS.
2. Do not redesign the lifecycle.
3. Do not change pricing.
4. Do not invent new products.
5. Do not create new authorities.
6. Do not replace Abando; keep it as the recovery product.
7. Do not add a second pricing model for ShopiFixer.
8. Do not hide proof behind operator-only files.

## Bottom Line

The exact implementation target is not a new system.

It is a reordering of the current public experience so that:

- the merchant sees the problem
- the merchant sees proof
- the merchant sees the canonical ShopiFixer Fix Sprint
- the merchant sees the fixed `$950` price
- the merchant can buy without being diverted into the Abando path

