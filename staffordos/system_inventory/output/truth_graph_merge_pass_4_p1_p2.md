# Truth Graph Merge Pass 4 — P1 Income + P2 Operations

Generated: 2026-04-29T01:09:25.593Z

## Purpose
Merge prioritized P1 income and P2 operations assets into the System Map truth graph as review-required capability groups.

## Rule
These are not declared fully trusted. They are now visible in the graph as discovered assets requiring review.

---

## Summary
- P1 income assets: 21
- P2 operations assets: 43
- New graph nodes added: 0

---

## Merged Capability Groups


### Revenue Engine
- Graph Node: pass4_revenue_engine
- Type: income_capability
- Status: DISCOVERED_REQUIRES_REVIEW
- Files: 9

#### Evidence Files
- staffordos/revenue/revenue_agent_v1.mjs
- staffordos/revenue/verifyPaymentAgreementLayer.js
- staffordos/revenue/paymentAgreements.json
- staffordos/revenue/paymentAgreementRepository.js
- staffordos/scorecards/verify_revenue_leakage_entry.js
- web/src/routes/revenueLeakageEntry.esm.js
- abando-frontend/src/components/audit/RevenueOpportunityRow.tsx
- abando-frontend/src/components/audit/RevenueOpportunityMap.tsx
- abando-frontend/src/lib/revenueRisk.ts


### Checkout Event System
- Graph Node: pass4_checkout_events
- Type: income_capability
- Status: DISCOVERED_REQUIRES_REVIEW
- Files: 11

#### Evidence Files
- abando-frontend/app/api/checkout-events/route.ts
- abando-frontend/web/src/dev/checkoutPublic.cjs
- abando-frontend/.bak/checkout.ts.20250930-095443
- abando-frontend/src/app_legacy/api/checkout/route.ts
- abando-frontend/src/components/dashboard/CheckoutFlow.tsx
- abando-frontend/src/components/scorecard/CheckoutFlowDiagram.tsx
- abando-frontend/src/lib/checkout.ts
- abando-frontend/src/lib/dashboard/confirmation/getSeededCheckoutEvents.ts
- abando-frontend/src/lib/dashboard/storage/getCheckoutEventsForShop.ts
- abando-frontend/src/lib/dashboard/storage/checkoutEventValidator.ts
- abando-frontend/src/lib/dashboard/storage/saveCheckoutEvents.ts


### ShopiFixer Revenue / Fix System
- Graph Node: pass4_shopifixer_revenue
- Type: income_capability
- Status: DISCOVERED_REQUIRES_REVIEW
- Files: 1

#### Evidence Files
- abando-frontend/app/shopifixer/page.tsx


### Agent Workforce
- Graph Node: pass4_agent_workforce
- Type: operations_capability
- Status: DISCOVERED_REQUIRES_REVIEW
- Files: 31

#### Evidence Files
- staffordos/system_inventory/output/agent_role_decomposition_v1.md
- staffordos/leads/reply_interpretation_agent_v1.mjs
- staffordos/leads/reply_response_agent_v1.mjs
- staffordos/leads/contact_enrichment_agent_v1.mjs
- staffordos/leads/reply_detection_agent_v1.mjs
- staffordos/leads/message_generation_agent_v1.mjs
- staffordos/leads/contact_research_agent_v1.mjs
- staffordos/leads/send_execution_agent_v1.mjs
- staffordos/leads/message_integrity_agent_v1.mjs
- staffordos/leads/lead_registry_sync_agent_v1.mjs
- staffordos/leads/approval_decision_agent_v1.mjs
- staffordos/leads/followup_agent_v1.mjs
- staffordos/leads/send_ledger_agent_v1.mjs
- staffordos/leads/message_validation_agent_v1.mjs
- staffordos/agents/dev_task_integrity_agent_v1.mjs
- staffordos/agents/prod_parity_agent_v1.mjs
- staffordos/agents/prod_surface_change_packet_v1.mjs
- staffordos/agents/surface_patch_agent_v1.mjs
- staffordos/agents/run_agent_v1.mjs
- staffordos/agents/progress_contract_loader_v1.mjs
- staffordos/agents/progress_contract_v1.json
- staffordos/agents/approval_interface_v1.mjs
- staffordos/agents/validate_progress_contract_v1.mjs
- staffordos/agents/system_truth_sync_agent_v1.mjs
- staffordos/agents/apply_patch_mode_v1.mjs
- staffordos/agents/change_pipeline_v1.mjs
- staffordos/hygiene/hygiene_agent_v1.js
- scripts/agent_role_decomposition_v1.mjs
- scripts/diag_cart_agent_api.sh
- scripts/sync_cart_agent_api_base.sh
- abando-frontend/src/components/director/AgentControls.tsx


### Runtime Loops
- Graph Node: pass4_runtime_loops
- Type: operations_capability
- Status: DISCOVERED_REQUIRES_REVIEW
- Files: 2

#### Evidence Files
- staffordos/deploy/check_abando_proof_loop.js
- staffordos/proof_loop/merchant_proof_loop_completion_pack.md


### Execution Packets
- Graph Node: pass4_execution_packets
- Type: operations_capability
- Status: DISCOVERED_REQUIRES_REVIEW
- Files: 6

#### Evidence Files
- staffordos/planning/Execution_Board_Template.md
- staffordos/hygiene/cleanup_execution_plan.md
- staffordos/hygiene/cleanup_execution_pack_v1.js
- staffordos/hygiene/run_cleanup_execution_pack.js
- staffordos/hygiene/cleanup_execution_pack_v2.js
- staffordos/hygiene/run_cleanup_execution_pack_v2.js


### Execution Gates
- Graph Node: pass4_execution_gates
- Type: operations_capability
- Status: DISCOVERED_REQUIRES_REVIEW
- Files: 4

#### Evidence Files
- staffordos/hygiene/output/worktree_cleanup_gate_report.md
- staffordos/hygiene/worktree_cleanup_gate_report.md
- staffordos/hygiene/worktree_cleanup_gate_v1.js
- scripts/patch_allow_webhook_paths_in_gate.sh


---

## Next Required Step
Review each PASS 4 group and classify:

1. Real operational capability
2. Partial / needs proof
3. Duplicate / legacy
4. UI-worthy now
5. System-map-only

After that, System Map UI can read from the graph without hiding these assets.
