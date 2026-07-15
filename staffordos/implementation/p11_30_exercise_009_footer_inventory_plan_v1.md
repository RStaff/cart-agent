# P11.30 Exercise 009 Footer Inventory Plan

Status:
Complete

Document Type:
Exercise planning artifact (read-only, documentation-only)

## Mission And Exercise Identity

- Mission ID: `mission_001`
- Mission: Mission 001 - NoKings Shopify Engineering Training
- Exercise ID: `ex_009_footer_inventory`
- Exercise: Exercise 009 - Footer Inventory
- Product: ShopiFixer
- Environment type: `controlled_training`
- Payment required: `false`

## Merchant And Canonical Store

- Merchant: NoKings Athletics
- Canonical store: `no-kings-athletics.myshopify.com`
- Storefront URL: `https://no-kings-athletics.myshopify.com`
- Shopify admin identity: `no-kings-athletics-dev.myshopify.com`
- Proof run: `mission_001_nokings_shopifixer_v1`

## Precondition Verification

Verified before this plan was created:

- Exercise 008 certification exists: `staffordos/implementation/p11_28_mission_001_exercise_008_certification_v1.md`
- Readiness reports: `CONDITIONAL_GO` | phase `exercise_009_planning` | blocker `Exercise 009 Planning Missing` | next `Plan Exercise 009 - Footer Inventory`
- Exercise 008 lifecycle tags exist:
  - `p11.27-nokings-exercise-008-proof-package`
  - `p11.28-nokings-exercise-008-certification`
  - `p11.28.1-nokings-post-trust-certification-readiness`

## Canonical Objective

From `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md`, Exercise 009:

- Objective: identify footer links, signup, and policy surfaces.
- Shopify area: Footer
- Risk level: low
- Validation required: confirm footer hierarchy and utility ownership
- Rollback requirement: none, inventory only
- Expected lesson: footer is usually a paired content-and-utility structure

## Authority Mode

**analysis-only.**

Repository-backed basis:

- The canonical mission record defines Exercise 009 as inventory-only with no rollback requirement.
- No canonical curriculum or doctrine artifact proves implementation authority for Exercise 009.
- Reversible implementation therefore remains **Not Yet Governed** for this exercise.

No Shopify mutation, theme edit, admin/CLI/API execution, or live inspection is authorized.

## Repository-Proven Candidate Targets

All paths verified in the archived NoKings theme backup:
`staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`

Footer group entry point and sections:

- `sections/footer-group.json` — auto-generated group file (drift-prone, same caution as `header-group.json` from Exercise 007). Proven order: `footer_m9NzUG` (type `footer`) then `footer_utilities_jLGE8U` (type `footer-utilities`).
- `sections/footer.liquid` — footer section; renders blocks via `content_for 'blocks'`; schema supports block types `_divider`, `@app`, `button`, `follow-on-shop`, `group`, `icon`, `image`, `menu`, `payment-icons`, `text`, `logo`, `jumbo-text`, `social-links`, `email-signup`.
- `sections/footer-utilities.liquid` — utilities section; renders blocks via `content_for 'blocks'`; schema supports `footer-copyright`, `footer-policy-list`, `social-links`.
- `sections/password-footer.liquid` — separate password-page footer surface (exists; role to be confirmed during inventory).

Archived footer-group configuration facts (source evidence only):

- Footer section blocks: one `group` block containing two `text` blocks (`<h2>Join our email list</h2>` and `<p>Get exclusive deals and early access to new products.</p>`) plus one `email-signup` block (label `Sign up`, integrated arrow button, border radius 100).
- Footer-utilities blocks in order: `footer-copyright` (`show_powered_by: true`), `footer-policy-list`, `social-links` (Facebook, Instagram, YouTube, TikTok, X URLs populated with platform-root defaults; Threads, LinkedIn, Bluesky, Snapchat, Pinterest, Tumblr, Vimeo, custom empty).
- No `payment-icons` block appears in the archived footer-group block order — footer payment icons are **schema-supported but not configured** in archived source.
- No `menu` block appears in the archived footer-group block order — footer menu/navigation is **schema-supported but not configured** in archived source.

Footer-related blocks (proven files):

