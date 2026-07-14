# P11.15 - Exercise 007 Header Navigation Inventory Planning

## Mission Identity

- Mission ID: mission_001
- Mission: Mission 001 - NoKings Shopify Engineering Training
- Product: ShopiFixer
- Merchant: NoKings Athletics
- Canonical store: no-kings-athletics.myshopify.com
- Storefront URL: https://no-kings-athletics.myshopify.com
- Environment type: controlled_training
- Payment required: false

## Exercise Identity

- Exercise ID: ex_007_header_navigation_inventory
- Exercise: Exercise 007 - Header Navigation Inventory
- Shopify area: Header / navigation / mobile menu
- Authority mode: analysis-only
- Risk level: low
- Rollback requirement: none, inventory only

## Repository Authority Reviewed

- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `SHOPIFIXER_PATTERN_LIBRARY_0001_HOMEPAGE_ARCHITECTURE.md`
- `staffordos/implementation/p11_14_mission_001_exercise_006_certification_v1.md`
- `staffordos/implementation/p11_8_exercise_006_cart_inventory_plan_v1.md`
- `staffordos/implementation/p11_7_mission_001_exercise_005_certification_v1.md`
- `staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md`
- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

## Current Readiness

- Status: CONDITIONAL_GO
- Current phase: exercise_007_planning
- Current blocker: Exercise 007 Planning Missing
- Next safe action: Plan Exercise 007 - Header Navigation Inventory
- Payment required: false
- Completion permitted: false

This planning report resolves the planning artifact requirement only. It does not create scope, baseline evidence, inventory notes, after evidence, proof package, certification, or readiness alignment for Exercise 007.

## Objective

Mission 001 defines Exercise 007 as `ex_007_header_navigation_inventory`.

Canonical objective:

- Identify the header and mobile navigation control points.

Required validation from mission doctrine:

- Confirm desktop navigation ownership.
- Confirm mobile navigation ownership.

Expected lesson:

- Header behavior is split between JSON settings, Liquid, and JavaScript.

## Authority Mode

Exercise 007 is analysis-only unless later governed doctrine explicitly authorizes implementation.

No repository authority reviewed in this planning mission authorizes:

- Shopify mutation
- Theme file edits
- Shopify Admin, CLI, API, or storefront execution
- Runtime storefront testing
- Header/navigation implementation
- Payment flow changes
- Completion, fulfillment, or commercial proof changes
- Abando authority changes
- Generic `cart-agent-dev` commercial pilot changes

## Expected Exercise Artifact Directory

