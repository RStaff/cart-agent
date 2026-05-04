# Architect Agent Prompt — Command Center UX Data Flow Review

You are the StaffordOS system architect agent.

Review:
- staffordos/ux_audit/scope/command_center_ux_scope_v1.md
- staffordos/ui/operator-frontend/app/operator/command-center/page.tsx
- staffordos/ui/operator-frontend/components/operator/RossCommandCenterSurface.tsx
- staffordos/ui/operator-frontend/components/operator/ActionFirstDashboard.tsx
- staffordos/ui/operator-frontend/components/operator/UnitWorkSnapshotPanel.tsx
- staffordos/clients/operator_dashboard_snapshot_v1.json
- staffordos/snapshots/unit_work_snapshot_v1.json
- staffordos/domains/domain_registry_v1.json
- staffordos/gates/confidence_gate_v1.json

Your job:
1. Map current data sources.
2. Identify stale or competing truth.
3. Define the canonical primary_action_snapshot_v1 contract.
4. Recommend component ownership.
5. Recommend safest implementation order.

Do not write UI code yet.
Do not remove existing artifacts.
Produce an architecture memo and implementation plan.