- `blocks/email-signup.liquid` — uses `{% form 'customer' %}` (Shopify platform form), success/error states, arrow icon.
- `blocks/footer-copyright.liquid` — renders `shop.name` linked to `routes.root_url` and optional `powered_by_link`.
- `blocks/footer-policy-list.liquid` — renders only when `shop.policies.size > 0`; opens a `terms-policies-popover` listing `policy.url` links; uses `settings.popover_color_scheme`.
- `blocks/social-links.liquid` — renders platform icons via `render 'icon'` from per-platform URL settings.
- `blocks/payment-icons.liquid` — carried forward from Exercise 008: iterates `shop.enabled_payment_types` through `payment_type_svg_tag`.
- `blocks/menu.liquid` — footer-capable menu block (schema-supported in footer).
- `blocks/group.liquid`, `blocks/text.liquid`, `blocks/icon.liquid`, `blocks/image.liquid`, `blocks/logo.liquid`, `blocks/jumbo-text.liquid`, `blocks/button.liquid`, `blocks/follow-on-shop.liquid`, `blocks/_divider.liquid` — schema-supported footer content blocks.
- `blocks/_footer-social-icons.liquid` and `blocks/_social-link.liquid` — exist; render relationship to the active footer is **Not Yet Proven** (no section/snippet reference found by name).

Localization (verified, with a corrective finding):

- `snippets/localization-form.liquid` and `assets/localization.js` exist, but in archived source they are rendered by `sections/header.liquid` and `snippets/header-drawer.liquid` only. A **footer** localization/language/country selector is **Not Yet Proven** for this theme — the inventory must not assume one.

Settings and schema:

- `config/settings_data.json`, `config/settings_schema.json` — popover color scheme, social settings support, and any footer-relevant global settings.

## Not Yet Proven Targets

- `snippets/footer-menu.liquid`: **does not exist** in archived source (candidate disproven; menu support lives in `blocks/menu.liquid`).
- `snippets/payment-icons.liquid`: **does not exist** in archived source (candidate disproven; payment icons live in `blocks/payment-icons.liquid`, carried forward from Exercise 008).
- Footer localization selector: Not Yet Proven (localization is header-owned in archived source).
- `blocks/_footer-social-icons.liquid` active usage: Not Yet Proven.
- `sections/password-footer.liquid` runtime role: Not Yet Proven.
- Active footer app blocks (`@app` is schema-supported): Not Yet Proven.
- Metafield-driven footer content: Not Yet Proven.
- Footer-specific JavaScript assets: Not Yet Proven (no footer-named asset found; behavior may be CSS-only or shared).
- Mobile footer runtime behavior: Not Yet Proven (source supports `vertical_on_mobile`; runtime unproven).
- Live footer configuration, live policy pages, live social URLs, live email-signup behavior, live payment icons, live copyright rendering: Not Yet Proven.
- Current theme name / ID / version and source hashes: Not Yet Proven.

## In Scope

- Footer group JSON entry-point inventory (`footer-group.json` order, sections, block trees, settings)
- Footer section hierarchy inventory (`footer.liquid`, `footer-utilities.liquid`)
- Footer content-block support inventory (schema-supported block types versus configured blocks)
- Email-signup source inventory including the `{% form 'customer' %}` platform boundary
- Policy-link source inventory (`footer-policy-list`, `shop.policies` runtime dependency)
- Copyright/legal copy source inventory (`footer-copyright`, `shop.name`, `powered_by_link`)
- Social-link source inventory (`social-links`, icon rendering, configured URLs)
- Footer payment-icon support inventory (schema support versus absent configuration; Exercise 008 carry-forward)
- Footer menu support inventory (schema support versus absent configuration)
- Localization ownership confirmation (header-owned versus footer-owned)
- Password-footer surface identification
- Settings/schema dependency inventory for footer surfaces
- Mobile footer source-support capture (`vertical_on_mobile` and related settings)
- Footer relationship to trust, checkout readiness, and global-shell authority
- App-block and metafield unknown capture
- Repository-backed risk and rollback implication capture
- Reusable ShopiFixer footer knowledge capture

## Out Of Scope

- Shopify mutation of any kind
- Theme file edits
- Shopify Admin, CLI, API, or storefront execution
- Live Shopify inspection or runtime testing
- Footer, menu, policy, social, signup, or payment-icon implementation
- Newsletter/email provider testing or submission
- Policy content edits
- App installation or configuration
- Metafield writes
- Scope creation, evidence capture, inventory execution, proof package, or certification (later governed phases)
- Exercises 004-008 artifacts (immutable)
- Abando authority
- Generic `cart-agent-dev` commercial pilot artifacts
- Payment, fulfillment, commercial proof, or completion truth changes

