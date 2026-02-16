# Phase 3 Guardrails

Phase 3 adds non-destructive controls to prevent production rewiring to deprecated app trees.

## Added controls

- Marker files created:
  - `api/DEPRECATED.md`
  - `backend/DEPRECATED.md`
  - `frontend/DEPRECATED.md`
  - `abando-frontend/DEPRECATED.md`
- Integrity script now requires those markers.
- Integrity script now fails if Render config references legacy app trees.
- Integrity script now requires `render.backend.yaml` to keep `startCommand: npm start`.

## Result

Legacy trees remain available for rollback/reference, but deployment wiring is guarded against accidental drift.
