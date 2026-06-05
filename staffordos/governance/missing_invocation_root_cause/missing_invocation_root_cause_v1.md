# Missing Invocation Root Cause Audit v1

## 1. Executive Summary

`staffordos/clients/next_action_engine_v1.mjs` was intentionally designed as a lifecycle / next-action engine, and operator-daemon binding artifacts later named it as the `next_action_owner`. But the repository does not prove any active runtime entrypoint that actually invokes it.

The missing hop is not the existence of the engine. The missing hop is the runtime wiring from the active StaffordOS task-selection loop into that engine. The best evidence points to the operator-daemon selection path, centered on `staffordos/operator_daemon/select_next_task_v1.mjs` and the auto runner that calls it, as the place where the chain should continue but currently stops.

## 2. What component was supposed to invoke `next_action_engine_v1.mjs`?

The intended invoker was the **operator-daemon task selection / routing path**:

- `staffordos/operator_daemon/run_auto_task_with_commit_gate_v1.sh`
- `staffordos/operator_daemon/select_next_task_v1.mjs`

The binding artifacts also name:

- `staffordos/operator_daemon/task_command_resolver_v1.mjs` as router owner
- `staffordos/clients/next_action_engine_v1.mjs` as `next_action_owner`

But those binding artifacts are architectural records, not proof of live invocation.

## 3. Was invocation ever implemented?

No proven live invocation was found.

The runtime loop exists, but the `select_next_task_v1.mjs` selector never calls `next_action_engine_v1.mjs`, and no other active runtime entrypoint was found bridging to it.

## 4. Was invocation removed, renamed, or replaced?

No evidence supports removal, renaming, or replacement.

What exists is a **binding manifest** and a **routing plan** that mention `next_action_engine_v1.mjs`, but no live call site. That points to an integration that was planned and partially formalized, not one that was later removed from a working runtime path.

## 5. Was there a partially-completed integration?

Yes.

Evidence:

- `write_router_binding_plan_v1.mjs` explicitly lists `next_action_engine_v1.mjs` as a candidate upstream input for task selection.
- `write_router_decision_agent_binding_v1.mjs` declares `next_action_owner: "staffordos/clients/next_action_engine_v1.mjs"`.
- `run_auto_task_with_commit_gate_v1.sh` is an active selector loop, but its selected task flow never reaches `next_action_engine_v1.mjs`.

That is an integration scaffold without execution wiring.

## 6. What exact runtime boundary breaks?

The chain breaks at the operator-daemon task-selection boundary:

- `staffordos/operator_daemon/run_auto_task_with_commit_gate_v1.sh`
  -> `staffordos/operator_daemon/select_next_task_v1.mjs`

`select_next_task_v1.mjs` is active, but it only selects tasks such as:

- `merchant_registry_build`
- `send_readiness_gate`
- `send_preview`

It does **not** import, shell out to, or otherwise invoke `next_action_engine_v1.mjs`.

So the last live runtime boundary before the missing hop is `select_next_task_v1.mjs`.

## 7. Reference graph

### Runtime path that is active today

`run_auto_task_with_commit_gate_v1.sh`
-> `select_next_task_v1.mjs`
-> `run_task_with_commit_gate_v1.sh`
-> `task_command_resolver_v1.mjs`
-> `run_agent_loop.mjs`

This active path does not reach `next_action_engine_v1.mjs`.

### Intended but disconnected path

`write_router_binding_plan_v1.mjs`
-> `write_router_decision_agent_binding_v1.mjs`
-> `router_decision_agent_binding_v1.json`
-> `next_action_owner: next_action_engine_v1.mjs`

This is architectural intent, not runtime proof.

## 8. Direct answers

1. **What component was supposed to invoke `next_action_engine_v1.mjs`?**
   - The operator-daemon task-selection / routing path, especially `select_next_task_v1.mjs`.

2. **Was invocation ever implemented?**
   - No proven runtime implementation was found.

3. **Was invocation removed?**
   - No evidence of removal.

4. **Was invocation renamed?**
   - No evidence of renaming.

5. **Was invocation replaced?**
   - No evidence of a replacement runtime owner for this specific engine.

6. **Is there a partially-completed integration?**
   - Yes.

7. **Is there an abandoned implementation?**
   - Yes, in the sense of binding artifacts without execution.

8. **Is there a runtime registration artifact without execution?**
   - Yes.

9. **Is there a scheduler artifact without a worker?**
   - Effectively yes; the auto runner and binding manifests exist, but no worker path invokes the engine.

10. **What is the exact earliest point where the chain breaks?**
    - `staffordos/operator_daemon/select_next_task_v1.mjs`, at the point where task selection ends without invoking or reading from `next_action_engine_v1.mjs`.

## 9. Final determination

**INVOCATION_DISCONNECTED**

Reason:

- the engine exists and was intended to be part of lifecycle execution,
- binding artifacts name it as the next-action owner,
- the active runtime loop does not invoke it,
- no evidence shows removal or replacement,
- the chain is therefore disconnected at the operator-daemon selection boundary.

## 10. Explicit warning

Do not treat the presence of `next_action_engine_v1.mjs` or the `next_action_owner` binding as proof of runtime execution. The repository currently supports intent, not invocation.
