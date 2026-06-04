# StaffordMedia.ai ShopiFixer Phase 1 Results

## Files Changed

- `web/src/public/index.html`
- `web/src/public/pricing/index.html`
- `web/src/routes/landing.esm.js`
- `web/src/routes/pricing.esm.js`
- `web/src/routes/runAudit.esm.js`
- `web/src/routes/scorecard.esm.js`
- `abando-frontend/app/shopifixer/page.tsx`

## Pages Updated

- `/`
- `/pricing`
- `/run-audit`
- `/scorecard/:domain`
- `/shopifixer`
- public pricing page

## CTAs Updated

- Primary homepage CTA now points to `Run ShopiFixer Audit`
- Proof CTA now points to `See proof` / `ShopiFixer proof`
- Pricing CTA now points to the canonical ShopiFixer path first
- Run-audit fallback CTA now points to ShopiFixer proof before Abando install
- Scorecard CTA now points to the ShopiFixer proof and `$950 Fix Sprint` before Abando install
- ShopiFixer page CTA now says `Run ShopiFixer Audit`
- Secondary Abando install CTA remains available where appropriate

## Navigation Updates

- Navigation now surfaces `ShopiFixer`, `Audit`, `Proof`, `Pricing`, `Abando`, and `Support`
- Public pricing navigation now leads with ShopiFixer instead of Abando
- Footer and headline branding now lead with ShopiFixer on the updated merchant-facing surfaces

## Proof Surfaced

- Added/updated proof language on the public homepage
- Added a proof section on the ShopiFixer page with before/after evidence language
- Added proof-first decision language on pricing, run-audit, and scorecard pages
- Surfaced the canonical `$950 flat fee` at decision points
- Kept Abando as the downstream install/tracking path rather than the primary offer

## Remaining Work

- Abando-first surfaces still exist in the broader product shell and can still be reached directly
- The install path remains the secondary commercial path and still needs continued routing discipline
- Scorecard and audit flows still contain legacy benchmark/install language that can be tightened further in a later pass
- The Abando-backed pricing plans remain unchanged and should stay secondary until a deeper conversion pass is approved

## Validation

- `node --input-type=module` import check passed for:
  - `web/src/routes/landing.esm.js`
  - `web/src/routes/pricing.esm.js`
  - `web/src/routes/runAudit.esm.js`
  - `web/src/routes/scorecard.esm.js`
- `npm run build -- --webpack` from `abando-frontend/` completed successfully
- Render checks passed for:
  - `/`
  - `/pricing`
  - `/run-audit`
  - `/scorecard/:domain`

## Notes

- The first Next build attempt hit a Turbopack environment error unrelated to the code changes.
- The webpack build path succeeded and produced the route list including `/shopifixer`, `/run-audit`, and `/scorecard/[domain]`.
