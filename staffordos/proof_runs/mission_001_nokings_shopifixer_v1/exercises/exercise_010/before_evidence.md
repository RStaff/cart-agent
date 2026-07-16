# Exercise 010 Before Evidence - Safe Edit Simulation Baseline

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Exercise ID:
exercise_010

Exercise:
Exercise 010 - Safe Edit Simulation

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
Exercise 010 - Safe Edit Simulation baseline; homepage hero heading text block; proposed smallest-safe change recorded as documentation only.

Issue:
Baseline captured before the governed safe edit simulation. The selected candidate is a proposed rollback-protected copy refinement to the homepage hero heading text block; the exact original source, proposed replacement, baseline hash, dependencies, blast radius, QA checks, and rollback path are recorded below. No change is applied.

Screenshot:
Not Yet Proven (live rendered hero not captured in this baseline; archived homepage screenshots referenced below).

Notes:
- Proposal-only safe edit simulation baseline. The proposed diff exists only in this document as PROPOSED ONLY.
- No Shopify mutation, no local theme mutation, no unpublished-theme mutation, no live-theme publication occurred.
- Target file bytes are unchanged: baseline hash equals post-capture hash (proof below).

## 1. Active Scope Authority

Active scope path:

`staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/fix_scope.md`

Authority mode: analysis-only simulation. Implementation (including unpublished-theme edits) is Not Yet Governed. This baseline selects one candidate and records its baseline; it applies nothing.

## 2. Committed Source Authority

The target is read from committed, repository-backed archived NoKings theme source (the source-of-truth for Mission 001; no live theme pull is committed):

- Archived theme backup root: `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`
- Target file (repo-relative): `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json`
- Theme-pull evidence reference: `staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt`
- Archived homepage before screenshots: `staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png`, `staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png`
- The target file is Git-tracked and clean; the working-copy hash equals the committed `HEAD` blob hash (Section 8).

Homepage architecture authority (candidate provenance): Exercises 001-003 homepage inventory/hero/product-list reports and `SHOPIFIXER_PATTERN_LIBRARY_0001_HOMEPAGE_ARCHITECTURE`.

## 3. Selected Candidate Intervention

Proposed smallest-safe change: refine the homepage hero heading copy from a generic phrase to a brand-specific phrase. Copy-clarity refinement only; no conversion outcome is claimed.

This candidate satisfies the scope's selection criteria:

- repository-backed: proven in the archived backup and provenance-certified via the homepage architecture reports/pattern
- small and visible: the above-the-fold hero heading on the homepage
- easy to explain: "make the homepage hero headline brand-specific"
- reversible: a single richtext string in one page template block
- observable before and after: the hero heading is the first content on the homepage
- isolated from payment and checkout authority: the hero text has no cart/checkout/payment coupling
- local, not shared: the string occurs exactly once in the entire theme (Section 6); no shared snippet or locale key is involved
- pattern-productive: generalizes into a reusable "homepage hero copy refinement" safe-fix pattern

## 4. Exact Target File

`staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json`

## 5. Exact Target Structural Element

- Section instance: `hero_jVaWmY` (`type: hero`), first section in the homepage `order`
- Block instance: `text_YLPk4p` (`type: text`), first block in the hero `block_order`
- Setting key: `settings.text` (richtext) of block `text_YLPk4p`
- Source location: `templates/index.json` line 18

### Exact Original Source Excerpt (verbatim, committed)

Line 18 of `templates/index.json`, inside `sections.hero_jVaWmY.blocks.text_YLPk4p.settings`:

```json
"text": "<p>Browse our latest products</p>",
```

### Exact Proposed Replacement Excerpt — PROPOSED ONLY (not applied)

```json
"text": "<p>Shop the latest from NoKings Athletics</p>",
```

PROPOSED ONLY: this replacement is documentation. It has not been written to `templates/index.json`, to any local theme copy, to any unpublished theme, or to the live theme. Only the inner text of the `<p>` element changes; the block id, block type, `block_order`, all other settings, and all surrounding structure are unchanged.

## 6. Relevant Dependencies

Render chain (verified in archived source):

- `templates/index.json` → hero section `hero_jVaWmY` → `sections/hero.liquid`
- `sections/hero.liquid` renders its blocks via `{% content_for 'blocks' %}` (line 537); the hero schema accepts a `text` block type
- Block `text_YLPk4p` (`type: text`) → `blocks/text.liquid` → `{% render 'text', block: block %}`
- `snippets/text.liquid` outputs the value at line 92: `{{ block.settings.text }}` (richtext, rendered as raw HTML)

Data dependencies: none. The value is a static richtext literal; it does not reference `shop`, `collection`, product, cart, or checkout objects. (The sibling product-list block uses `{{ closest.collection.title }}`, but the hero text block does not.)

## 7. Expected Blast Radius

