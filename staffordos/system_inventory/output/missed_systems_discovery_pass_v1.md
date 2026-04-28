# Missed Systems Discovery Pass v1

## Purpose
Identify major existing StaffordOS / Abando / ShopiFixer systems not yet represented in the truth graph.

## Required Search Areas
- loops
- repair / self-healing
- ShopiFixer audit
- slice execution
- dev system
- operator packets
- onboarding / service packs
- command center truth
- product routing
- execution gates
- revenue recovery
=== SEARCH MISSED SYSTEMS ===

## TERM: loop
staffordos/deploy/check_abando_proof_loop.js
staffordos/hygiene/run_hygiene_control_loop.js
staffordos/proof_loop/run_merchant_proof_loop_completion_pack.js
staffordos/proof_loop/merchant_proof_loop_completion_pack_v1.js
staffordos/proof_loop/merchant_proof_loop_completion_pack.md
staffordos/loop/staffordos_loop_v1.mjs
staffordos/loop/STAFFORDOS_LOOP_V1.md
web/src/lib/send-worker-loop.js

## TERM: loops

## TERM: self-healing

## TERM: repair
scripts/repair_demo_playground_and_deploy.sh

## TERM: shopifixer
staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs
staffordos/agents/apply_shopifixer_conversion_v2.mjs
staffordos/agents/apply_shopifixer_page_upgrade_v2.mjs
staffordos/packets/shopifixer_governed_outreach_packet_v1.json
staffordos/packets/shopifixer_page_upgrade_packet_v2.json
staffordos/surfaces/staffordmedia_shopifixer_prod_surface_change_packet_v1.json
abando-frontend/app/shopifixer/page.tsx

## TERM: audit
staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs
staffordos/system_inventory/output/audit_artifact_index_v1.md
staffordos/system_inventory/registry_reality_audit_v1.mjs
staffordos/scorecards/guidedAuditEngine.js
staffordos/scorecards/verify_guided_audit.js
staffordos/scorecards/verify_run_audit.js
staffordos/scorecards/runAuditResolver.js
web/src/routes/runAudit.esm.js
web/src/routes/guidedAudit.esm.js
abando-frontend/app/run-audit/page.tsx
abando-frontend/app/free-audit/page.tsx
abando-frontend/app/audit-result/page.tsx
abando-frontend/app/api/director/runAuditFactory/route.ts
abando-frontend/app/api/audit/start/route.ts
abando-frontend/app/api/audit/status/route.ts
abando-frontend/app/api/audit/exportScreenshot/[storeId]/route.ts
abando-frontend/app/api/audit/preview/[storeId]/route.ts
abando-frontend/app/audit-preview/[storeId]/page.tsx
abando-frontend/src/app_legacy/run-audit/RunAuditForm.tsx
abando-frontend/src/app_legacy/run-audit/page.tsx
abando-frontend/src/app_legacy/free-audit/page.tsx
abando-frontend/src/app_legacy/audit-result/page.tsx
abando-frontend/src/components/dashboard/AuditSummaryCard.tsx
abando-frontend/src/components/public/RunAuditForm.tsx
abando-frontend/src/components/audit/AuditResultPage.tsx
abando-frontend/src/components/audit/RevenueOpportunityRow.tsx
abando-frontend/src/components/audit/AuditPreviewCard.tsx
abando-frontend/src/components/audit/BenchmarkComparisonCard.tsx
abando-frontend/src/components/audit/InstallCtaBar.tsx
abando-frontend/src/components/audit/FreeAuditForm.tsx
abando-frontend/src/components/audit/RevenueOpportunityMap.tsx
abando-frontend/src/components/audit/AuditPreviewLayout.tsx
abando-frontend/src/components/audit/AuditProgressState.tsx
abando-frontend/src/components/audit/HeroMetricCard.tsx
abando-frontend/src/components/audit/StoreIdentityBar.tsx
abando-frontend/src/components/audit/PrimaryIssueCard.tsx
abando-frontend/src/components/audit/BenchmarkBadge.tsx

## TERM: slice

## TERM: dev-system

