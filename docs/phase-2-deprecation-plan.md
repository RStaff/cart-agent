# Phase 2 Deprecation Plan (Non-Canonical App Trees)

This phase hardens integrity while avoiding destructive deletion.

## Objective

Prevent production drift back to legacy app paths while preserving rollback options.

## Completed in this phase

- Root build path aligned to canonical frontend:
  - `package.json` `scripts.build` now targets `web/frontend`
- Root postinstall no longer boots legacy frontend:
  - `package.json` `scripts.postinstall` no longer references `abando-frontend`
- Integrity checks now enforce:
  - root build must target `web/frontend`
  - root build must not target `abando-frontend`
  - root postinstall must not target `abando-frontend`

## Deprecated directories (kept for now)

- `api/`
- `backend/`
- `frontend/`
- `abando-frontend/`

These are retained temporarily for reference and rollback, but are not canonical runtime paths.

## Phase 3 proposal (after validation window)

1. Add `README.md` marker files in each deprecated directory with `DEPRECATED` header and migration pointer to `web/` and `web/frontend/`.
2. Remove deprecated directories from CI discovery logic where possible.
3. Archive deprecated trees into a single `_archive/` namespace in one controlled PR.
4. Delete archived trees in a final PR after at least one stable release cycle.

## Rollback

If build/runtime issues occur, revert only this commit to restore previous script wiring. No data/schema migration is involved in this phase.
