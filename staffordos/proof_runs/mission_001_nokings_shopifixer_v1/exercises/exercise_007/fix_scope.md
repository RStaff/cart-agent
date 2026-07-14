# Exercise 007 Fix Scope

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Exercise ID:
exercise_007

Exercise:
Exercise 007 - Header Navigation Inventory

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
Exercise 007 - Header Navigation Inventory

Identify the NoKings header and mobile navigation control points, using only repository-backed source evidence.

Target Page / Template / Artifact:
sections/header-group.json
sections/header.liquid
sections/header-announcements.liquid
snippets/header-row.liquid
snippets/header-drawer.liquid
snippets/header-actions.liquid
snippets/search.liquid
snippets/search-modal.liquid
snippets/mega-menu-list.liquid
assets/header.js
assets/header-menu.js
assets/header-drawer.js
assets/header-actions.js
assets/announcement-bar.js
assets/predictive-search.js

Target Header / Navigation Surfaces:
- Header group JSON structure
- Header section settings
- Header row composition
- Desktop menu rendering
- Mobile drawer navigation rendering
- Announcement bar rendering
- Header actions
- Search and predictive-search source relationship
- Header logo/source image relationship
- Account action surface, where repository truth proves it
- Cart action relationship carried forward from Exercise 006
- Header JavaScript assets
- Menu, drawer, search, announcement, and action source dependencies
- Global-shell blast radius and rollback implications

Proven Target Files:
- `sections/header-group.json`
- `sections/header.liquid`
- `sections/header-announcements.liquid`
- `snippets/header-row.liquid`
- `snippets/header-drawer.liquid`
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
- `assets/header-menu.js`
- `assets/header-drawer.js`
- `assets/header-actions.js`
- `assets/announcement-bar.js`
- `assets/predictive-search.js`
- `assets/search-page-input.js`
- `assets/icon-menu.svg`
- `assets/icon-search.svg`

Rendered Archive Surfaces:
- `header-group`
- announcement bar
- `header-component`
- mobile `header-drawer`
- desktop `header-menu`
- mobile and desktop search buttons
- header logo image
- `header-actions`
- account action surface
- cart icon/action surface
- rendered menu links: Home, Catalog, Contact
- predictive-search markup elsewhere in the captured page

Unproven Candidate Files / Surfaces:
- `snippets/header-navigation.liquid`: Not Yet Proven
- `snippets/mobile-menu.liquid`: Not Yet Proven
- `snippets/navigation-drawer.liquid`: Not Yet Proven
- Dedicated mega-menu active runtime state: Not Yet Proven
- Live predictive-search runtime behavior: Not Yet Proven
- Current live menu item set beyond archived Home, Catalog, Contact capture: Not Yet Proven
- Current live announcement content beyond archived "Welcome to our store" capture: Not Yet Proven
- Current active app blocks in header: Not Yet Proven
- Current localization selector runtime behavior: Not Yet Proven
- Current customer-account runtime behavior: Not Yet Proven
- Current theme name, theme ID, and theme version: Not Yet Proven
- Source hashes for header/navigation files: Not Yet Proven

Smallest Governed Scope:
Perform a read-only engineering inventory of the NoKings header and navigation source architecture. Map how header group JSON, header section Liquid, header rows, desktop menu, mobile drawer, announcement bar, header actions, search/predictive-search source, logo, account, cart action, and related JavaScript assets are wired from repository-backed files.

In Scope:
- Identify the header group JSON hierarchy.
- Identify the active header section and announcement section settings.
- Identify header row placement responsibilities.
- Identify desktop menu rendering responsibilities.
- Identify mobile drawer navigation responsibilities.
- Identify announcement bar source responsibilities.
- Identify header action surfaces where repository truth proves them.
- Identify search and predictive-search source relationships.
- Identify header logo source relationship.
- Identify cart/action relationship carried forward from Exercise 006 without re-inventorying cart behavior.
- Identify header-related JavaScript assets.
- Record global-shell blast radius and rollback implications.
- Record repository-backed unknowns.
- Record reusable ShopiFixer global-shell analysis patterns.
- Preserve Exercise 004, Exercise 005, and Exercise 006 evidence chains.

Out of Scope:
- Shopify mutation.
- Theme file edits.
- Shopify Admin, CLI, API, or storefront execution.
- Runtime navigation testing.
- Runtime mobile-menu testing.
- Runtime predictive-search testing.
- Menu item editing.
- Announcement copy editing.
- Header logo editing.
- Cart drawer implementation.
- Customer-account implementation.
- Localization implementation.
- Payment, fulfillment, or completion changes.
- Commercial ShopiFixer pilot changes.
- Abando changes.
- Before evidence capture.
- Header/navigation inventory execution.
- After evidence capture.
- Mission proof package generation.
- Exercise certification.

