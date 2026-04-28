# StaffordOS Agent Role Decomposition v1

Generated: 2026-04-28T23:00:58.690Z

## Purpose
Turn discovered agents/scripts into employee-like roles that can later be surfaced in the Command Center without guessing.

## Source Policy
Only agents from existing registry/files are included. This artifact does not claim agents are actively running unless execution evidence is later attached.

## Summary
- Agent registry found: true
- Registry agents detected: 17
- Filesystem agent-like files detected: 16
- Unique agent/capability records: 29

---

## Grouped Agent Roles

### unclassified

#### run_agent_v1
- ID: run_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### followup_agent_v1
- ID: followup_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### message_generation_agent_v1
- ID: message_generation_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### message_validation_agent_v1
- ID: message_validation_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### send_ledger_agent_v1
- ID: send_ledger_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### surface_patch_agent_v1
- ID: surface_patch_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### change_pipeline_v1
- ID: change_pipeline_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### dev_task_integrity_agent_v1
- ID: dev_task_integrity_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: System Map
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.

#### approval_interface_v1.mjs
- ID: approval_interface_v1
- Path: staffordos/agents/approval_interface_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: System Map
- Reads Data: true
- Writes Data: true
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Needs classification.


### execution / governance

#### approval_decision_agent_v1
- ID: approval_decision_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Command Center
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports safe execution and blocker/action control.

#### send_execution_agent_v1
- ID: send_execution_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Command Center
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports safe execution and blocker/action control.

#### execution_driver_v1.mjs
- ID: execution_driver_v1
- Path: staffordos/agents/execution_driver_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: Command Center
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports safe execution and blocker/action control.


### revenue / marketing

#### contact_enrichment_agent_v1
- ID: contact_enrichment_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### contact_research_agent_v1
- ID: contact_research_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### reply_detection_agent_v1
- ID: reply_detection_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### reply_interpretation_agent_v1
- ID: reply_interpretation_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### reply_response_agent_v1
- ID: reply_response_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### revenue_agent_v1
- ID: revenue_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### lead_registry_sync_agent_v1
- ID: lead_registry_sync_agent_v1
- Path: not specified
- Evidence Source: staffordos/agents/agent_registry_v1.json
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### revenue_truth_v1.json
- ID: revenue_truth_v1
- Path: staffordos/revenue/revenue_truth_v1.json
- Evidence Source: filesystem_detected
- Command Center Surface: Leads / Revenue Command
- Reads Data: false
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.

#### shopifixer_audit_to_outreach_v1.mjs
- ID: shopifixer_audit_to_outreach_v1
- Path: staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: Leads / Revenue Command
- Reads Data: true
- Writes Data: true
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports closing deals and revenue creation.


### system truth / hygiene

#### system_truth_sync_agent_v1.mjs
- ID: system_truth_sync_agent_v1
- Path: staffordos/agents/system_truth_sync_agent_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: System Map / Command Center
- Reads Data: true
- Writes Data: true
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports trusted operation and prevents fake system state.

#### registry_reality_audit_v1.mjs
- ID: registry_reality_audit_v1
- Path: staffordos/system_inventory/registry_reality_audit_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: System Map / Command Center
- Reads Data: true
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports trusted operation and prevents fake system state.

#### shape_map_v1.mjs
- ID: shape_map_v1
- Path: staffordos/system_inventory/shape_map_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: System Map / Command Center
- Reads Data: true
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports trusted operation and prevents fake system state.

#### shape_runtime_v1.mjs
- ID: shape_runtime_v1
- Path: staffordos/system_inventory/shape_runtime_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: System Map / Command Center
- Reads Data: true
- Writes Data: true
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports trusted operation and prevents fake system state.

#### shape_diff_v1.mjs
- ID: shape_diff_v1
- Path: staffordos/system_inventory/shape_diff_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: System Map / Command Center
- Reads Data: true
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports trusted operation and prevents fake system state.

#### patch_gate_v1.mjs
- ID: patch_gate_v1
- Path: staffordos/system_inventory/patch_gate_v1.mjs
- Evidence Source: filesystem_detected
- Command Center Surface: System Map / Command Center
- Reads Data: true
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports trusted operation and prevents fake system state.


### audit / diagnostic

#### guidedAuditEngine.js
- ID: guidedAuditEngine
- Path: staffordos/scorecards/guidedAuditEngine.js
- Evidence Source: filesystem_detected
- Command Center Surface: Capacity / System Map
- Reads Data: true
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports client/system diagnosis and service packaging.

#### runAuditResolver.js
- ID: runAuditResolver
- Path: staffordos/scorecards/runAuditResolver.js
- Evidence Source: filesystem_detected
- Command Center Surface: Capacity / System Map
- Reads Data: true
- Writes Data: false
- Control Status: not_yet_operator_controlled
- Decomposition Status: needs_input_output_contract
- Business Relevance: Supports client/system diagnosis and service packaging.

---

## Required Next Synthesis

Before agents appear as controllable employees in Command Center, each agent needs:

1. Input contract
2. Output contract
3. Trigger mode
4. Last-run evidence
5. Risk level
6. Approval requirement
7. Owner surface
8. Business objective served

## Command Center Implication

The Command Center should not merely list agents. It should show:

- Which agents are active
- Which agents are blocked
- Which agents need Ross approval
- Which agents generated useful output
- Which agents directly support income
- Which agents support system health

