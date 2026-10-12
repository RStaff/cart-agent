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

Bootstrap resolves the effective hook location with `git rev-parse --git-path
hooks`; it does not assume `.git` is a directory and therefore works from a
linked worktree. The installer reports whether a linked worktree will alter a
shared hook and fails closed unless `STAFFORDOS_ALLOW_SHARED_HOOK_INSTALL=true`
is explicitly supplied after reviewing that impact. An existing hook is
copied beside itself before replacement and the installer prints the exact
rollback command. The installed hook stores an absolute path and SHA-256 for
the reviewed validator, so a target worktree need not contain governance
source files and a later silent validator replacement is rejected.

Bootstrap requires installing the revised hook with:

```sh
bash staffordos/operator_daemon/install_gated_commit_hook_v1.sh
```

When using the adapter against a target worktree, invoke the adapter by its
absolute path from the governance checkout while the target is its working
directory. The adapter resolves its authorization store through
`git rev-parse --git-dir`, preserving worktree-local one-use state.
