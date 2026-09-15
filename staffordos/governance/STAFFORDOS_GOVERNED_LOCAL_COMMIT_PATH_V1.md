# STAFFORDOS_GOVERNED_LOCAL_COMMIT_PATH_V1

## Purpose

StaffordOS needs a governed way to create a local commit without pushing. The existing runner remains available for missions that authorize push, but it is not safe for missions that explicitly prohibit remote mutation.

## Local-Only Runner

`staffordos/operator_daemon/run_task_with_local_commit_gate_v1.sh`

The runner:

- requires task, expected artifact, and commit message arguments;
- normalizes inputs through the stateless character integrity guard, which emits only to stdout and never writes repository output;
- checks the validator map and resolver syntax;
- verifies the expected artifact exists and parses JSON artifacts;
- requires an empty staging area before it starts;
- stages only the expected artifact and `STAFFORDOS_APPROVED_COMMIT_PATHS`;
- prints and validates the staged file list;
- runs `git diff --cached --check`;
- invokes `staffordos/operator_daemon/commit_gate_v1.sh`;
- sets `STAFFORDOS_GATED=true`;
- creates a local commit;
- stops before any remote mutation.

## Push Boundary

The local-only runner contains no `git push`, deploy, publish, or remote mutation command. It does not call the existing push-capable runner.

## Existing Runner

`staffordos/operator_daemon/run_task_with_commit_gate_v1.sh` remains unchanged and still performs the existing commit-then-push behavior for missions that authorize push.

## Character-Integrity Output Boundary

`staffordos/guards/character_integrity_guard_v1.mjs` is a stateless validator. Its normal operation emits the normalized value or deterministic structured result on stdout, rejects unknown modes and oversized input, and does not create or modify `staffordos/operator_daemon/output/character_integrity_guard_v1.json`. That tracked JSON is historical fixture data only; it is not current authority or runtime state. The guard accepts no output-path argument and no environment-controlled destination.

The guard's output is an integrity decision, not owner authentication. Its callers remain responsible for the existing commit and push gates. The push-capable runner retains its broader runtime behavior and must be separately authorized for any remote mutation.

## Commit Containment

The runner fails if files are staged before execution. It stages only explicitly approved paths and rejects any staged file that is not in the approved set.

## Limitations

The local-only runner is a commit gate, not a task execution daemon. Mission-specific tests and validation should run before invoking it. The existing `commit_gate_v1.sh` remains the final StaffordOS gate.

## Rollback

Remove the local-only runner, its focused test, this governance artifact, and the pre-commit hook installer guidance line. Existing push-capable governance remains available.
