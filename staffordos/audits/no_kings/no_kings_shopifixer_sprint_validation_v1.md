# No Kings ShopiFixer Sprint Validation V1

## Store

No Kings Athletics

## Selected Sprint Issue

Homepage product discovery and value clarity.

## Evidence Reviewed

- `staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png`
- `staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png`
- `staffordos/audits/no_kings/evidence/annotated/homepage_before_annotation_v1.md`
- `staffordos/audits/no_kings/no_kings_scorecard_completion_v1.md`
- `staffordos/shopifixer/shopifixer_commercial_definition_v1.md`

## Execution Decision

GO, with a tight scope.

This sprint can be honestly executed if it stays focused on one visible homepage conversion issue: the first commercial decision point does not clearly show what to buy, why it is valuable, and why the visitor should trust the path forward.

This is not a full homepage redesign. The brand hero, navigation, visual identity, and store structure should remain intact.

## Current Implementation Opportunity

The before evidence shows a strong brand-first homepage, but the early buying path is weak.

Observed implementation opportunities:

- The first impression is dominated by the brand hero and slogan.
- The primary hero CTA, "ENTER THE FORGE", is brand-aligned but not product-specific.
- The first visible product area is not strong enough to carry the sale.
- The desktop before evidence shows an early product card for `No Kings Athletics AirL Fabric Tee` with weak visual proof and a `$0.00` price at capture time.
- The mobile before evidence delays clear product value and purchase confidence until after the hero.
- Later product sections include generic-looking product cards, which weakens buying confidence if they remain visible to a first-time visitor.
- Trust signals exist lower on the page, but they do not support the first product decision early enough.

No checked-in No Kings Shopify theme files were found in this repo. The required implementation appears to be Shopify theme/admin work, not a local repository code change.

## Proposed After State

The after state should preserve the existing brand world and add a clearer commerce block immediately after the hero.

The first homepage scroll should answer:

- What is being sold?
- Why should this visitor care?
- What should they click first?
- Can they trust the buying path?

Recommended section:

`Built for the work. Ready to wear.`

Section placement:

- Desktop: directly below the existing hero, before brand philosophy blocks.
- Mobile: directly below the hero, before `WORK / HONOR / LEGACY`.

Recommended content:

- Feature the primary product or primary collection.
- Use a real product image.
- Show the correct product name.
- Show the correct price.
- Add a direct CTA to the product or collection.
- Add short value copy that explains the product, not just the brand.
- Add only verified trust signals.

Suggested copy direction:

Heading:

`Training gear for the standard you keep.`

Supporting line:

`Start with the AirL Fabric Tee: lightweight daily training gear built around work, honor, and legacy.`

CTA:

`Shop the AirL Fabric Tee`

Secondary CTA:

`View all gear`

Verified trust line:

`Secure checkout. Store support available.`

Do not claim fast shipping, guaranteed returns, performance lift, local manufacturing, premium fabric specs, or customer reviews unless those facts are verified in Shopify settings, product content, policy pages, or merchant-provided proof.

## A. Exact Implementation Plan

1. Preserve the current header, navigation, hero image, slogan, and brand CTA.
2. In the Shopify theme editor, inspect the homepage section order.
3. Identify the section currently producing the early `Products` block.
4. Replace that weak block, or reconfigure it, into one intentional product value section directly below the hero.
5. Select the primary product or collection for the sprint.
6. Confirm the product has a real image, correct title, correct price, and working product URL.
7. Write product-value copy that explains the product in one sentence.
8. Add one primary product CTA and one secondary collection CTA.
9. Add a compact verified trust row below the product CTA.
10. Move brand philosophy blocks below the product decision block.
11. Hide or correct any generic placeholder product cards near the conversion path.
12. Preview the homepage on desktop and mobile.
13. Test that the CTA opens the correct product or collection.
14. Test that the product path can proceed toward cart or checkout.
15. Capture after screenshots that match the before evidence dimensions and page targets.
16. Package before evidence, after evidence, implementation summary, and QA results for the merchant.

## B. Required Shopify Theme Changes

Required changes are limited to the homepage template and configured product content.

Likely Shopify changes:

- Update homepage section order in the theme editor or `templates/index.json`.
- Configure an existing featured product, featured collection, image-with-text, or custom liquid section directly below the hero.
- Bind the section to the real primary product or primary collection.
- Replace placeholder or generic product content with merchant-approved product content.
- Add short product value copy.
- Add verified trust microcopy near the product CTA.
- Ensure product card image, price, title, and link are real.
- Ensure mobile layout keeps the product decision block visible before the brand philosophy content.

Out of scope:

