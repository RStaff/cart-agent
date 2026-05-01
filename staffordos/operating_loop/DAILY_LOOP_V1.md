# StaffordOS Daily Operating Loop v1

## Purpose

Prevent drift. Preserve progress. Force every work session through scope, runtime, proof, and checkpoint gates.

## Daily Flow

1. Start Workday
2. Restore runtime truth
3. Choose one active blocker
4. Execute only that blocker
5. Run gates
6. Write proof
7. Save checkpoint
8. Stop cleanly

## Non-Negotiable Gates

### Gate 1 — Runtime Stability
- `/health` must return 200
- critical UI route must return 200

### Gate 2 — Scope Lock
- one workstream only
- no parallel product patching

### Gate 3 — Existing System Check
- search for existing runner/gate/agent before creating new files

### Gate 4 — Syntax / Runtime Check
- no broken backend
- no unchecked route patches

### Gate 5 — Proof Capture
- proof artifact must be written or updated

### Gate 6 — Checkpoint
- git status
- git diff
- critical files archived to home-server

## Stop Rule

If runtime breaks, stop feature work and restore stability before anything else.
