# Vibe Code Risk Register v1

## Highest-risk artifacts

1. `staffordos/operator_design/`
   - Why risky: broad set of planning and verification docs with canonical-sounding filenames.
   - Pattern: analysis often reads like authority even when it is only a derived conclusion.
   - Governance issue: easy to cite as truth without checking `authority/output` or runtime evidence.

2. `staffordos/audits/no_kings/`
   - Why risky: mixes evidence capture, logs, screenshots, prompt text, candidate selection, and final narratives.
   - Pattern: the tree contains useful proof material, but it also contains speculative interpretation.
   - Governance issue: no-kings artifacts are useful history, not active StaffordOS truth.

3. `staffordos/lifecycle_audit/`
   - Why risky: lifecycle and convergence analysis can sound canonical before the canonical authority is actually updated.
   - Pattern: audit prose can become a shadow operating model.
   - Governance issue: these files should inform decisions, not define the lifecycle.

4. `staffordos/cockpit_audit/rejected_ui/ceo_cockpit_ai_slop_rejected_20260603.tsx`
   - Why risky: explicit rejected UI code, likely AI-assisted and not authority-backed.
   - Pattern: code-like artifacts can re-enter the path if not quarantined.
   - Governance issue: should stay quarantined as a rejected example.

5. `merchant_audit.sh` and `merchant_audit_output.txt`
   - Why risky: ad hoc exploratory tooling and its generated output.
   - Pattern: loose shell scripts create unsupported audit paths and stale notes.
   - Governance issue: not tied to a governed lifecycle or active authority.

## Medium-risk but useful artifacts

- `staffordos/authority/output/current_launch_readiness_score_v1.md`
- `staffordos/authority/output/revenue_success_gate_v1.md`
- `staffordos/lifecycle_audit/session_snapshots/active_runtime_repo_truth_20260603_v1.md`
- `staffordos/operator_design/shopifixer_checkout_connection_results_v1.md`

These are the least risky of the generated artifacts because they are tied to explicit runtime evidence or decision gates. They still need refresh discipline so they do not drift into stale truth.

## Cleanup rule

Do not broad-commit the whole tree.
Do not broad-delete the whole tree.
Do not elevate any artifact to StaffordOS truth unless it is backed by a committed authority file, runtime evidence, or the active packet/payment/client/proof surfaces.
