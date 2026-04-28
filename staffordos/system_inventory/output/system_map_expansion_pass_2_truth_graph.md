# System Map Expansion Pass 2 — Truth Graph Build

Generated: 2026-04-28T23:39:40.296Z

## Purpose
Create a unified truth graph from existing audit/truth artifacts so the System Map can become derived, current, and harder to fake.

## Source Policy
Derived only from existing audit/truth artifacts. No manual claims without source evidence.

---

## Source Coverage
- FOUND: staffordos/system_map/system_map_truth_v1.json
- FOUND: staffordos/system_inventory/output/audit_artifact_index_v1.md
- FOUND: staffordos/system_inventory/output/system_map_expansion_plan_v1.md
- FOUND: staffordos/system_inventory/output/system_map_expansion_pass_1.md
- FOUND: staffordos/system_inventory/output/capability_decomposition_v1.md
- FOUND: staffordos/system_inventory/output/brd_frd_command_center_binding_v1.md
- FOUND: staffordos/system_inventory/objective_binding_v1.json
- FOUND: staffordos/system_inventory/output/agent_role_decomposition_v1.json
- FOUND: staffordos/system_inventory/output/agent_control_requirements_v1.md
- FOUND: staffordos/system_inventory/output/data_ownership_matrix_v1.json
- FOUND: staffordos/system_inventory/output/real_partial_placeholder_matrix_v1.json
- FOUND: staffordos/leads/lead_registry_v1.json
- FOUND: staffordos/leads/send_ledger_v1.json
- FOUND: staffordos/revenue/revenue_truth_v1.json
- FOUND: staffordos/agents/agent_registry_v1.json

---

## Metrics
- Leads: 22
- Send proofs: 2
- Agents/capabilities: 29
- Capability records: 16
- REAL capabilities: 5
- PARTIAL capabilities: 8
- PLACEHOLDER capabilities: 3

---

## Truth Graph Nodes
### Local System
- ID: local_system
- Type: runtime
- Status: REAL
- Count: n/a
- Summary: Local repo/runtime truth from committed system map truth artifact.
- Evidence:
  - staffordos/system_map/system_map_truth_v1.json

### Server / Kubernetes / ArgoCD
- ID: server_infra
- Type: runtime
- Status: REAL
- Count: n/a
- Summary: Server, Kubernetes, and ArgoCD truth.
- Evidence:
  - staffordos/system_map/system_map_truth_v1.json

### Lead Registry
- ID: lead_registry
- Type: data_store
- Status: REAL
- Count: 22
- Summary: Canonical lead registry.
- Evidence:
  - staffordos/leads/lead_registry_v1.json

### Send Proof Ledger
- ID: send_proof
- Type: data_store
- Status: PARTIAL
- Count: 2
- Summary: Proof ledger for outreach. Current records may be dry-run/operator proof unless live provider proof exists.
- Evidence:
  - staffordos/leads/send_ledger_v1.json

### Revenue Truth
- ID: revenue_truth
- Type: business_engine
- Status: PARTIAL
- Count: n/a
- Summary: Revenue funnel and blocker truth.
- Evidence:
  - staffordos/revenue/revenue_truth_v1.json

### Agent System
- ID: agent_system
- Type: automation_layer
- Status: PARTIAL
- Count: 29
- Summary: Discovered agents/capabilities, not yet fully controlled.
- Evidence:
  - staffordos/system_inventory/output/agent_role_decomposition_v1.json
  - staffordos/agents/agent_registry_v1.json

### Objective / BRD / FRD Binding
- ID: objective_binding
- Type: strategy_layer
- Status: REAL
- Count: n/a
- Summary: Personal objectives, business objectives, requirements, and UI binding.
- Evidence:
  - staffordos/system_inventory/objective_binding_v1.json
  - staffordos/system_inventory/output/brd_frd_command_center_binding_v1.md

### Local System Truth
- ID: capability_local_system_truth
- Type: capability
- Status: REAL
- Count: n/a
- Summary: Local machine, branch, status, and recent commit truth exist.
- Evidence:
  - staffordos/system_map/system_map_truth_v1.json

### Server / Kubernetes / ArgoCD Truth
- ID: capability_server_kubernetes_argocd_truth
- Type: capability
- Status: REAL
- Count: n/a
- Summary: Server, Kubernetes, cart-agent deployment, and ArgoCD truth exist.
- Evidence:
  - staffordos/system_map/system_map_truth_v1.json