Exercise 007 should use exercise-specific authority only:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/`

Planned lifecycle artifacts:

- `fix_scope.md`
- `before_evidence.md`
- `execution_notes.md`
- `after_evidence.md`
- `mission_proof_package.md`

These artifacts are not created in this planning mission.

## Scope

Exercise 007 should inventory the NoKings header and navigation architecture from repository-backed source only.

The governed inventory should map:

- Header group JSON structure
- Header section settings
- Header row composition
- Desktop menu rendering
- Mobile drawer navigation rendering
- Announcement bar rendering
- Header actions
- Search and predictive-search source relationship
- Header logo/source image relationship
- Account action surface, where repository-backed
- Cart action relationship carried forward from Exercise 006
- Header JavaScript assets
- Menu, drawer, search, announcement, and action source dependencies
- Global-shell blast radius and rollback implications
- Repository-backed unknowns

## In Scope

- Exercise-specific scope creation in a later mission
- Exercise 007 source baseline in a later mission
- Read-only header/navigation inventory in a later mission
- Exercise 007 after-evidence, proof package, and certification in later missions
- `sections/header-group.json` hierarchy and active section order
- `sections/header.liquid` render flow
- `sections/header-announcements.liquid` announcement-bar source flow
- `snippets/header-row.liquid` left/center/right row placement logic
- `snippets/header-drawer.liquid` mobile drawer navigation source flow
- `snippets/header-actions.liquid` action surface relationship
- `snippets/search.liquid` and search modal source flow
- Predictive-search source relationship where repository-backed
- `assets/header.js`, `assets/header-menu.js`, `assets/header-drawer.js`, `assets/header-actions.js`, `assets/announcement-bar.js`, and `assets/predictive-search.js`
- Rendered homepage header clues already archived in repository truth
- Repository-backed unknowns
- Reusable ShopiFixer global-shell analysis patterns

## Explicit Out Of Scope

- Shopify mutation
- Theme file edits
- Shopify Admin, CLI, API, or storefront execution
- Runtime navigation testing
- Runtime mobile-menu testing
- Runtime predictive-search testing
- Menu item editing
- Announcement copy editing
- Header logo editing
- Cart drawer implementation
- Customer-account implementation
- Localization implementation
- Payment, fulfillment, or completion changes
- Commercial ShopiFixer pilot changes
- Abando changes
- Exercise 007 scope creation in this mission
- Exercise 007 baseline capture in this mission
- Exercise 007 inventory execution in this mission
- Exercise 007 after evidence, proof package, or certification in this mission

## Repository-Backed Candidate Inspection Targets

Mission 001 doctrine identifies these likely files:

- `sections/header-group.json`
- `sections/header.liquid`
- `sections/header-announcements.liquid`
- `snippets/header-drawer.liquid`
- `assets/header-menu.js`

The archived NoKings theme backup proves these additional header/navigation source files exist:

- `snippets/header-row.liquid`
- `snippets/header-actions.liquid`
- `snippets/search.liquid`
- `snippets/search-modal.liquid`
- `snippets/predictive-search-styles.liquid`
- `snippets/predictive-search-products-list.liquid`
- `snippets/predictive-search-resource-carousel.liquid`
- `snippets/predictive-search-empty-state.liquid`
- `snippets/mega-menu-list.liquid`
- `snippets/menu-font-styles.liquid`
- `snippets/submenu-font-styles.liquid`
- `snippets/util-mega-menu-img-sizes-attr.liquid`
- `sections/search-header.liquid`
- `sections/predictive-search.liquid`
- `sections/predictive-search-empty.liquid`
- `blocks/_announcement.liquid`
- `assets/header.js`
- `assets/header-drawer.js`
- `assets/header-actions.js`
- `assets/announcement-bar.js`
- `assets/predictive-search.js`
- `assets/search-page-input.js`
- `assets/icon-menu.svg`
- `assets/icon-search.svg`

The archived rendered homepage proves these rendered header/navigation surfaces existed at capture time:

- `header-group`
- announcement bar
- `header-component`
- mobile `header-drawer`
- desktop `header-menu`
- `header-menu.js`
- mobile and desktop search buttons
- header logo image
- `header-actions`
- account action surface
- cart icon/action surface
- rendered menu links: Home, Catalog, Contact
- predictive-search markup elsewhere in the captured page

Candidate targets marked Not Yet Proven:

- `snippets/header-navigation.liquid`: Not Yet Proven
- `snippets/mobile-menu.liquid`: Not Yet Proven
- `snippets/navigation-drawer.liquid`: Not Yet Proven
- Dedicated mega-menu active runtime state: Not Yet Proven
- Live predictive-search runtime behavior: Not Yet Proven
- Current live menu item set: Not Yet Proven beyond archived Home, Catalog, Contact capture
- Current live announcement content: Not Yet Proven beyond archived "Welcome to our store" capture
- Current active app blocks in header: Not Yet Proven
- Current localization selector runtime behavior: Not Yet Proven
- Current customer-account runtime behavior: Not Yet Proven
- Current theme name, theme ID, and theme version: Not Yet Proven
- Source hashes for header/navigation files: Not Yet Proven

## Required Before Evidence

The Exercise 007 baseline should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/before_evidence.md`

It should capture:

- Mission ID and Exercise ID
- Merchant and canonical store
- Analysis-only authority
- Active Exercise 007 scope path
- Proven header/navigation source references
- Archived theme-pull reference
- Archived rendered homepage header evidence
- Candidate target files
- Unknown fields explicitly marked Not Yet Proven
- Confirmation no Shopify mutation occurred

The baseline must not claim runtime behavior, current live menu state, current theme identity, source hashes, screenshots, or merchant outcomes unless repository truth proves them.

## Required Inventory

The Exercise 007 inventory should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/execution_notes.md`

It should map:

- Header group JSON hierarchy
- Header section settings and static blocks
- Header row placement logic
- Desktop menu render hierarchy
- Mobile drawer render hierarchy
- Announcement bar render hierarchy
- Search and predictive-search source relationship
- Header action surfaces
- Header logo source relationship
- Cart/action relationship carried forward from Exercise 006
- Header-related JavaScript assets
- Menu style, featured product/collection, and drawer settings where repository-backed
- Global-shell blast radius
- Reusable ShopiFixer patterns
- Risks and remaining unknowns

The inventory must not infer live storefront behavior.

## Required After Evidence

The Exercise 007 completion evidence should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/after_evidence.md`

It should confirm:

- Scope completed
- Baseline captured
- Header/navigation inventory completed
- Files inventoried
- Desktop and mobile navigation ownership mapped from source
- No Shopify mutation occurred
- Runtime behavior remains Not Yet Proven unless separately proven
- Remaining unknowns are explicit
- Recommendation for Exercise 008

It must not claim storefront improvements, UX improvements, conversion improvements, merchant outcomes, production deployment, payment, or completion.

## Required Proof Package

