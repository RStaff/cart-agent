# CEO Snapshot Discovery v1

## Executive Summary
StaffordOS already has real runtime truth for leads, clients, revenue, fulfillment proxies, proof ledgers, operator action state, and dashboard summaries.

The cockpit problem is not lack of data. The problem is that the data is split across several files and only partially converged into a single authoritative "what should Ross do right now?" view.

## Truth Source Inventory

| Domain | File | Owner | Runtime writer | Authority level | Update frequency | Used by cockpit |
|---|---|---|---|---|---|---|
| Lead truth | `staffordos/leads/lead_registry_v1.json` | `staffordos/leads/lead_registry_sync_agent_v1.mjs` | `lead_registry_sync_agent_v1.mjs`, `followup_agent_v1.mjs`, `reply_detection_agent_v1.mjs`, `contact_enrichment_agent_v1.mjs`, `promote_leads_to_clients_v1.mjs` | authoritative | event-driven / sync-driven | yes, direct and via `ceo-snapshot` |
| Lead event truth | `staffordos/leads/lead_events_v1.json` | `staffordos/leads/lead_registry_sync_agent_v1.mjs` | lead ingest / update agents | supporting | event-driven append-only | indirect |
| Send proof truth | `staffordos/leads/send_ledger_v1.json` | `staffordos/leads/send_ledger_agent_v1.mjs` | `send_ledger_agent_v1.mjs`, `send_execution_agent_v1.mjs`, `reply_detection_agent_v1.mjs` | supporting | event-driven | yes, direct in `ceo-snapshot` proof status |
| Client truth | `staffordos/clients/client_registry_v1.json` | `staffordos/clients/next_action_engine_v1.mjs` and payment propagation path | `next_action_engine_v1.mjs`, `recordVerifiedStripePayment` via `revenue_agent_v1.mjs`, `promote_leads_to_clients_v1.mjs`, `upgrade_client_registry_operating_model_v1.mjs` | authoritative | gated execution / payment webhook / normalization runs | yes, direct and via `ceo-snapshot` |
| Revenue truth | `staffordos/revenue/revenue_truth_v1.json` | `staffordos/revenue/revenue_agent_v1.mjs` | `revenue_agent_v1.mjs` (including `recordStripePaymentPropagation`), runtime revenue sync | authoritative | payment webhook / revenue sync | yes, direct and via `ceo-snapshot` |
| Fulfillment work truth | `staffordos/snapshots/unit_work_snapshot_v1.json` | `staffordos/units/lock_schema_foundation_v1.mjs` | `lock_schema_foundation_v1.mjs` | supporting | schema/unit refresh runs | yes, via primary-action resolution and operator home |
| Fulfillment unit truth | `staffordos/units/delivery_units_v1.json` | `staffordos/units/lock_schema_foundation_v1.mjs` | `lock_schema_foundation_v1.mjs` | supporting | schema/unit refresh runs | indirect |
| Proof pipeline truth | `staffordos/leads/send_ledger_v1.json` | `staffordos/leads/send_ledger_agent_v1.mjs` | `send_ledger_agent_v1.mjs` | supporting | event-driven | yes, direct in `ceo-snapshot` proof summary |
| Operator action truth | `staffordos/events/operator_action_events_v1.json` | `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts` | `execute-primary-action` route | supporting | CTA click / operator action | indirect via execution log |
| Outcome truth | `staffordos/events/outcome_event_log_v1.json` | `staffordos/ui/operator-frontend/app/api/operator/execute-primary-action/route.ts` | `execute-primary-action` route and initial schema foundation write | supporting | CTA click / event log | indirect via execution log |
| Operator snapshot truth | `staffordos/snapshots/primary_action_snapshot_v1.json` | `staffordos/decision/resolve_primary_action_v1.mjs` | `resolve_primary_action_v1.mjs` (called from `persistent_operator_v1.mjs`) | authoritative for operator action | operator loop / on-demand resolve | yes, direct through operator home and command center |
| Dashboard summary truth | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs` | `build_operator_dashboard_snapshot_v1.mjs`, `revenue_agent_v1.mjs` | derived authoritative summary | payment propagation / dashboard rebuild | yes, direct and via `ceo-snapshot` |
| System truth summary | `staffordos/system_map/system_map_truth_v1.json` | `staffordos/agents/system_truth_sync_agent_v1.mjs` | `system_truth_sync_agent_v1.mjs` | derived system summary | system truth sync loop | indirect |

## Current Cockpit Coverage

The current cockpit can already read:

- Lead truth through `lead_registry_v1.json` and `lead_events_v1.json`
- Client truth through `client_registry_v1.json`
- Revenue truth through `revenue_truth_v1.json`
- Proof truth through `send_ledger_v1.json`
- Operator action truth through `primary_action_snapshot_v1.json`
- Dashboard truth through `operator_dashboard_snapshot_v1.json`
- Unit work truth through `unit_work_snapshot_v1.json`

The cockpit does not yet present these as one merged authoritative CEO snapshot with a single top-5 action list.

## Discovery Conclusion

StaffordOS already has real runtime truths. What is missing is one authoritative convergence layer that composes those truths into a single CEO operating view without inventing metrics.
