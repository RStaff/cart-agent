# P11.22 - Exercise 008 Trust Badge Inventory Planning

## Mission And Exercise Identity

- Mission ID: `mission_001`
- Mission: `Mission 001 - NoKings Shopify Engineering Training`
- Exercise ID: `ex_008_trust_badge_inventory`
- Exercise: `Exercise 008 - Trust Badge Inventory`
- Product: `ShopiFixer`
- Merchant: `NoKings Athletics`
- Canonical store: `no-kings-athletics.myshopify.com`
- Storefront URL: `https://no-kings-athletics.myshopify.com`
- Environment type: `controlled_training`
- Authority mode: `analysis-only`
- Payment required: `false`

## Repository Authority Reviewed

- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `SHOPIFIXER_COMPETENCY_ENGINE_V1.md`
- `staffordos/operator_daemon/output/competency_engine_sync_v1.json`
- `staffordos/implementation/p10_10_exercise_004_knowledge_consolidation_v1.md`
- `staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md`
- `staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md`
- `staffordos/implementation/p11_14_mission_001_exercise_006_certification_v1.md`
- `staffordos/implementation/p11_21_mission_001_exercise_007_certification_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/mission_proof_package.md`
- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`
- `staffordos/shopifixer/patterns/pattern_002_homepage_primary_cta_emphasis_v1.md`

## Current Readiness

- Status: `CONDITIONAL_GO`
- Current phase: `exercise_008_planning`
- Current blocker: `Exercise 008 Planning Missing`
- Next safe action: `Plan Exercise 008 - Trust Badge Inventory`
- Payment required: `false`
- Completion permitted: `false`
- Prior exercise state: Exercise 007 is certified and Mission 001 remains active.

This planning report resolves planning intent only. It does not create Exercise 008 scope, baseline evidence, inventory notes, after evidence, proof package, certification, or readiness-output changes.

## Canonical Objective

Mission 001 defines Exercise 008 as `ex_008_trust_badge_inventory`.

Canonical objective:

- Identify how trust badges and CTA trust styling are implemented.

Canonical Shopify area:

- Trust / CTA

Mission 001 likely files:

- `snippets/buy-buttons-styles.liquid`
- `snippets/payment-icons.liquid`
- `snippets/product-badges-styles.liquid`
- `snippets/button.liquid`

Repository clarification:

- The archived NoKings source proves `blocks/payment-icons.liquid`, not `snippets/payment-icons.liquid`.
- Therefore `blocks/payment-icons.liquid` is a proven NoKings target.
- `snippets/payment-icons.liquid` remains Not Yet Proven for NoKings until future source evidence proves it exists.

## Authority Mode

Exercise 008 is analysis-only unless later governed doctrine explicitly authorizes implementation.

No repository authority reviewed in this planning mission authorizes:

- Shopify mutation
- Theme file edits
- Shopify Admin, CLI, API, or storefront execution
- Runtime storefront inspection
- Payment configuration changes
- Checkout behavior changes
- Merchant claim changes
- Trust-badge implementation
- App configuration changes
- Payment, fulfillment, commercial proof, or completion changes
- Abando or generic `cart-agent-dev` changes

## Exercise-Specific Authority Path

Exercise 008 should use exercise-specific authority only:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/`

Expected lifecycle artifacts:

- `fix_scope.md`
- `before_evidence.md`
- `execution_notes.md`
- `after_evidence.md`
- `mission_proof_package.md`

These artifacts are not created in this planning mission.

## Repository-Proven Candidate Targets

The governed scope should list only repository-proven targets as proven and keep uncertain paths explicit.

### Product Page And Purchase CTA

Proven source paths:

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

Repository-backed facts:

