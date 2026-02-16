# Canonical Architecture (Source of Truth)

This document defines the runtime architecture that is considered production-authoritative.

## Active Runtime

- Backend app: `web/src/index.js`
- Backend package root: `web/package.json`
- Root start command: `npm start` in `package.json`, which executes `node --require ./web/smc-preload.cjs web/src/index.js`
- Frontend app: `web/frontend` (Vite static build)
- Shopify app config: `shopify.app.toml`
- Render static frontend config: `render.yaml` (`web/frontend/dist`)

## Deployment Expectations

- Any production backend startup path must resolve to `web/src/index.js`.
- Any static frontend deployment must build from `web/frontend`.
- Shopify webhook and callback routes must be served by the backend started from `web/src/index.js`.

## Non-Canonical App Trees

The following directories exist in the repo but are not the source of truth for production runtime:

- `api/`
- `backend/`
- `frontend/`
- `abando-frontend/`

They may be retained for migration/reference work, but changes here do not define production behavior unless deployment wiring is explicitly updated.

## Change Control Rule

Before switching canonical paths, update all of the following in the same PR:

1. `package.json` start/build scripts
2. `render.yaml` and/or Render service settings
3. `shopify.app.toml` callback/webhook assumptions
4. This file: `docs/architecture-canonical.md`
5. `scripts/verify_architecture_integrity.sh`
