# Worktree Cleanup Gate Report

## Current Status

- Status: `BLOCKED_FOR_PROMOTION`
- Branch: `cleanup-proof-surface`
- Allowed Next Step: targeted local cleanup and scope reduction
- Blocked Next Step: promotion

## Why This State Was Assigned

- Hygiene status input is BLOCKED.
- Branch cleanup-proof-surface currently has 8 staged, 121 unstaged, and 78 untracked path(s).
- Environment inventory reports 7 current environment risk(s) relevant to promotion trust.
- Generated noise exists in 3 path(s).

## Repo Hygiene Risks

- Generated noise present in 3 path(s).
- Staged and unstaged work are mixed in the same worktree.
- Unstaged surface area is high at 121 path(s).
- Untracked surface area is high at 78 path(s).
- Mixed concerns detected across 38 top-level areas.

## Environment Risks

- VERCEL_TOKEN missing while abando-frontend/.vercel is present
- RENDER_API_KEY/RENDER_TOKEN missing while Render config is present
- OAuth callback drift previously pointed installs at the Render host instead of app.abando.ai.
- Live proof loop is not yet fully completed end to end.
- Render API must never be used as the OAuth redirect host.
- Live proof loop currently stops if no real storefront checkout has been captured.
- Historical base URL drift created multiple sources of truth for merchant-facing URLs.

## Recommended Cleanup Actions

- Clean generated build output and cache directories from the active review path.
- Separate staged and unstaged changes before continuing promotion-oriented work.
- Triage untracked directories and keep only intentionally created new surfaces.
- Restore missing deploy credentials before treating this worktree as promotion-capable.
- Reduce the worktree to a single active concern before the next promotion attempt.

## Allowed Next Step

- targeted local cleanup and scope reduction

## Blocked Next Step

- promotion
