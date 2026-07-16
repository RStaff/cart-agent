# Exercise 010 Execution Notes - Safe Edit Simulation

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
Exercise 010 - Safe Edit Simulation; homepage hero heading text block; proposed diff and rollback design recorded as documentation only.

Issue:
Governed safe edit simulation performed for the proposed rollback-protected homepage hero copy refinement. The proposed diff is mechanically actionable but not applied; the baseline hash, dependency and blast-radius analysis, QA plan, and rollback rehearsal design are recorded below. No change is applied to any theme.

Notes:
- Proposal-only safe edit simulation. The proposed diff exists only in this document, labeled PROPOSED DIFF — NOT APPLIED.
- No Shopify mutation, no local theme mutation, no unpublished-theme mutation, no live-theme publication, no patch file.
- Target file bytes unchanged: committed hash == working-tree hash before == working-tree hash after (Section 11).

## 1. Mission And Exercise Identity

- Mission ID: `mission_001`
- Mission: Mission 001 - NoKings Shopify Engineering Training
- Exercise ID: `exercise_010`
- Exercise: Exercise 010 - Safe Edit Simulation
- Product: ShopiFixer
- Merchant: NoKings Athletics
- Canonical store: `no-kings-athletics.myshopify.com`
- Environment: `controlled_training`
- Active scope: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/fix_scope.md`
- Baseline: `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_010/before_evidence.md`

## 2. Simulation Authority

- analysis-only
- proposal-only (a change is proposed, never applied)
- implementation prohibited (including unpublished-theme edits; Not Yet Governed)
- Shopify mutation prohibited
- local theme mutation prohibited

The proposed diff is documentation. Applying it — anywhere — is outside Exercise 010 authority and requires a new explicit canonical authority gate in a later mission.

## 3. Candidate-Selection Rationale

The candidate (established by Exercise 010 scope and before evidence) is the homepage hero heading copy. It is:

- visible: the first, above-the-fold content on the homepage
- homepage-local: lives only in `templates/index.json`; the string and block id occur exactly once theme-wide
- low risk: a single richtext string; no logic, layout, or structure changes
- isolated: no coupling to shared snippets, locales, or global-shell/group JSON
- merchant-explainable: "make the homepage hero headline brand-specific" — one sentence
- reversible: one line restores the exact baseline
- checkout/payment-independent: the hero text has no cart, checkout, or payment coupling
- suitable for a safe-fix pattern: generalizes into a reusable "homepage hero copy refinement" pattern

## 4. Exact Target Authority

- Exact file: `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json`
- Section/block/settings path: `sections.hero_jVaWmY` (`type: hero`) → `blocks.text_YLPk4p` (`type: text`) → `settings.text`
- Structural location: `templates/index.json` line 18; `hero_jVaWmY` is first in `order`; `text_YLPk4p` is first in the hero `block_order`
- Render chain:
  - `templates/index.json` → hero section `hero_jVaWmY` → `sections/hero.liquid`
  - `sections/hero.liquid` renders blocks via `{% content_for 'blocks' %}` (line 537); hero schema accepts a `text` block
  - block `text_YLPk4p` → `blocks/text.liquid` → `{% render 'text', block: block %}`
  - `snippets/text.liquid` line 92 outputs `{{ block.settings.text }}` (richtext, raw HTML)
- Relevant dependencies: none — the value is a static richtext literal; it references no `shop`, `collection`, product, cart, or checkout object
- Uniqueness findings: `"Browse our latest products"` occurs exactly once in the entire theme backup (`templates/index.json:18`); block id `text_YLPk4p` occurs only in `templates/index.json`

## 5. Exact Proposed Diff

PROPOSED DIFF — NOT APPLIED

```diff
--- a/templates/index.json
+++ b/templates/index.json
@@ sections.hero_jVaWmY.blocks.text_YLPk4p.settings @@
-            "text": "<p>Browse our latest products</p>",
+            "text": "<p>Shop the latest from NoKings Athletics</p>",
```

This diff is documentation only. It has not been written to `templates/index.json`, any local theme copy, any unpublished theme, or the live theme. No patch file was created or applied. Only the inner text of the `<p>` element changes; block id, block type, `block_order`, all other settings, and surrounding structure are unchanged.

## 6. Intended Visible Effect

If applied (it is not): the homepage hero heading would read "Shop the latest from NoKings Athletics" instead of "Browse our latest products". Same placement, typography preset (`h2`), color, and layout; only the words change.

No conversion improvement, revenue impact, or merchant outcome is claimed. This is a copy-clarity/brand-specificity refinement only.

## 7. Dependency And Blast-Radius Analysis

- Homepage-only expected effect: confirmed — the string and block id are unique to `templates/index.json`.
- No cart coupling: confirmed.
- No checkout coupling: confirmed.
- No payment coupling: confirmed.
- No header/footer/global-shell structural change: confirmed — the change is inside a homepage template block, not a group JSON or shared section.
- No JavaScript behavior: confirmed — the value renders as static richtext via `snippets/text.liquid`; no asset/JS involved.
- No app-block or metafield dependency proven: confirmed for archived source (none found); live app/metafield influence remains Not Yet Proven.

## 8. Risk Assessment

- Technical risk: low — single richtext literal; valid JSON string edit; no schema/type change.
- Visual risk: low — text length is comparable; same typography preset and container; wrap set to `pretty`.
- Merchant-claim risk: low if presented as copy refinement; would become high if framed as a proven conversion win (prohibited — see Section 13).
- Theme-editor drift risk: medium — `templates/index.json` is auto-generated and may be overwritten by the Shopify admin theme editor; a future applied change should prefer the theme editor as the drift-safe path and re-verify the baseline before editing.
- Runtime uncertainty: the live homepage may already differ from the archived value (drift); rendered result on the live store is Not Yet Proven.

## 9. Proposed QA Plan (defined, not performed)

For a future applied change only:

- Baseline hash verification: confirm `templates/index.json` equals baseline `5bd32f69…bdb4` before editing.
- Rendered homepage check: homepage loads without error.
- Hero location check: the new copy renders in the hero heading position.
- Desktop check: hero heading renders correctly on desktop.
- Mobile check: hero heading renders correctly on mobile (`vertical_on_mobile: true`).
- CTA and navigation intact: hero "Shop all" button, header, and product grid render and function.
- Unrelated surfaces unchanged: product-list, footer, cart, and other pages unaffected.
- Post-change source hash capture: record the applied-file SHA-256 (expected `53b0c14e…2b20`).
- Rollback verification: confirm restoring the original line returns the file to baseline `5bd32f69…bdb4`.

## 10. Mandatory Rollback Rehearsal Design (design only, not executed)

- Baseline source: `templates/index.json` (archived backup `dev_horizon_150895657158`) + committed `HEAD` blob + Mission 001 tags.
- Original content: `"text": "<p>Browse our latest products</p>",`
- Baseline hash: `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Proposed content: `"text": "<p>Shop the latest from NoKings Athletics</p>",`
- Proposed full-file hash (if applied): `53b0c14eacd65ff47b3b567bfa0fcba1ff3f360155faa028e4a0846e9ef12b20`
- Exact reversal action: replace the proposed line with the recorded original line in `templates/index.json` (canon template-rollback: restore the prior JSON template structure); where a merchant edited via the theme editor, restore via the theme editor to avoid drift.
- Restored expected content: `"text": "<p>Browse our latest products</p>",`
- Restored expected hash: `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Verification sequence:
  1. Recompute file SHA-256; assert equal to baseline `5bd32f69…bdb4`.
  2. Reload homepage; assert hero heading reads the original text.
  3. Assert hero button, header, and product-list render (canon reversion + functional validation).
- Stop conditions: baseline hash mismatch; missing backup; unexpected file state; wrong store/theme; any step requiring a Shopify write or publication; inability to restore original content/hash exactly.

Rollback was not executed because nothing was applied.

## 11. Non-Mutation Proof

Target path: `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json`

- Committed target hash (`HEAD` blob): `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Working-tree target hash before simulation: `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Working-tree target hash after simulation: `5bd32f693497830397f0b2b43dbcd9015fefd3db5b1505535f168312eb18bdb4`
- Equality result: committed == before == after — **EQUAL**. Target bytes unchanged.
- Git status for the target file: clean (no working-tree diff).

## 12. Simulation Result

- Proposal completed: yes.
- Proposed diff is mechanically actionable: yes (exact file, path, original and replacement lines, and hashes recorded).
- No implementation occurred.
- No Shopify mutation occurred.
- No local theme mutation occurred.
- Rollback design completed: yes.
- Rollback not executed.
- Runtime effect: Not Yet Proven.

## 13. Safe-Fix Pattern Candidate

Pattern candidate: "Homepage hero copy refinement (proposal + rollback)". Candidate only — not promoted as proven by an applied change.

- Problem type: generic or unclear above-the-fold homepage hero heading copy.
- Eligible target: a `text` block `settings.text` richtext value inside the homepage hero section of a page-level JSON template; string unique theme-wide; no data-object references.
- Evidence required: exact file + section/block/settings path; verbatim original content; baseline SHA-256; render-chain trace; theme-wide uniqueness check; archived and (where available) live source references.
- Authority required: governed exercise scope; analysis-only for the proposal; a separate explicit mutation gate plus merchant approval before any applied change.
- Proposed intervention boundary: change only the inner text of the richtext value; never alter block id, type, order, other settings, structure, or any shared/global-shell/checkout surface.
- QA expectations: baseline-hash verification, rendered homepage + hero-location check, desktop and mobile, CTA/navigation intact, unrelated surfaces unchanged, post-change hash capture, rollback verification.
- Rollback design: record baseline source + original content + baseline hash; reversal restores the original line; verify restored hash equals baseline; theme-editor drift handling; explicit stop conditions.
- Prohibited claims: conversion improvement, revenue impact, merchant outcome, live-state assertions, or "applied/verified" status while the change remains a proposal.

## 14. Remaining Unknowns (Not Yet Proven)

- Live homepage state
- Live theme identity (name, ID, version)
- Live source hash
- Rendered effect of the proposed copy
- Mobile appearance on the live store
- Merchant preference for the proposed wording
- Conversion impact
- Theme-editor drift (whether the live value still matches the archived value)
- Publish behavior
- Rollback execution (designed, not executed)

## 15. Recommendation

Next governed action: **Capture Exercise 010 After Evidence**.

Do not apply the proposed change in this mission. Applying it is Not Yet Governed and requires a separate explicit authority gate and merchant approval.
