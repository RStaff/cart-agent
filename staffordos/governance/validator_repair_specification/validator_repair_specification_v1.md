# Validator Repair Specification v1

## 1. Executive Summary

`staffordos/operator_daemon/post_patch_structural_validator_v1.mjs` is a legitimate governance gate, but its current artifact check is too narrow for the `next_action_execution` path.

The narrow safe repair is to make the validator branch on artifact type:

- registry artifacts such as `staffordos/clients/client_registry_v1.json`
- task/status/execution artifacts

The validator should keep protecting task-shaped artifacts while using a registry-appropriate schema for registry artifacts.

## 2. Exact file requiring change

- `staffordos/operator_daemon/post_patch_structural_validator_v1.mjs`

## 3. Exact rule requiring change

- `expected_artifact_task_or_status_present`

Current rule:

```js
Boolean(artifact?.status || artifact?.task_type || artifact?.execution)
```

## 4. How the validator should distinguish artifact types

The validator should branch by the expected artifact’s schema and/or known path shape:

- If the expected artifact is `staffordos/clients/client_registry_v1.json` or another registry artifact, validate registry fields.
- Otherwise, continue validating task/status/execution fields.

The narrowest safe distinction is:

- recognized registry path -> registry validation branch
- task/status artifact -> current task/status/execution branch

## 5. Fields that should validate `client_registry_v1.json`

For `staffordos/clients/client_registry_v1.json`, the validator should require:

- `schema`
- `clients`
- `generated_at`
- `purpose`
- `decision_engine` or equivalent registry decision metadata

And for each client item, it should at minimum ensure:

- `client_id`
- `lifecycle`
- `next_action`

Because this path is about registry mutation, the validator should confirm the artifact is a valid client registry and that it contains the expected canonical client record structure.

## 6. Fields that should still validate task/status/execution artifacts

For task/status/execution artifacts, the validator should continue requiring at least one of:

- `status`
- `task_type`
- `execution`

and should continue checking that the artifact is valid JSON and structurally present.

## 7. Repair scope

- **Scope:** `SINGLE_FILE`
- **Risk:** `LOW`

Reason:

- only one validator file requires a governed change,
- the existing gate and engine remain untouched,
- no new architecture or registry is needed.

## 8. Governance safety

This repair can be done without weakening governance.

It preserves the structural gate for task/status artifacts while adding the correct registry artifact branch for `next_action_execution`.

## 9. Effect on `next_action_execution`

Yes, the repair should allow `next_action_execution` to pass while still rejecting malformed task artifacts, because:

- the registry artifact branch would validate `client_registry_v1.json` correctly,
- the task/status branch would remain strict for all task-like artifacts.

## 10. Direct answers

- **Exact file:** `staffordos/operator_daemon/post_patch_structural_validator_v1.mjs`
- **Exact rule:** `expected_artifact_task_or_status_present`
- **Exact registry validation criteria:** require `schema`, `clients`, `generated_at`, `purpose`, and `decision_engine`-style metadata, plus canonical per-client fields
- **Exact task/status validation criteria:** require `status` or `task_type` or `execution`
- **Single-file repair:** yes
- **Can be done without weakening governance:** yes
- **Will it allow `next_action_execution` while still rejecting malformed task artifacts:** yes

## 11. Ready / Not Ready

**READY_FOR_GOVERNED_REPAIR**
