# Resolver Repair Specification v1

## 1. Executive Summary

The current StaffordOS runtime can already execute mapped tasks through the gated runner. The remaining blocker is a single missing resolver binding in `staffordos/operator_daemon/task_command_resolver_v1.mjs` for `staffordos/clients/next_action_engine_v1.mjs`.

This specification defines the minimal governed repair required to make the fulfillment transition engine reachable through the existing runtime. It does **not** implement the change.

## 2. Current State

`run_auto_task_with_commit_gate_v1.sh`
-> `select_next_task_v1.mjs`
-> `run_task_with_commit_gate_v1.sh`
-> `task_command_resolver_v1.mjs`

At the resolver boundary, the requested next-action task has no approved `COMMANDS` entry, so execution stops before `next_action_engine_v1.mjs` can launch.

## 3. Required State

`run_auto_task_with_commit_gate_v1.sh`
-> `select_next_task_v1.mjs`
-> `run_task_with_commit_gate_v1.sh`
-> `task_command_resolver_v1.mjs`
-> `node staffordos/clients/next_action_engine_v1.mjs`
-> `staffordos/clients/client_registry_v1.json`

## 4. Before Repair Runtime Flow

1. Auto task selection chooses a task.
2. Gated runner validates the task.
3. Resolver attempts to map the task type.
4. Resolver fails because no approved mapping exists for `next_action_engine_v1.mjs`.
5. Fulfillment execution does not start.

## 5. After Repair Runtime Flow

1. Auto task selection chooses the fulfillment task.
2. Gated runner validates the task.
3. Resolver maps the task type to `node staffordos/clients/next_action_engine_v1.mjs`.
4. Gated runner executes the node command.
5. `next_action_engine_v1.mjs` reads and writes `staffordos/clients/client_registry_v1.json`.
6. The engine advances lifecycle state according to existing client truth.

## 6. Exact Repair Inputs

### File requiring change

- `staffordos/operator_daemon/task_command_resolver_v1.mjs`

### Required COMMANDS entry

```js
next_action_execution: {
  task_type: "next_action_execution",
  command: "node staffordos/clients/next_action_engine_v1.mjs",
  approval_level: "operator_safe",
  execution_class: "fulfillment_transition",
  system: "staffordos",
  revenue_action: false,
  reason: "Execute lifecycle transitions for paid clients through next_action_engine_v1.mjs."
}
```

### Required task mapping

- `task_type = "next_action_execution"`

### Required approval level

- `operator_safe`

### Required execution_class

- `fulfillment_transition`

### Required system classification

- `staffordos`

### Required revenue_action classification

- `false`

### Required gated runner path

- `staffordos/operator_daemon/run_task_with_commit_gate_v1.sh`

### Required expected runtime artifact

- `staffordos/clients/client_registry_v1.json`

### Expected lifecycle transition

- `proposal_sent -> deal_won`
- `deal_won -> fix_in_progress`
- `fix_in_progress -> fix_completed`

These transitions are already encoded in the engine’s lifecycle decision logic; the repair only makes the engine reachable through the resolver.

## 7. Repair Classification

- **Repair scope:** `SINGLE_FILE`
- **Repair risk:** `LOW`

Reason:

- only one resolver file requires a governed edit,
- the runtime gate and engine already exist,
- no new architecture or registries are required.

## 8. Direct repair specification

### Exact file

- `staffordos/operator_daemon/task_command_resolver_v1.mjs`

### Exact binding

- add an approved `COMMANDS` entry for `next_action_execution` pointing to `node staffordos/clients/next_action_engine_v1.mjs`

### Exact expected runtime result

- the gated runner can resolve and execute `next_action_engine_v1.mjs`
- the engine mutates `staffordos/clients/client_registry_v1.json`
- the paid-client lifecycle can advance through the existing fulfillment logic

## 9. Ready / Not Ready

**READY_FOR_GOVERNED_REPAIR**

The repair is narrow, bounded, and does not require new architecture.
