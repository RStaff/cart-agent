# StaffordMedia.ai ShopiFixer Alignment Work Package v1

Repository truth basis:

- [ShopiFixer commercial truth authority](./shopifixer_commercial_truth_authority_v1.md)
- [StaffordMedia.ai alignment audit](./staffordmedia_shopifixer_alignment_v1.md)
- [Alignment execution plan](./staffordmedia_shopifixer_alignment_execution_plan_v1.md)

Canonical truth:

- Product: `ShopiFixer Fix Sprint`
- Price: `$950 flat fee`
- Commercial authority: established
- Lifecycle authority: established

This work package converts the approved alignment plan into executable implementation work only. It does not create new products, new pricing, or new authorities.

## Work Items

| Change | Current State | Desired State | File(s) Involved | User Impact | Commercial Impact | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Home page hero and CTA hierarchy | Home page is Abando-branded and offers `Try audit`, `Install Abando`, `Open demo` first. | Home page leads with ShopiFixer as the first answer for conversion issues, with proof and canonical offer visible. | `web/src/public/index.html` | Merchants understand the service being sold before they click away. | Raises ShopiFixer intent and reduces brand confusion. | Phase 1 |
| Home page copy | Home copy frames Abando as the main product and emphasizes checkout recovery. | Home copy frames ShopiFixer Fix Sprint as the primary conversion response; Abando becomes secondary recovery positioning. | `web/src/public/index.html` | Merchants see the correct first-touch promise. | Aligns public message with canonical commercial authority. | Phase 1 |
| Primary navigation | Nav shows `Try audit`, `Install Abando`, `Open demo`. | Nav includes ShopiFixer, Proof, and a ShopiFixer purchase path first; Abando is secondary. | `web/src/public/index.html`, any shared nav component if extracted later | Merchants can find the right path without reconstructing the product model. | Reduces abandonment caused by product confusion. | Phase 1 |
| Public audit route | `/fix` and `/run-audit` behave like benchmark/estimate entry points and hand off to Abando install if no scorecard exists. | Audit becomes the first step in the ShopiFixer commercial path and leads toward the canonical $950 Fix Sprint. | `web/src/routes/runAudit.esm.js`, `web/src/routes/scorecard.esm.js` | Merchants see a concrete issue path instead of a dead-end audit. | Converts audit interest into paid-fix intent. | Phase 1 |
| Public pricing page | Pricing pages show Abando monthly plans. | Pricing or purchase presentation must surface the canonical ShopiFixer Fix Sprint offer and not make Abando monthly pricing the first answer for conversion issues. | `web/src/routes/pricing.esm.js`, `web/src/public/pricing/index.html` | Merchants can see the actual offer they are being asked to buy. | Removes pricing mismatch and improves close rate. | Phase 1 |
| ShopiFixer page | ShopiFixer page is a synthetic demo with a fake example audit result and no canonical checkout path. | ShopiFixer page becomes a proof-backed commercial page with the canonical offer and proof package summary. | `abando-frontend/app/shopifixer/page.tsx` | Merchants see a real service page, not a toy demo. | Increases trust and creates a direct paid path. | Phase 1 |
| Install handoff | `/install/shopify` is an Abando install flow and is currently the fallback destination from audit/scores. | Install remains Abando-only recovery positioning and is no longer the default response for ShopiFixer conversion issues. | `web/src/routes/installShopify.esm.js` | Merchants are not diverted away from the fix sprint. | Keeps recovery product separate from fix-sprint conversion. | Phase 1 |
| Proof presentation on scorecard | Scorecard and audit routes emphasize benchmark data and install. | Proof is surfaced adjacent to the audit and offer, including before/after evidence and a proof package summary. | `web/src/routes/scorecard.esm.js`, `web/src/routes/runAudit.esm.js` | Merchants can verify why the offer is credible. | Proof becomes part of conversion, not a hidden operator artifact. | Phase 1 |
| Offer presentation for the merchant | Offer generation exists externally and produces merchant-facing artifacts that can diverge from canonical authority. | Offer presentation points back to the canonical ShopiFixer definition and keeps the `$950` fixed fee visible and consistent. | `staffordos/clients/generate_shopifixer_offer_v1.mjs`, `staffordos/clients/send_shopifixer_offer_v1.mjs`, `staffordos/clients/shopifixer_offer_latest.json` | Merchant sees one coherent offer. | Removes the dynamic offer mismatch and supports closure. | Phase 2 |
| CTA copy across acquisition flow | Current CTAs emphasize audit, install, and demo. | CTAs emphasize `Run ShopiFixer Audit`, `See proof`, and `Get the $950 Fix Sprint`, with Abando install secondary. | `web/src/public/index.html`, `web/src/routes/runAudit.esm.js`, `abando-frontend/app/shopifixer/page.tsx` | Merchants know what action to take next. | Higher conversion from visitor to paid inquiry. | Phase 1 |
| Proof package summary | Internal proof exists, but the merchant-facing path does not show it. | Public surfaces expose the proof package structure: before evidence, implementation summary, QA summary, after evidence, completion report. | `abando-frontend/app/shopifixer/page.tsx`, `web/src/routes/scorecard.esm.js`, `web/src/routes/runAudit.esm.js` | Merchants get decision-grade trust context. | Proof becomes a sales asset. | Phase 1 |
| ShopiFixer pricing visibility | Canonical $950 exists in authority files, but public pages do not present it cleanly. | The canonical `$950 flat fee` is visible wherever ShopiFixer is presented. | `web/src/routes/pricing.esm.js`, `web/src/routes/runAudit.esm.js`, `abando-frontend/app/shopifixer/page.tsx`, `staffordos/shopifixer/shopifixer_commercial_definition_v1.md` | Merchants understand the actual purchase price. | Eliminates pricing ambiguity. | Phase 1 |

