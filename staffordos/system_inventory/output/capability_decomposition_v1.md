# StaffordOS Capability Decomposition v1

## Purpose
Map all audited system components to real capabilities without assumption.

---

## 1. Leads Capability
- Source: lead_registry_v1.json
- Function:
  - lead storage
  - lifecycle tracking
  - next action
- Business Objective: Close deals
- Status: REAL

---

## 2. Send Capability
- Source:
  - send_ledger_v1.json
  - send_execution_log_v1.json
- Function:
  - send tracking
  - proof logging
- Business Objective: Close deals / Generate revenue
- Status: PARTIAL (dry-run only)

---

## 3. Revenue Capability
- Source:
  - revenue_truth_v1.json
- Function:
  - funnel tracking
  - bottleneck detection
- Business Objective: Generate revenue
- Status: PARTIAL (not fully operationalized)

---

## 4. Agent Capability
- Source:
  - agent_registry_v1.json
  - agent scripts
- Function:
  - automation tasks
  - scoring
  - enrichment
- Business Objective: Automate operations
- Status: PARTIAL (not surfaced)

---

## 5. System Truth Capability
- Source:
  - system_map_truth_v1.json
- Function:
  - environment awareness
  - infra visibility
- Business Objective: Operate with control
- Status: REAL

---

## 6. Environment Inventory
- Source:
  - environment_inventory_v1.json
- Function:
  - runtime context
- Business Objective: Operate system
- Status: REAL

---

## Notes
- No assumptions included
- Only audited artifacts used
