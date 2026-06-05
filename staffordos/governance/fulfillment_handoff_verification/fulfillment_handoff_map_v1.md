# Fulfillment Handoff Map v1

## Active handoff chain

`run_auto_task_with_commit_gate_v1.sh`
-> `select_next_task_v1.mjs`
-> `run_task_with_commit_gate_v1.sh`
-> `task_command_resolver_v1.mjs`
-> `run_agent_loop.mjs`

## Intended but missing fulfillment continuation

`run_task_with_commit_gate_v1.sh`
-> `next_action_engine_v1.mjs`

This continuation is not proven in runtime.

## Boundary classification

- `select_next_task_v1.mjs` -> `run_task_with_commit_gate_v1.sh`: **PROVEN_HANDOFF**
- `run_task_with_commit_gate_v1.sh` -> `next_action_engine_v1.mjs`: **DISCONNECTED_HANDOFF**
- binding manifests naming next-action owner: **HISTORICAL_INTENT**
- router plan referencing next action engine as upstream input: **PARTIAL_HANDOFF**
- live fulfillment worker for next action engine: **DEAD_DISPATCH**

## Exact breakpoint

- **File:** `staffordos/operator_daemon/select_next_task_v1.mjs`
- **Function:** module top-level task selection logic
- **Runtime boundary:** task selection stops before fulfillment execution