- `templates/product.json` contains the active product entry point and a `buy-buttons` block.
- The active product template includes static `quantity`, `add-to-cart`, and `accelerated-checkout` blocks under `buy_buttons_eYQEYi`.
- `blocks/buy-buttons.liquid` renders purchase controls and includes pickup-availability source support.
- `blocks/accelerated-checkout.liquid` renders `form_obj | payment_button` when product and form context are present.
- `snippets/buy-buttons-styles.liquid` controls CTA layout, add-to-cart styling, quantity rules, pickup-availability styling, and button dimensions.
- `blocks/price.liquid` can render tax/shipping copy and payment terms when block settings enable them.
- The active product template has `show_installments: false` and `show_tax_info: false` for product price blocks.

### Product Badges And Product Card Trust Signals

Proven source paths:

- `snippets/product-badges-styles.liquid`
- `blocks/_product-card-gallery.liquid`
- `sections/product-recommendations.liquid`
- `sections/product-hotspots.liquid`
- `sections/product-list.liquid`
- `config/settings_data.json`
- `config/settings_schema.json`

Repository-backed facts:

- `snippets/product-badges-styles.liquid` defines `.product-badges` and `.product-badges__badge` styling.
- `blocks/_product-card-gallery.liquid` renders sold-out and sale badges based on product availability and compare-at price.
- `config/settings_data.json` proves badge settings for position, corner radius, sale color scheme, sold-out color scheme, and text transform.
- The badge architecture is a product state signal, not proof of merchant trust claims or runtime storefront behavior.

### Payment Icons And Footer Trust Surface

Proven source paths:

- `blocks/payment-icons.liquid`
- `sections/footer.liquid`

Repository-backed facts:

- `blocks/payment-icons.liquid` iterates `shop.enabled_payment_types`.
- It renders each type through `payment_type_svg_tag`.
- It includes an accessibility label from `blocks.payment_methods`.
- `sections/footer.liquid` supports a `payment-icons` block type.

Important boundary:

- Payment icon source support does not prove which payment methods are currently enabled at runtime.
- Payment icon display does not prove payment acceptance, checkout state, payment settlement, Stripe truth, or merchant payment status.

### Cart Trust And Checkout-Readiness Messaging

Proven source paths:

- `blocks/_cart-summary.liquid`
- `snippets/cart-summary.liquid`
- `snippets/tax-info.liquid`
- `blocks/accelerated-checkout.liquid`
- `templates/cart.json`
- `sections/main-cart.liquid`
- `config/settings_data.json`
- `config/settings_schema.json`

Repository-backed facts:

- Exercise 006 certified that cart checkout-readiness surfaces cluster in `snippets/cart-summary.liquid`.
- `snippets/cart-summary.liquid` owns subtotal, discount rows, discount-code entry support, cart note support, estimated total, installment source support, tax/shipping messaging, checkout CTA, and additional checkout button source support.
- `snippets/tax-info.liquid` selects tax, duty, and shipping-at-checkout copy from cart state, shipping-policy state, and discount-code setting.
- `config/settings_data.json` proves `show_add_discount_code: true` and `cart_type: drawer`.
- Runtime tax, duty, shipping, discount, checkout, and accelerated-checkout behavior remain Not Yet Proven.

### Theme Blocks, Icons, Shipping, Returns, And Reassurance

Proven source paths:

- `blocks/_product-details.liquid`
- `blocks/icon.liquid`
- `blocks/accordion.liquid`
- `blocks/_accordion-row.liquid`
- `blocks/popup-link.liquid`
- `blocks/_inline-text.liquid`
- `sections/section.liquid`

Repository-backed facts:

- `blocks/_product-details.liquid` contains default preset groups using `icon: truck` with `t:html_defaults.free_shipping_over` and `icon: return` with `t:html_defaults.free_returns`.
- The active `templates/product.json` reviewed in this mission does not include that default reassurance group in the active product detail block order.
- `blocks/accordion.liquid`, `blocks/_accordion-row.liquid`, and `blocks/popup-link.liquid` provide source support for return-policy and shipping-related content.
- These source supports do not prove live merchant policies, live return guarantees, live shipping terms, or active product-page reassurance content.

## Not Yet Proven Targets

