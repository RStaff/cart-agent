# Exercise 008 Before Evidence - Trust Badge Source Baseline

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Exercise ID:
exercise_008

Exercise:
Exercise 008 - Trust Badge Inventory

Product:
ShopiFixer

Merchant:
NoKings Athletics

Store:
no-kings-athletics.myshopify.com

Environment Type:
controlled_training

Authority Mode:
analysis-only

Payment Required:
false

Affected Page / Artifact:
Exercise 008 - Trust Badge Inventory source baseline

Issue:
Trust badge, payment icon, checkout-readiness, shipping, returns, and CTA reassurance source baseline captured before the governed read-only trust badge inventory is performed.

Why It Matters:
Exercise 008 must identify repository-backed trust and reassurance source surfaces without inspecting live Shopify, modifying Shopify, changing payment authority, or claiming runtime checkout behavior.

Screenshot:
Not Captured - no new customer-facing screenshot was authorized for this source baseline.

Notes:
- This is an exercise-specific source baseline for Exercise 008 - Trust Badge Inventory.
- Baseline assumptions: none.
- No Shopify mutation occurred.
- No trust badge inventory was performed.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.

## Canonical Context

- Mission: Mission 001 - NoKings Shopify Engineering Training
- Exercise: Exercise 008 - Trust Badge Inventory
- Canonical store: no-kings-athletics.myshopify.com
- Storefront URL: https://no-kings-athletics.myshopify.com
- Environment: controlled_training
- Authority: analysis-only
- Payment required: false
- Scope path: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/fix_scope.md`
- Expected inventory artifact: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/execution_notes.md`

## Repository-Backed Objective

Mission 001 defines Exercise 008 as `ex_008_trust_badge_inventory`.

Objective:

- Identify how trust badges and CTA trust styling are implemented.

Canonical Shopify area:

- Trust / CTA

Expected lesson:

- Trust signals must be separated from merchant claims, payment authority, and runtime checkout behavior.

## Theme Pull And Archive References

Repository-backed theme-pull and access references:

- `staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt`
- `staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/README.md`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`
- `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158/`

Repository boundary:

- The archived theme backup is preserved for reference and reviewed here only as repository-backed evidence.
- This baseline does not treat archived theme files as live Shopify truth.

Theme name:

- Not Yet Proven

Theme ID:

- Not Yet Proven

Theme version:

- Not Yet Proven

## Proven Product CTA And Trust Styling Sources

Repository-backed product CTA and trust styling source files:

- `templates/product.json`
- `sections/product-information.liquid`
- `snippets/buy-buttons-styles.liquid`
- `snippets/button.liquid`
- `snippets/add-to-cart-button.liquid`
- `blocks/buy-buttons.liquid`
- `blocks/add-to-cart.liquid`
- `blocks/accelerated-checkout.liquid`
- `blocks/price.liquid`
- `assets/sticky-add-to-cart.js`
- `assets/icon-add-to-cart.svg`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/product.json`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/product-information.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/buy-buttons-styles.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/button.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/add-to-cart-button.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/buy-buttons.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/add-to-cart.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/accelerated-checkout.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/price.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/sticky-add-to-cart.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/icon-add-to-cart.svg`

Repository-backed facts:

- `templates/product.json` includes product purchase blocks, including `buy-buttons`, `add-to-cart`, and `accelerated-checkout` source relationships.
- `snippets/buy-buttons-styles.liquid` provides CTA layout and add-to-cart styling source support.
- `snippets/button.liquid` provides reusable button rendering support.
- `blocks/accelerated-checkout.liquid` provides source support for Shopify payment-button rendering when product and form context are present.
- `blocks/price.liquid` provides source support for payment terms and tax/shipping copy when settings allow it.
- Product template settings reviewed in P11.22 show `show_installments: false` and `show_tax_info: false` in the active product template source; runtime behavior remains Not Yet Proven.

## Proven Product Badge Sources

Repository-backed product badge source files:

- `snippets/product-badges-styles.liquid`
- `blocks/_product-card-gallery.liquid`
- `sections/product-recommendations.liquid`
- `sections/product-hotspots.liquid`
- `sections/product-list.liquid`
- `config/settings_data.json`
- `config/settings_schema.json`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/product-badges-styles.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_product-card-gallery.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/product-recommendations.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/product-hotspots.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/product-list.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_data.json`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_schema.json`

Repository-backed facts:

- `snippets/product-badges-styles.liquid` defines product badge styling.
- `blocks/_product-card-gallery.liquid` provides source support for sold-out and sale badge rendering based on product state.
- `config/settings_data.json` includes badge position, corner radius, sale color scheme, sold-out color scheme, and text-transform settings.
- Product badges are product-state signals, not proof of merchant trust claims or runtime merchandising state.

## Proven Payment Icon Sources

Repository-backed payment icon source files:

- `blocks/payment-icons.liquid`
- `sections/footer.liquid`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/payment-icons.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/footer.liquid`

Repository-backed facts:

- `blocks/payment-icons.liquid` iterates `shop.enabled_payment_types`.
- `blocks/payment-icons.liquid` renders each payment type through `payment_type_svg_tag`.
- `sections/footer.liquid` supports a `payment-icons` block type.

Payment boundary:

- Payment icon source support does not prove which payment methods are enabled at runtime.
- Payment icon display does not prove payment acceptance, checkout state, payment settlement, Stripe truth, merchant payment status, or completion authority.

## Proven Cart Trust And Tax/Shipping Sources

