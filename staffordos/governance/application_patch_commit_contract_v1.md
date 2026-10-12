# Application Patch Commit Contract v1

This is a non-operational commit boundary. It validates an already staged
application patch and invokes the repository pre-commit hook only after
validation. It never stages files, runs an operator task, sends messages,
accesses production, or pushes.

The adapter is `staffordos/operator_daemon/application_patch_commit_gate_v1.mjs`.
Its per-commit intent supplies the repository, branch, expected base, sorted
allowlist, staged blob IDs, and SHA-256 of `git diff --cached --binary`.
Validation is repeated immediately before `git commit`.

The digest is always computed from raw bytes using:
`git -c color.ui=false diff --cached --binary --full-index --no-ext-diff --no-textconv`.

The hook receives a private, one-use authorization file created by the
adapter. Missing, malformed, expired, mismatched, or reused authorization
fails closed. Callers do not set gate authorization.

Bootstrap requires installing the revised hook with:

```sh
bash staffordos/operator_daemon/install_gated_commit_hook_v1.sh
```
