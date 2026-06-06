# CEO Snapshot Spec v1

## Purpose
Define a CEO Truth Snapshot from existing runtime truth only.

No placeholder metrics.
No demo values.
No invented KPIs.

## Sections and Metrics

### Revenue
| Metric | Source file | Source field | Authority owner | Refresh source | Confidence |
|---|---|---|---|---|---|
| Stafford revenue | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `revenue_summary.stafford_revenue` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild / payment propagation | high |
| Merchant revenue recovered | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `revenue_summary.merchant_revenue_recovered` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild / payment propagation | high |
| Recurring MRR | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `revenue_summary.recurring_mrr` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | medium |
| Active revenue clients | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `top_metrics.active_revenue_clients` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | high |
| Total clients | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `top_metrics.total_clients` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | high |
| Paid clients | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `revenue.paid_clients` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| Unpaid clients | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `revenue.unpaid_clients` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| Revenue gaps | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `revenue_gaps[]` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | high |

### ShopiFixer Pipeline
| Metric | Source file | Source field | Authority owner | Refresh source | Confidence |
|---|---|---|---|---|---|
| Proposal sent clients | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `conversion.proposal_sent_clients` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| Canonical proposal sent clients | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `conversion.canonical_proposal_sent_clients` | `client_registry_v1.json` + canonical lifecycle rules | CEO snapshot aggregation | medium |
| Audits needed | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `conversion.audits_needed` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| Payment pending clients | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `conversion.payment_pending_clients` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| Closest to payment | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `conversion.closest_to_payment` | `client_registry_v1.json` | CEO snapshot aggregation | medium |
| Priority lead candidates | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `acquisition.priority_leads` | `lead_registry_v1.json` | CEO snapshot aggregation | medium |

### ShopiFixer Fulfillment
| Metric | Source file | Source field | Authority owner | Refresh source | Confidence |
|---|---|---|---|---|---|
| Fixes in progress | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `fulfillment.fixes_in_progress` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| Fix not started | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `fulfillment.fix_not_started` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| QA queue | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `fulfillment.qa_queue` | `client_registry_v1.json` | CEO snapshot aggregation | medium |
| Proof queue | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `fulfillment.proof_queue` | `client_registry_v1.json` | CEO snapshot aggregation | medium |
| Canonical stage counts | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `fulfillment.canonical_stage_counts` | `client_registry_v1.json` | CEO snapshot aggregation | medium |
| Open work units | `staffordos/snapshots/unit_work_snapshot_v1.json` | `open_work[]` | `lock_schema_foundation_v1.mjs` | unit work snapshot refresh | medium |

### Proof Pipeline
| Metric | Source file | Source field | Authority owner | Refresh source | Confidence |
|---|---|---|---|---|---|
| Total proofs | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `merchant_success.outreach_proof.total_proofs` | `send_ledger_v1.json` | CEO snapshot aggregation | medium |
| Dry-run proofs | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `merchant_success.outreach_proof.dry_run_proofs` | `send_ledger_v1.json` | CEO snapshot aggregation | medium |
| Live send attempted | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `merchant_success.outreach_proof.live_send_attempted` | `send_ledger_v1.json` | CEO snapshot aggregation | medium |
| Latest proofs | `staffordos/leads/send_ledger_v1.json` | `items[]` | `send_ledger_agent_v1.mjs` | send ledger writes | medium |
| Proof / revenue gaps | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `merchant_success.proof_or_revenue_gaps` | `client_registry_v1.json` + `send_ledger_v1.json` | CEO snapshot aggregation | medium |

### Abando
| Metric | Source file | Source field | Authority owner | Refresh source | Confidence |
|---|---|---|---|---|---|
| Merchant revenue recovered | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `revenue_summary.merchant_revenue_recovered` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | high |
| Abando installed clients | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `clients[].abando.installed` | `client_registry_v1.json` | CEO snapshot aggregation | high |
| Abando MRR | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `revenue_summary.recurring_mrr` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | high |
| Recovery gap | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `revenue_gaps[]` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | high |

### System Health
| Metric | Source file | Source field | Authority owner | Refresh source | Confidence |
|---|---|---|---|---|---|
| Lead registry health | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `executive_control.source_health.lead_registry` | lead registry read path | CEO snapshot aggregation | high |
| Client registry health | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `executive_control.source_health.client_registry` | client registry read path | CEO snapshot aggregation | high |
| Dashboard snapshot health | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `executive_control.source_health.dashboard_snapshot` | dashboard snapshot read path | CEO snapshot aggregation | high |
| Proof status health | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `executive_control.source_health.proof_status` | send ledger read path | CEO snapshot aggregation | medium |
| Green/red/unknown counts | `staffordos/clients/operator_dashboard_snapshot_v1.json` | `system_health_summary.*` | `build_operator_dashboard_snapshot_v1.mjs` | dashboard rebuild | high |

### Top Operator Actions
| Metric | Source file | Source field | Authority owner | Refresh source | Confidence |
|---|---|---|---|---|---|
| Primary action | `staffordos/snapshots/primary_action_snapshot_v1.json` | `primary_action` | `resolve_primary_action_v1.mjs` | operator loop | high |
| Next best action | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `next_best_action` | CEO snapshot aggregation | CEO snapshot aggregation | high |
| Priority leads | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `acquisition.priority_leads` | lead registry | CEO snapshot aggregation | medium |
| Closest to payment | `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts` | `conversion.closest_to_payment` | client registry | CEO snapshot aggregation | medium |
| Open work summary | `staffordos/snapshots/unit_work_snapshot_v1.json` | `summary.*` | `lock_schema_foundation_v1.mjs` | unit work snapshot refresh | medium |

## Spec Conclusion

The CEO snapshot should only expose metrics already present in runtime truth:

- client registry
- lead registry
- revenue truth
- dashboard snapshot
- primary action snapshot
- unit work snapshot
- send ledger / proof status

No invented KPIs. No demo metrics.