The following possible trust/reassurance surfaces must remain explicit unknowns until Exercise 008 proves them:

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
- Current live footer payment-icon rendering: Not Yet Proven
- Current theme name, theme ID, and theme version: Not Yet Proven
- Source hashes for trust-related files: Not Yet Proven

## Scope

Exercise 008 should inventory the NoKings trust-badge, payment-icon, and CTA trust architecture from repository-backed source only.

The work should map:

- Trust signal taxonomy
- Product CTA style source
- Add-to-cart and accelerated-checkout source relationship
- Product badge source and theme settings
- Payment icon block source
- Footer payment-icon support
- Cart checkout-readiness messaging
- Tax and shipping-at-checkout copy source
- Installment/payment-terms source support
- Shipping and returns reassurance source support
- Theme-block and schema dependencies
- App-block, metafield, and runtime unknowns
- Trust-signal versus merchant-claim boundaries
- Rollback and mutation implications

## In Scope

- Exercise-specific scope creation in a later mission
- Exercise 008 source baseline in a later mission
- Read-only trust-badge inventory in a later mission
- Exercise 008 after evidence, proof package, and certification in later missions
- `snippets/buy-buttons-styles.liquid` CTA styling and purchase-control layout support
- `snippets/button.liquid` reusable button rendering support
- `blocks/buy-buttons.liquid`, `blocks/add-to-cart.liquid`, and `blocks/accelerated-checkout.liquid`
- `blocks/price.liquid` payment terms and tax/shipping source support
- `snippets/product-badges-styles.liquid` and badge settings
- `blocks/_product-card-gallery.liquid` sale/sold-out badge rendering
- `blocks/payment-icons.liquid` and footer payment-icon support
- `snippets/cart-summary.liquid` checkout-readiness surfaces
- `snippets/tax-info.liquid` tax/shipping copy source
- shipping/returns reassurance source support in product-detail presets, accordion blocks, and popup-link blocks
- theme settings in `config/settings_data.json` and `config/settings_schema.json`
- repository-backed unknowns
- reusable ShopiFixer trust-surface analysis patterns

## Out Of Scope

- Shopify mutation
- Theme file edits
- Shopify Admin, CLI, API, or storefront execution
- Runtime storefront testing
- Payment provider testing
- Checkout testing
- Stripe or Shopify payment truth changes
- Merchant policy edits
- Trust badge or copy implementation
- App installation, configuration, or app-block execution
- Metafield writes
- Exercise 008 scope creation in this mission
- Exercise 008 baseline capture in this mission
- Exercise 008 inventory execution in this mission
- Exercise 008 after evidence, proof package, or certification in this mission
- Generic `cart-agent-dev` commercial pilot changes
- Abando authority changes
- Payment, fulfillment, commercial proof, or completion truth changes

## Required Before Evidence

The Exercise 008 baseline should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/before_evidence.md`

It should capture:

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

## Required Inventory Artifact

The Exercise 008 inventory should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/execution_notes.md`

It should document:

- Architecture map
- Source dependency tree
- Product CTA trust flow
- Product badge flow
- Payment icon flow
- Cart checkout-readiness flow
- Tax/shipping messaging flow
- Installment/payment terms support
- Shipping/returns reassurance source support
- Theme settings and schema dependencies
- App-block and metafield unknowns
- Trust signal versus merchant claim distinctions
- Risks
- Rollback implications
- Reusable ShopiFixer patterns

The inventory must not infer runtime behavior or active merchant claims.

## Required After Evidence

The Exercise 008 after evidence should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/after_evidence.md`

It should confirm:

- Trust Badge Inventory completed
- Analysis completed
- Files inventoried
- Trust-signal taxonomy captured
- Product CTA styling source identified
- Product badge source identified
- Payment-icon source identified
- Cart trust/checkout-readiness source identified
- Remaining runtime and merchant-claim unknowns recorded
- No Shopify mutation occurred
- No payment, checkout, merchant outcome, conversion, production deployment, or completion claim was made

## Required Proof Package

The Exercise 008 proof package should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/mission_proof_package.md`