## Before-Evidence Requirements

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_009/before_evidence.md` must capture:

- Mission ID and Exercise ID
- Merchant and canonical store
- Analysis-only authority and `Payment Required: false`
- Active Exercise 009 scope path
- Archived theme-pull references (`theme_pull_test_v2.txt`, archive README, theme backup paths)
- Proven footer group, section, block, and settings source references
- The header-owned localization finding
- Candidate and unknown fields explicitly marked Not Yet Proven (including theme identity and source hashes)
- Confirmation no Shopify mutation occurred
- No claims of runtime footer behavior, live policies, live social URLs, live signup behavior, live payment icons, screenshots, or merchant outcomes

## Inventory Method

The Exercise 009 inventory must:

- Read only the Exercise 009 scope and baseline as active authority.
- Use archived NoKings theme source and certified Exercise 004-008 knowledge.
- Trace from `footer-group.json` into sections, blocks, snippets, assets, settings, and schema.
- Separate schema-supported block types from blocks actually configured in the archived group file.
- Separate source support from runtime storefront behavior.
- Separate theme-rendered policy links from merchant-authored policy content (`shop.policies` is runtime data).
- Separate email-signup source markup from Shopify platform form handling.
- Separate payment-icon schema support from enabled payment methods (Exercise 008 boundary).
- Confirm localization ownership rather than assuming a footer selector.
- Record all unknowns as Not Yet Proven.

## After-Evidence Requirements

`.../exercise_009/after_evidence.md` must confirm:

- Footer Inventory completed as repository-backed analysis
- Footer group hierarchy and utility ownership identified (the canonical validation requirement)
- Content-versus-utilities pairing captured (the expected lesson)
- Policy, copyright, social, signup, payment-icon, and menu source support classified
- Runtime, merchant-policy, app, and metafield unknowns remain explicit
- No Shopify mutation occurred
- No storefront, conversion, merchant-outcome, payment, or completion claims

## Proof-Package Requirements

`.../exercise_009/mission_proof_package.md` must:

- Use only the five Exercise 009 exercise-specific authority artifacts
- Carry `Status: Assembled`, canonical store, and exercise identity fields recognized by the readiness evaluator
- Summarize scope, baseline, inventory, and after evidence
- Include footer architecture, block support versus configuration, policy/copyright/social/signup/payment-icon/menu findings, localization ownership, settings dependencies, trust and global-shell intersections, reusable patterns, risks, unknowns, rollback implications, and an Exercise 010 recommendation
- Exclude all unsupported claims (live footer state, live policies, live payment methods, runtime behavior, conversion, payment, certification, mission completion)

## Certification Requirements

The Exercise 009 certification memo (expected `staffordos/implementation/p11_3X_mission_001_exercise_009_certification_v1.md`) must follow the certified Exercise 005-008 pattern:

- Identity block (mission, exercise, merchant, canonical store, product, environment, authority, payment)
- Evidence Chain Verification section
- A "Footer Architecture Certified" findings section
- Repository Truth Reviewed section
- Unsupported Claims Explicitly Excluded section
- Mutation And Rollback Assessment section
- Readiness Assessment section
- Next Canonical Exercise section recommending `ex_010_safe_edit_simulation` / `Exercise 010 - Safe Edit Simulation`
- Certification decision (`GO` / `CONDITIONAL GO`) and "No Shopify mutation occurred" confirmation

A minimal evaluator/validator recognition update for Exercise 009 phases will be required at the scope, proof, and certification missions (the evaluator currently defines exercises 004-008); those changes belong to the later missions, not to this plan.

## Success Criteria

- Exercise 009 scope, when created, is exercise-specific and references only repository-proven targets.
- Disproven candidates (`snippets/footer-menu.liquid`, `snippets/payment-icons.liquid`) are not propagated as targets.
- Schema-supported versus configured block distinction is preserved throughout the evidence chain.
- Localization ownership is stated from source, not assumed.
- Not Yet Proven targets remain explicit at every phase.
- No mission-root payload file is used as active authority.
- No Shopify mutation occurs.
- No payment, completion, Abando, commercial pilot, or prior-exercise truth changes occur.
- The next governed phase after scope becomes Before Evidence, then Inventory, After Evidence, Proof Package, and Certification.

## Rollback Expectations

Shopify rollback required:

- No. Exercise 009 is analysis-only; no mutation is authorized.

Repository rollback:

- Each Exercise 009 lifecycle artifact remains individually restorable through Git history and mission tags, following the Exercise 008 tag pattern (`p11.27` / `p11.28` / `p11.28.1`).
- This plan itself rolls back by deleting `staffordos/implementation/p11_30_exercise_009_footer_inventory_plan_v1.md`.
- Exercises 004-008 and mission-root index files must not be altered.

## Knowledge-Capture Requirements

Exercise 009 must produce reusable ShopiFixer knowledge about:

- footer group entry-point and content/utilities pairing
- schema-supported versus configured footer blocks
- policy-link rendering versus merchant policy authorship boundaries
- email-signup source versus platform form runtime boundaries
- footer payment-icon support versus payment authority (Exercise 008 boundary, footer-applied)
- social-link configuration surfaces
- localization ownership across the global shell
- footer drift risk from auto-generated group JSON
- footer intersection with trust and checkout readiness

## Carry-Forward Knowledge From Exercises 004-008

- **Header/navigation (Ex 007):** the footer is the second half of the global shell. `footer-group.json` carries the same auto-generated drift risk as `header-group.json`; global-shell changes are high-blast-radius. Localization forms proved header-owned; Exercise 009 confirms whether the footer adds any.
- **Trust/reassurance (Ex 008):** footer payment-icon support (`sections/footer.liquid` allowing `blocks/payment-icons.liquid`) is already certified as source support only. Exercise 009 adds the finding that the archived footer configuration does not include the payment-icons block — display support without configured display.
- **Payment-icon boundary (Ex 008):** payment icons never prove enabled payment methods, acceptance, settlement, or payment authority.
- **Merchant policy claims (Ex 006/008):** `footer-policy-list` renders `shop.policies` — theme source proves the rendering path, never the policy content; live policy truth stays Not Yet Proven.
- **Cart/checkout readiness (Ex 006):** the footer sits outside the cart-to-checkout flow but contributes trust context (policies, payment icons, contact/social presence) on every page.
- **Evidence discipline (Ex 004-008):** exercise-specific authority, immutable prior chains, index-only mission roots, and explicit unknowns carry forward unchanged.

## Risks And Remaining Unknowns

Risks:

- Treating schema-supported footer blocks (menu, payment-icons, @app) as configured footer content would overstate archived truth.
- Treating rendered policy links as merchant policy claims would cross the merchant-authorship boundary.
- Treating the archived email-signup block as a working subscription flow would claim platform runtime behavior.
- Treating archived social URLs (platform-root defaults) as live merchant social presence would overclaim.
- Treating archived group JSON as current live footer configuration ignores admin/theme-editor drift.
- Assuming a footer localization selector would contradict archived source (header-owned).

Remaining unknowns (all Not Yet Proven):

- Live footer configuration and rendering
- Merchant-authored policy content and live policy pages
- App-provided footer content (`@app` block usage)
- Metafield-driven footer content
- Enabled payment methods and live payment icons
- Runtime localization behavior anywhere in the shell
- Email-signup runtime behavior and customer-list truth
- Checkout behavior outside theme authority
- Mobile footer runtime behavior
- Theme identity and source hashes

## Exercise-Specific Authority Path

Recommended authority directory:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_009/`

