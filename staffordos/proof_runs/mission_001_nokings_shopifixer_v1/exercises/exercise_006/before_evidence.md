# Exercise 006 Before Evidence - Cart Source Baseline

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Exercise ID:
exercise_006

Exercise:
Exercise 006 - Cart Inventory

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
Exercise 006 - Cart Inventory source baseline

Issue:
Cart source baseline captured before the governed read-only cart inventory is performed.

Why It Matters:
Exercise 006 must identify the cart files that affect trust, totals, and checkout readiness without inspecting Shopify, modifying Shopify, or claiming runtime behavior.

Screenshot:
Not Captured - no new customer-facing screenshot was authorized for this source baseline.

Notes:
- This is an exercise-specific source baseline for Exercise 006 - Cart Inventory.
- Baseline assumptions: none.
- No Shopify mutation occurred.
- No cart inventory was performed.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.

## Canonical Context

- Mission: Mission 001 - NoKings Shopify Engineering Training
- Exercise: Exercise 006 - Cart Inventory
- Canonical store: no-kings-athletics.myshopify.com
- Storefront URL: https://no-kings-athletics.myshopify.com
- Environment: controlled_training
- Authority: analysis-only
- Payment required: false
- Scope path: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/fix_scope.md`
- Expected inventory artifact: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/execution_notes.md`

## Repository-Backed Objective

Mission 001 defines Exercise 006 as `ex_006_cart_inventory`.

Objective:

- Identify the cart files that affect trust, totals, and checkout readiness.

Validation required:

- Confirm cart summary responsibilities.
- Confirm cart item rendering responsibilities.

Expected lesson:

- Cart behavior is split across template, section, and component assets.

## Proven Cart Source References

Mission 001 and the Exercise 006 scope prove these primary cart targets:

- `templates/cart.json`
- `sections/main-cart.liquid`
- `snippets/cart-summary.liquid`
- `snippets/cart-items-component.liquid`

The Exercise 006 scope and P11.8 planning report also identify these repository-backed cart source references:

- `snippets/cart-products.liquid`
- `snippets/cart-bubble.liquid`
- `snippets/quantity-selector.liquid`
- `snippets/tax-info.liquid`
- `blocks/_cart-title.liquid`
- `blocks/_cart-products.liquid`
- `blocks/_cart-summary.liquid`
- `blocks/quantity.liquid`
- `blocks/accelerated-checkout.liquid`
- `blocks/add-to-cart.liquid`
- `blocks/_inline-text.liquid`
- `assets/component-cart-items.js`
- `assets/component-cart-quantity-selector.js`
- `assets/cart-discount.js`
- `assets/cart-note.js`
- `assets/cart-drawer.js`
- `assets/cart-icon.js`
- `assets/fly-to-cart.js`
- `assets/sticky-add-to-cart.js`
- `assets/header-drawer.js`
- `assets/icon-cart.svg`
- `assets/icon-discount.svg`

## Proven Archived Theme Paths

The NoKings archived theme backup proves the following cart source paths exist:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/cart.json`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/main-cart.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-summary.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-items-component.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-products.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-bubble.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/quantity-selector.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/tax-info.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_cart-title.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_cart-products.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_cart-summary.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/quantity.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/accelerated-checkout.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/add-to-cart.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/component-cart-items.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/component-cart-quantity-selector.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-discount.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-note.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-drawer.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-icon.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/fly-to-cart.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/sticky-add-to-cart.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header-drawer.js`

The older NoKings audit backup also contains a matching cart source set under:

- `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158/`

## Theme Pull References

Repository-backed theme-pull and access references:

- `staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt`
- `staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`
- `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158/`

Theme name:

- Not Yet Proven

Theme ID:

- Not Yet Proven

Theme version:

- Not Yet Proven

## Discovery References

- `staffordos/implementation/p11_8_exercise_006_cart_inventory_plan_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/fix_scope.md`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md`
- `staffordos/implementation/p10_10_exercise_004_knowledge_consolidation_v1.md`
- `staffordos/audits/no_kings/product_discovery/product_source_inventory_v1.txt`
- `staffordos/audits/no_kings/catalog_truth/homepage.html`

## Existing Archived Evidence References

- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/audits/no_kings/evidence/before_evidence_record_v1.md`
- `staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png`
- `staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png`

Existing homepage catalog truth proves a rendered cart drawer surface existed at capture time, including cart drawer and cart item component markup. It does not prove current runtime cart drawer behavior for Exercise 006.

## Source Hashes

- `templates/cart.json`: Not Yet Proven
- `sections/main-cart.liquid`: Not Yet Proven
- `snippets/cart-summary.liquid`: Not Yet Proven
- `snippets/cart-items-component.liquid`: Not Yet Proven
- `assets/component-cart-items.js`: Not Yet Proven
- Additional cart source hashes: Not Yet Proven

## Unknown Fields

- Exact active theme name at Exercise 006 baseline: Not Yet Proven
- Exact theme ID at Exercise 006 baseline: Not Yet Proven
- Exact theme version at Exercise 006 baseline: Not Yet Proven
- Source hashes for cart files: Not Yet Proven
- Dedicated cart drawer section path: Not Yet Proven
- Full cart drawer Liquid source hierarchy: Not Yet Proven
- Shipping messaging source beyond cart summary and tax references: Not Yet Proven
- Runtime tax, duty, or shipping message configuration: Not Yet Proven
- Active cart app blocks: Not Yet Proven
- Cart metafield dependencies: Not Yet Proven
- Cart attribute dependencies: Not Yet Proven
- Live checkout handoff behavior: Not Yet Proven
- Runtime accelerated-checkout availability: Not Yet Proven
- Runtime quick-add to cart drawer behavior: Not Yet Proven
- Runtime cart drawer behavior: Not Yet Proven
- Runtime discount behavior: Not Yet Proven

## Baseline Confirmation

- Baseline assumptions: none.
- Repository-backed source references were captured.
- No inventory findings are claimed in this baseline.
- No storefront improvements are claimed.
- No UX improvements are claimed.
- No conversion improvements are claimed.
- No merchant outcomes are claimed.
- No Shopify mutation occurred.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.
