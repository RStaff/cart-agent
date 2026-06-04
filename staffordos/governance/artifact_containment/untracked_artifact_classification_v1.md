# Untracked Artifact Classification v1

Generated from `git status --short` plus full untracked-file enumeration.

Cleanup is **not yet safe**. The workspace mixes active authority outputs, runtime evidence snapshots, historical audit bundles, empty placeholder directories, and loose generated outputs. Do not broad-delete or broad-commit.

## 1. Safe-to-commit candidates

- `staffordos/authority/output/current_launch_readiness_score_v1.md`  
  Classification: `KEEP_CANDIDATE`  
  Reason: current launch gate derived from active StaffordOS truth and used for decisioning.  
  Related commit: `ccf63524`  
  Related authority: `revenue_success_gate_v1.md`, `staffordos_business_core_definition_of_done_v1.md`  
  Related runtime evidence: `client_registry_v1.json`, `lead_registry_v1.json`, `operator_dashboard_snapshot_v1.json`, `ceo-snapshot` route  
  Best-practice concern: operator judgment can go stale if not regenerated.  
  Risk if kept: medium; a stale score could be mistaken for current truth.  
  Risk if deleted: lose a useful launch-readiness gate.  
  Recommended action: keep and commit only if refreshed against current runtime truth.  
  Should it ever be promoted to StaffordOS truth: yes, as a derived decision record, not as source truth.

- `staffordos/authority/output/revenue_success_gate_v1.md`  
  Classification: `KEEP_CANDIDATE`  
  Reason: active GO / NO-GO gate for revenue execution.  
  Related commit: `ccf63524`  
  Related authority: `staffordos_business_core_definition_of_done_v1.md`, `shopifixer_fulfillment_authority_v1.md`  
  Related runtime evidence: cockpit snapshot, packet/payment authority, client registry  
  Best-practice concern: policy-like document can drift from live runtime state.  
  Risk if kept: medium; may be overread as operational proof.  
  Risk if deleted: remove the current decision gate and force rediscovery.  
  Recommended action: keep and commit as a governed decision artifact.  
  Should it ever be promoted to StaffordOS truth: yes, as a decision gate only.

- `staffordos/lifecycle_audit/session_snapshots/active_runtime_repo_truth_20260603_v1.md`  
  Classification: `KEEP_CANDIDATE`  
  Reason: records the active runtime repository boundary and current critical path.  
  Related commit: `ccf63524`  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: active repo paths, cockpit routes, client registry paths  
  Best-practice concern: snapshot can become stale if the repo boundary changes.  
  Risk if kept: low-to-medium; only dangerous if mistaken for live authority.  
  Risk if deleted: lose an important repo-boundary correction record.  
  Recommended action: keep as a runtime evidence snapshot.  
  Should it ever be promoted to StaffordOS truth: yes, as evidence of repo/runtime location, not as lifecycle authority.

- `staffordos/operator_design/shopifixer_checkout_connection_results_v1.md`  
  Classification: `KEEP_CANDIDATE`  
  Reason: ties the ShopiFixer CTA to the packet-aware checkout flow and records validation.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_loop_connection_work_package_v1.md`, packet/payment authority  
  Related runtime evidence: `npm run build -- --webpack`, `/shopifixer` route, `POST /__public-checkout` handoff  
  Best-practice concern: implementation result notes can drift from code if not updated with changes.  
  Risk if kept: medium; may overstate current validation if the page changes later.  
  Risk if deleted: lose the clearest implementation result for the purchase handoff.  
  Recommended action: keep as an execution result record.  
  Should it ever be promoted to StaffordOS truth: yes, as an implementation evidence record only.

## 2. Safe-to-archive candidates

- `staffordos/audits/no_kings/catalog_truth/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: raw catalog evidence bundle (`homepage.html`, `products_250.json`).  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: storefront catalog captures  
  Best-practice concern: raw evidence can be mistaken for current store truth.  
  Risk if kept: stale storefront snapshot may be read as live truth.  
  Risk if deleted: lose proof trail for the No Kings audit.  
  Recommended action: archive as evidence.  
  Should it ever be promoted to StaffordOS truth: no, only as evidence.

