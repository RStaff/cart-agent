# StaffordOS Writer Function Audit

Scope: ShopiFixer writers used by the Operator Command Center.

## Executive Summary
The five ShopiFixer writers are simple file emitters plus one completion mutator. Four of them write markdown evidence artifacts by overwriting a fixed path. The completion writer updates fulfillment truth, stamps a completion timestamp, and triggers the merchant lifecycle registry rebuild script, which overwrites the generated merchant registry artifacts.

The current implementation is operationally usable, but it is not immutable, not history-preserving, and not checksum-backed. Screenshots are referenced as strings, not copied. Merchant identity is carried as a plain store string, and packet identity is not persisted by these writers.

## Writer Audit

### 1) `writeShopifixerBeforeEvidence`

1. File location
   `staffordos/ui/operator-frontend/lib/operator/writeShopifixerBeforeEvidence.ts:1-53`

2. Inputs accepted
   `store`, `date`, `affected_page_or_artifact`, `issue`, `why_it_matters`, `screenshot`, `notes`

3. Output files written
   `proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`

4. Whether existing files are overwritten or appended
   Overwritten via `fs.writeFileSync`

5. Whether timestamps are recorded
   No writer-generated timestamp; only the caller-supplied `date` string is written

6. Whether screenshots are copied or merely referenced
   Merely referenced as text in the markdown body

7. Whether merchant identity is persisted
   Yes, but only as the submitted `store` string

8. Whether packet ID is persisted
   No

9. Whether execution history is preserved
   No dedicated history. The output file is rewritten in place

10. Whether hashes/checksums are produced
    No

11. Whether evidence is immutable
    No

12. Whether proof package is assembled automatically or simply rewritten
    Not applicable. This writer only emits before-evidence

13. Missing production capabilities
    Immutability, append-only history, evidence file provenance metadata, checksum generation, screenshot artifact copying, packet linkage

14. Recommended smallest next improvement
    Add a small provenance footer with created-at, writer name, and source file references; keep the file append-only or versioned

### 2) `writeShopifixerAfterEvidence`

1. File location
   `staffordos/ui/operator-frontend/lib/operator/writeShopifixerAfterEvidence.ts:1-57`

2. Inputs accepted
   `store`, `date`, `affected_page_or_artifact`, `after_screenshot`, `after_notes`, `remaining_limitations`, `observed_improvement`, `merchant_facing_summary`

3. Output files written
   `proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`

4. Whether existing files are overwritten or appended
   Overwritten via `fs.writeFileSync`

5. Whether timestamps are recorded
   No writer-generated timestamp; only the caller-supplied `date` string is written

6. Whether screenshots are copied or merely referenced
   Merely referenced as text in the markdown body

7. Whether merchant identity is persisted
   Yes, but only as the submitted `store` string

8. Whether packet ID is persisted
   No

9. Whether execution history is preserved
   No dedicated history. The output file is rewritten in place

10. Whether hashes/checksums are produced
    No

11. Whether evidence is immutable
    No

12. Whether proof package is assembled automatically or simply rewritten
    Not applicable. This writer only emits after-evidence

13. Missing production capabilities
    Same as before-evidence, plus no explicit link back to the scoped fix or proof package

14. Recommended smallest next improvement
    Add a stable evidence ID and a backlink to the before-evidence artifact

### 3) `writeShopifixerScopedFix`

1. File location
   `staffordos/ui/operator-frontend/lib/operator/writeShopifixerScopedFix.ts:1-67`

2. Inputs accepted
   `store`, `scoped_fix`, `in_scope`, `out_of_scope`, `merchant_approval_needed`, `change_made`, `location_changed`, `implementation_notes`, `success_criteria`

3. Output files written
   `proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`

4. Whether existing files are overwritten or appended
   Overwritten via `fs.writeFileSync`

5. Whether timestamps are recorded
   No writer-generated timestamp

6. Whether screenshots are copied or merely referenced
   No screenshot handling in this writer