The Exercise 007 proof package should be written only to:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/mission_proof_package.md`

It should consolidate only exercise-specific artifacts:

- Exercise 007 scope
- Exercise 007 before evidence
- Exercise 007 execution notes
- Exercise 007 after evidence

It should preserve Mission 001 isolation and must not use mission-root payload files or commercial pilot proof artifacts.

## Required Certification

The Exercise 007 certification should be a later implementation memo only after the proof package is complete.

Expected certification artifact:

`staffordos/implementation/p11_?_mission_001_exercise_007_certification_v1.md`

The certification should close Exercise 007 only. It must not close Mission 001 unless canonical doctrine proves Exercise 007 is the final exercise. Mission 001 already lists later exercises, including Exercise 008.

## Carry-Forward Knowledge From Exercises 004-006

From Exercise 004:

- Trace from JSON template to section to snippet.
- Keep page-specific evidence separate from mutation artifacts.
- Treat media, variant, quantity, and CTA flows as governed dependency chains.

From Exercise 005:

- Separate wrapper authority from shared component authority.
- Do not conflate active template flow with reusable but inactive source primitives.
- Preserve filters, sorting, pagination, and card-rendering surfaces as distinct control points.

From Exercise 006:

- Separate full-page authority from drawer/action authority.
- Treat JavaScript assets as first-class source authority, not secondary implementation details.
- Keep source support separate from runtime proof.
- Preserve exercise-specific evidence chains so later work cannot overwrite certified prior exercises.

For Exercise 007, these lessons imply:

- Header and mobile navigation must be mapped across group JSON, section Liquid, snippets, blocks, settings, and assets.
- Header changes are global-shell changes and must not be treated as page-local.
- Mobile drawer behavior must be mapped separately from desktop menu behavior.
- Search, account, cart, localization, and announcement surfaces must remain separate control points until evidence proves their interactions.

## Risks

- Header/navigation files affect every storefront page, so implementation risk is broader than page-specific product, collection, or cart inventory.
- Mobile drawer behavior can be broken by editing the wrong snippet or asset.
- Desktop menu and mobile drawer may share menu settings but render through different paths.
- Announcement and search behavior may depend on JavaScript assets that are not obvious from rendered markup alone.
- Header action surfaces may overlap with cart, account, localization, and search responsibilities.
- Archived rendered homepage truth may not prove current live storefront state.
- The theme backup proves source files exist, but source hashes and current theme identity remain Not Yet Proven.
- Runtime menu, drawer, search, account, localization, and announcement behavior remains Not Yet Proven.

## Remaining Unknowns

- Current theme name: Not Yet Proven
- Current theme ID: Not Yet Proven
- Current theme version: Not Yet Proven
- Source hashes for header/navigation files: Not Yet Proven
- Current live menu item set: Not Yet Proven
- Current live mobile drawer behavior: Not Yet Proven
- Current live desktop menu behavior: Not Yet Proven
- Current live predictive-search behavior: Not Yet Proven
- Current live announcement content and interaction behavior: Not Yet Proven
- Active mega-menu runtime state: Not Yet Proven
- Active customer-account runtime state: Not Yet Proven
- Active localization selector runtime state: Not Yet Proven
- Header app-block behavior: Not Yet Proven
- Header metafield dependencies: Not Yet Proven
- Header settings drift since archived theme backup: Not Yet Proven

## Rollback Considerations

- This planning mission performs no Shopify mutation, so Shopify rollback is not required.
- Repository rollback is limited to removing or reverting this planning report.
- Later Exercise 007 artifacts must stay under `exercises/exercise_007/` so they cannot overwrite Exercises 004-006.
- Any future implementation-capable mission must define a separate rollback artifact before modifying global header/navigation source.
- Header/navigation implementation should not proceed from this planning report alone.

## Expected Readiness Transition

After this planning report is committed in a later mission, the next governed step should be Exercise 007 scope creation.

Expected next mission:

- Establish governed Exercise 007 scope.

Expected Exercise 007 lifecycle:

1. Scope
2. Before evidence
3. Header/navigation inventory
4. After evidence
5. Mission proof package
6. Exercise certification

Readiness should not advance from `exercise_007_planning` until the readiness model is intentionally aligned to recognize the planning artifact and Exercise 007 scope exists.

## Success Criteria

Exercise 007 planning is ready when:

- The mission and exercise identity are explicit.
- The exercise remains analysis-only.
- No payment requirement is introduced.
- The Exercise 007 artifact directory is defined but not created by this mission.
- Candidate targets are repository-backed or explicitly marked Not Yet Proven.
- Required scope, baseline, inventory, after-evidence, proof, and certification artifacts are defined.
- Carry-forward knowledge from Exercises 004-006 is preserved.
- Risks and unknowns are explicit.
- No Shopify mutation, commercial pilot change, Abando change, readiness mutation, scope creation, evidence capture, proof generation, or certification occurs.

## Planning Outcome

GO for starting Exercise 007 scope in a later governed mission.

Repository-backed justification:

- Mission 001 doctrine identifies Exercise 007 as `ex_007_header_navigation_inventory`.
- Current readiness identifies Exercise 007 planning as the next blocker.
- The archived NoKings theme backup proves the primary header/navigation source files exist.
- Prior exercises prove the exercise-specific artifact model and analysis-only pattern.
- No critical authority contradiction was found.
