# Exercise 009 Fix Scope - Footer Inventory

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Product:
ShopiFixer

Exercise ID:
exercise_009

Exercise:
Exercise 009 - Footer Inventory

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

Implementation Permitted:
No

Scope Authority:
Exercise-specific

Active Scope Path:
staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_009/fix_scope.md

Exact Problem / Learning Objective:
Exercise 009 - Footer Inventory

Identify footer links, signup, and policy surfaces; confirm footer hierarchy and utility ownership; establish the footer as a paired content-and-utility structure.

Target Page / Template / Artifact:
Exercise 009 - Footer Inventory; sections/footer-group.json; sections/footer.liquid; sections/footer-utilities.liquid

Smallest Governed Scope:
Create a read-only source inventory of the NoKings footer architecture using only Exercise 009 authority and existing repository-backed NoKings evidence.

## Proven Repository Targets

All paths verified in the archived NoKings theme backup:
`staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

Footer group entry point and sections:

- `sections/footer-group.json`
- `sections/footer.liquid`
- `sections/footer-utilities.liquid`
- `sections/password-footer.liquid`

Footer blocks configured in the archived group file:

- `blocks/email-signup.liquid`
- `blocks/footer-copyright.liquid`
- `blocks/footer-policy-list.liquid`
- `blocks/social-links.liquid`
- `blocks/group.liquid`
- `blocks/text.liquid`

Footer blocks schema-supported but not configured in the archived group file:

- `blocks/payment-icons.liquid`
- `blocks/menu.liquid`
- `blocks/button.liquid`
- `blocks/follow-on-shop.liquid`
- `blocks/icon.liquid`
- `blocks/image.liquid`
- `blocks/logo.liquid`
- `blocks/jumbo-text.liquid`
- `blocks/_divider.liquid`

Settings and schema:

- `config/settings_data.json`
- `config/settings_schema.json`

Supporting source referenced by footer blocks:

- `blocks/_social-link.liquid`
- `blocks/_footer-social-icons.liquid` (active usage Not Yet Proven)

## Explicitly Disproven Or Not Yet Proven Candidates

Disproven (verified absent from archived source):

- `snippets/footer-menu.liquid`: does not exist; footer menu support lives in `blocks/menu.liquid`.
- `snippets/payment-icons.liquid`: does not exist; payment icons live in `blocks/payment-icons.liquid` (Exercise 008 carry-forward).

Not Yet Proven:

- Footer-owned localization selector: archived source renders `snippets/localization-form.liquid` from `sections/header.liquid` and `snippets/header-drawer.liquid` only.
- App-block runtime behavior (`@app` is schema-supported in the footer section): Not Yet Proven.
- Metafield-driven footer content: Not Yet Proven.
- Live policy values and merchant-authored policy content: Not Yet Proven.
- Live payment methods and live payment icons: Not Yet Proven.
- Live newsletter/email-signup behavior: Not Yet Proven.
- `blocks/_footer-social-icons.liquid` active usage: Not Yet Proven.
- `sections/password-footer.liquid` runtime role: Not Yet Proven.
- Footer-specific JavaScript assets: Not Yet Proven (no footer-named asset found in archived source).
- Mobile footer runtime behavior: Not Yet Proven (source supports `vertical_on_mobile`; runtime unproven).
- Current live footer configuration and rendering: Not Yet Proven.
- Current theme name: Not Yet Proven.
- Current theme ID: Not Yet Proven.
- Current theme version: Not Yet Proven.
- Source hashes for footer-related files: Not Yet Proven.

## In Scope

- Footer group entry-point inventory (`footer-group.json` order, sections, block trees, settings)
- Footer and footer-utilities section hierarchy inventory
- Footer menu/navigation ownership inventory (schema support versus absent configuration)
- Policy-link source-support inventory (`footer-policy-list`, `shop.policies` runtime dependency)
- Email-signup source-flow inventory including the `{% form 'customer' %}` platform boundary
- Social-link source-support inventory
- Payment-icon source-support inventory (schema support versus absent configuration; Exercise 008 boundary carried forward)
- Copyright/legal surface inventory (`footer-copyright`, `shop.name`, `powered_by_link`)
- Block and schema dependency inventory for footer surfaces
- Configured versus merely schema-supported block distinction
- Localization ownership confirmation across the global shell
- Password-footer surface identification
- Footer relationship to trust, localization, and global-shell authority
- App-block and metafield unknown capture
- Repository-backed risk and rollback implication capture
- Reusable ShopiFixer footer knowledge capture

## Out of Scope

- Shopify mutation
- Theme file edits
- Shopify Admin, CLI, API, or storefront execution
- Live storefront inspection
- Runtime behavior claims
- Merchant policy validation or edits
- Enabled payment-method validation
- Newsletter delivery validation or submission
- Payment or completion state changes
- App-block implementation or configuration
- Metafield writes
- Footer, menu, policy, social, signup, or payment-icon implementation
- Before evidence capture in this scope mission
- Footer inventory execution in this scope mission
- After evidence capture
- Proof package generation
- Certification
- Exercise 010 work
- Exercises 004-008 artifacts (immutable)
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

Exercise 009 authorizes repository-backed analysis only. Reversible implementation is Not Yet Governed for this exercise.

## Required Before Evidence

The next governed artifact is:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_009/before_evidence.md`

