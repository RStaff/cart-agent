# ShopiFixer Evidence Pipeline Audit

Scope: Operator Command Center -> writer functions -> final merchant proof package.

## Executive Summary
The current ShopiFixer evidence pipeline is functional but not production-hardened. The UI-triggered writers create the expected before/after/scope/proof-package artifacts, and completion updates fulfillment truth plus the generated merchant lifecycle registry. However, the pipeline is not append-only, screenshots are only referenced as text, packet identity is not persisted, previous versions are not recoverable, and there is no checksum or signed manifest.

The proof package itself is deterministic only if the three source evidence files remain unchanged. The broader pipeline is not deterministic because evidence files and fulfillment truth are overwritten in place, and completion stamps the current time.

## Stage Audit

### 1) Capture Before Evidence

1. Trigger
   UI server action from `/operator/command-center` (`staffordos/ui/operator-frontend/app/operator/command-center/page.tsx:38-60`)

2. Writer function invoked
   `writeShopifixerBeforeEvidence` (`staffordos/ui/operator-frontend/lib/operator/writeShopifixerBeforeEvidence.ts:14-52`)

3. Files created
   `proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`

4. Files updated
   The same `before_evidence.md` file is overwritten on each run

5. Evidence retained
   Store, date, affected page/artifact, issue, why it matters, screenshot text, notes

6. Evidence lost
   Actual screenshot file bytes, prior before-evidence versions, any packet linkage

7. Whether outputs are immutable
   No

8. Whether screenshots are referenced or embedded
   Referenced only as text

9. Whether timestamps are preserved
   Only the caller-supplied `date` is written; no writer-generated timestamp

10. Whether merchant identity is preserved
    Yes, as the submitted `store` string

11. Whether packet identity is preserved
    No

12. Whether previous versions remain recoverable
    No

13. Whether the proof package is deterministic
    Not at this stage

14. Missing production capabilities
    Immutable artifact IDs, screenshot copying, append-only history, checksum, packet linkage

### 2) Record Scoped Fix

1. Trigger
   UI server action from `/operator/command-center` (`staffordos/ui/operator-frontend/app/operator/command-center/page.tsx:88-115`)

2. Writer function invoked
   `writeShopifixerScopedFix` (`staffordos/ui/operator-frontend/lib/operator/writeShopifixerScopedFix.ts:26-66`)

3. Files created
   `proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`

4. Files updated
   The same `fix_scope.md` file is overwritten on each run

5. Evidence retained
   Store, scoped fix, in-scope, out-of-scope, approval-needed flag, change made, location changed, implementation notes, success criteria

6. Evidence lost
   Prior scope versions and any packet linkage

7. Whether outputs are immutable
   No

8. Whether screenshots are referenced or embedded
   Not applicable

9. Whether timestamps are preserved
   No writer-generated timestamp

10. Whether merchant identity is preserved
    Yes, as the submitted `store` string

11. Whether packet identity is preserved
    No

12. Whether previous versions remain recoverable
    No

13. Whether the proof package is deterministic
    Not at this stage

14. Missing production capabilities
    Versioning for scope snapshots, immutable approval records, artifact checksum, packet association

### 3) Capture After Evidence

1. Trigger
   UI server action from `/operator/command-center` (`staffordos/ui/operator-frontend/app/operator/command-center/page.tsx:62-86`)

2. Writer function invoked
   `writeShopifixerAfterEvidence` (`staffordos/ui/operator-frontend/lib/operator/writeShopifixerAfterEvidence.ts:15-56`)

3. Files created
   `proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`

4. Files updated
   The same `after_evidence.md` file is overwritten on each run

5. Evidence retained
   Store, date, affected page/artifact, after screenshot text, after notes, remaining limitations, observed improvement, merchant-facing summary

6. Evidence lost
   Actual screenshot file bytes, prior after-evidence versions, packet linkage

7. Whether outputs are immutable
   No

8. Whether screenshots are referenced or embedded
   Referenced only as text

9. Whether timestamps are preserved
   Only the caller-supplied `date` is written; no writer-generated timestamp

10. Whether merchant identity is preserved
    Yes, as the submitted `store` string

11. Whether packet identity is preserved
    No

12. Whether previous versions remain recoverable
    No

13. Whether the proof package is deterministic
    Not at this stage

14. Missing production capabilities
    Immutable after-evidence record, screenshot artifact storage, versioned output, packet linkage

### 4) Generate Proof Package

1. Trigger
   UI server action from `/operator/command-center` (`staffordos/ui/operator-frontend/app/operator/command-center/page.tsx:117-126`)

2. Writer function invoked
   `writeShopifixerProofPackage` (`staffordos/ui/operator-frontend/lib/operator/writeShopifixerProofPackage.ts:22-89`)

3. Files created
   `proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`

4. Files updated
   `merchant_proof_package.md` is overwritten each time; the writer reads `before_evidence.md`, `fix_scope.md`, and `after_evidence.md` as inputs

5. Evidence retained
   The current text content of the three evidence files is assembled into the proof package