### Lead Registry
- ID: capability_lead_registry
- Type: capability
- Status: REAL
- Count: n/a
- Summary: 22 leads found in canonical registry.
- Evidence:
  - staffordos/leads/lead_registry_v1.json

### Lead Events
- ID: capability_lead_events
- Type: capability
- Status: REAL
- Count: n/a
- Summary: Lead event artifact exists and records lifecycle movement.
- Evidence:
  - staffordos/leads/lead_events_v1.json

### Send Proof
- ID: capability_send_proof
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: 2 send proofs found; 2 dry-run proofs; 0 live sends proven.
- Evidence:
  - staffordos/leads/send_ledger_v1.json

### Real Email Send
- ID: capability_real_email_send
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: Current proof chain does not prove real provider-backed email send.
- Evidence:
  - staffordos/leads/send_ledger_v1.json
  - staffordos/leads/send_execution_log_v1.json

### Real SMS Send
- ID: capability_real_sms_send
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: SMS delivery is not proven by current send proof records.
- Evidence:
  - staffordos/leads/send_ledger_v1.json

### Revenue Truth
- ID: capability_revenue_truth
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: Revenue truth artifact exists, but paid conversion/recovered revenue is not yet fully operationalized.
- Evidence:
  - staffordos/revenue/revenue_truth_v1.json
  - staffordos/revenue/revenue_truth_v1.md

### Agent Registry
- ID: capability_agent_registry
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: Agents are discovered, but not yet controlled, trusted, or surfaced.
- Evidence:
  - staffordos/agents/agent_registry_v1.json

### Command Center
- ID: capability_command_center
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: UI exists, but is not yet fully driven by objective binding, agent control, and complete system truth.
- Evidence:
  - staffordos/ui/operator-frontend/app/operator/command-center

### Leads Surface
- ID: capability_leads_surface
- Type: capability
- Status: REAL
- Count: n/a
- Summary: Leads surface is bound to canonical registry and shows row-level proof fields.
- Evidence:
  - staffordos/ui/operator-frontend/components/operator/LeadQueue.tsx

### Revenue Command Surface
- ID: capability_revenue_command_surface
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: Revenue Command shows lead lifecycle and send proof, but not full income truth yet.
- Evidence:
  - staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx

### Capacity Surface
- ID: capability_capacity_surface
- Type: capability
- Status: PLACEHOLDER
- Count: n/a
- Summary: Capacity is not yet bound to Shopifixer client onboarding or service packs.
- Evidence:
  - staffordos/ui/operator-frontend/app/operator/capacity

### Analytics Surface
- ID: capability_analytics_surface
- Type: capability
- Status: PLACEHOLDER
- Count: n/a
- Summary: Analytics is not yet bound to product, revenue, send, or agent performance data.
- Evidence:
  - staffordos/ui/operator-frontend/app/operator/analytics

### Products Surface
- ID: capability_products_surface
- Type: capability
- Status: PLACEHOLDER
- Count: n/a
- Summary: Products page is not yet bound to Abando, Shopifixer, StaffordOS product truth.
- Evidence:
  - staffordos/ui/operator-frontend/app/operator/products

### System Map Surface
- ID: capability_system_map_surface
- Type: capability
- Status: PARTIAL
- Count: n/a
- Summary: System Map exists but must ingest deeper audit outputs and product/agent/data matrices.
- Evidence:
  - staffordos/ui/operator-frontend/app/operator/system-map/page.tsx


---

## Truth Graph Edges
- local_system → system_map: feeds truth
- server_infra → system_map: feeds truth
- lead_registry → send_proof: lead actions create proof
- send_proof → revenue_truth: send proof informs revenue progress
- lead_registry → revenue_truth: lead lifecycle informs revenue state
- agent_system → command_center: future controllable workforce
- objective_binding → command_center: defines command center purpose
- objective_binding → system_map: defines why assets matter
- data_ownership → system_map: defines readers/writers
- real_partial_placeholder → system_map: defines capability truth status

---

## Known Gaps
- System Map UI is not yet fully driven by this truth graph.
- Agent control is defined but not yet implemented.
- Abando capability still needs dedicated product decomposition.
- Real email/SMS provider-backed send proof still needs confirmation.
- Capacity is not yet bound to Shopifixer onboarding/service-pack workflow.
- Analytics and Products are not yet bound to capability truth.

---

## Required Next Step
System Map UI should read this truth graph directly:

`staffordos/system_inventory/output/system_map_truth_graph_v1.json`

No Command Center rebuild should happen until this graph is visible and reviewable.
