# Final Lifecycle Repair Readiness Review v1

## Executive Summary

The unauthorized `merchantRevenueRecovered > 0 -> revenue_active` promotion is safe to remove or constrain.

Reason: every current consumer of `revenue_active` is a derived read surface, a dashboard count, a label mapping, or a runtime decision engine. No packet writer, payment writer, or fulfillment writer depends on `revenue_active` as a source of authority.

The repair is narrow:

- change the `merchantRevenueRecovered > 0` branch in `staffordos/clients/next_action_engine_v1.mjs`
- stop using merchant recovery revenue as a lifecycle promotion into `revenue_active`

The likely runtime result after the repair is that affected merchants will fall back to the next governed branch in the engine, which for the current proof merchant points to `audit_requested` because `shopifixer.audit_status` is still `not_started`.

## Downstream Readers of `revenue_active`

### Files that read or surface `revenue_active`

1. `staffordos/clients/next_action_engine_v1.mjs`
   - line 22: priority scoring treats `revenue_active` as the top ease-of-close state
   - line 148: writes `revenue_active`
2. `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
   - lifecycle stage list includes `revenue_active`
   - stage upgrade maps proof-client / paid-path truth to `revenue_active`
3. `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`
   - `top_metrics.active_revenue_clients` counts `lifecycle.stage === "revenue_active"`
4. `staffordos/ui/operator-frontend/lib/operator/lifecycleTerminology.ts`
   - maps `revenue_active` to “Merchant Success”
5. `staffordos/ui/operator-frontend/app/api/operator/ceo-snapshot/route.ts`
   - reads dashboard snapshot `top_metrics.active_revenue_clients`
   - exposes canonical and lifecycle counts to the cockpit
6. `staffordos/ui/operator-frontend/app/api/operator/client-registry/route.ts`
   - normalizes lifecycle stage and summary fields that can include `revenue_active`
7. `staffordos/clients/client_registry_v1.json`
   - current runtime truth contains `lifecycle.stage = revenue_active`
8. Reports / governance artifacts
   - `staffordos/governance/lifecycle_promotion_authority_audit/lifecycle_promotion_authority_audit_v1.md`
   - `staffordos/governance/next_action_engine_conformance_audit/next_action_engine_conformance_audit_v1.md`
   - `staffordos/governance/next_action_engine_provenance_audit/next_action_engine_provenance_audit_v1.md`
   - `staffordos/authority/output/current_launch_readiness_score_v1.md`
   - `staffordos/governance/quarantine/20260604_untracked_artifacts/top_priority_merchant_truth_v1.md`

### APIs that expose `revenue_active`

- `/api/operator/ceo-snapshot`
  - surfaces `active_revenue_clients` from the dashboard snapshot
- `/api/operator/client-registry`
  - surfaces lifecycle stage and canonical stage mapping

### Dashboards that surface `revenue_active`

- `staffordos/clients/operator_dashboard_snapshot_v1.json`
- `staffordos/ui/operator-frontend/components/operator/ActionFirstDashboard.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx` indirectly through dashboard snapshot

### Reports that read it

- current launch readiness score
- lifecycle promotion authority audit
- next action conformance audit
- provenance audit

### Operator workflows that surface it

- CEO Cockpit / operator snapshot route
- Client Registry API
- Revenue Command reads the broader revenue context, but it does not own the `revenue_active` transition

### Automation paths that read it

- `staffordos/clients/next_action_engine_v1.mjs`
- `staffordos/clients/upgrade_client_registry_operating_model_v1.mjs`
- `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`

### Packet logic

No packet-layer writer or packet-state rule was found that depends on `revenue_active`.

## Repair Assessment

### 1. What breaks if `revenue_active` is removed entirely?

- Dashboard counts for `active_revenue_clients` drop to zero for any records still carrying that stage.
- UI labels that map `revenue_active` to “Merchant Success” will no longer be exercised for new promotions.
- Priority scoring in `next_action_engine_v1.mjs` loses its top-ease-of-close boost for that stage.

Nothing in the payment path, packet path, or fulfillment path breaks, because those paths do not depend on `revenue_active` as authority.

### 2. What breaks if `revenue_active` is replaced with `proposal_sent`?

- The merchant would be mislabeled as pre-payment / pre-close even when recovered revenue exists.
- Current dashboards and cockpit summaries would understate merchant-success-like evidence.
- The stage would still be wrong under canonical ShopiFixer truth.

### 3. What breaks if `revenue_active` becomes a metric instead of a lifecycle stage?

- The lifecycle graph becomes cleaner and closer to authority.
- Dashboard and cockpit views can still count merchant recovery as a metric.
- Existing readers would need to stop treating it as a stage value, but no runtime writer depends on it for packet or payment behavior.

## Exact Change Scope

### Exact lines to change

- `staffordos/clients/next_action_engine_v1.mjs:146-158`

### Smallest repair

Remove or constrain the `merchantRevenueRecovered > 0` branch so it no longer assigns `lifecycle_stage: "revenue_active"`.

Do not replace it with another lifecycle stage unless the replacement is separately authority-backed.

## Expected Runtime Outcome

After repair, the current proof merchant would no longer be promoted to `revenue_active` just because merchant recovery revenue exists.

On the current stored truth, the engine would next fall through to the `audit_requested` branch because:

- `shopifixer.audit_status` is `not_started`
- the merchant is not `proof_client` for ShopiFixer fulfillment

So the runtime effect is:

- `revenue_active` no longer appears as a lifecycle promotion outcome for this path
- the merchant returns to the governed conversion lane instead of the unauthorized merchant-success lane

## Final Answers

- Is the repair safe? **Yes**
- What exact line(s) should be changed? **`staffordos/clients/next_action_engine_v1.mjs:146-158`**
- What is the smallest repair? **Remove or constrain the `merchantRevenueRecovered > 0 -> revenue_active` branch**
- What is the expected runtime outcome? **The merchant will no longer be promoted to `revenue_active`; the current record will fall through to the governed `audit_requested` path**
- Does any blocker remain after the repair? **Yes. Fulfillment still lacks a runtime writer for `deal_won -> fix_in_progress`, and proof/review/referral remain unproven**

## Governance Conclusion

This repair is the correct next step because it removes an unauthorized lifecycle override without weakening the payment, packet, or fulfillment guardrails.