It should consolidate:

- Exercise-specific scope
- Exercise-specific before evidence
- Exercise-specific execution notes
- Exercise-specific after evidence
- Proven trust architecture
- Risks and unknowns
- Reusable ShopiFixer trust-surface knowledge
- Recommendation for Exercise 009

It must not claim certification, storefront improvement, payment, production deployment, commercial completion, or Mission 001 completion.

## Required Certification

The Exercise 008 certification should be a later implementation memo only after the proof package exists.

Expected future path:

`staffordos/implementation/p11_28_mission_001_exercise_008_certification_v1.md`

The exact mission number may change if intervening readiness-alignment missions are required. The certification should close Exercise 008 only and should not close Mission 001 because Mission 001 defines later exercises, including Exercise 009.

## Success Criteria

Exercise 008 scope can begin when:

- This planning artifact exists.
- The canonical store remains `no-kings-athletics.myshopify.com`.
- The mission binding remains `controlled_training`.
- Payment remains not required.
- Exercise-specific authority path is preserved.
- Candidate trust targets are separated into proven and Not Yet Proven groups.
- No mission-root payload files are used.
- No Shopify mutation is authorized.

Exercise 008 inventory can later be certified when:

- Exercise 008 scope is complete.
- Exercise 008 before evidence is complete.
- Exercise 008 inventory notes are complete.
- Exercise 008 after evidence is complete.
- Exercise 008 proof package is assembled.
- Trust signals, payment icons, merchant claims, app content, and checkout behavior are clearly separated.
- Remaining unknowns are explicit.
- No critical authority contradiction exists.

## Rollback Expectations

Shopify rollback:

- Not required for planning, scope, baseline, inventory, after evidence, proof package, or certification if Exercise 008 remains analysis-only.

Repository rollback:

- Planning artifact rollback is available through Git.
- Future Exercise 008 artifacts should remain isolated under `exercises/exercise_008/`.
- Future rollback should not alter Exercise 004, Exercise 005, Exercise 006, Exercise 007, Abando, or commercial `cart-agent-dev` truth.

Future implementation rollback:

- Not authorized by this plan.
- If later governed doctrine permits implementation, rollback must cover any edited product template, product section, block, snippet, cart summary, footer, settings, app, or metafield authority.

## Carry-Forward Knowledge From Exercises 004-007

Exercise 004:

- Product purchase architecture is block-driven and schema-governed.
- CTA trust surfaces sit inside the product-information and buy-buttons flow.
- Accelerated checkout is part of the purchase stack but runtime availability remains separate.

Exercise 005:

- Product-card and collection-card trust indicators can be shared infrastructure.
- Product badges must be distinguished from live merchant claims.
- Shared card rendering creates cross-surface blast radius.

Exercise 006:

- Cart trust and checkout-readiness cluster in `snippets/cart-summary.liquid`.
- `snippets/tax-info.liquid` owns tax, duty, and shipping-at-checkout copy source selection.
- Runtime checkout, tax, shipping, discount, and accelerated-checkout behavior cannot be proven from source presence alone.

Exercise 007:

- Global-shell surfaces can expose payment icons or trust messaging through footer/header-adjacent source.
- Global-shell changes have broad blast radius.
- Exercise-specific evidence chains must remain isolated.

Reusable ShopiFixer rules:

- Separate source support from runtime proof.
- Separate trust signal from merchant claim.
- Separate payment icon display from payment truth.
- Separate theme setting from live merchant policy.
- Separate analysis authority from implementation authority.

## Risks And Unknowns

Risks:

- Trust badges can imply merchant promises; Exercise 008 must not certify claims that repository truth does not prove.
- Payment icons can be mistaken for payment authority; they only prove source support unless runtime payment configuration is verified.
- Accelerated checkout support can be mistaken for runtime wallet availability.
- Tax and shipping copy depends on cart state, shop policy state, discount setting, and checkout platform behavior.
- Product badge styling is shared with collection/product-card surfaces.
- Footer payment-icon support may affect global shell expectations.
- App-provided trust badges and metafield content could exist outside archived theme source.
- Runtime checkout behavior is not controlled solely by theme source.

