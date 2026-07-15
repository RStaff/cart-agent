# Exercise 008 Fix Scope - Trust Badge Inventory

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Product:
ShopiFixer

Exercise ID:
exercise_008

Exercise:
Exercise 008 - Trust Badge Inventory

Merchant:
NoKings Athletics

Environment Type:
controlled_training

Store:
no-kings-athletics.myshopify.com

Authority Mode:
analysis-only

Payment Required:
false

Scope Authority:
Exercise-specific

Active Scope Path:
staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/fix_scope.md

Exact Problem / Learning Objective:
Exercise 008 - Trust Badge Inventory

Identify how NoKings trust badges, payment icons, checkout-readiness messaging, and CTA trust styling are implemented from repository-backed Shopify theme source without inspecting live Shopify or performing a mutation.

Target Page / Template / Artifact:
Exercise 008 - Trust Badge Inventory; snippets/buy-buttons-styles.liquid; blocks/payment-icons.liquid; snippets/product-badges-styles.liquid; snippets/button.liquid

Smallest Governed Scope:
Create a read-only source inventory of trust-badge and CTA trust architecture using only Exercise 008 authority and existing repository-backed NoKings evidence.

## Proven Repository Targets

Product page and purchase CTA:

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

Product badges and product-card trust signals:

- `snippets/product-badges-styles.liquid`
- `blocks/_product-card-gallery.liquid`
- `sections/product-recommendations.liquid`
- `sections/product-hotspots.liquid`
- `sections/product-list.liquid`
- `config/settings_data.json`
- `config/settings_schema.json`

Payment icon surfaces:

- `blocks/payment-icons.liquid`
- `sections/footer.liquid`

Cart trust and checkout-readiness messaging:

- `templates/cart.json`
- `sections/main-cart.liquid`
- `blocks/_cart-summary.liquid`
- `snippets/cart-summary.liquid`
- `snippets/tax-info.liquid`
- `blocks/accelerated-checkout.liquid`
- `config/settings_data.json`
- `config/settings_schema.json`

Product reassurance, shipping, returns, and guarantee source support:

- `blocks/_product-details.liquid`
- `blocks/icon.liquid`
- `blocks/accordion.liquid`
- `blocks/_accordion-row.liquid`
- `blocks/popup-link.liquid`
- `blocks/_inline-text.liquid`
- `sections/section.liquid`

## In Scope

- Product trust badge source inventory
- Product-card sale and sold-out badge source inventory
- Buy-button trust styling and CTA reassurance source inventory
- Add-to-cart and accelerated-checkout source relationship mapping
- Product reassurance block support inventory
- Payment icon source inventory
- Footer payment-icon block support inventory
- Cart checkout-readiness messaging source inventory
- Tax, duty, and shipping-at-checkout copy source inventory
- Shipping and returns reassurance source-support inventory
- Theme settings and schema dependency inventory for badges, buttons, cart, and payment icons
- Trust signal versus merchant claim classification
- Payment icon display versus payment authority classification
- Source support versus runtime checkout behavior classification
- App-block and metafield unknown capture
- Repository-backed risk and rollback implication capture
- Reusable ShopiFixer trust-surface knowledge capture

## Out of Scope

- Shopify mutation
- Theme file edits
- Shopify Admin, CLI, API, or storefront execution
- Live Shopify inspection
- Runtime storefront testing
- Payment provider testing
- Checkout testing
- Stripe or Shopify payment truth changes
- Merchant policy edits
- Trust badge, copy, payment icon, or CTA implementation
- App installation or configuration
- Metafield writes
- Before evidence capture in this scope mission
- Trust badge inventory execution in this scope mission
- After evidence capture
- Proof package generation
- Certification
- Generic `cart-agent-dev` commercial pilot changes
- Abando authority changes
- Payment, fulfillment, commercial proof, or completion truth changes

## Merchant Approval Requirement

No merchant approval is claimed.

Reason:

- This is a controlled-training, analysis-only exercise.
- No Shopify mutation or merchant-facing change is authorized.

## Implementation Permitted

No.

Exercise 008 authorizes repository-backed analysis only. Reversible implementation is Not Yet Governed for this exercise.

## Required Before Evidence

