# STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1

## 1. Mission Summary

- **mission_id:** mission_001_nokings_training
- **mission_type:** training
- **objective:** Use the NoKings Shopify store as the controlled environment for training ShopiFixer to understand, diagnose, safely modify, validate, and document Shopify theme improvements.
- **owner:** Ross
- **status:** created
- **priority:** high
- **environment:** NoKings Shopify store
- **related product:** ShopiFixer
- **related training store:** NoKings

## 2. Mission Lifecycle

This mission should move through the following states:

1. **Created**
   - Mission exists and is scoped.
2. **Inventory**
   - Theme structure and target files are identified.
3. **Baseline Captured**
   - Before evidence is captured.
4. **Training Exercise Active**
   - A specific exercise is underway.
5. **Change Proposed**
   - Smallest safe fix is identified.
6. **Change Approved**
   - Change is accepted for application.
7. **Change Applied**
   - Theme change is made in the controlled environment.
8. **Validation Complete**
   - Desktop/mobile and functional checks pass.
9. **Lesson Recorded**
   - Mission lesson is written into StaffordOS.
10. **Pattern Promoted**
    - Validated pattern is added to the reusable ShopiFixer playbook.
11. **Mission Complete**
    - Mission objectives are met and evidence is complete.

## 3. Training Scope

Mission 001 will train ShopiFixer in:

- Shopify file-system literacy
- theme inventory
- homepage edits
- product page edits
- collection page edits
- cart trust edits
- mobile UX edits
- rollback discipline
- evidence capture
- reusable fix patterns

## 4. Authority Sources

The mission must use these authorities:

- NoKings Shopify theme
- Shopify admin/theme files
- StaffordOS mission record
- ShopiFixer training plan
- before/after evidence
- validation checklist
- rollback notes

No other authority should be treated as primary for this mission.

## 5. First 10 Training Exercises

### Exercise 001
- **exercise_id:** ex_001_homepage_inventory
- **objective:** Identify the actual homepage section order and the files that control it.
- **Shopify area:** Homepage
- **likely files involved:** `templates/index.json`, `sections/hero.liquid`, `sections/product-list.liquid`
- **risk level:** low
- **validation required:** confirm section order and homepage render path
- **rollback requirement:** none, inventory only
- **expected lesson:** real Shopify pages are section-structured, not one-file monoliths

### Exercise 002
- **exercise_id:** ex_002_hero_analysis
- **objective:** Map the hero section inputs, settings, and content dependencies.
- **Shopify area:** Homepage hero
- **likely files involved:** `sections/hero.liquid`, `templates/index.json`, `snippets/button.liquid`
- **risk level:** low
- **validation required:** confirm which fields drive hero copy and CTA
- **rollback requirement:** none, inventory only
- **expected lesson:** small visual changes often start in section settings, not code

### Exercise 003
- **exercise_id:** ex_003_product_list_analysis
- **objective:** Map the product-list section and its merchandising controls.
- **Shopify area:** Homepage merchandising
- **likely files involved:** `sections/product-list.liquid`, `snippets/product-card.liquid`, `snippets/collection-card.liquid`
- **risk level:** low
- **validation required:** confirm product list settings and card composition
- **rollback requirement:** none, inventory only
- **expected lesson:** product merchandising is usually a section plus nested blocks

### Exercise 004
- **exercise_id:** ex_004_product_page_inventory
- **objective:** Identify the product page file stack and media / CTA dependencies.
- **Shopify area:** Product page
- **likely files involved:** `templates/product.json`, `sections/product-information.liquid`, `snippets/product-media-gallery-content.liquid`, `snippets/add-to-cart-button.liquid`
- **risk level:** low
- **validation required:** confirm product media and CTA file ownership
- **rollback requirement:** none, inventory only
- **expected lesson:** product pages split presentation across sections and snippets

### Exercise 005
- **exercise_id:** ex_005_collection_page_inventory
- **objective:** Identify the collection page structure and its filtering/grid behavior.
- **Shopify area:** Collection page
- **likely files involved:** `templates/collection.json`, `sections/main-collection.liquid`, `sections/collection-list.liquid`, `snippets/product-grid.liquid`
- **risk level:** low
- **validation required:** confirm collection layout and filter hooks
- **rollback requirement:** none, inventory only
- **expected lesson:** collection pages are often composition-heavy and setting-driven

### Exercise 006
- **exercise_id:** ex_006_cart_inventory
- **objective:** Identify the cart files that affect trust, totals, and checkout readiness.
- **Shopify area:** Cart
- **likely files involved:** `templates/cart.json`, `sections/main-cart.liquid`, `snippets/cart-summary.liquid`, `snippets/cart-items-component.liquid`
- **risk level:** low
- **validation required:** confirm cart summary and item rendering responsibilities
- **rollback requirement:** none, inventory only
- **expected lesson:** cart behavior is split across template, section, and component assets

