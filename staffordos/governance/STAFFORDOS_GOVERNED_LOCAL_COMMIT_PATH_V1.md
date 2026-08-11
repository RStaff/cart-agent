# STAFFORDOS_GOVERNED_LOCAL_COMMIT_PATH_V1

## Purpose

StaffordOS needs a governed way to create a local commit without pushing. The existing runner remains available for missions that authorize push, but it is not safe for missions that explicitly prohibit remote mutation.

## Local-Only Runner

`staffordos/operator_daemon/run_task_with_local_commit_gate_v1.sh`

The runner:

- requires task, expected artifact, and commit message arguments;
- normalizes inputs through the character integrity guard;
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

## Commit Containment

The runner fails if files are staged before execution. It stages only explicitly approved paths and rejects any staged file that is not in the approved set.

## Limitations

The local-only runner is a commit gate, not a task execution daemon. Mission-specific tests and validation should run before invoking it. The existing `commit_gate_v1.sh` remains the final StaffordOS gate.

## Rollback

Remove the local-only runner, its focused test, this governance artifact, and the pre-commit hook installer guidance line. Existing push-capable governance remains available.
