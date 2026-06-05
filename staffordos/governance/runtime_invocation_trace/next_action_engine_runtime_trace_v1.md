# next_action_engine_v1 Runtime Invocation Trace v1

## 1. Executive Summary

`staffordos/clients/next_action_engine_v1.mjs` is **disconnected** from the current active runtime path.

The file is real, and it does mutate `staffordos/clients/client_registry_v1.json` when run directly. But no active runtime entrypoint in the repository was found that invokes it.

That means the engine is not currently the live bridge from:

- `proposal_sent`
- `deal_won`
- `fix_in_progress`
- `fix_completed`

The live runtime path currently stops at the client registry writer used by verified payment propagation. The fulfillment transition logic in `next_action_engine_v1.mjs` remains referenceable code, not proven runtime behavior.

## 2. Runtime Entry Points

Confirmed active runtime entrypoints inspected:

1. `package.json` `start`
2. `staffordos/operator_daemon/persistent_operator_v1.mjs`
3. `staffordos/operator_daemon/task_command_resolver_v1.mjs`
4. `staffordos/execution/run_agent_loop.mjs`

What they do:

- `package.json start` boots `web/src/index.js`.
- `persistent_operator_v1.mjs` runs the operator loop, task resolver, canonical spine, and runtime sync.
- `task_command_resolver_v1.mjs` maps task types to commands.
- `run_agent_loop.mjs` executes the resolved command.

None of those runtime entrypoints resolve to `staffordos/clients/next_action_engine_v1.mjs`.

## 3. Invocation Graph

### Direct invocation

No direct active runtime invocation was found.

### Indirect invocation

No indirect active runtime invocation was found.

### Runtime graph result

```
runtime entrypoints
  -> task resolver
  -> execution runner
  -> resolved safe observation / other mapped tasks
  -> no next_action_engine_v1.mjs
```

## 4. Direct Callers

No direct caller was found in active runtime code.

Evidence:

- `task_command_resolver_v1.mjs` does not map any task type to `node staffordos/clients/next_action_engine_v1.mjs`.
- `persistent_operator_v1.mjs` always passes its chosen task to `task_command_resolver_v1.mjs`.
- `run_agent_loop.mjs` executes the command returned by the resolver; it does not independently select `next_action_engine_v1.mjs`.

## 5. Indirect Callers

No indirect caller was found in active runtime code.

References to `next_action_engine_v1.mjs` appear in:

- router binding manifests
- governance audits
- inventory files
- archive artifacts

Those are not runtime execution paths.

## 6. Dead References

These are references to the engine that are not runtime execution:

- `staffordos/operator_daemon/write_router_decision_agent_binding_v1.mjs`
- `staffordos/operator_daemon/write_router_binding_plan_v1.mjs`
- `staffordos/operator_daemon/output/router_decision_agent_binding_v1.json`
- `staffordos/operator_daemon/output/router_binding_plan_v1.json`
- `staffordos/operator_daemon/output/neck_router_inventory_v1.json`
- `staffordos/operator_daemon/output/system_brain_inventory_v1.json`
- governance audits and archive text files

These prove the engine is known to StaffordOS, but not that it is executed.

## 7. Lifecycle Transition Ownership

`next_action_engine_v1.mjs` contains code that can write lifecycle transitions for:

- `proposal_sent`
- `deal_won`
- `fix_in_progress`
- `fix_completed`

However, ownership in practice is split:

- `staffordos/clients/client_registry_v1.mjs` owns the verified payment write that persists `deal_won`.
- `staffordos/clients/next_action_engine_v1.mjs` owns the stand-alone lifecycle transition logic for fulfillment stages.

The runtime problem is that the latter is not wired into a live entrypoint.

## 8. Fulfillment Boundary Analysis

Current fulfillment boundary:

1. Verified Stripe payment
2. Packet binding
3. Client registry payment write
4. `deal_won`

The next hop that should carry the client into fulfillment is:

5. `fix_in_progress`

That hop is currently not proven live.

The first missing runtime hop is:

- active runtime entrypoint -> `staffordos/clients/next_action_engine_v1.mjs`

## 9. Highest-Risk Runtime Gap

The highest-risk gap is that `next_action_engine_v1.mjs` can mutate the client registry, but there is no proven live process that invokes it. That makes the fulfillment lifecycle transition chain disconnected at runtime.

## 10. Single Next Verifiable Question

Does any active runtime entrypoint, scheduler, task mapping, or startup script resolve to `node staffordos/clients/next_action_engine_v1.mjs`?

## Classification

`staffordos/clients/next_action_engine_v1.mjs` is:

- **DISCONNECTED**

Evidence:

- active runtime entrypoints exist
- the engine is referenced in inventories and bindings
- no live invocation path was found
- the engine is not mapped by the current task resolver
- the engine is not called by the persistent operator or execution runner

