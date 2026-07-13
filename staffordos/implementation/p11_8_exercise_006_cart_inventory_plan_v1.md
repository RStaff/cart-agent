# P11.8 - Exercise 006 Cart Inventory Planning

## Mission And Exercise Identity

- Mission ID: mission_001
- Mission: Mission 001 - NoKings Shopify Engineering Training
- Exercise ID: exercise_006
- Exercise: Exercise 006 - Cart Inventory
- Product: ShopiFixer
- Merchant: NoKings Athletics
- Canonical store: no-kings-athletics.myshopify.com
- Storefront URL: https://no-kings-athletics.myshopify.com
- Environment type: controlled_training
- Authority mode: analysis-only
- Payment required: false

## Repository Authority Reviewed

- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md`
- `staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md`
- `staffordos/implementation/p10_10_exercise_004_knowledge_consolidation_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/fix_scope.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/before_evidence.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/execution_notes.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/after_evidence.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `SHOPIFIXER_COMPETENCY_ENGINE_V1.md`
- `staffordos/operator_daemon/output/competency_engine_sync_v1.json`
- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/audits/no_kings/product_discovery/product_source_inventory_v1.txt`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

## Canonical Objective

Mission 001 defines Exercise 006 as `ex_006_cart_inventory`.

Objective:

> Identify the cart files that affect trust, totals, and checkout readiness.

Required validation from mission doctrine:

- Confirm cart summary responsibilities.
- Confirm cart item rendering responsibilities.

Expected lesson:

- Cart behavior is split across template, section, and component assets.

Rollback requirement:

- None for Shopify, because the exercise is inventory-only.

## Authority Mode

Exercise 006 is analysis-only unless later governed doctrine explicitly authorizes implementation.

No repository authority reviewed in this planning mission authorizes:

- Shopify mutation
- Theme edits
- Checkout mutation
- Payment flow changes
- Commercial ShopiFixer proof or completion changes
- Abando or cart-agent-dev changes

Exercise 006 should use exercise-specific authority only:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/`

Expected lifecycle artifacts:

- `fix_scope.md`
- `before_evidence.md`
- `execution_notes.md`
- `after_evidence.md`
- `mission_proof_package.md`

These artifacts were not created in this planning mission.

## Proven Target Files

The canonical Mission 001 record identifies these likely cart files:

- `templates/cart.json`
- `sections/main-cart.liquid`
- `snippets/cart-summary.liquid`
- `snippets/cart-items-component.liquid`

The ShopiFixer engineering canon also identifies these cart-related files:

- `templates/cart.json`
- `sections/main-cart.liquid`
- `snippets/cart-summary.liquid`
- `assets/cart-items-component.js`
- `snippets/add-to-cart-button.liquid`
- `snippets/header-drawer.liquid`

The archived NoKings theme backup proves these additional cart-related source files exist:

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

The existing homepage catalog truth proves a rendered cart drawer surface existed at capture time, including:

- `cart-drawer-component`
- `cart-items-component`
- `cart-icon.js`
- `cart-drawer.js`
- `component-cart-items.js`
- `component-cart-quantity-selector.js`
- Empty cart drawer markup
- Cart bubble item-count markup

Runtime drawer behavior remains Not Yet Proven for Exercise 006.

## Target Files Marked Not Yet Proven

The following possible cart surfaces require Exercise 006 source confirmation before they can be treated as authoritative:

- Dedicated cart drawer section path: Not Yet Proven
- Full cart drawer Liquid source hierarchy: Not Yet Proven
- Shipping messaging source beyond existing tax/cart summary references: Not Yet Proven
- Runtime tax, duty, or shipping message configuration: Not Yet Proven
- Active cart app blocks: Not Yet Proven
- Cart metafield dependencies: Not Yet Proven
- Cart attribute dependencies: Not Yet Proven
- Live checkout handoff behavior: Not Yet Proven
- Runtime accelerated-checkout availability: Not Yet Proven
- Runtime quick-add to cart drawer behavior: Not Yet Proven

## Scope

Exercise 006 should inventory the NoKings cart architecture from repository-backed source only.

The work should map:

- Cart JSON template entry point
- Main cart section
- Cart page title block
- Cart product/item block
- Cart summary block
- Cart products snippet
- Cart summary snippet
- Cart item component wrapper
- Quantity selector path
- Item removal path
- Discount and cart note path
- Tax information path
- Checkout CTA source
- Accelerated-checkout source
- Empty-cart state source
- Cart drawer relationship where source is proven
- Cart JavaScript/assets connected to quantity, item updates, discounts, notes, drawer behavior, sticky add-to-cart, and cart icon state