Merchant Approval Requirement:
No merchant approval is required for read-only controlled training analysis. Do not infer commercial merchant approval.

Implementation Permitted:
No

Required Before Evidence:
- Exercise-specific baseline at `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/before_evidence.md`
- Mission ID, exercise ID, merchant, canonical store, environment type, authority mode, and active scope path
- Proven header/navigation source references
- Archived theme-pull reference
- Archived rendered homepage header evidence
- Candidate target files
- Existing hashes only if already proven
- Confirmation no Shopify mutation occurred
- Unknown fields marked Not Yet Proven

Required Inventory:
- Exercise-specific inventory at `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/execution_notes.md`
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

Required After Evidence:
- Exercise-specific after evidence at `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/after_evidence.md`
- Confirmation that the header/navigation inventory was completed
- Files inventoried
- Desktop and mobile navigation ownership mapped from source
- Confirmation no Shopify mutation occurred
- Runtime behavior marked Not Yet Proven unless separately proven
- Remaining unknowns explicit
- Recommendation for Exercise 008

Required Proof Package:
- Exercise-specific proof package at `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/mission_proof_package.md`
- Consolidate only Exercise 007 scope, before evidence, execution notes, and after evidence
- Do not use mission-root payload files
- Do not use commercial pilot proof artifacts

Required Certification:
- Later certification memo after the Exercise 007 proof package is complete
- Certify Exercise 007 only
- Do not close Mission 001 unless canonical doctrine proves Exercise 007 is the final exercise
- Preserve later Exercise 008 continuation because Mission 001 lists Exercise 008

Inventory Method:
- Start at `sections/header-group.json`.
- Trace active section order and settings.
- Trace `sections/header.liquid`.
- Trace captured blocks and snippets including header logo, header menu, mobile drawer, search, and header actions.
- Trace `snippets/header-row.liquid`, `snippets/header-drawer.liquid`, `snippets/header-actions.liquid`, `snippets/search.liquid`, and search/predictive-search snippets.
- Trace connected assets including `header.js`, `header-menu.js`, `header-drawer.js`, `header-actions.js`, `announcement-bar.js`, and `predictive-search.js`.
- Separate desktop navigation from mobile drawer navigation.
- Separate source support from runtime proof.
- Mark runtime behavior, current live menu state, current theme identity, source hashes, app-block behavior, customer-account behavior, localization behavior, and predictive-search behavior as Not Yet Proven unless repository truth proves them.

Success Criteria:
- The header group JSON entry point is identified.
- The active header and announcement sections are mapped.
- Header row composition is mapped.
- Desktop menu ownership is mapped.
- Mobile drawer ownership is mapped.
- Search and predictive-search source relationships are mapped.
- Header action surfaces are classified.
- Header JavaScript assets are mapped.
- Global-shell risk is explicitly recorded.
- Runtime behavior gaps remain explicit.
- No Shopify mutation occurs.
- Exercise 004, Exercise 005, and Exercise 006 evidence chains remain untouched.
- Commercial cart-agent-dev and Abando truth remain untouched.

Rollback Expectation:
- Shopify rollback is not required because implementation is not permitted.
- Repository rollback remains available through Git for this exercise-specific scope file.
- Future Exercise 007 artifacts must remain exercise-specific so they can be reverted without modifying Exercises 004-006 evidence chains.
- Any later implementation-capable header/navigation mission must define a separate rollback artifact before modifying global shell source.

Knowledge Capture Requirement:
- Capture reusable ShopiFixer rules for header/global-shell architecture mapping.
- Preserve the source-versus-runtime distinction.
- Carry forward Exercise 004 page-flow tracing, Exercise 005 wrapper/component separation, and Exercise 006 drawer/action boundary discipline.
- Identify header and navigation risk patterns without authorizing changes.

Source Artifacts:
- `staffordos/implementation/p11_15_exercise_007_header_navigation_inventory_plan_v1.md`
- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `SHOPIFIXER_PATTERN_LIBRARY_0001_HOMEPAGE_ARCHITECTURE.md`
- `staffordos/implementation/p11_14_mission_001_exercise_006_certification_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/mission_proof_package.md`
- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

Governance Confirmation:
- Exercise-specific authority only.
- No mission-root scope payload was modified.
- No before evidence was captured.
- No header/navigation inventory was performed.
- No Shopify mutation was authorized or performed.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.
