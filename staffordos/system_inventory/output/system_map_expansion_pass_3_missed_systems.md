# System Map Expansion Pass 3 — Missed Systems → Capability Groups

Generated: 2026-04-29T00:10:16.292Z

## Purpose
Convert missed systems discovery into capability groups that can be merged into the System Map truth graph.

## Rule
No UI build yet. This pass only classifies already discovered assets.

---

## Capability Groups


### Control / Worker Loops
- ID: loops
- Status: REAL
- Files Found: 6/6
- Business Value: Keeps system processes running, checking, or completing work.
- Command Center Surface: Command Center / System Map

#### Files
- FOUND: staffordos/loop/staffordos_loop_v1.mjs
- FOUND: staffordos/loop/STAFFORDOS_LOOP_V1.md
- FOUND: staffordos/hygiene/run_hygiene_control_loop.js
- FOUND: staffordos/proof_loop/run_merchant_proof_loop_completion_pack.js
- FOUND: staffordos/proof_loop/merchant_proof_loop_completion_pack_v1.js
- FOUND: web/src/lib/send-worker-loop.js


### ShopiFixer Audit / Diagnostic System
- ID: shopifixer_audit
- Status: REAL
- Files Found: 13/13
- Business Value: Finds storefront issues and creates a paid fix path.
- Command Center Surface: Capacity / Products / Revenue Command

#### Files
- FOUND: staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs
- FOUND: staffordos/scorecards/guidedAuditEngine.js
- FOUND: staffordos/scorecards/runAuditResolver.js
- FOUND: staffordos/scorecards/verify_guided_audit.js
- FOUND: staffordos/scorecards/verify_run_audit.js
- FOUND: web/src/routes/runAudit.esm.js
- FOUND: web/src/routes/guidedAudit.esm.js
- FOUND: abando-frontend/app/run-audit/page.tsx
- FOUND: abando-frontend/app/free-audit/page.tsx
- FOUND: abando-frontend/app/audit-result/page.tsx
- FOUND: abando-frontend/app/api/audit/start/route.ts
- FOUND: abando-frontend/app/api/audit/status/route.ts
- FOUND: abando-frontend/app/api/audit/preview/[storeId]/route.ts


### ShopiFixer Execution / Page Upgrade System
- ID: shopifixer_execution
- Status: REAL
- Files Found: 5/5
- Business Value: Turns audit findings into actual fixes or upgrade packets.
- Command Center Surface: Capacity / Command Center

#### Files
- FOUND: staffordos/agents/apply_shopifixer_conversion_v2.mjs
- FOUND: staffordos/agents/apply_shopifixer_page_upgrade_v2.mjs
- FOUND: staffordos/packets/shopifixer_governed_outreach_packet_v1.json
- FOUND: staffordos/packets/shopifixer_page_upgrade_packet_v2.json
- FOUND: staffordos/surfaces/staffordmedia_shopifixer_prod_surface_change_packet_v1.json


### Execution Packet System
- ID: execution_packets
- Status: REAL
- Files Found: 7/7
- Business Value: Packages decisions into governed work units.
- Command Center Surface: Command Center

#### Files
- FOUND: staffordos/optimization/packetTemplates.js
- FOUND: staffordos/optimization/executionPacketGenerator.js
- FOUND: staffordos/optimization/executionPacketRepository.js
- FOUND: staffordos/optimization/verifyExecutionPacketPersistence.js
- FOUND: staffordos/optimization/persistExecutionPacket.js
- FOUND: staffordos/optimization/executionPacketRegistry.json
- FOUND: staffordos/packets/conversion_upgrade_packet_v2.json


### Execution / Revenue / Patch Gates
- ID: gates
- Status: REAL
- Files Found: 9/9
- Business Value: Prevents unsafe execution and validates readiness.
- Command Center Surface: Command Center / System Map