- Full theme redesign.
- New brand identity.
- New product photography production.
- New checkout customization.
- SEO campaign.
- Ad campaign.
- Catalog-wide merchandising project.
- Conversion guarantee.

## C. Before vs After Comparison

### Before

- Visitor sees the brand world before seeing a clear buying path.
- Product discovery is delayed.
- The first product area does not yet prove value strongly enough.
- The captured early product state includes weak product presentation and `$0.00` pricing.
- Trust support appears too late to help the first product decision.
- Mobile requires too much scrolling before the product offer becomes clear.

### After

- Visitor still sees the No Kings brand identity first.
- Immediately after the hero, the visitor sees the primary product or collection.
- Product name, image, price, value proposition, and CTA are visible earlier.
- The first buying path is explicit.
- Trust support appears near the buying decision.
- Mobile visitors can understand what to buy and why before the page becomes mostly brand story.

### Proof Standard

The before/after proof must show a visible change in homepage product clarity and buying path. It does not need to prove revenue lift.

Acceptable proof:

- Before screenshot shows delayed or weak product discovery.
- After screenshot shows the product decision block near the top.
- Before screenshot shows unclear product value.
- After screenshot shows a product-specific value statement.
- Before screenshot shows weak purchase confidence near the decision point.
- After screenshot shows verified trust support near the CTA.

Unacceptable proof:

- A written claim that conversion improved without analytics.
- A claim that the store will generate more sales.
- A generic "homepage improved" statement without before/after screenshots.
- A full redesign presented as the selected sprint.

## D. QA Checklist

- Desktop homepage loads without layout break.
- Mobile homepage loads without layout break.
- Existing header navigation remains intact.
- Existing hero remains intact.
- Product decision block appears directly below the hero.
- Product image is real.
- Product title is real.
- Product price is correct.
- No `$0.00` price appears unless the product is intentionally free.
- No generic `Product title` placeholders appear in the early buying path.
- Primary CTA opens the intended product or collection.
- Secondary CTA opens the intended collection or catalog path.
- Product page can proceed toward cart or checkout.
- Trust statements are verified.
- No unsupported guarantee, shipping, return, review, or performance claims are added.
- Desktop after screenshot captured.
- Mobile after screenshot captured.
- Merchant proof package assembled.

## E. Proof Package Contents

Required proof package:

- Before desktop screenshot: `staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png`
- Before mobile screenshot: `staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png`
- Scorecard: `staffordos/audits/no_kings/no_kings_scorecard_completion_v1.md`
- Sprint validation: `staffordos/audits/no_kings/no_kings_shopifixer_sprint_validation_v1.md`
- Implementation summary.
- List of homepage sections changed.
- Final copy used in the product value section.
- QA checklist with pass/fail status.
- After desktop screenshot.
- After mobile screenshot.
- Before vs after comparison summary.
- Completion note stating what was not claimed.

Recommended after evidence paths:

- `staffordos/audits/no_kings/evidence/after/homepage_desktop_after.png`
- `staffordos/audits/no_kings/evidence/after/homepage_mobile_after.png`

Recommended proof package output:

- `staffordos/audits/no_kings/proof_package/no_kings_shopifixer_sprint_completion_v1.md`

## Can This Honestly Justify $950?

Yes, conditionally.

This sprint can justify a $950 fixed fee if ShopiFixer delivers the full commercial package:

- one visible issue
- one scoped homepage fix
- real product content
- implementation in Shopify
- QA validation
- before/after screenshots
- merchant-readable proof package

The value is not "we changed a section." The value is that a merchant can see a specific conversion obstacle, approve a focused fix, receive the implemented improvement, and walk away with proof that the first product decision is clearer.

This cannot justify $950 if the work stops at recommendations only, if the product still shows placeholder content, or if the proof package is not produced.

## Merchant-Grade Recommendation

Proceed with this ShopiFixer sprint as the No Kings validation sprint.

The offer should be framed as:

`We will improve the first homepage buying path by making the primary product, value, CTA, and trust support clear earlier on desktop and mobile.`

Expected merchant outcome:

- A first-time visitor understands what No Kings sells sooner.
- The primary buying path is easier to choose.
- The homepage still feels like No Kings.
- The merchant receives visible before/after proof.

Do not sell this as guaranteed sales growth. Sell it as a focused, implemented, proof-backed homepage conversion improvement.

## Final Readiness

Sprint execution readiness:

CONDITIONAL GO.

Conditions before execution:

- Shopify theme access is available.
- The primary product or collection is selected.
- Product image, price, and product link are correct.
- Trust claims are verified.
- After screenshots can be captured.

If those conditions are met, this is a valid $950 ShopiFixer Fix Sprint.
