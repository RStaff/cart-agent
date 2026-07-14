# Exercise 007 Before Evidence - Header Navigation Source Baseline

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

Affected Page / Artifact:
Exercise 007 - Header Navigation Inventory source baseline

Issue:
Header navigation source baseline captured before the governed read-only header/navigation inventory is performed.

Why It Matters:
Exercise 007 must identify the NoKings header and mobile navigation control points without inspecting live Shopify, modifying Shopify, or claiming runtime behavior.

Screenshot:
Not Captured - no new customer-facing screenshot was authorized for this source baseline.

Notes:
- This is an exercise-specific source baseline for Exercise 007 - Header Navigation Inventory.
- Baseline assumptions: none.
- No Shopify mutation occurred.
- No header/navigation inventory was performed.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.

## Canonical Context

- Mission: Mission 001 - NoKings Shopify Engineering Training
- Exercise: Exercise 007 - Header Navigation Inventory
- Canonical store: no-kings-athletics.myshopify.com
- Storefront URL: https://no-kings-athletics.myshopify.com
- Environment: controlled_training
- Authority: analysis-only
- Payment required: false
- Scope path: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/fix_scope.md`
- Expected inventory artifact: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/execution_notes.md`

## Repository-Backed Objective

Mission 001 defines Exercise 007 as `ex_007_header_navigation_inventory`.

Objective:

- Identify the header and mobile navigation control points.

Validation required:

- Confirm desktop navigation ownership.
- Confirm mobile navigation ownership.

Expected lesson:

- Header behavior is split between JSON settings, Liquid, and JavaScript.

## Proven Header Group Entry Point

The Exercise 007 scope and planning report identify the header group entry point:

- `sections/header-group.json`

The archived NoKings theme backup proves this source path exists:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/header-group.json`

The archived rendered homepage proves a rendered `header-group` surface existed at capture time:

- `staffordos/audits/no_kings/catalog_truth/homepage.html`

## Proven Header Section Files

Repository-backed header section files:

- `sections/header-group.json`
- `sections/header.liquid`
- `sections/header-announcements.liquid`
- `sections/search-header.liquid`
- `sections/predictive-search.liquid`
- `sections/predictive-search-empty.liquid`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/header-group.json`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/header.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/header-announcements.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/search-header.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/predictive-search.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/predictive-search-empty.liquid`

## Proven Announcement-Bar Files

Repository-backed announcement files:

- `sections/header-announcements.liquid`
- `blocks/_announcement.liquid`
- `assets/announcement-bar.js`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/header-announcements.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_announcement.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/announcement-bar.js`

Archived rendered homepage truth proves announcement-bar markup existed at capture time and displayed `Welcome to our store`. Current live announcement content is Not Yet Proven.

## Proven Desktop Navigation Files

Repository-backed desktop navigation files:

- `sections/header.liquid`
- `snippets/header-row.liquid`
- `snippets/mega-menu-list.liquid`
- `snippets/menu-font-styles.liquid`
- `snippets/submenu-font-styles.liquid`
- `snippets/util-mega-menu-img-sizes-attr.liquid`
- `assets/header.js`
- `assets/header-menu.js`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/header.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/header-row.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/mega-menu-list.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/menu-font-styles.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/submenu-font-styles.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/util-mega-menu-img-sizes-attr.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header-menu.js`

Archived rendered homepage truth proves a desktop `header-menu` surface existed at capture time with rendered links Home, Catalog, and Contact. Current live menu state is Not Yet Proven.

## Proven Mobile Drawer Files

Repository-backed mobile drawer files:

- `snippets/header-drawer.liquid`
- `assets/header-drawer.js`
- `assets/icon-menu.svg`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/header-drawer.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header-drawer.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/icon-menu.svg`

Archived rendered homepage truth proves a mobile `header-drawer` surface existed at capture time. Current live drawer behavior is Not Yet Proven.

## Proven Header Action Files

Repository-backed header action files:

- `snippets/header-actions.liquid`
- `assets/header-actions.js`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/header-actions.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header-actions.js`

Archived rendered homepage truth proves header action surfaces existed at capture time, including account and cart action markup. Runtime account, localization, and cart action behavior for Exercise 007 remains Not Yet Proven.

## Proven Search Files

Repository-backed search and predictive-search files:

- `snippets/search.liquid`
- `snippets/search-modal.liquid`
- `snippets/predictive-search-styles.liquid`
- `snippets/predictive-search-products-list.liquid`
- `snippets/predictive-search-resource-carousel.liquid`
- `snippets/predictive-search-empty-state.liquid`
- `sections/search-header.liquid`
- `sections/predictive-search.liquid`
- `sections/predictive-search-empty.liquid`
- `assets/predictive-search.js`
- `assets/search-page-input.js`
- `assets/icon-search.svg`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/search.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/search-modal.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/predictive-search-styles.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/predictive-search-products-list.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/predictive-search-resource-carousel.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/predictive-search-empty-state.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/search-header.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/predictive-search.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/predictive-search-empty.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/predictive-search.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/search-page-input.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/icon-search.svg`