Repository-backed cart trust and checkout-readiness source files:

- `templates/cart.json`
- `sections/main-cart.liquid`
- `blocks/_cart-summary.liquid`
- `snippets/cart-summary.liquid`
- `snippets/tax-info.liquid`
- `blocks/accelerated-checkout.liquid`
- `config/settings_data.json`
- `config/settings_schema.json`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/cart.json`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/main-cart.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_cart-summary.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-summary.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/tax-info.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/accelerated-checkout.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_data.json`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_schema.json`

Repository-backed facts:

- Exercise 006 certified cart checkout-readiness source surfaces in `snippets/cart-summary.liquid`.
- `snippets/cart-summary.liquid` provides source support for subtotal, discount rows, discount-code entry, cart note support, estimated total, installment support, tax/shipping messaging, checkout CTA, and additional checkout button support.
- `snippets/tax-info.liquid` selects tax, duty, and shipping-at-checkout copy based on cart state, shipping-policy state, and discount setting.
- `config/settings_data.json` proves `show_add_discount_code: true` and `cart_type: drawer` in archived settings.

Runtime boundary:

- Runtime tax, duty, shipping, discount, checkout, and accelerated-checkout behavior remain Not Yet Proven.

## Proven Shipping, Returns, Guarantee, And Reassurance Source Support

Repository-backed reassurance support files:

- `blocks/_product-details.liquid`
- `blocks/icon.liquid`
- `blocks/accordion.liquid`
- `blocks/_accordion-row.liquid`
- `blocks/popup-link.liquid`
- `blocks/_inline-text.liquid`
- `sections/section.liquid`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_product-details.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/icon.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/accordion.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_accordion-row.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/popup-link.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_inline-text.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/section.liquid`

Repository-backed facts:

- `blocks/_product-details.liquid` contains default preset groups using `icon: truck` with `t:html_defaults.free_shipping_over` and `icon: return` with `t:html_defaults.free_returns`.
- `blocks/accordion.liquid`, `blocks/_accordion-row.liquid`, and `blocks/popup-link.liquid` provide source support for return-policy and shipping-related content.
- P11.22 records that the active `templates/product.json` reviewed there does not include that default reassurance group in the active product detail block order.

Merchant-claim boundary:

- These source supports do not prove live merchant policies, live return guarantees, live shipping terms, or active product-page reassurance content.

## Proven Schema And Settings References

Repository-backed schema and settings files:

- `config/settings_data.json`
- `config/settings_schema.json`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_data.json`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_schema.json`

Repository-backed settings facts:

- Badge settings exist for badge position, badge corner radius, sale badge color scheme, sold-out badge color scheme, and badge text transform.
- Cart setting support exists for discount-code display and installment display.
- Settings source support does not prove current live runtime state.

## Existing Discovery And Pattern Artifacts

- `staffordos/implementation/p11_22_exercise_008_trust_badge_inventory_plan_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/fix_scope.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/mission_proof_package.md`
- `staffordos/implementation/p10_10_exercise_004_knowledge_consolidation_v1.md`
- `staffordos/shopifixer/patterns/pattern_002_homepage_primary_cta_emphasis_v1.md`
- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/audits/no_kings/evidence/before_evidence_record_v1.md`
- `staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png`
- `staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png`

## Source Hashes

- `snippets/buy-buttons-styles.liquid`: Not Yet Proven
- `blocks/payment-icons.liquid`: Not Yet Proven
- `snippets/product-badges-styles.liquid`: Not Yet Proven
- `snippets/button.liquid`: Not Yet Proven
- `snippets/cart-summary.liquid`: Not Yet Proven
- `snippets/tax-info.liquid`: Not Yet Proven
- Additional trust-related source hashes: Not Yet Proven

## Unknown Fields

- Current active trust badges: Not Yet Proven
- Runtime payment icon set: Not Yet Proven
- Runtime enabled payment methods: Not Yet Proven
- Runtime accelerated-checkout availability: Not Yet Proven
- Runtime installment eligibility: Not Yet Proven
- Runtime Shop Pay or wallet availability: Not Yet Proven
- Runtime tax, duty, or shipping calculation: Not Yet Proven
- Runtime checkout behavior: Not Yet Proven
- Current live shipping assurance copy: Not Yet Proven
- Current live returns or guarantee copy: Not Yet Proven
- Current live guarantee copy: Not Yet Proven
- Active product-page reassurance group: Not Yet Proven
- Active app-provided trust badge content: Not Yet Proven
- Active metafield-driven trust content: Not Yet Proven
- Live merchant policy claims: Not Yet Proven
- Current live footer payment icon rendering: Not Yet Proven
- Current theme name: Not Yet Proven
- Current theme ID: Not Yet Proven
- Current theme version: Not Yet Proven
- Trust-related source hashes: Not Yet Proven

## Rollback Implications

Shopify rollback required:

- No

Reason:

- This source baseline performs no Shopify mutation.

Repository rollback:

- Restore or remove `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/before_evidence.md`.
- Do not alter Exercises 004-007.
- Do not alter mission-root index/deprecation files.

## Baseline Confirmation

- Baseline assumptions: none.
- Repository-backed trust and reassurance source references were captured.
- No trust badge inventory findings are claimed in this baseline.
- No storefront improvements are claimed.
- No UX improvements are claimed.
- No conversion improvements are claimed.
- No merchant outcomes are claimed.
- No runtime payment or checkout behavior is claimed.
- No Shopify mutation occurred.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.