The next governed artifact is:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/before_evidence.md`

Required baseline content:

- Mission ID and Exercise ID
- Merchant and canonical store
- Analysis-only authority
- Active Exercise 008 scope path
- Archived theme-pull reference
- Proven trust-related source references
- Proven product CTA and product badge source paths
- Proven payment-icon source path
- Proven cart trust and tax/shipping source paths
- Candidate targets marked Not Yet Proven
- Unknown fields explicitly marked Not Yet Proven
- Confirmation no Shopify mutation occurred

The baseline must not claim runtime payment behavior, checkout behavior, active merchant policy truth, active app-block behavior, screenshots, source hashes, theme identity, conversion outcomes, or merchant outcomes unless repository truth proves them.

## Inventory Method

The future inventory must:

- Read only the Exercise 008 scope and baseline.
- Use archived NoKings theme source and prior certified exercise knowledge.
- Trace source dependencies from JSON templates and sections into blocks, snippets, assets, settings, and schema.
- Separate proven source support from runtime storefront behavior.
- Separate trust signals from merchant claims.
- Separate payment icon display from payment authority.
- Separate checkout source support from checkout platform behavior.
- Record unknowns as Not Yet Proven.

## Success Criteria

- Exercise 008 scope remains exercise-specific.
- Scope references only repository-backed proven targets.
- Not Yet Proven targets remain explicit.
- No mission-root payload file is used as active authority.
- No Shopify mutation occurs.
- No payment, completion, Abando, commercial pilot, or prior-exercise truth changes occur.
- The next governed phase becomes Before Evidence.
- The next safe action becomes Capture Before Evidence.

## Rollback Expectation

Shopify rollback required:

- No

Reason:

- This scope authorizes no Shopify mutation.

Repository rollback:

- Restore or remove `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/fix_scope.md`.
- Do not alter Exercises 004-007.
- Do not alter mission-root index/deprecation files.

## Knowledge-Capture Requirement

Exercise 008 must produce reusable ShopiFixer knowledge about:

- trust-surface taxonomy
- product CTA trust source mapping
- product badge source mapping
- payment icon source mapping
- cart trust and tax/shipping copy source mapping
- theme settings that influence visual trust signals
- merchant-claim boundaries
- payment-authority boundaries
- checkout-runtime boundaries
- app-block and metafield unknowns

## Not Yet Proven Targets

- `snippets/payment-icons.liquid`: Not Yet Proven
- Active product-page trust-badge content: Not Yet Proven
- Active cart trust/reassurance copy beyond source support: Not Yet Proven
- Runtime payment icon set: Not Yet Proven
- Runtime enabled payment methods: Not Yet Proven
- Runtime accelerated-checkout availability: Not Yet Proven
- Runtime installment eligibility: Not Yet Proven
- Runtime Shop Pay or wallet availability: Not Yet Proven
- Runtime tax, duty, or shipping calculation: Not Yet Proven
- Runtime checkout behavior: Not Yet Proven
- Current live shipping assurance copy: Not Yet Proven
- Current live returns or guarantee copy: Not Yet Proven
- Active product-page reassurance group: Not Yet Proven
- Active app-provided trust badge blocks: Not Yet Proven
- Active metafield-driven trust content: Not Yet Proven
- Active policy-page source truth: Not Yet Proven
- Current live footer payment icon rendering: Not Yet Proven
- Current theme name: Not Yet Proven
- Current theme ID: Not Yet Proven
- Current theme version: Not Yet Proven
- Source hashes for trust-related files: Not Yet Proven

## Source Artifacts

- `staffordos/implementation/p11_22_exercise_008_trust_badge_inventory_plan_v1.md`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `SHOPIFIXER_COMPETENCY_ENGINE_V1.md`
- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/mission_proof_package.md`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`
- `staffordos/shopifixer/patterns/pattern_002_homepage_primary_cta_emphasis_v1.md`

## Final Scope Decision

GO.

Repository-backed justification:

- Exercise 008 is canonical in Mission 001.
- Exercise 007 is certified and Mission 001 remains active.
- The current readiness output identifies Exercise 008 planning as the next blocker.
- The P11.22 planning artifact defines enough repository-backed targets to scope Exercise 008.
- Exercise 008 is analysis-only.
- No Shopify mutation, payment, completion, Abando, commercial pilot, or prior-exercise change is authorized.
