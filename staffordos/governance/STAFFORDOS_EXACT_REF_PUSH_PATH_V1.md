# StaffordOS Exact-Ref Governed Push Path V1

## Status

This is an inactive, repository-only capability. It does not authorize a push,
private-data operation, pull request, merge, deployment, or resume correction.
Activation requires independent review, a governed local commit, post-commit
verification, and separate owner authorization. The first public publication
of this runner cannot be governed by the runner itself; bootstrap requires a
separately authorized procedure after those checks.

Synthetic test mode may enable Git Trace2 events only inside runner-created
temporary state to verify the actual client invocation. Normal invocations
clear trace controls, do not accept a trace path, and never use trace output
as push authority.

## Contract

`run_exact_ref_push_with_gate_v1.sh` accepts exactly one closed JSON
authorization manifest. The manifest is bounded ASCII JSON with duplicate-key
rejection, exact keys, full SHA values, an exact canonical remote identity, an
invoked repository root, one expected parent, an approved file and mode/blob
SHA-256 manifest, one full destination ref, one destination precondition, a
noncryptographic authorization reference, and `noForce: true`.

The only additional invocation form is `--synthetic-test-mode`. It is rejected
for non-temporary repositories and endpoints, requires a repository-local
disposable control file, and is used only by the focused synthetic tests. It
cannot activate production storage or be selected by a normal one-manifest
invocation.

Only `refs/heads/careeros/*` and `refs/heads/staffordos/*` are permitted. Tags,
wildcards, deletions, tracking refs, notes, pull refs, empty path segments,
`.` and `..` segments, and ambiguous ref names are rejected. The runner builds
one refspec internally from validated values and executes the equivalent of:

```text
git push --porcelain <remote> <source-sha>:<full-destination-ref>
```

It never accepts caller Git options, force flags, multiple refspecs, tag
following, mirror/all behavior, or default push configuration. `ABSENT` and
`EXACT_SHA` are explicit, mutually exclusive destination preconditions. An
existing destination must be a normal fast-forward descendant; an exact
source retry is verified idempotently without another push.

## Validation And Threat Model

The runner verifies the local commit, tree, single parent, ancestry, clean
worktree, empty index, exact changed paths, explicitly declared regular
`100644` or executable `100755` modes, and SHA-256 content digests. It matches the configured remote URL byte-for-byte against
the manifest and checks the protected base branch before and after the push.
The destination is rechecked immediately before mutation. No force operation
is available, so a server-side race cannot be converted into an unsafe update.

Git is selected only from the platform trusted absolute-path allowlist. On the
current platform this is `/usr/bin/git` or `/bin/git`, and the executable and
its parent are verified as root-owned and not user-writable. Strict manifest
parsing uses the root-owned, non-symlinked `/usr/bin/python3`; there is no
ambient-`PATH` Node or Python fallback. Git
configuration, object directories, push options, SSH overrides, credential
helpers, tracing, and protocol overrides from the ambient environment are
removed or disabled. For authenticated HTTPS publication, the runner creates
a mode `0600` runner-owned Git configuration containing only the
`credential.https://github.com` helper entry. It resolves only the fixed
`/opt/homebrew/bin/gh` installation path, verifies the resolved executable and
its parent chain, and uses `gh auth git-credential` without reading credential
bytes in shell code. Synthetic tests may use only the fixed disposable helper
path inside their repository-local control boundary; production invocations
cannot select a helper or Git configuration. The production path is accepted
only when it resolves beneath `/opt/homebrew/Cellar/gh`, the executable is
owned by root or the current account and has no write bits, all components are
on the same device, no component is world-writable, and non-root-owned
components belong to the current account. User-owned group-writable
directories are accepted only inside the fixed Homebrew prefix; foreign-owned
or outside-prefix writable components are rejected. GitHub CLI token, host,
and configuration overrides are cleared. The runner derives `HOME` from the
effective operating-system account rather than accepting caller-provided
`HOME`, `XDG_CONFIG_HOME`, or `GH_CONFIG_DIR`, pins GitHub CLI configuration
to that account's `.config/gh` directory, and validates existing configuration
files as owned, regular, non-symlinked, and not group- or world-writable.
The effective account remains part of the trust boundary; this is not a
cryptographic claim about user-owned software. `GIT_TERMINAL_PROMPT=0` is
always set and askpass overrides are cleared, so missing authentication fails
without an interactive prompt. Helper output, tokens, URLs with credentials,
and authentication errors are never emitted or retained as runner results. A
private temporary directory is created outside the worktree with mode `0700`,
used for bounded validation and output, and removed on normal exit or signal.
Incomplete state is never authoritative.

Afterward, the exact destination, protected base, and bounded heads/tags
inventory are checked. A successful process is reported only when all checks
agree. A remote failure with an uncertain destination is reported as
`PUSH_RESULT_UNKNOWN`; a confirmed absent destination with an unchanged
protected base receives only a closed, bounded diagnostic such as
`PUSH_FAILED_DNS` or `PUSH_FAILED_AUTHORIZATION` plus exit status and state
metadata. Raw Git output is never emitted or retained after cleanup. Oversized,
binary, malformed, contradictory, or unrecognized output becomes
`PUSH_FAILED_UNKNOWN`. Network acceptance followed by local loss of
connectivity therefore requires a fresh read-only query by an operator, and
the runner does not retry automatically.

The owner authorization reference is metadata, not a signature or proof of
identity. Logs expose bounded status codes and no credential-bearing URLs,
private paths, unrelated refs, or environment values. Direct shell/Git use
and remote hooks remain outside this wrapper's technical control and require
the normal repository governance boundary.

## Governance Relationship

This narrow runner is separate from inactive Mission Envelope V2 and does not
write operator-daemon runtime state. Its only persistent effect, when later
activated, is the one explicitly authorized remote ref update. It does not
create pull requests, merge, deploy, follow tags, or execute private resume
authority corrections. Synthetic tests use disposable local and bare Git
repositories only. The runner is not active until reviewed, committed,
merged, and separately activated.

## Bootstrap And Capacity

The runner cannot claim to govern its own first remote publication. A separate
owner-authorized bootstrap should publish the reviewed commit using an
independently inspected exact refspec and then immediately verify the feature
ref, without pushing the base branch or any tag. No bootstrap push is covered
here. Once active, this adds one narrow StaffordOS exact-ref capability; it
does not increase runtime operator-daemon usage during this inactive phase.
