# Next Action Engine Reference Graph v1

## Reference graph

```text
creation_commit
  95438db81c21b8b24daac781dad344eee9302e26
    └─ introduces staffordos/clients/next_action_engine_v1.mjs
         ├─ reads staffordos/clients/client_registry_v1.json
         ├─ computes lifecycle / next_action / decision_trace
         └─ writes staffordos/clients/client_registry_v1.json

later_refinement_commit
  ca4e0e9e4ac85d27967679ec52ea69ec7a574671
    └─ changes revenue proof precedence in the same engine

later_expansion_commit
  7dd25287
    └─ adds priority scoring and blocker detection

architectural_binding_artifacts
  staffordos/operator_daemon/write_router_decision_agent_binding_v1.mjs
    └─ names next_action_engine_v1.mjs as next_action_owner
  staffordos/operator_daemon/output/router_decision_agent_binding_v1.json
    └─ persisted binding manifest
  staffordos/operator_daemon/output/neck_router_inventory_v1.json
    └─ inventory mention only

runtime_trace_artifacts
  staffordos/governance/runtime_invocation_trace/runtime_invocation_trace_v1.md
    └─ no proven live caller
  staffordos/governance/lifecycle_transition_verification/lifecycle_transition_verification_v1.md
    └─ code exists, runtime wiring broken
  staffordos/governance/fulfillment_lifecycle_verification/fulfillment_lifecycle_verification_v1.md
    └─ fulfillment logic present, runtime unproven

current_live_chain
  web/src/index.js
    └─ installStripeWebhook(app)
       └─ web/src/routes/stripeWebhook.esm.js
          └─ staffordos/revenue/revenue_agent_v1.mjs
             └─ staffordos/clients/client_registry_v1.mjs
                └─ staffordos/clients/build_operator_dashboard_snapshot_v1.mjs
```

## Reference classes

- **ACTIVE_RUNTIME_REFERENCE**
  - `staffordos/revenue/revenue_agent_v1.mjs`
  - `staffordos/clients/client_registry_v1.json`
  - `staffordos/clients/build_operator_dashboard_snapshot_v1.mjs`

- **ARCHITECTURAL_REFERENCE**
  - `staffordos/operator_daemon/write_router_decision_agent_binding_v1.mjs`
  - `staffordos/operator_daemon/output/router_decision_agent_binding_v1.json`
  - `staffordos/operator_daemon/output/neck_router_inventory_v1.json`

- **HISTORICAL_REFERENCE**
  - `staffordos/governance/runtime_invocation_trace/runtime_invocation_trace_v1.md`
  - `staffordos/governance/lifecycle_transition_verification/lifecycle_transition_verification_v1.md`
  - `staffordos/governance/fulfillment_lifecycle_verification/fulfillment_lifecycle_verification_v1.md`

- **DEAD_REFERENCE**
  - `staffordos/clients/next_action_engine_v1.mjs` as a live runtime target
  - `staffordos/clients/close_engine_v1.mjs`