### Exercise 007
- **exercise_id:** ex_007_header_navigation_inventory
- **objective:** Identify the header and mobile navigation control points.
- **Shopify area:** Header / navigation / mobile menu
- **likely files involved:** `sections/header-group.json`, `sections/header.liquid`, `sections/header-announcements.liquid`, `snippets/header-drawer.liquid`, `assets/header-menu.js`
- **risk level:** low
- **validation required:** confirm desktop and mobile navigation ownership
- **rollback requirement:** none, inventory only
- **expected lesson:** header behavior is split between JSON settings, Liquid, and JS

### Exercise 008
- **exercise_id:** ex_008_trust_badge_inventory
- **objective:** Identify how trust badges and CTA trust styling are implemented.
- **Shopify area:** Trust / CTA
- **likely files involved:** `snippets/buy-buttons-styles.liquid`, `snippets/payment-icons.liquid`, `snippets/product-badges-styles.liquid`, `snippets/button.liquid`
- **risk level:** low
- **validation required:** confirm badge and CTA source files
- **rollback requirement:** none, inventory only
- **expected lesson:** trust presentation is often snippet-driven rather than template-driven

### Exercise 009
- **exercise_id:** ex_009_footer_inventory
- **objective:** Identify footer links, signup, and policy surfaces.
- **Shopify area:** Footer
- **likely files involved:** `sections/footer-group.json`, `sections/footer.liquid`, `sections/footer-utilities.liquid`
- **risk level:** low
- **validation required:** confirm footer hierarchy and utility ownership
- **rollback requirement:** none, inventory only
- **expected lesson:** footer is usually a paired content-and-utility structure

### Exercise 010
- **exercise_id:** ex_010_safe_edit_simulation
- **objective:** Practice proposing a smallest-safe change without applying it.
- **Shopify area:** Any low-risk theme area from prior exercises
- **likely files involved:** depends on the selected prior file map
- **risk level:** medium
- **validation required:** compare proposed change against baseline
- **rollback requirement:** yes, must define the revert path before approval
- **expected lesson:** safe edits begin with a precise file map and rollback plan

## 6. Evidence Requirements

> **Amended by P11.46** (`staffordos/implementation/p11_46_mission_001_doctrine_governance_and_gate_amendment_v1.md`).
> The screenshot requirement was made conditional on a rendered/live surface being in scope, with an explicit recorded waiver otherwise (see the amendment record for the original verbatim wording and rationale). This resolves the contradiction between the former universal screenshot requirement and the source-only analysis exercises (004–010), which captured no rendered screenshots. Screenshots remain mandatory for governed applied changes.

Every training exercise must capture:

- files inspected
- files changed
- validation result
- rollback path
- lesson learned
- before/after screenshots of the affected rendered surface when a rendered or live storefront surface is in scope and screenshot capture is authorized; otherwise an explicit recorded screenshot waiver stating why no rendered capture applies (for example, source-only analysis against archived theme source)

For a governed applied change, before/after screenshots of the affected rendered surface are mandatory and may not be waived.

If an exercise does not change code (analysis, inventory, or simulation only), the evidence set must still capture:

- inspected files
- validation result
- lesson learned
- a before screenshot of the affected rendered surface, or an explicit recorded screenshot waiver as described above

## 7. Readiness Gate

> **Amended by P11.46** (`staffordos/implementation/p11_46_mission_001_doctrine_governance_and_gate_amendment_v1.md`).
> The two count-based criteria in this gate were replaced with capability-class criteria on repository evidence (see the amendment record for the original verbatim wording, evidence, and rationale). Existing Exercise 004–010 certifications remain valid and are not re-scored.

Mission 001 is successful when all of the following are true:

- NoKings theme inventory is complete
- the key files for homepage, product, collection, cart, header, footer, trust, and mobile behavior are identified
- at least 10 exercises have been completed
- at least one mechanically actionable safe-fix proposal has been produced (capability class: proposal)
- at least one governed applied-and-validated storefront change has been performed (capability class: applied change)
- at least one executed rollback rehearsal has restored a baseline and been verified (capability class: rollback)
- before/after evidence exists for every applied change
- lessons are recorded in StaffordOS
- reusable patterns are promoted into the ShopiFixer playbook

The three capability-class criteria replace the former "at least 3 exercises included a safe proposed fix pattern" and "at least 3 exercises included a rollback rehearsal or explicit rollback plan." Completion now requires that each of the three fix capability classes — proposal, applied change, executed rollback — be demonstrated at least once, rather than that a proposal or a rollback *plan* be repeated three times. A rollback *plan* alone no longer satisfies this gate; the rollback criterion requires an executed, verified rehearsal.

## 8. Next Action

Recommended first actual training exercise:

**Exercise 001 — Homepage inventory**

Reason:
- it is the safest starting point
- it establishes the real NoKings homepage file order
- it creates the file-system baseline for every later ShopiFixer fix

## Final Classification

**GO**

Mission 001 is ready to begin Exercise 001.