6. Evidence lost
   Historical versions of the source evidence files are not preserved; no screenshot bytes are stored

7. Whether outputs are immutable
   No

8. Whether screenshots are referenced or embedded
   Referenced indirectly through the text copied from the source evidence files

9. Whether timestamps are preserved
   No timestamp is added to the proof package

10. Whether merchant identity is preserved
    Yes, via the parsed `Store:` field

11. Whether packet identity is preserved
    No

12. Whether previous versions remain recoverable
    No

13. Whether the proof package is deterministic
    Yes, for a fixed set of source evidence files

14. Missing production capabilities
    Package manifest, content hash, immutable snapshotting of source evidence, screenshot attachment handling

### 5) Mark Completion

1. Trigger
   UI server action from `/operator/command-center` (`staffordos/ui/operator-frontend/app/operator/command-center/page.tsx:128-140`)

2. Writer function invoked
   `writeShopifixerCompletion` (`staffordos/ui/operator-frontend/lib/operator/writeShopifixerCompletion.ts:43-112`)

3. Files created
   None guaranteed on first run; the completion path updates existing fulfillment truth and then rebuilds the generated merchant registry outputs

4. Files updated
   - `fulfillment/shopifixer_fulfillment_truth_v1.json`
   - `staffordos/merchant_registry/merchant_lifecycle_registry_v1.json`
   - `staffordos/merchant_registry/merchant_lifecycle_registry_v1.md`

5. Evidence retained
   The matched fulfillment item is updated with completion state, `completed_at`, and proof package location

6. Evidence lost
   Prior fulfillment item state is overwritten; no append-only execution record is kept

7. Whether outputs are immutable
   No

8. Whether screenshots are referenced or embedded
   Not handled by this stage

9. Whether timestamps are preserved
   Yes, `completed_at` is stamped with the current ISO timestamp

10. Whether merchant identity is preserved
    Yes, by matching the submitted store against the fulfillment truth item

11. Whether packet identity is preserved
    No

12. Whether previous versions remain recoverable
    No

13. Whether the proof package is deterministic
    No. Completion adds current-time state and rewrites mutable fulfillment truth

14. Missing production capabilities
    Append-only completion log, explicit packet binding, checksum/signature, immutable completion snapshot

## Canonical Workflow Diagram

```text
/operator/command-center
  ├─ Capture Before Evidence
  │    └─ writeShopifixerBeforeEvidence
  │         └─ proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md
  │             - store
  │             - date
  │             - affected_page_or_artifact
  │             - issue
  │             - why_it_matters
  │             - screenshot (text reference only)
  │             - notes
  │
  ├─ Record Scoped Fix
  │    └─ writeShopifixerScopedFix
  │         └─ proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md
  │             - store
  │             - scoped_fix
  │             - in_scope
  │             - out_of_scope
  │             - merchant_approval_needed
  │             - change_made
  │             - location_changed
  │             - implementation_notes
  │             - success_criteria
  │
  ├─ Capture After Evidence
  │    └─ writeShopifixerAfterEvidence
  │         └─ proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md
  │             - store
  │             - date
  │             - affected_page_or_artifact
  │             - after_screenshot (text reference only)
  │             - after_notes
  │             - remaining_limitations
  │             - observed_improvement
  │             - merchant_facing_summary
  │
  ├─ Generate Proof Package
  │    └─ writeShopifixerProofPackage
  │         └─ proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md
  │             - reads before_evidence.md
  │             - reads fix_scope.md
  │             - reads after_evidence.md
  │             - assembles current text into one package
  │
  └─ Mark Completion
       └─ writeShopifixerCompletion
            ├─ fulfillment/shopifixer_fulfillment_truth_v1.json
            ├─ staffordos/merchant_registry/merchant_lifecycle_registry_v1.json
            └─ staffordos/merchant_registry/merchant_lifecycle_registry_v1.md
```

## Production Readiness Score
**38 / 100**

Reasoning:
- The functional sequence exists end-to-end.
- The package is readable and usable for dry runs.
- Production hardening is weak: overwrite semantics, no screenshot storage, no packet identity, no checksum, no append-only history, and no immutable proof chain.

## Blockers

### Critical
- Evidence files are overwritten rather than preserved as immutable records.
- Screenshots are only text references; the actual artifact is not retained.
- Packet identity is not persisted through the pipeline.

### High
- Completion rewrites fulfillment truth in place and depends on current-time state.
- The proof package is not cryptographically sealed or versioned.
- Previous versions of the evidence and completion outputs are not recoverable.

### Medium
- No checksum or signed manifest is emitted for evidence or proof package.
- Merchant identity is only a plain store string in the evidence writers.
- Completion depends on the mutable fulfillment truth being in the expected state.

### Low
- The proof package has a stable structure but no explicit version header.
- The workflow does not surface a durable artifact index or audit trail.

## Highest-Leverage Next Task
Introduce an append-only evidence manifest with stored screenshot artifacts and stable artifact IDs, then have all five writer stages write to that manifest rather than overwriting free-form markdown files.

## Validation
`git diff --check` was run against this report file and passed.