7. Whether merchant identity is persisted
   Yes, but only as the submitted `store` string

8. Whether packet ID is persisted
   No

9. Whether execution history is preserved
   No dedicated history. The output file is rewritten in place

10. Whether hashes/checksums are produced
    No

11. Whether evidence is immutable
    No

12. Whether proof package is assembled automatically or simply rewritten
    Not applicable. This writer only emits the scoped-fix artifact

13. Missing production capabilities
    Transactional scope versioning, approval status metadata, checksum, and direct linkage to evidence artifacts

14. Recommended smallest next improvement
    Add a generated fix ID and record approval state with the scope snapshot

### 4) `writeShopifixerProofPackage`

1. File location
   `staffordos/ui/operator-frontend/lib/operator/writeShopifixerProofPackage.ts:1-90`

2. Inputs accepted
   None

3. Output files written
   `proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`

4. Whether existing files are overwritten or appended
   Overwritten via `fs.writeFileSync`

5. Whether timestamps are recorded
   No timestamp is recorded

6. Whether screenshots are copied or merely referenced
   Merely referenced indirectly. It reads the evidence markdown files and embeds their text into the package

7. Whether merchant identity is persisted
   Yes, via the parsed `Store:` field

8. Whether packet ID is persisted
   No

9. Whether execution history is preserved
   No dedicated history. It rewrites one consolidated package from the current evidence files

10. Whether hashes/checksums are produced
    No

11. Whether evidence is immutable
    No

12. Whether proof package is assembled automatically or simply rewritten
    Simply rewritten. It composes a package by re-reading the three evidence files each time

13. Missing production capabilities
    Stable package versioning, source provenance tags, checksum/signature, and attachment handling for screenshots

14. Recommended smallest next improvement
    Add a package manifest that captures source file paths, writer version, and a content hash

### 5) `writeShopifixerCompletion`

1. File location
   `staffordos/ui/operator-frontend/lib/operator/writeShopifixerCompletion.ts:1-112`

2. Inputs accepted
   `store`, `date`

3. Output files written
   Directly writes `fulfillment/shopifixer_fulfillment_truth_v1.json`
   Indirectly triggers `staffordos/merchant_registry/build_merchant_lifecycle_registry_v1.mjs`, which writes:
   - `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
   - `staffordos/merchant_registry/merchant_lifecycle_registry_v1.md`

4. Whether existing files are overwritten or appended
   Overwritten. The fulfillment truth JSON is rewritten, and the merchant registry build script also rewrites its generated outputs

5. Whether timestamps are recorded
   Yes. `completed_at` is stamped with `new Date().toISOString()`

6. Whether screenshots are copied or merely referenced
   Not handled by this writer

7. Whether merchant identity is persisted
   Yes, via matching `store` against fulfillment truth items and updating the matched record

8. Whether packet ID is persisted
   No

9. Whether execution history is preserved
   Only partially. The matched fulfillment item is replaced in place and `completed_at` is added, but no append-only execution log is kept

10. Whether hashes/checksums are produced
    No

11. Whether evidence is immutable
    No

12. Whether proof package is assembled automatically or simply rewritten
    The proof package is expected to exist already. Completion validates it, then updates fulfillment truth and rebuilds the merchant registry. It does not assemble the proof package itself

13. Missing production capabilities
    Append-only completion log, checksum, explicit packet linkage, and stronger provenance for the completion event

14. Recommended smallest next improvement
    Add an append-only completion event record alongside the fulfillment truth update

## Cross-Cutting Findings

- All five writers are fixed-path file emitters; none support versioned outputs.
- Screenshots are never copied to a managed artifact store.
- No writer persists a packet ID.
- Only the completion writer records a writer-generated timestamp.
- No writer produces hashes or checksums.
- Evidence and proof artifacts are rewritable, not immutable.
- The proof package is a reconstruction from current evidence files, not a durable assembled bundle.

## Validation
`git diff --check` was used after authoring this report and was clean.