## Detailed Change List

### 1. Home page

- Current state: Abando-first home, Abando logo, Abando recovery framing, Abando-centric CTAs.
- Desired state: ShopiFixer-first for conversion issues, with Abando secondary.
- Files: `web/src/public/index.html`
- User impact: merchant sees the right commercial answer immediately.
- Commercial impact: reduces brand drift and increases ShopiFixer intent.
- Priority: Phase 1

### 2. Navigation

- Current state: nav points to `Try audit`, `Install Abando`, `Open demo`.
- Desired state: nav exposes `ShopiFixer`, `Proof`, and a ShopiFixer purchase path first.
- Files: `web/src/public/index.html`, shared nav files if later extracted.
- User impact: merchant can navigate to the actual offer and proof.
- Commercial impact: reduces drop-off before the offer is understood.
- Priority: Phase 1

### 3. Audit entry

- Current state: audit route is benchmark-based and routes to Abando install when there is no generated scorecard.
- Desired state: audit becomes the ShopiFixer entry point and leads toward the canonical $950 Fix Sprint.
- Files: `web/src/routes/runAudit.esm.js`, `web/src/routes/scorecard.esm.js`
- User impact: merchant gets a problem-to-solution path instead of a dead-end estimate.
- Commercial impact: converts audit intent into paid-fix intent.
- Priority: Phase 1

### 4. Pricing / purchase page

- Current state: public pricing pages show Abando monthly plans.
- Desired state: ShopiFixer purchase presentation is visible and canonical; Abando pricing is secondary.
- Files: `web/src/routes/pricing.esm.js`, `web/src/public/pricing/index.html`
- User impact: merchant sees the correct product-price pairing.
- Commercial impact: removes mismatch between the canonical authority and the public offer page.
- Priority: Phase 1

### 5. ShopiFixer page

- Current state: synthetic audit demo with no real purchase path.
- Desired state: proof-backed commercial page with the canonical offer and proof package.
- Files: `abando-frontend/app/shopifixer/page.tsx`
- User impact: merchant sees a credible commercial page rather than a demo.
- Commercial impact: improves trust and close readiness.
- Priority: Phase 1

### 6. Install handoff

