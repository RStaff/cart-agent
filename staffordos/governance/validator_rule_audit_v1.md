# Validator Rule Audit v1

## Executive Summary

`staffordos/operator_daemon/post_patch_structural_validator_v1.mjs` failed on `expected_artifact_task_or_status_present` during the `next_action_execution` gated run.

The rule is not nonsense: it is a real structural safety check that prevents a gate from accepting malformed task/status artifacts. But for the `next_action_execution` path, the expected artifact is `staffordos/clients/client_registry_v1.json`, which is a registry artifact, not a task/status artifact. That makes the rule only partially valid for this use case.

## 1. Exact validator rule failing

`expected_artifact_task_or_status_present`

## 2. Exact file containing the rule

`staffordos/operator_daemon/post_patch_structural_validator_v1.mjs`

## 3. Exact condition evaluated

```js
Boolean(artifact?.status || artifact?.task_type || artifact?.execution)
```

## 4. What was expected

The validator expected the `expected_artifact` JSON to expose at least one of:

- `status`
- `task_type`
- `execution`

## 5. What actual value was present at runtime

The runtime artifact was:

- `staffordos/clients/client_registry_v1.json`

Its top-level keys are:

- `clients`
- `decision_engine`
- `generated_at`
- `operating_model`
- `purpose`
- `schema`

It does **not** contain top-level `status`, `task_type`, or `execution`, so the condition evaluated to `false`.

## 6. Is this a currently-governed StaffordOS requirement?

Partially.

The validator is enforcing a real structural governance expectation for task-like artifacts. That is legitimate in the abstract.

However, the specific artifact contract is stale for the `next_action_execution` path because that path legitimately uses a registry artifact as the expected artifact.

## 7. Is this a requirement that no longer exists?

For this execution path, yes.

The task no longer produces a task/status-shaped artifact as its expected output. It mutates `client_registry_v1.json` directly.

## 8. Was the validator written before the next_action_engine architecture was introduced?

No proven evidence supports that.

The validator was added after the next-action engine already existed, but its artifact contract still assumes a task/status-shaped output.

## 9. Does the validator protect a real commercial risk?

Yes, but only generically.

It protects against accepting malformed or incomplete gated task artifacts. That is a real risk.

What it does **not** accurately protect is the `next_action_execution` contract, because that task writes a registry rather than a task/status artifact.

## 10. What failure would become possible if bypassed?

A malformed or incomplete task artifact could be treated as acceptable by the gate.

That said, bypassing this validator for `next_action_execution` would also avoid a false negative on a valid registry-mutating execution path.

## Classification

**PARTIALLY_VALID_RULE**

## Final answers

- **Is the validator correct?** Partially.
- **Is the validator stale?** Partially.
- **Is the validator protecting a real risk?** Yes.
- **Should the validator be repaired, removed, or left unchanged?** Repaired.