## In Scope

- `templates/cart.json` hierarchy
- `sections/main-cart.liquid` render structure
- `_cart-title`, `_cart-products`, and `_cart-summary` block responsibilities
- `cart-products` item rendering flow
- `cart-summary` totals, discounts, notes, tax info, checkout CTA, and accelerated checkout flow
- `cart-items-component` shared page/drawer wrapper
- Quantity update and remove behavior from source assets
- Empty-cart state and continue-shopping behavior
- Cart drawer source references, only where repository-backed
- Cart-to-checkout source handoff, only as source mapping
- Repository-backed unknowns
- Rollback and mutation implications
- Reusable ShopiFixer cart analysis patterns

## Out Of Scope

- Shopify mutation
- Theme file edits
- Shopify Admin or CLI execution
- Storefront runtime testing
- Checkout testing
- Payment verification
- Merchant outcome claims
- Conversion or revenue claims
- Exercise 006 before evidence capture
- Exercise 006 inventory execution
- Exercise 006 proof package generation
- Exercise 006 certification
- Generic cart-agent-dev pilot changes
- Abando authority changes
- Commercial ShopiFixer payment, proof, fulfillment, or completion truth

## Required Before Evidence Baseline

The Exercise 006 baseline should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/before_evidence.md`

The baseline should include:

- Mission ID
- Exercise ID and name
- Merchant
- Canonical store
- Environment type
- Analysis-only authority
- Active exercise-specific scope path
- Theme name, ID, and version if proven
- Theme pull/access references if proven
- Cart template target
- Cart section target
- Cart block targets
- Cart snippet targets
- Cart asset targets
- Existing source references
- Existing hashes only if already proven
- Cart drawer/full-cart distinction
- Rollback implications
- Confirmation no Shopify mutation occurred
- Unknown fields marked Not Yet Proven

Required baseline rule:

- Do not claim screenshots, runtime behavior, source hashes, theme identity, cart drawer behavior, or checkout behavior unless repository truth proves them.

## Required Inventory Artifact

The Exercise 006 inventory should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/execution_notes.md`

The inventory should document:

- Architecture map
- File dependency tree
- JSON template hierarchy
- Liquid render hierarchy
- Block hierarchy
- Snippet hierarchy
- JavaScript asset responsibilities
- Cart item rendering flow
- Cart summary/totals flow
- Discount flow
- Tax information flow
- Quantity update flow
- Item removal flow
- Empty-cart flow
- Checkout CTA path
- Accelerated-checkout source path
- Cart drawer relationship where proven
- CTA locations
- Trust and checkout-readiness surfaces
- Engineering observations
- Risks
- Reusable ShopiFixer patterns
- Unknowns

## Required After Evidence Artifact

The Exercise 006 after-evidence artifact should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/after_evidence.md`

It should certify the analysis outcome only. It must not claim:

- Storefront changes
- UX improvements
- Conversion improvements
- Merchant outcomes
- Runtime behavior
- Payment
- Production deployment

## Required Proof And Certification Artifacts

The Exercise 006 proof package should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/mission_proof_package.md`

Expected certification memo path:

`staffordos/implementation/p11_11_mission_001_exercise_006_certification_v1.md`

The exact certification mission number may be adjusted by later planning, but the certification must remain exercise-specific and must not close all of Mission 001 unless canonical curriculum proves Exercise 006 is the final exercise.

## Inventory Method

Exercise 006 should use this sequence:

1. Start at `templates/cart.json`.
2. Identify the active cart section and static blocks.
3. Trace `sections/main-cart.liquid`.
4. Trace `_cart-title`, `_cart-products`, and `_cart-summary`.
5. Trace `cart-products`, `cart-summary`, `cart-items-component`, `cart-bubble`, `quantity-selector`, and `tax-info`.
6. Trace connected assets including `component-cart-items.js`, `component-cart-quantity-selector.js`, `cart-drawer.js`, `cart-discount.js`, `cart-note.js`, and `cart-icon.js`.
7. Separate full cart page architecture from cart drawer architecture.
8. Identify checkout CTA and accelerated-checkout source paths without testing checkout.
9. Record all runtime, app-block, metafield, and cart-attribute behavior as Not Yet Proven unless source evidence proves it.
10. Capture reusable ShopiFixer rules for cart inventory.

## Success Criteria

Exercise 006 scope can be considered successful when the governed inventory proves:

- The cart template entry point is identified.
- The main cart section and block hierarchy are mapped.
- Cart item rendering responsibilities are mapped.
- Cart summary/totals responsibilities are mapped.
- Discount, note, tax-info, checkout CTA, and accelerated-checkout source paths are mapped.
- Quantity update and item removal source responsibilities are mapped.
- Empty-cart state source is mapped.
- Cart drawer relationship is classified as proven or Not Yet Proven.
- Runtime behavior gaps remain explicit.
- No Shopify mutation occurred.
- Exercise 004 and Exercise 005 evidence chains remain untouched.
- Commercial cart-agent-dev and Abando truth remain untouched.

## Rollback Expectations

Shopify rollback:

- Not required for Exercise 006 planning or inventory if analysis-only authority is preserved.

Repository rollback:

- Planning artifact rollback remains available through Git history.
- Future Exercise 006 artifacts must remain exercise-specific so they can be reverted without modifying Exercise 004 or Exercise 005 evidence chains.

## Knowledge Carry-Forward

From Exercise 004:

- Begin at the JSON template entry point.
- Trace section, block, snippet, and asset dependencies before making any claim about behavior.
- Keep runtime behavior separate from source-level architecture.
- Do not infer merchant or conversion outcomes from source analysis.

From Exercise 005:

- Preserve exercise-specific evidence authority.
- Distinguish template architecture from rendered/storefront behavior.
- Treat app blocks, runtime filters, and runtime cards as Not Yet Proven unless repository truth proves them.
- Capture reusable rules as engineering knowledge rather than storefront outcome claims.

For Exercise 006, the cart-specific carry-forward is:

- Cart architecture is checkout-adjacent and requires stricter authority discipline than collection inventory.
- Checkout readiness must be mapped from source, not tested or claimed.
- Drawer, full cart, summary, item updates, and checkout CTA paths must be separated.

## Risks And Unknowns

- Theme name: Not Yet Proven in the current planning artifact.
- Theme ID: Not Yet Proven in the current planning artifact.
- Theme version: Not Yet Proven in the current planning artifact.
- Source hashes: Not Yet Proven in the current planning artifact.
- Cart drawer versus full cart source boundary: Partially Proven, requires Exercise 006 inventory.
- Runtime cart drawer behavior: Not Yet Proven.
- Runtime checkout handoff behavior: Not Yet Proven.
- Runtime accelerated-checkout availability: Not Yet Proven.
- Runtime discount behavior: Not Yet Proven.
- Shipping and tax messaging behavior: Not Yet Proven.
- Active app blocks: Not Yet Proven.
- Metafield dependencies: Not Yet Proven.
- Cart attribute dependencies: Not Yet Proven.
- Checkout readiness authority: Source-only until a later governed runtime or implementation mission authorizes more.

## Expected Readiness Transitions

Current readiness before this planning report:

- Status: CONDITIONAL_GO
- Current phase: exercise_006_planning
- Current blocker: Exercise 006 Planning Missing
- Next safe action: Plan Exercise 006 - Cart Inventory
- Payment required: false
- Completion permitted: false

Expected next governed transition after this planning report is reviewed:

- Current phase: exercise_006_scope
- Current blocker: Exercise 006 Scope Missing
- Next safe action: Establish governed Exercise 006 scope
- Payment required: false
- Completion permitted: false

Expected lifecycle after future governed artifacts:

1. Exercise 006 planning
2. Exercise 006 scope
3. Exercise 006 before evidence
4. Exercise 006 cart inventory
5. Exercise 006 after evidence
6. Exercise 006 proof package
7. Exercise 006 certification
8. Next canonical Mission 001 continuation phase

## Recommended First Implementation Mission

Recommended next mission:

`P11.9_NOKINGS_EXERCISE_006_SCOPE`

Purpose:

- Create the exercise-specific governed scope only.

Canonical scope target:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/fix_scope.md`

Constraints:

- Do not inspect Shopify.
- Do not mutate Shopify.
- Do not create before evidence yet.
- Do not perform the inventory yet.
- Do not alter Exercise 004 or Exercise 005 artifacts.
- Do not alter Abando, cart-agent-dev, payment, completion, or commercial proof truth.

## Planning Decision

GO for starting Exercise 006 scope.

Justification:

- Mission 001 explicitly defines Exercise 006 as Cart Inventory.
- Exercise 005 certification identifies Exercise 006 planning as the next canonical continuation.
- Current readiness output identifies Exercise 006 planning as the active blocker.
- Repository truth proves enough cart source targets to scope the exercise.
- Remaining runtime and source-identity gaps are known and can be carried into scope and before evidence without authorizing mutation.
- Payment remains not required.
- No Shopify mutation is authorized.