Required baseline content:

- Mission ID and Exercise ID
- Merchant and canonical store
- Analysis-only authority
- Active Exercise 009 scope path
- Archived theme-pull references
- Proven footer group, section, block, and settings source references
- The header-owned localization finding
- Disproven candidates restated (footer-menu and payment-icons snippets)
- Candidate targets marked Not Yet Proven
- Unknown fields explicitly marked Not Yet Proven
- Confirmation no Shopify mutation occurred

The baseline must not claim runtime footer behavior, live policies, live social URLs, live signup behavior, live payment icons, screenshots, source hashes, theme identity, conversion outcomes, or merchant outcomes unless repository truth proves them.

## Inventory Method

The future inventory must:

- Read only the Exercise 009 scope and baseline as active authority.
- Use archived NoKings theme source and certified Exercise 004-008 knowledge.
- Trace from `footer-group.json` JSON group order into section hierarchy, block types, snippets, assets, settings, and schema.
- Record the configured block trees exactly as archived (group text blocks, email-signup, footer-copyright, footer-policy-list, social-links).
- Record schema-supported but unconfigured block types (`menu`, `payment-icons`, `@app`, and other content blocks) as source support only.
- Map policy, signup, social, copyright, and payment surfaces to their owning blocks.
- Separate footer content ownership (`footer` section) from utility ownership (`footer-utilities` section).
- Separate source dependencies from runtime unknowns.
- Separate theme-rendered policy links from merchant-authored policy content.
- Separate email-signup source markup from Shopify platform form handling.
- Separate payment-icon schema support from enabled payment methods.
- Confirm localization ownership rather than assuming a footer selector.
- Record unknowns as Not Yet Proven.

## Success Criteria

- The active footer hierarchy is mapped from `footer-group.json` through both sections.
- Content ownership and utility ownership are separated.
- Configured blocks are distinguished from merely schema-supported blocks.
- Policy, signup, social, copyright, and payment-icon sources are identified.
- Assumptions are marked Not Yet Proven; disproven candidates are not propagated.
- No runtime or merchant claims are fabricated.
- Exercise 009 scope remains exercise-specific.
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

- Restore or remove `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_009/fix_scope.md` through Git history and mission tags.
- Do not alter Exercises 004-008.
- Do not alter mission-root index/deprecation files.

## Knowledge-Capture Requirement

Exercise 009 must produce reusable ShopiFixer knowledge about:

- footer group entry-point and content/utilities pairing
- schema-supported versus configured footer blocks
- policy-link rendering versus merchant policy authorship boundaries
- email-signup source versus platform form runtime boundaries
- footer payment-icon support versus payment authority
- social-link configuration surfaces
- localization ownership across the global shell
- footer drift risk from auto-generated group JSON
- footer intersection with trust and checkout readiness

## Source Artifacts

- `staffordos/implementation/p11_30_exercise_009_footer_inventory_plan_v1.md`
- `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`
- `SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md`
- `SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md`
- `SHOPIFIXER_COMPETENCY_ENGINE_V1.md`
- `staffordos/missions/mission_001_nokings_shopifixer_binding_v1.json`
- `staffordos/qa/output/nokings_mission_001_readiness_v1.json`
- `staffordos/implementation/p11_28_mission_001_exercise_008_certification_v1.md`
- `staffordos/implementation/p11_29_mission_001_architecture_checkpoint_v1.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/mission_proof_package.md`
- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`
- `staffordos/shopifixer/patterns/pattern_002_homepage_primary_cta_emphasis_v1.md`

## Final Scope Decision

GO.

Repository-backed justification:

- Exercise 009 is canonical in Mission 001.
- Exercise 008 is certified and Mission 001 remains active.
- The current readiness output identifies Exercise 009 planning as the next blocker.
- The P11.30 planning artifact defines repository-proven footer targets, disproven candidates, and explicit unknowns.
- Exercise 009 is analysis-only.
- No Shopify mutation, payment, completion, Abando, commercial pilot, or prior-exercise change is authorized.