#### Files
- FOUND: staffordos/gates/revenue_gate_v1.mjs
- FOUND: staffordos/system_inventory/patch_gate_v1.mjs
- FOUND: staffordos/optimization/paymentGate.js
- FOUND: staffordos/hygiene/branch_scope_gate_v1.js
- FOUND: staffordos/hygiene/run_branch_scope_gate.js
- FOUND: staffordos/hygiene/run_worktree_cleanup_gate.js
- FOUND: staffordos/revenue/revenue_gate.js
- FOUND: staffordos/revenue/verify_revenue_gate.js
- FOUND: web/src/middleware/usageGate.js


### Onboarding System
- ID: onboarding
- Status: REAL
- Files Found: 6/6
- Business Value: Collects client/store setup information for service or app activation.
- Command Center Surface: Capacity / Products

#### Files
- FOUND: scripts/leads/send_onboarding_message.mjs
- FOUND: scripts/patch_onboarding_page.sh
- FOUND: web/src/public/onboarding/index.html
- FOUND: abando-frontend/src/app_legacy/onboarding/OnboardingForm.tsx
- FOUND: abando-frontend/src/app_legacy/onboarding/Client.tsx
- FOUND: abando-frontend/src/app_legacy/onboarding/page.tsx


### Abando Recovery System
- ID: recovery
- Status: REAL
- Files Found: 7/7
- Business Value: Recovers abandoned carts and attributes revenue.
- Command Center Surface: Products / Revenue Command / Analytics

#### Files
- FOUND: staffordos/deploy/check_recovery_link_base.js
- FOUND: web/lib/composeRecoveryMessage.js
- FOUND: web/src/lib/recoveryAttribution.js
- FOUND: web/src/lib/recoveryMessageEngine.js
- FOUND: abando-frontend/app/api/abando/activation/trigger-test-recovery/route.ts
- FOUND: abando-frontend/src/components/dashboard/RecoveryOpportunityCard.tsx
- FOUND: abando-frontend/src/components/RecoveryEntryCta.tsx


### Routing System
- ID: routers
- Status: REAL
- Files Found: 5/5
- Business Value: Routes leads, stores, tasks, or actions to the correct workflow.
- Command Center Surface: System Map / Command Center

#### Files
- FOUND: staffordos/leads/router.js
- FOUND: staffordos/router/router_v1_real_store_worksheet.mjs
- FOUND: staffordos/router/router_v1_harness.mjs
- FOUND: staffordos/router/router_v1_1.js
- FOUND: staffordos/router/router_v1.js


### Execution Control System
- ID: execution_control
- Status: REAL
- Files Found: 4/4
- Business Value: Determines allowed automation scope and execution mode.
- Command Center Surface: Command Center

#### Files
- FOUND: staffordos/execution/verifyExecutionControl.js
- FOUND: staffordos/execution/automationScope.js
- FOUND: staffordos/execution/resolveExecutionMode.js
- FOUND: staffordos/agents/execution_driver_v1.mjs


### Legacy / Earlier Command Center Surfaces
- ID: legacy_command_center
- Status: REAL
- Files Found: 6/6
- Business Value: Older UI assets that may contain useful UX or state patterns.
- Command Center Surface: System Map / Command Center

#### Files
- FOUND: staffordos/ui/command-center/styles.css
- FOUND: staffordos/ui/command-center/app.js
- FOUND: staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts
- FOUND: staffordos/ui/operator-frontend/app/operator/command-center/page.tsx
- FOUND: abando-frontend/src/app_legacy/command-center/StatusPanel.tsx
- FOUND: abando-frontend/src/app_legacy/command-center/page.tsx


---

## Required Truth Graph Update
These groups must be added to:

- system_map_truth_graph_v1.json
- System Map UI
- Command Center requirements
- Product capability decomposition
- Data ownership matrix where files read/write state

## Important Finding
The previous truth graph was incomplete because it did not fully represent:
- loops
- ShopiFixer audit/fix workflow
- execution packets
- gates
- onboarding
- Abando recovery
- routing
- execution control
- older command center assets