- Current state: Abando install is the fallback from audit and scorecard.
- Desired state: Abando install remains available but does not replace ShopiFixer conversion.
- Files: `web/src/routes/installShopify.esm.js`, `web/src/routes/runAudit.esm.js`, `web/src/routes/scorecard.esm.js`
- User impact: merchant is not pushed into the wrong product.
- Commercial impact: preserves clean product boundaries.
- Priority: Phase 1

### 7. Proof presentation

- Current state: proof is mostly internal or synthetic.
- Desired state: proof package summary is visible on the merchant-facing path.
- Files: `abando-frontend/app/shopifixer/page.tsx`, `web/src/routes/runAudit.esm.js`, `web/src/routes/scorecard.esm.js`
- User impact: merchant can see why the fixed fee is justified.
- Commercial impact: proof supports conversion instead of sitting behind the scenes.
- Priority: Phase 1

### 8. Offer generation and sent offer artifact

- Current state: generated offers can drift from canonical authority and output a dynamic value in `shopifixer_offer_latest.json`.
- Desired state: generated offers and sent offer artifacts remain consistent with the canonical commercial definition.
- Files: `staffordos/clients/generate_shopifixer_offer_v1.mjs`, `staffordos/clients/send_shopifixer_offer_v1.mjs`, `staffordos/clients/shopifixer_offer_latest.json`
- User impact: merchant receives a coherent offer.
- Commercial impact: removes price drift and confusion.
- Priority: Phase 2

### 9. CTA copy across the funnel

- Current state: CTAs are audit/install/demo oriented.
- Desired state: CTAs are ShopiFixer audit, proof, and purchase oriented.
- Files: `web/src/public/index.html`, `web/src/routes/runAudit.esm.js`, `abando-frontend/app/shopifixer/page.tsx`
- User impact: merchant understands what action to take next.
- Commercial impact: stronger conversion from interest to purchase.
- Priority: Phase 1

### 10. Canonical pricing visibility

- Current state: canonical `$950` is defined in authority files but not clearly surfaced everywhere merchants make decisions.
- Desired state: `$950 flat fee` is visible wherever ShopiFixer is presented.
- Files: `staffordos/shopifixer/shopifixer_commercial_definition_v1.md`, `web/src/routes/pricing.esm.js`, `web/src/routes/runAudit.esm.js`, `abando-frontend/app/shopifixer/page.tsx`
- User impact: merchant knows the real price without inference.
- Commercial impact: keeps the site aligned with the commercial authority.
- Priority: Phase 1

## Phase 1
Highest ROI / Lowest Risk

1. Update the home page hero, copy, and CTAs so ShopiFixer is the first answer for conversion issues.
2. Update navigation to expose ShopiFixer and proof before Abando recovery.
3. Update the audit flow so it leads to ShopiFixer instead of defaulting to Abando install.
4. Surface the canonical $950 price on the ShopiFixer path.
5. Add a visible proof package summary to the ShopiFixer page and audit path.

## Phase 2
Medium Effort / High Conversion Gain

1. Rework public pricing presentation so ShopiFixer purchase is visible and Abando pricing is secondary.
2. Bring the synthetic ShopiFixer page into a proof-backed commercial page structure.
3. Align generated merchant offers with the canonical ShopiFixer definition so they do not drift from $950.
4. Clean up operator-generated offer artifacts so they support the same offer language.

## Phase 3
Longer-term Improvements

1. Reconcile the broader public site structure so ShopiFixer and Abando are fully separated at the merchant decision layer.
2. Refine proof presentation into a reusable merchant-ready sales asset across audit, offer, and follow-up.
3. Tighten any shared navigation or page templates only after the new path is proven to convert.

## Notes on What Not to Do

- Do not add new products.
- Do not add new pricing models.
- Do not create new authorities.
- Do not redesign StaffordOS or the lifecycle.
- Do not bury the canonical ShopiFixer offer behind Abando pages.

## Bottom Line

The implementation work is mainly a reordering of the existing public experience:

- make ShopiFixer visible first
- make proof visible next
- keep Abando secondary
- keep the `$950` canonical offer consistent
- keep the merchant on one path from problem to purchase