- `staffordos/audits/no_kings/evidence/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: before screenshots, annotation, and evidence record bundle.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: `homepage_desktop_before.png`, `homepage_mobile_before.png`, `before_evidence_record_v1.md`  
  Best-practice concern: evidence packages can be mistaken for implementation proof.  
  Risk if kept: low; mainly storage and confusion risk.  
  Risk if deleted: lose before-state proof.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no, only as proof evidence.

- `staffordos/audits/no_kings/execution/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: execution brief and product reference inventory for the No Kings audit.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: product reference inventory notes  
  Best-practice concern: planning bundles can drift into implied execution claims.  
  Risk if kept: low; mostly historical clutter.  
  Risk if deleted: lose audit planning context.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/execution_readiness/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: readiness notes for Shopify execution access.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: readiness checks only  
  Best-practice concern: readiness notes are not execution proof.  
  Risk if kept: low.  
  Risk if deleted: lose the evidence of readiness checks.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/execution_truth/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: theme access and pull-test logs.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: `execution_access_result_v1.md`, `theme_pull_test_v1.txt`, `theme_pull_test_v2.txt`  
  Best-practice concern: logs are evidence, not current state.  
  Risk if kept: stale access proof may be mistaken for live access.  
  Risk if deleted: lose the access/debug trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/final_audit/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: after-state spec, readiness note, and final audit narrative.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: audit summary only  
  Best-practice concern: final audit prose can overstate proof if later cited without evidence.  
  Risk if kept: low-to-medium.  
  Risk if deleted: lose the audit conclusion trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/graphql_truth/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: GraphQL access/config/query truth bundle.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: admin queries, app help, config inspection logs  
  Best-practice concern: low-level API logs are not merchant truth.  
  Risk if kept: low.  
  Risk if deleted: lose access and query evidence.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/live_theme_analysis/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: live theme tree and mutation-target analysis bundle.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: live theme directory tree, mutation targets, product list locations  
  Best-practice concern: analysis artifacts can look like implementation instructions.  
  Risk if kept: medium; easy to confuse with approved change scope.  
  Risk if deleted: lose the analysis trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/mutation_decision/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: mutation complexity decision note.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: mutation decision note only  
  Best-practice concern: decision notes can be mistaken for approved changes.  
  Risk if kept: medium.  
  Risk if deleted: lose the decision rationale.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/product_admin_truth/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: admin truth inventory for Shopify app/env inspection.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: app help/auth help/env inventory files  
  Best-practice concern: admin-inspection notes are not current merchant truth.  
  Risk if kept: low.  
  Risk if deleted: lose setup evidence.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/product_discovery/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: product catalog, prioritization, and probe outputs.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: `storefront_product_probe_v1.json`, catalog/product inventory files  
  Best-practice concern: discovery artifacts are not product truth unless verified against live storefront/admin state.  
  Risk if kept: medium.  
  Risk if deleted: lose product discovery evidence.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/no_kings_scorecard_and_findings_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: scorecard/finding narrative for the No Kings audit.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: before screenshots and audit review notes  
  Best-practice concern: scorecard prose can be read as proof without supporting evidence.  
  Risk if kept: medium.  
  Risk if deleted: lose the scorecard trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/no_kings_scorecard_completion_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: completion note for the No Kings scorecard.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: scorecard completion only  
  Best-practice concern: completion language can overstate actual merchant proof.  
  Risk if kept: low-to-medium.  
  Risk if deleted: lose closure record.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/no_kings_shopifixer_950_value_gap_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: value-gap analysis supporting the No Kings audit.  
  Related commit: none  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: No Kings before-state evidence  
  Best-practice concern: value-gap conclusions are still analysis, not merchant proof.  
  Risk if kept: medium; can sound merchant-grade without a completed sprint.  
  Risk if deleted: lose the commercial analysis rationale.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/no_kings_shopifixer_sprint_validation_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: validation note for the No Kings ShopiFixer sprint.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: validation note only  
  Best-practice concern: validation narratives can be mistaken for executed proof.  
  Risk if kept: low-to-medium.  
  Risk if deleted: lose the validation record.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/no_kings_visual_review_prompt_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: review prompt artifact for visual assessment.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: visual-review prompt only  
  Best-practice concern: prompt material is especially easy to misread as output.  
  Risk if kept: medium; prompt text can look like approved analysis.  
  Risk if deleted: lose the review prompt used during audit.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/proof_store_plan/no_kings_proof_store_correction_plan_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: correction plan for proof-store setup.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: proof-store planning only  
  Best-practice concern: a plan is not proof and should not be cited as such.  
  Risk if kept: low.  
  Risk if deleted: lose the correction plan.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/reconciliation/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: current-truth reconciliation bundle (HTML/JSON truth snapshots).  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: `no_kings_current_truth_v1.md`, `no_kings_current_truth_result_v1.md`, product snapshots  
  Best-practice concern: reconciliation snapshots can be misread as current state after the store changes.  
  Risk if kept: medium.  
  Risk if deleted: lose the reconciliation evidence.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/scoring/no_kings_revenue_impact_score_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: revenue-impact score from the No Kings audit.  
  Related commit: none  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: audit score only  
  Best-practice concern: score outputs can look authoritative without executed evidence.  
  Risk if kept: medium.  
  Risk if deleted: lose the scoring rationale.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: full Horizon theme backup bundle (assets, blocks, locales, sections, snippets, templates).  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: theme pull tests and live theme analysis  
  Best-practice concern: large backup trees are easy to confuse with current source.  
  Risk if kept: high storage and confusion risk; stale theme can be mistaken for active truth.  
  Risk if deleted: lose a major execution evidence bundle.  
  Recommended action: archive, preferably off the active workspace once indexed.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/validation/no_kings_vs_shopifixer_standard_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: validation comparison between No Kings and ShopiFixer standard.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: validation comparison only  
  Best-practice concern: comparison docs can blur into policy if not clearly labeled.  
  Risk if kept: low.  
  Risk if deleted: lose the validation comparison.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/cockpit_audit/rejected_ui/ceo_cockpit_ai_slop_rejected_20260603.tsx`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: rejected UI code retained as a negative example.  
  Related commit: none  
  Related authority: CEO cockpit / operator UI conventions  
  Related runtime evidence: rejected UI only  
  Best-practice concern: AI-generated UI code is high-risk for reintroduction if not quarantined.  
  Risk if kept: medium-to-high; can leak back into the app if not clearly quarantined.  
  Risk if deleted: lose a reference example of what was rejected.  
  Recommended action: archive in the rejected_ui quarantine only.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/backups/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: backup snapshots for contact research and contact targets.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: pre-No-Kings backup JSON snapshots  
  Best-practice concern: backup snapshots are not live lifecycle truth.  
  Risk if kept: stale contact data may be mistaken for active lead truth.  
  Risk if deleted: lose the historical backup baseline.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/canonical_artifact_inventory_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: inventory of canonical artifacts.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: inventory document only  
  Best-practice concern: inventories are reference material, not authoritative truth.  
  Risk if kept: low.  
  Risk if deleted: lose the inventory trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/canonical_systems_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: systems reconciliation map.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: system reconciliation notes only  
  Best-practice concern: canonical-sounding maps can be overread as source truth.  
  Risk if kept: medium.  
  Risk if deleted: lose the systems reconciliation record.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/client_promotion_path_v1.txt`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: notes on client promotion path.  
  Related commit: none  
  Related authority: `client_promotion_authority_v1.md`  
  Related runtime evidence: promotion-path analysis only  
  Best-practice concern: text notes can be mistaken for implemented flow.  
  Risk if kept: low.  
  Risk if deleted: lose the promotion-path notes.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/commercialization_gaps_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: commercialization gap analysis.  
  Related commit: none  
  Related authority: `revenue_success_gate_v1.md`  
  Related runtime evidence: gap analysis only  
  Best-practice concern: gaps are useful but not proof.  
  Risk if kept: medium.  
  Risk if deleted: lose the gap inventory.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/commercialization_truth_map_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: commercial truth mapping note.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: mapping notes only  
  Best-practice concern: truth maps can sound authoritative without being canonical.  
  Risk if kept: medium.  
  Risk if deleted: lose the mapping reference.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/convergence_blockers_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: blocker analysis for lifecycle convergence.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: convergence analysis only  
  Best-practice concern: blocker lists can age quickly.  
  Risk if kept: low-to-medium.  
  Risk if deleted: lose historical blocker context.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/convergence_dependency_graph_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: dependency graph for convergence work.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: dependency analysis only  
  Best-practice concern: graphs can imply structure that may not exist in code.  
  Risk if kept: medium.  
  Risk if deleted: lose the dependency trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/convergence_status_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: status reconciliation note for convergence.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: status note only  
  Best-practice concern: status reports age fast and can sound more final than they are.  
  Risk if kept: medium.  
  Risk if deleted: lose the status snapshot.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/critical_path_challenge_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: critical-path challenge note.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: challenge note only  
  Best-practice concern: challenge notes are guidance, not implementation proof.  
  Risk if kept: low.  
  Risk if deleted: lose the challenge context.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/merchant_lifecycle_artifact_inventory_v1.txt`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: merchant lifecycle artifact inventory.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: inventory only  
  Best-practice concern: inventory files are not lifecycle truth.  
  Risk if kept: low.  
  Risk if deleted: lose the inventory.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/next_executable_node_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: next-node recommendation from the lifecycle audit.  
  Related commit: none  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: recommendation only  
  Best-practice concern: recommendations should not be mistaken for implemented work.  
  Risk if kept: medium.  
  Risk if deleted: lose the reasoning trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/outreach_readiness_reconciliation_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: outreach readiness reconciliation note.  
  Related commit: none  
  Related authority: `revenue_success_gate_v1.md`  
  Related runtime evidence: reconciliation note only  
  Best-practice concern: readiness conclusions can outlive the evidence that supported them.  
  Risk if kept: medium.  
  Risk if deleted: lose outreach-readiness context.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/lifecycle_audit/outreach_readiness_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: outreach readiness summary.  
  Related commit: none  
  Related authority: `revenue_success_gate_v1.md`  
  Related runtime evidence: outreach-readiness note only  
  Best-practice concern: summary docs can become stale quickly.  
  Risk if kept: medium.  
  Risk if deleted: lose the readiness summary.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operating_loop/output/stop_workday_20260531_213342/`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: incident bundle containing `git_diff.patch`, `git_status.txt`, `runtime_check.txt`, and `critical_files.tgz`.  
  Related commit: none  
  Related authority: operating-loop governance only  
  Related runtime evidence: incident snapshot bundle  
  Best-practice concern: generated incident bundles are easy to confuse with source truth.  
  Risk if kept: low-to-medium; storage and confusion risk.  
  Risk if deleted: lose the incident bundle.  
  Recommended action: archive, ideally out of the active workspace.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/cart_agent_paid_loop_execution_checklist_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: execution checklist for the paid-loop plan.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_back_half_execution_truth_v1.md`, `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: packet/payment path docs  
  Best-practice concern: checklist language can imply completion when it is still a plan.  
  Risk if kept: medium.  
  Risk if deleted: lose execution guidance.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/commercial_convergence_review_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: commercialization review summary.  
  Related commit: `ccf63524`  
  Related authority: `shopifixer_commercial_definition_v1.md`, `revenue_success_gate_v1.md`  
  Related runtime evidence: commercial-convergence notes only  
  Best-practice concern: review narratives are not commercial proof.  
  Risk if kept: medium.  
  Risk if deleted: lose the commercialization review.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/flywheel_and_data_moat_readiness_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: flywheel/data-moat readiness assessment.  
  Related commit: `ccf63524`  
  Related authority: `staffordos_canonical_lifecycle_v1.md`, `revenue_success_gate_v1.md`  
  Related runtime evidence: merchant/proof/payment data review  
  Best-practice concern: strategic readiness docs can become sales-sounding without implementation proof.  
  Risk if kept: medium.  
  Risk if deleted: lose the strategic assessment.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/lifecycle_convergence_phase1_results_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: phase-1 convergence results note.  
  Related commit: `2a233f67`  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: read-side terminology mappings  
  Best-practice concern: results notes are not the lifecycle authority.  
  Risk if kept: low-to-medium.  
  Risk if deleted: lose the phase-1 convergence record.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/lifecycle_convergence_plan_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: lifecycle convergence plan.  
  Related commit: `2a233f67`  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: terminology-convergence planning only  
  Best-practice concern: plans are not architecture or truth.  
  Risk if kept: low.  
  Risk if deleted: lose the plan.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/lifecycle_convergence_runtime_verification_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: runtime verification summary for lifecycle terminology.  
  Related commit: `2a233f67`  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: `/operator/command-center`, `/operator/leads`, `/operator/revenue-command`, `ceo-snapshot`, client registry reads  
  Best-practice concern: verification summaries can go stale as the UI changes.  
  Risk if kept: medium.  
  Risk if deleted: lose the runtime verification record.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/lifecycle_model_existence_audit_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: audit on whether a lifecycle model already exists.  
  Related commit: `2a233f67`  
  Related authority: `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: lifecycle file inventory  
  Best-practice concern: audit conclusions should not be mistaken for the lifecycle model itself.  
  Risk if kept: low.  
  Risk if deleted: lose the existence-audit trail.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/shopifixer_back_half_execution_truth_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: back-half execution truth analysis.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_fulfillment_authority_v1.md`, `staffordos_canonical_lifecycle_v1.md`  
  Related runtime evidence: packet/payment/proof/review machinery review  
  Best-practice concern: analysis of back-half truth is not the back-half implementation.  
  Risk if kept: medium.  
  Risk if deleted: lose the back-half truth map.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/shopifixer_commercial_truth_authority_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: commercial truth audit for ShopiFixer.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: pricing/offers/revenue truth review  
  Best-practice concern: the title says authority, but the artifact is still a derived audit.  
  Risk if kept: medium; easy to overread as source authority.  
  Risk if deleted: lose the commercial truth reconciliation.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/shopifixer_conversion_audit_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: conversion audit of the public ShopiFixer experience.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: public pages, proof surfaces, offer surfaces  
  Best-practice concern: conversion audits can sound like proof when they are diagnosis.  
  Risk if kept: medium.  
  Risk if deleted: lose the conversion diagnosis.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/shopifixer_loop_connection_work_package_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: implementation work package for the ShopiFixer loop connection.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_back_half_execution_truth_v1.md`, packet/payment authority  
  Related runtime evidence: checkout path and webhook path review  
  Best-practice concern: a work package is a plan, not an implemented system.  
  Risk if kept: medium.  
  Risk if deleted: lose the implementation plan.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/shopifixer_process_alignment_verification_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: verification that the public flow matches the developed ShopiFixer process.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_commercial_definition_v1.md`, `shopifixer_fulfillment_authority_v1.md`  
  Related runtime evidence: public pages, payment path, proof path review  
  Best-practice concern: verification text can be outdated after the next UI or route change.  
  Risk if kept: medium.  
  Risk if deleted: lose a useful alignment check.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/staffordmedia_shopifixer_alignment_execution_plan_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: execution plan for aligning StaffordMedia.ai with ShopiFixer.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: public page/CTA review  
  Best-practice concern: execution plans can be mistaken for implemented work.  
  Risk if kept: low-to-medium.  
  Risk if deleted: lose the implementation plan.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/staffordmedia_shopifixer_alignment_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: alignment audit of StaffordMedia.ai to the canonical ShopiFixer offer.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: public journey review  
  Best-practice concern: alignment audits are not the offer or product definition.  
  Risk if kept: medium.  
  Risk if deleted: lose the alignment reasoning.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/staffordmedia_shopifixer_phase1_results_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: phase-1 implementation results for the public conversion path.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: build and render validation  
  Best-practice concern: result notes can drift if the public pages change.  
  Risk if kept: medium.  
  Risk if deleted: lose the phase-1 change record.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/staffordmedia_shopifixer_work_package_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: work package translating alignment into implementation tasks.  
  Related commit: `60aae12a`  
  Related authority: `shopifixer_commercial_definition_v1.md`  
  Related runtime evidence: public conversion path review  
  Best-practice concern: work packages are planning artifacts, not proof.  
  Risk if kept: low-to-medium.  
  Risk if deleted: lose the implementation checklist.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/operator_design/top_priority_merchant_truth_v1.md`  
  Classification: `ARCHIVE_CANDIDATE`  
  Reason: merchant-priority truth note derived from runtime artifacts.  
  Related commit: `ccf63524`  
  Related authority: `client_registry_v1.mjs`, `operator_dashboard_snapshot_v1.json`  
  Related runtime evidence: current client registry and CEO snapshot reads  
  Best-practice concern: priority conclusions can change quickly with new leads or payments.  
  Risk if kept: medium.  
  Risk if deleted: lose the reasoning for current merchant priority.  
  Recommended action: archive.  
  Should it ever be promoted to StaffordOS truth: no.

## 3. Safe-to-delete candidates

- `merchant_audit.sh`  
  Classification: `DELETE_CANDIDATE`  
  Reason: ad hoc grep/jq audit helper, not tied to authority or runtime truth.  
  Related commit: none  
  Related authority: none  
  Related runtime evidence: none  
  Best-practice concern: mixed-scope shell audit with no governed lifecycle.  
  Risk if kept: becomes a shadow audit path and can normalize unsupported findings.  
  Risk if deleted: only loses a convenience script.  
  Recommended action: delete or rewrite only if a tracked, authority-backed audit helper is needed.  
  Should it ever be promoted to StaffordOS truth: no.

- `merchant_audit_output.txt`  
  Classification: `DELETE_CANDIDATE`  
  Reason: generated output from the ad hoc merchant audit script.  
  Related commit: none  
  Related authority: none  
  Related runtime evidence: none  
  Best-practice concern: stale generated output is easy to mistake for current evidence.  
  Risk if kept: stale findings may be repeated as if current.  
  Risk if deleted: minimal; it is not a source of truth.  
  Recommended action: delete.  
  Should it ever be promoted to StaffordOS truth: no.

## 4. Needs-human-review list

- `staffordos/audits/no_kings/evidence/after/`  
  Classification: `NEEDS_HUMAN_REVIEW`  
  Reason: empty placeholder directory for after-state evidence.  
  Related commit: none  
  Related authority: `shopifixer_audit_authority_v1.md`  
  Related runtime evidence: none yet  
  Best-practice concern: empty proof folders can imply completed evidence when none exists.  
  Risk if kept: false signal risk.  
  Risk if deleted: only loses a placeholder; harmless to recreate later.  
  Recommended action: confirm whether this is an intentional staging path before keeping it.  
  Should it ever be promoted to StaffordOS truth: no.

- `staffordos/audits/no_kings/proof_package/`  
  Classification: `NEEDS_HUMAN_REVIEW`  
  Reason: empty placeholder directory for the proof package.  
  Related commit: none  
  Related authority: `shopifixer_fulfillment_authority_v1.md`  
  Related runtime evidence: none yet  
  Best-practice concern: placeholder proof-package directories can falsely imply proof exists.  
  Risk if kept: false signal risk.  
  Risk if deleted: no real data loss if it is only a placeholder.  
  Recommended action: confirm whether this path is intentionally reserved; otherwise remove it.  
  Should it ever be promoted to StaffordOS truth: no.

## 5. Vibe-code risk list

- High risk: the entire `staffordos/audits/no_kings/` evidence tree, especially `final_audit/`, `product_discovery/`, `reconciliation/`, `graphql_truth/`, `execution_truth/`, and `theme_backup/`. These bundles mix capture scripts, logs, screenshots, and strong-sounding conclusions. They are useful history, but they are not authority and should not be promoted to truth.
- High risk: the `staffordos/lifecycle_audit/` tree. It is a useful reconciliation layer, but it is still analysis. The file names sound canonical even when the contents are only derived judgments.
- High risk: most of `staffordos/operator_design/`. These are planning and verification outputs, not source truth. They are especially vulnerable to becoming “vibe-coded” because they often restate desired convergence as if it were already operational.
- High risk: `staffordos/cockpit_audit/rejected_ui/ceo_cockpit_ai_slop_rejected_20260603.tsx`. This is explicitly rejected UI code and should stay quarantined.
- Medium risk: `staffordos/authority/output/current_launch_readiness_score_v1.md` and `revenue_success_gate_v1.md`. They are grounded and useful, but they are still operator judgments and can go stale.
- Medium risk: `staffordos/operator_design/shopifixer_checkout_connection_results_v1.md` and `staffordos/lifecycle_audit/session_snapshots/active_runtime_repo_truth_20260603_v1.md`. Both are evidence snapshots; they are useful, but only if they stay synchronized with runtime reality.
- Low-level but still noise: `merchant_audit.sh` and `merchant_audit_output.txt`. They are classic loose-worktree artifacts: useful during exploration, not governed, not a source of truth.

## 6. Recommended next shell commands

1. `git diff --name-only --no-ext-diff -- *.md *.txt *.json *.tsx *.mjs *.html`
2. `find staffordos/audits/no_kings -maxdepth 2 -type d | sort`
3. `find staffordos/lifecycle_audit -maxdepth 2 -type d | sort`
4. `git status --short`
5. For any keep candidate you want to retain, verify it against current authority or runtime evidence before committing.

## 7. Explicit warning

Cleanup is not yet safe because the workspace contains a mix of:

- current authority outputs,
- historical audit bundles,
- runtime evidence snapshots,
- rejected UI code,
- empty placeholder directories, and
- loose generated outputs.

Do not broad-commit, do not broad-delete, and do not let any operator_design or lifecycle_audit artifact be treated as source truth without a direct authority or runtime check.
