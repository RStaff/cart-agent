# Exercise 006 Fix Scope

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

Exact Problem / Learning Objective:
Exercise 006 - Cart Inventory

Identify the NoKings cart files that affect trust, totals, and checkout readiness, using only repository-backed source evidence.

Target Page / Template / Artifact:
templates/cart.json
sections/main-cart.liquid
snippets/cart-summary.liquid
snippets/cart-items-component.liquid
snippets/cart-products.liquid
blocks/_cart-title.liquid
blocks/_cart-products.liquid
blocks/_cart-summary.liquid
assets/component-cart-items.js
assets/component-cart-quantity-selector.js

Target Cart Surfaces:
- Full cart template
- Main cart section
- Cart item rendering
- Cart totals
- Quantity updates
- Item removal
- Discounts
- Tax messaging
- Checkout CTA
- Accelerated checkout source path
- Empty-cart state
- Cart drawer relationship where repository truth proves it
- Cart-to-checkout handoff source path
- Related scripts and assets

Proven Target Files:
- `templates/cart.json`
- `sections/main-cart.liquid`
- `snippets/cart-summary.liquid`
- `snippets/cart-items-component.liquid`
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

Unproven Candidate Files / Surfaces:
- Dedicated cart drawer section path: Not Yet Proven
- Full cart drawer Liquid source hierarchy: Not Yet Proven
- Shipping messaging source beyond existing cart summary and tax references: Not Yet Proven
- Runtime tax, duty, or shipping message configuration: Not Yet Proven
- Active cart app blocks: Not Yet Proven
- Cart metafield dependencies: Not Yet Proven
- Cart attribute dependencies: Not Yet Proven
- Live checkout handoff behavior: Not Yet Proven
- Runtime accelerated-checkout availability: Not Yet Proven
- Runtime quick-add to cart drawer behavior: Not Yet Proven
- Runtime cart drawer behavior: Not Yet Proven
- Runtime discount behavior: Not Yet Proven

Smallest Governed Scope:
Perform a read-only engineering inventory of the NoKings cart source architecture. Map how the cart page, cart summary, cart item rendering, quantity updates, item removal, discount/tax surfaces, checkout CTA, accelerated checkout source path, empty-cart state, and drawer-related source references are wired from repository-backed files.

In Scope:
- Identify the cart JSON template hierarchy.
- Identify the main cart section and static cart blocks.
- Identify cart item rendering responsibilities.
- Identify cart summary, totals, discount, note, tax, checkout CTA, and accelerated checkout source responsibilities.
- Identify quantity update and item-removal source responsibilities.
- Identify empty-cart state source responsibilities.
- Identify cart drawer source references only where repository truth proves them.
- Identify cart scripts and assets connected to cart behavior.
- Record full-cart versus cart-drawer boundaries as proven or Not Yet Proven.
- Record trust and checkout-readiness surfaces as source-level findings only.
- Record reusable ShopiFixer cart-analysis patterns.
- Preserve Exercise 004 and Exercise 005 evidence chains.

Out of Scope:
- Shopify mutation.
- Theme file edits.
- Shopify Admin, CLI, API, or storefront execution.
- Storefront runtime testing.
- Checkout testing.
- Payment verification.
- Merchant outcome claims.
- Conversion or revenue claims.
- Before evidence capture.
- Cart inventory execution.
- After evidence capture.
- Mission proof package generation.
- Exercise certification.
- Generic cart-agent-dev pilot changes.
- Abando authority changes.
- Commercial ShopiFixer payment, proof, fulfillment, or completion truth.

Merchant Approval Requirement:
No merchant approval is required for read-only controlled training analysis. Do not infer commercial merchant approval.

Implementation Permitted:
No

Required Before Evidence:
- Exercise-specific baseline at `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/before_evidence.md`
- Mission ID, exercise ID, merchant, canonical store, environment type, authority mode, and active scope path
- Proven theme identity fields only where repository truth proves them
- Target cart template, section, block, snippet, and asset references
- Existing theme-pull and archive references
- Existing hashes only if already proven
- Cart drawer/full-cart distinction marked as proven or Not Yet Proven
- Confirmation no Shopify mutation occurred
- Unknown fields marked Not Yet Proven

Inventory Method:
- Start at `templates/cart.json`.
- Trace the active cart section and static cart blocks.
- Trace `sections/main-cart.liquid`.
- Trace `_cart-title`, `_cart-products`, and `_cart-summary`.
- Trace `cart-products`, `cart-summary`, `cart-items-component`, `cart-bubble`, `quantity-selector`, and `tax-info`.
- Trace connected assets including `component-cart-items.js`, `component-cart-quantity-selector.js`, `cart-drawer.js`, `cart-discount.js`, `cart-note.js`, and `cart-icon.js`.
- Separate full cart page architecture from cart drawer architecture.
- Identify checkout CTA and accelerated-checkout source paths without testing checkout.
- Mark runtime behavior, app-block behavior, metafields, cart attributes, checkout handoff, and drawer behavior as Not Yet Proven unless repository source proves them.

Success Criteria:
- The cart template entry point is identified.
- The main cart section and block hierarchy are mapped.
- Cart item rendering responsibilities are mapped.
- Cart summary and totals responsibilities are mapped.
- Discount, note, tax-info, checkout CTA, and accelerated-checkout source paths are mapped.
- Quantity update and item removal source responsibilities are mapped.
- Empty-cart state source is mapped.
- Cart drawer relationship is classified as proven or Not Yet Proven.
- Runtime behavior gaps remain explicit.
- No Shopify mutation occurs.
- Exercise 004 and Exercise 005 evidence chains remain untouched.
- Commercial cart-agent-dev and Abando truth remain untouched.

Rollback Expectation:
- Shopify rollback is not required because implementation is not permitted.
- Repository rollback remains available through Git for this exercise-specific scope file.
- Future Exercise 006 artifacts must remain exercise-specific so they can be reverted without modifying Exercise 004 or Exercise 005 evidence chains.

Knowledge Capture Requirement:
- Capture reusable ShopiFixer rules for cart architecture mapping.
- Preserve the source-versus-runtime distinction.
- Carry forward Exercise 004 purchase-flow lessons and Exercise 005 template/section/snippet inventory discipline.
- Identify cart and checkout-adjacent risk patterns without authorizing changes.

Source Artifacts:
- `staffordos/implementation/p11_8_exercise_006_cart_inventory_plan_v1.md`
- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md`
- `staffordos/implementation/p10_10_exercise_004_knowledge_consolidation_v1.md`
- `staffordos/audits/no_kings/product_discovery/product_source_inventory_v1.txt`
- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

Governance Confirmation:
- Exercise-specific authority only.
- No mission-root scope payload was modified.
- No before evidence was captured.
- No cart inventory was performed.
- No Shopify mutation was authorized or performed.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.