Expected lifecycle artifacts (to be created only in their own governed phases — none created by this plan):

1. `fix_scope.md`
2. `before_evidence.md`
3. `execution_notes.md`
4. `after_evidence.md`
5. `mission_proof_package.md`

## Expected Readiness Transitions

| After governed step | Phase | Blocker | Next safe action |
|---|---|---|---|
| This plan (no readiness change) | `exercise_009_planning` | `Exercise 009 Planning Missing` | Plan Exercise 009 - Footer Inventory |
| Scope created + evaluator recognition | `before_evidence` | `Before Evidence Missing` | Capture Before Evidence |
| Baseline captured | `footer_inventory` | `Footer Inventory Not Performed` | Perform governed read-only footer inventory |
| Inventory complete | `after_evidence` | `After Evidence Missing` | Capture After Evidence |
| After evidence complete | `proof_package` | `Proof Package Missing` | Generate Exercise 009 Mission Proof Package |
| Proof package assembled | `mission_certification` | `Mission Certification Missing` | Certify Exercise 009 |
| Certification recognized | `exercise_010_planning` | `Exercise 010 Planning Missing` | Plan Exercise 010 - Safe Edit Simulation |

Status remains `CONDITIONAL_GO`, payment `false`, completion `false` throughout. The evaluator's Exercise 009 phase definitions will be added in the scope mission, mirroring the Exercise 008 pattern.

## Recommended Next Governed Mission

**P11.31 — Establish Exercise 009 governed scope**, creating:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_009/fix_scope.md`

together with the minimal evaluator/binding-validator recognition for Exercise 009 (definition entry and state-sensitive assertions), following the exact pattern proven for Exercise 008.

## Planning Decision

**GO** for starting Exercise 009 scope.

Repository-backed justification:

- All preconditions verified (Exercise 008 certified, readiness at `exercise_009_planning`, lifecycle tags present).
- Exercise 009 is canonical in Mission 001 and is the evaluator's declared next planning phase.
- The footer surface is fully present in archived source: group entry point, both sections, and all supporting blocks verified file-by-file.
- Candidate targets are proven or explicitly disproven; unknowns are explicit.
- The exercise is analysis-only, low-risk, and requires no Shopify mutation or rollback.
- No payment, completion, Abando, commercial pilot, or prior-exercise truth is affected.