## TERM: packet
staffordos/optimization/packetTemplates.js
staffordos/optimization/executionPacketGenerator.js
staffordos/optimization/executionPacketRepository.js
staffordos/optimization/verifyExecutionPacketPersistence.js
staffordos/optimization/persistExecutionPacket.js
staffordos/optimization/executionPacketRegistry.json
staffordos/agents/prod_surface_change_packet_v1.mjs
staffordos/packets/conversion_upgrade_packet_v2.json
staffordos/packets/shopifixer_governed_outreach_packet_v1.json
staffordos/packets/shopifixer_page_upgrade_packet_v2.json
staffordos/surfaces/staffordmedia_shopifixer_prod_surface_change_packet_v1.json

## TERM: packets
staffordos/packets/conversion_upgrade_packet_v2.json
staffordos/packets/shopifixer_governed_outreach_packet_v1.json
staffordos/packets/shopifixer_page_upgrade_packet_v2.json

## TERM: gate
staffordos/gates/revenue_gate_v1.mjs
staffordos/system_inventory/patch_gate_v1.mjs
staffordos/optimization/paymentGate.js
staffordos/hygiene/branch_scope_gate_v1.js
staffordos/hygiene/run_branch_scope_gate.js
staffordos/hygiene/run_worktree_cleanup_gate.js
staffordos/hygiene/output/worktree_cleanup_gate_report.md
staffordos/hygiene/worktree_cleanup_gate_report.md
staffordos/hygiene/worktree_cleanup_gate_v1.js
staffordos/revenue/revenue_gate.js
staffordos/revenue/verify_revenue_gate.js
scripts/patch_allow_webhook_paths_in_gate.sh
web/src/middleware/usageGate.js

## TERM: onboarding
scripts/leads/send_onboarding_message.mjs
scripts/patch_onboarding_page.sh
web/src/public/onboarding/index.html
abando-frontend/src/app_legacy/onboarding/OnboardingForm.tsx
abando-frontend/src/app_legacy/onboarding/Client.tsx
abando-frontend/src/app_legacy/onboarding/page.tsx
abando-frontend/src/app_legacy/onboarding/template.tsx

## TERM: service-pack

## TERM: service_pack

## TERM: command-center
staffordos/ui/command-center/styles.css
staffordos/ui/command-center/app.js
staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts
staffordos/ui/operator-frontend/app/operator/command-center/page.tsx
abando-frontend/src/app_legacy/command-center/StatusPanel.tsx
abando-frontend/src/app_legacy/command-center/page.tsx

## TERM: recovery
staffordos/deploy/check_recovery_link_base.js
web/lib/composeRecoveryMessage.js
web/src/lib/recoveryAttribution.js
web/src/lib/recoveryMessageEngine.js
abando-frontend/app/api/abando/activation/trigger-test-recovery/route.ts
abando-frontend/src/components/dashboard/RecoveryOpportunityCard.tsx
abando-frontend/src/components/RecoveryEntryCta.tsx

## TERM: router
staffordos/leads/router.js
staffordos/router/router_v1_real_store_worksheet.mjs
staffordos/router/router_v1_harness.mjs
staffordos/router/router_v1_1.js
staffordos/router/router_v1.js

## TERM: execution
staffordos/leads/send_execution_log_v1.json
staffordos/leads/send_execution_agent_v1.mjs
staffordos/optimization/executionPacketGenerator.js
staffordos/optimization/executionPacketRepository.js
staffordos/optimization/verifyExecutionPacketPersistence.js
staffordos/optimization/persistExecutionPacket.js
staffordos/optimization/executionPacketRegistry.json
staffordos/planning/Execution_Board_Template.md
staffordos/agents/execution_driver_v1.mjs
staffordos/hygiene/cleanup_execution_plan.md
staffordos/hygiene/cleanup_execution_pack_v1.js
staffordos/hygiene/run_cleanup_execution_pack.js
staffordos/hygiene/cleanup_execution_pack_v2.js
staffordos/hygiene/run_cleanup_execution_pack_v2.js
staffordos/execution/verifyExecutionControl.js
staffordos/execution/automationScope.js
staffordos/execution/resolveExecutionMode.js