- String uniqueness: `"Browse our latest products"` occurs exactly once in the entire theme backup (only at `templates/index.json:18`).
- Block-id uniqueness: `text_YLPk4p` occurs only in `templates/index.json`.
- Scope of effect: homepage only. No other template, section, shared snippet, locale file, or global-shell/group JSON references this value.
- Isolation: no coupling to cart, checkout, payment, header, or footer authority.
- Drift caution: `templates/index.json` carries the auto-generated header comment warning that the Shopify admin theme editor may overwrite the file. This is a real dependency for a future applied change (the theme editor is the drift-safe application path), and it strengthens the rollback and stop-condition design; it does not increase the rendered blast radius, which remains homepage-only.

## 8. Baseline And Non-Mutation Proof

Target path:

`staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json`

- Original SHA-256 (baseline, working copy): `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Committed `HEAD` blob SHA-256 (authority): `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- SHA-256 after baseline capture (post-read): `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Equality result: baseline == committed == post-capture — **EQUAL**. The target bytes are unchanged.

Proposed-content hash (documentation only; computed by piping the committed blob through a text substitution to stdout, without touching the file):

- Proposed full-file SHA-256 (if the change were applied): `53b0c14eacd65ff47b3b567bfa0fcba1ff3f360155faa028e4a0846e9ef12b20`

This proposed hash is recorded to make a future applied change verifiable; it does not reflect any change on disk.

## 9. Expected Visible Effect

If the proposed change were applied (it is not): the homepage hero heading would read "Shop the latest from NoKings Athletics" instead of "Browse our latest products". Same placement, typography preset (`h2`), color, and layout; only the words change. No other page or element is affected.

## 10. Proposed QA Checks (for a future applied change; not run here)

- Baseline validation: confirm the original line exists verbatim at `templates/index.json:18` before any edit (hash equals baseline).
- Functional validation: homepage renders; hero section and heading render; hero button ("Shop all") and product-list unaffected.
- Responsive validation: desktop and mobile hero heading render correctly (hero uses `vertical_on_mobile: true`).
- Conversion-surface validation: hero CTA and product grid remain visible and unbroken (no conversion claim asserted).
- Reversion validation: restoring the original line restores the baseline hash exactly.
- Evidence validation: before/after screenshots and the diff recorded.

## 11. Mandatory Rollback Baseline And Steps

Rollback baseline (recovery point):

- Restore target: `templates/index.json` block `text_YLPk4p` `settings.text`
- Recorded original content: `"text": "<p>Browse our latest products</p>",`
- Baseline hash to restore to: `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Git anchor: committed `HEAD` blob of `templates/index.json` (and Mission 001 tags)

Exact rollback steps (design only; nothing to execute because nothing is applied):

1. Replace the proposed line `"text": "<p>Shop the latest from NoKings Athletics</p>",` with the recorded original `"text": "<p>Browse our latest products</p>",` in `templates/index.json` (per canon template-rollback: restore the prior JSON template structure).
2. Where a merchant edited via the theme editor, prefer restoring through the theme editor to avoid auto-generated-file drift.
3. Recompute the file SHA-256 and confirm it equals the baseline hash.

Rollback verification method:

- Restored-content SHA-256 must equal `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`.
- Homepage renders and the hero heading reads the original text; hero button and product-list render (canon reversion + functional validation).

## 12. Stop Conditions

- Wrong store (anything other than `no-kings-athletics.myshopify.com` / admin `no-kings-athletics-dev.myshopify.com`).
- Wrong theme: target-file content does not match the archived `dev_horizon_150895657158` baseline hash.
- Missing backup or missing baseline hash.
- Unproven target authority: the target is not the proven homepage hero text block.
- Unexpected dependency: any shared-snippet, locale, global-shell, or checkout coupling surfaces.
- Validator failure or regression at any phase.
- Unrelated working-tree changes outside this exercise's declared artifacts.
- Live-publication risk: any step would require a Shopify write, theme upload, or publication.
- Inability to prove rollback: original content/hash cannot be recorded or restored exactly.

## 13. Remaining Unknowns (Not Yet Proven)

- Live homepage configuration and rendered hero state on the live NoKings store.
- Current theme name, theme ID, theme version, and live source hashes (archive hash proven; live hash Not Yet Proven).
- Whether the live homepage hero still contains this exact value (theme-editor drift).
- Runtime, conversion, and merchant-outcome effects of the proposed copy.
- Any app-block or metafield influence on the homepage hero (none found in archived source; live Not Yet Proven).

## 14. Confirmations

- No Shopify mutation occurred.
- No local theme source was modified (target bytes unchanged; baseline hash equals post-capture hash).
- No unpublished-theme mutation and no live-theme publication occurred.
- No patch was applied to any theme file; the proposed diff exists only in this document as PROPOSED ONLY.
- Exercises 004-009 artifacts remain unchanged.
- No payment, completion, Abando, commercial pilot, or prior-exercise truth was changed.
