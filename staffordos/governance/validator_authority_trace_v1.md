# Validator Authority Trace v1

## Source of authority

`staffordos/operator_daemon/post_patch_structural_validator_v1.mjs`

## Runtime evidence

The validator executed during the `next_action_execution` gated run and failed the check:

`expected_artifact_task_or_status_present`

The runtime artifact was `staffordos/clients/client_registry_v1.json`, whose top-level keys are:

- `clients`
- `decision_engine`
- `generated_at`
- `operating_model`
- `purpose`
- `schema`

Because the artifact has no top-level `status`, `task_type`, or `execution`, the validator evaluated the rule to `false`.

## Authority assessment

The validator is not a bogus guard. It is a real structural gate.

But the gate’s artifact expectation is misaligned with the `next_action_execution` path, because that path uses a client registry as the expected artifact.

## Verdict

- **Current behavior:** legitimate but misapplied
- **Audit class:** `PARTIALLY_VALID_RULE`
- **Recommended treatment:** repair the contract for this execution path, not remove the validator