Remaining unknowns:

- Theme name: Not Yet Proven
- Theme ID: Not Yet Proven
- Theme version: Not Yet Proven
- Source hashes: Not Yet Proven
- Current live trust badge display: Not Yet Proven
- Active payment icon set: Not Yet Proven
- Active payment methods: Not Yet Proven
- Active merchant shipping policy truth: Not Yet Proven
- Active merchant returns or guarantee policy truth: Not Yet Proven
- Active app-provided trust blocks: Not Yet Proven
- Active trust metafields: Not Yet Proven
- Runtime checkout behavior: Not Yet Proven
- Runtime accelerated-checkout availability: Not Yet Proven
- Runtime installments availability: Not Yet Proven
- Current live footer payment icon rendering: Not Yet Proven
- Current live cart trust messaging: Not Yet Proven

## Expected Readiness Transitions

Current readiness:

- `exercise_008_planning`
- blocker: `Exercise 008 Planning Missing`
- next safe action: `Plan Exercise 008 - Trust Badge Inventory`

Expected transition after this planning report is committed and readiness recognizes planning authority, if such recognition is required:

- current phase: `scope`
- current blocker: `Scope Incomplete`
- next safe action: `Establish governed Exercise 008 scope`

Expected transition after future Exercise 008 scope is complete:

- current phase: `before_evidence`
- current blocker: `Before Evidence Missing`
- next safe action: `Capture Before Evidence`

Expected lifecycle after future artifacts:

- before evidence complete -> `trust_badge_inventory`
- inventory complete -> `after_evidence`
- after evidence complete -> `proof_package`
- proof package complete -> `mission_certification`
- certification complete -> `exercise_009_planning`

No readiness output is modified by this planning mission.

## Knowledge-Capture Requirements

Exercise 008 should capture:

- Trust signal taxonomy
- Product CTA trust source map
- Product badge source map
- Payment icon source map
- Cart trust and tax/shipping message source map
- Theme settings that influence visual trust signals
- Explicit split between merchant claims and source-proven UI support
- Explicit split between payment icon display and payment authority
- Explicit split between checkout source support and runtime checkout behavior
- Reusable ShopiFixer trust-surface analysis rules
- Remaining unknowns

Future recommended updates after certification only:

- Promote a trust-surface taxonomy pattern into the ShopiFixer pattern library.
- Add a curriculum note distinguishing payment icons from payment authority.
- Add mission memory for trust-signal source mapping.
- Update competency record only if a formal scoring rule is defined.

## Recommended Next Governed Mission

Recommended next mission:

`P11.23_NOKINGS_EXERCISE_008_SCOPE`

Purpose:

- Create only `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/fix_scope.md`.
- Preserve analysis-only authority.
- Use the candidate target classification from this planning report.
- Do not capture baseline, inventory, after evidence, proof package, certification, or readiness output unless narrowly required by scope recognition.

## Planning Decision

**GO**

Repository-backed justification:

- Exercise 008 is canonical in Mission 001.
- Exercise 007 is certified and Mission 001 remains active.
- Current readiness identifies Exercise 008 planning as the next blocker.
- The canonical store remains `no-kings-athletics.myshopify.com`.
- Payment is not required.
- Exercise-specific authority already exists as the Mission 001 convention.
- Repository truth provides enough source authority to scope the trust-badge inventory without inspecting or mutating Shopify.

## Final Confirmation

- No Shopify mutation occurred.
- No live Shopify inspection occurred.
- No Exercise 008 scope, baseline, inventory, after evidence, proof package, or certification was created.
- Exercises 004-007 were not modified.
- Abando and commercial `cart-agent-dev` truth were not modified.
- Payment, fulfillment, commercial proof, and completion truth were not modified.