Archived rendered homepage truth proves mobile and desktop search buttons existed at capture time, and predictive-search markup appears elsewhere in the captured page. Runtime predictive-search behavior is Not Yet Proven.

## Proven Mega-Menu Files

Repository-backed mega-menu-related files:

- `snippets/mega-menu-list.liquid`
- `snippets/util-mega-menu-img-sizes-attr.liquid`
- `snippets/menu-font-styles.liquid`
- `snippets/submenu-font-styles.liquid`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/mega-menu-list.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/util-mega-menu-img-sizes-attr.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/menu-font-styles.liquid`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/submenu-font-styles.liquid`

Dedicated mega-menu active runtime state is Not Yet Proven.

## Proven JavaScript And Assets

Repository-backed header/navigation assets:

- `assets/header.js`
- `assets/header-menu.js`
- `assets/header-drawer.js`
- `assets/header-actions.js`
- `assets/announcement-bar.js`
- `assets/predictive-search.js`
- `assets/search-page-input.js`
- `assets/icon-menu.svg`
- `assets/icon-search.svg`

Archived source paths:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header-menu.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header-drawer.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/header-actions.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/announcement-bar.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/predictive-search.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/search-page-input.js`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/icon-menu.svg`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/icon-search.svg`

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

- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/fix_scope.md`
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

## Existing Archived Evidence References

- `staffordos/audits/no_kings/catalog_truth/homepage.html`
- `staffordos/audits/no_kings/evidence/before_evidence_record_v1.md`
- `staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png`
- `staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png`

Existing homepage catalog truth proves rendered header, announcement, mobile drawer, desktop menu, search, action, account, cart, and logo surfaces existed at capture time. It does not prove current runtime header/navigation behavior for Exercise 007.

## Source Hashes

- `sections/header-group.json`: Not Yet Proven
- `sections/header.liquid`: Not Yet Proven
- `sections/header-announcements.liquid`: Not Yet Proven
- `snippets/header-row.liquid`: Not Yet Proven
- `snippets/header-drawer.liquid`: Not Yet Proven
- `snippets/header-actions.liquid`: Not Yet Proven
- `snippets/search.liquid`: Not Yet Proven
- `snippets/search-modal.liquid`: Not Yet Proven
- `snippets/mega-menu-list.liquid`: Not Yet Proven
- `assets/header.js`: Not Yet Proven
- `assets/header-menu.js`: Not Yet Proven
- `assets/header-drawer.js`: Not Yet Proven
- `assets/header-actions.js`: Not Yet Proven
- `assets/announcement-bar.js`: Not Yet Proven
- `assets/predictive-search.js`: Not Yet Proven
- Additional header/navigation source hashes: Not Yet Proven

## Unknown Fields

- Exact active theme name at Exercise 007 baseline: Not Yet Proven
- Exact theme ID at Exercise 007 baseline: Not Yet Proven
- Exact theme version at Exercise 007 baseline: Not Yet Proven
- Source hashes for header/navigation files: Not Yet Proven
- `snippets/header-navigation.liquid`: Not Yet Proven
- `snippets/mobile-menu.liquid`: Not Yet Proven
- `snippets/navigation-drawer.liquid`: Not Yet Proven
- Current live menu item set beyond archived Home, Catalog, Contact capture: Not Yet Proven
- Current live announcement content beyond archived "Welcome to our store" capture: Not Yet Proven
- Current live desktop menu behavior: Not Yet Proven
- Current live mobile drawer behavior: Not Yet Proven
- Current live predictive-search behavior: Not Yet Proven
- Active mega-menu runtime state: Not Yet Proven
- Active customer-account runtime state: Not Yet Proven
- Active localization selector runtime state: Not Yet Proven
- Header app-block behavior: Not Yet Proven
- Header metafield dependencies: Not Yet Proven
- Header settings drift since archived theme backup: Not Yet Proven

## Rollback Implications

- Shopify rollback is not required because no implementation is permitted or performed.
- Repository rollback is limited to restoring this exercise-specific before evidence file.
- Future Exercise 007 artifacts must remain exercise-specific so they can be reverted without modifying Exercises 004-006 evidence chains.
- Any later implementation-capable header/navigation mission must define a separate rollback artifact before modifying global shell source.

## Baseline Confirmation

- Baseline assumptions: none.
- Repository-backed source references were captured.
- No inventory findings are claimed in this baseline.
- No storefront improvements are claimed.
- No UX improvements are claimed.
- No conversion improvements are claimed.
- No merchant outcomes are claimed.
- No live Shopify inspection occurred.
- No Shopify mutation occurred.
- No payment, completion, fulfillment, Abando, cart-agent-dev, or commercial proof truth was changed.
