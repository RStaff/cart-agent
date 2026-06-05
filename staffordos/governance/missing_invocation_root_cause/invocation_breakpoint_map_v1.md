# Invocation Breakpoint Map v1

## Active runtime selector loop

`staffordos/operator_daemon/run_auto_task_with_commit_gate_v1.sh`
-> `staffordos/operator_daemon/select_next_task_v1.mjs`
-> `staffordos/operator_daemon/run_task_with_commit_gate_v1.sh`
-> `staffordos/operator_daemon/task_command_resolver_v1.mjs`
-> `staffordos/execution/run_agent_loop.mjs`

This path is active.

## Missing hop

`staffordos/operator_daemon/select_next_task_v1.mjs`
does **not** invoke:

`staffordos/clients/next_action_engine_v1.mjs`

## Why the chain stops there

- `select_next_task_v1.mjs` is the live selector.
- Its task choices are merchant registry / send readiness / preview tasks.
- It never consults `next_action_engine_v1.mjs`.
- The binding manifests only record intent that `next_action_engine_v1.mjs` is the `next_action_owner`.

## Exact breakpoint

- **File:** `staffordos/operator_daemon/select_next_task_v1.mjs`
- **Function:** module top-level task selection logic
- **Boundary:** automatic task selection ends before any call or data dependency on `next_action_engine_v1.mjs`

## Classification

- `select_next_task_v1.mjs` path: `PROVEN_RUNTIME_PATH`
- `next_action_engine_v1.mjs` invocation path: `DISCONNECTED_RUNTIME_PATH`
- binding manifests: `HISTORICAL_INTENT`
- plan artifacts: `PARTIAL_INTEGRATION`
- live caller for `next_action_engine_v1.mjs`: `DEAD_REFERENCE`
