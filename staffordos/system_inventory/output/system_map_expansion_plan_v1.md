# StaffordOS System Map Expansion Plan v1

## Purpose
Define the full scope required for the System Map to accurately represent ALL real system assets, capabilities, and runtime truth before Command Center UX improvements.

---

## 1. LOCAL SYSTEM TRUTH

### Must Include
- Repo structure (key directories only)
- Active branch + git status
- Recent commits affecting system behavior
- Local runtime services (Next.js, backend, workers)

### Sources
- system_map_truth_v1.json
- environment_inventory_v1.json

### Goal
Full visibility into what is running locally and what code state exists.

---

## 2. SERVER / INFRASTRUCTURE TRUTH

### Must Include
- Kubernetes cluster state
- Active pods (cart-agent, argocd, etc.)
- Deployment health
- ArgoCD sync + health status
- Backend service health endpoints

### Sources
- system_map_truth_v1.json (server + kubernetes sections)

### Goal
Understand if system is actually alive and operational beyond local machine.

---

## 3. PRODUCT CAPABILITIES (BY PRODUCT)

### Must Include
- Abando
- Shopifixer
- StaffordOS core

### For each product:
- What it does (capability)
- What stage it is in (real / partial / placeholder)
- What data it owns
- What revenue it produces or should produce

### Sources
- audit_artifact_index_v1.md
- revenue_truth_v1.json
- connectors + scripts

### Goal
Separate product logic from infrastructure and understand monetization paths.

---

## 4. AGENT SYSTEM

### Must Include
- All agents in agent_registry_v1.json
- Agent type (dev / marketing / revenue / hygiene)
- Last execution
- Output artifacts
- Whether agent is active or dormant

### Sources
- agent_registry_v1.json
- agent logs
- execution logs

### Goal
Treat agents like employees:
- what they do
- if they are working
- what they produced

---

## 5. BUSINESS ENGINES

### Must Include
- Leads Engine
- Send Engine (email + SMS)
- Revenue Engine
- Decision Engine

### For each engine:
- Input data
- Output data
- Current state
- Blocker

### Sources
- lead_registry_v1.json
- send_ledger_v1.json
- send_execution_log_v1.json
- revenue_truth_v1.json
- system-truth API

### Goal
Map how money is supposed to flow through the system.

---

## 6. DATA FLOW (CRITICAL)

### Must Include
Clear directional flow:

- Leads → Send → Proof → Revenue
- Agents → Data → Decisions
- Products → Events → Revenue

### Sources
- system_map_truth_v1.json
- revenue_truth_v1.json
- connectors

### Goal
Understand system behavior, not just components.

---

## 7. REAL vs PARTIAL vs PLACEHOLDER TAGGING

### Definitions

REAL:
- Proven execution
- Produces output
- Used by system

PARTIAL:
- Exists but incomplete
- Not fully wired
- Not producing consistent output

PLACEHOLDER:
- UI exists only
- No real backend capability

### Goal
Eliminate illusion of progress.

---

## 8. OBJECTIVE / BRD / FRD BINDING

### Must Include
For every capability:

- Personal Objective
- Business Objective
- Business Requirement
- Functional Requirement

### Source
- objective_binding_v1.json
- brd_frd_command_center_binding_v1.md

### Goal
Ensure system exists for a reason (not just engineering).

---

## 9. COMMAND CENTER DESTINATION MAPPING

### Must Include

For each capability:
- Which surface owns it

Mapping:

- Console → global interface
- Command Center → decisions + blockers
- Capacity → service execution (Shopifixer)
- Leads → deal engine
- Revenue Command → income engine
- Analytics → feedback loop
- Products → product state
- System Map → truth layer

### Goal
Prevent orphaned functionality.

---

## 10. GAP DETECTION LAYER

### Must Identify

- Missing capabilities
- Broken flows
- Duplicate systems
- Unused agents
- Revenue blockers

### Output
Explicit list of:
- what is missing
- what is broken
- what is redundant

---

## FINAL DEFINITION OF "COMPLETE SYSTEM MAP"

System Map is complete when:

1. Every real system component is visible
2. Every component is classified (real/partial/placeholder)
3. Every component is tied to an objective
4. Every component has a command center destination
5. Data flows are clear
6. Revenue path is traceable end-to-end

---

## RULE

No Command Center redesign until:
✔ System Map Expansion Plan is fully satisfied

