# Resolver Binding Readiness Verification v1

## 1. Executive Summary

The existing StaffordOS gate can already resolve, validate, and execute mapped task commands. `staffordos/clients/next_action_engine_v1.mjs` is a self-contained registry writer that reads and writes `staffordos/clients/client_registry_v1.json` with no external arguments required.

The chain is therefore not blocked by the runner, the gate, or the engine shape. It is blocked by the resolver table: `staffordos/operator_daemon/task_command_resolver_v1.mjs` does not currently contain an approved `COMMANDS` entry for `next_action_engine_v1.mjs`.

If that resolver entry were added with the correct task payload, the existing StaffordOS runtime should be able to execute the engine through the current gate path.

## 2. What exact COMMANDS entries currently exist?

The resolver currently contains many approved task mappings, including:

- `surface_validator`
- `surface_binding_runner`
- `routing_authority_runner`
- `experience_binding_runner`
- `execution_readiness_runner`
- `revenue_loop_runner`
- `revenue_conversion_surface_validator`
- `revenue_flow_logic_validator`
- `revenue_route_validator`
- `spine_deep_consistency_validator`
- `operator_confirmed_real_send`
- `primary_action_execution`
- `system_truth_sync`
- `lead_registry_sync`
- `shopifixer_followup_draft`
- `shopifixer_followup_approve`
- `send_readiness_gate`
- `contact_completeness_gate`
- `enrichment_task_packet`
- `operator_reviewed_enrichment_result`
- `merchant_registry_build`
- `send_preview`
- `send_confirm`
- `send_execute`
- `security_hygiene_inventory`
- `neck_router_inventory`
- `router_decision_agent_binding`
- `product_boundary_validator`
- `router_binding_plan`
- `validator_map_refresh`
- `router_to_gated_runner_binding`
- `console_ingestion_binding`
- `real_smtp_send_gate`
- `smtp_env_discovery`
- `smtp_env_binding_patch`
- `real_smtp_dry_run`
- `simulated_send_execution`
- `operator_confirmed_real_send_manifest`
- `real_smtp_dry_run_actual`
- `real_send_allowlist_and_ledger`
- `operator_test_recipient_binding`
- `system_brain_inventory`
- `resolver_preflight_guard_self_check`
- `fix_operator_test_recipient`

There is **no** `next_action_engine` / `next_action_execution` / fulfillment-transition mapping today.

## 3. What schema does a valid command require?

The resolver expects a `COMMANDS` entry shaped like the existing entries:

- `task_type`
- `command`
- `approval_level`
- `execution_class`
- `system`
- `revenue_action`
- `reason`

The resolver returns `resolved.command` if the `taskType` key exists and the command target exists.

## 4. What runtime payload does `next_action_engine_v1.mjs` expect?

It expects no CLI payload.

`next_action_engine_v1.mjs` self-reads:

- `staffordos/clients/client_registry_v1.json`

and self-writes:

- `staffordos/clients/client_registry_v1.json`

It does not require a separate task packet to compute its lifecycle transitions.

## 5. Does an existing task structure already satisfy those requirements?

Partially.

- The runner already accepts `task_type`, `expected_artifact`, and `commit_message`.
- The resolver already maps task types to node commands.
- The engine already has a self-contained CLI form.

What is missing is the resolver binding that maps a task type to `node staffordos/clients/next_action_engine_v1.mjs`.

## 6. Would command resolution succeed if a binding existed?

Yes, provided the binding uses an existing task type and a valid command target.

The resolver preflight checks only require:

- syntax-valid resolver
- known `taskType`
- command target exists

## 7. Would gate validation succeed?

Conditionally yes.

The gate checks:

- resolver syntax
- last run success
- operator heartbeat
- expected artifact exists
- no forbidden actions in the expected artifact

For `next_action_engine_v1.mjs`, the expected artifact should be the client registry file it writes:

- `staffordos/clients/client_registry_v1.json`

That artifact already exists and is valid JSON.

## 8. Would execution launch?

Conditionally yes.

The gate routes the resolved command into:

- `staffordos/execution/run_agent_loop.mjs`

which spawns the resolved node command directly.

## 9. Would `next_action_engine_v1.mjs` receive valid input?

Yes.

It does not need external argv input. Its runtime input is the client registry file it already reads.

## 10. Would registry mutation succeed?

Yes in code shape, assuming the registry JSON remains valid.

The engine is a direct registry writer and already mutates `staffordos/clients/client_registry_v1.json`.

## 11. What is the next runtime failure after command resolution?

No additional runtime failure is proven beyond the missing resolver mapping.

If a valid mapping is added with the correct artifact, the existing runner should be able to launch the engine.

## 12. Direct answers

1. **What exact COMMANDS pattern required?**
   - A `COMMANDS` entry in `task_command_resolver_v1.mjs` matching the existing shape:
     `task_type`, `command`, `approval_level`, `execution_class`, `system`, `revenue_action`, `reason`

2. **What exact task payload required?**
   - Runner inputs:
     - `task_type`: the new resolver key for next action execution
     - `expected_artifact`: `staffordos/clients/client_registry_v1.json`
     - `commit_message`: a normal gated-run message

3. **What exact runtime artifact required?**
   - `staffordos/clients/client_registry_v1.json`

4. **What exact next failure point (if any)?**
   - None proven after command resolution, provided the binding is correct.

## 13. Final determination

**RESOLVER_IS_FINAL_BLOCKER**

Reason:

- the gate and runner are already capable of executing a mapped command,
- the engine is already executable as a standalone node script,
- the missing approved resolver entry is the only proven blocker.

## 14. Stage-by-stage readiness

- Resolver mapping: **PROVEN_BLOCKED**
- Gate validation: **CONDITIONAL_READY**
- Execution launch: **CONDITIONAL_READY**
- Engine input contract: **PROVEN_READY**
- Registry mutation: **PROVEN_READY**

## 15. Explicit warning

Do not confuse “resolver blocker” with “engine blocker.” The engine is not blocked by its own input contract; it is blocked by task dispatch registration.
