# StaffordOS Data Ownership Matrix v1

Generated: 2026-04-28T23:07:25.240Z

---

## Purpose

Identify who writes and who reads each critical data artifact.

This defines control, dependencies, and where the system can break.

---

## Matrix

### lead_registry

- Path: staffordos/leads/lead_registry_v1.json
- Exists: true
- Purpose: source of truth for all leads

- Writers:
  - lead ingestion
  - lead sync agent

- Readers:
  - leads UI
  - revenue engine
  - send system

### lead_events

- Path: staffordos/leads/lead_events_v1.json
- Exists: true
- Purpose: event history of leads

- Writers:
  - unknown

- Readers:
  - unknown

### send_ledger

- Path: staffordos/leads/send_ledger_v1.json
- Exists: true
- Purpose: proof of outreach execution

- Writers:
  - send_execution_agent
  - manual mark_sent

- Readers:
  - revenue command
  - proof display

### send_execution_log

- Path: staffordos/leads/send_execution_log_v1.json
- Exists: true
- Purpose: execution log of sends

- Writers:
  - unknown

- Readers:
  - unknown

### revenue_truth

- Path: staffordos/revenue/revenue_truth_v1.json
- Exists: true
- Purpose: revenue funnel + bottleneck truth

- Writers:
  - revenue_agent

- Readers:
  - command center
  - analytics

### agent_registry

- Path: staffordos/agents/agent_registry_v1.json
- Exists: true
- Purpose: declared agent system

- Writers:
  - developer / system

- Readers:
  - command center
  - system map

### environment_inventory

- Path: staffordos/hygiene/environment_inventory_v1.json
- Exists: true
- Purpose: runtime environment truth

- Writers:
  - unknown

- Readers:
  - unknown

### system_map_truth

- Path: staffordos/system_map/system_map_truth_v1.json
- Exists: true
- Purpose: full system snapshot

- Writers:
  - system audit tools

- Readers:
  - system map UI
  - operator


---

## Key Insight

If a file has:
- NO clear writer → system cannot progress
- NO clear reader → system produces useless output
- MULTIPLE writers → risk of corruption
- MULTIPLE readers → high dependency surface

---

## Critical Observations

You must identify:

1. Which data drives revenue
2. Which data is blocking revenue
3. Which data is never used
4. Which data is duplicated

---

## Next Required Layer

After this:

→ Real vs Partial vs Placeholder Matrix (data-level)
→ Then Command Center becomes truly accurate

