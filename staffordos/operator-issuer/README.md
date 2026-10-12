# StaffordOS operator issuer

This package is the established Google-to-StaffordOS operator assertion
issuer. It is a dependency of the operator session handoff; it is not a
client-facing authentication replacement.

## Local startup

Run from this directory with the locked dependencies:

```sh
npm ci
npm start
```

The local issuer binds to `127.0.0.1:8787` when `PORT` is unset. The
canonical local callback is:

`http://127.0.0.1:8787/auth/google/callback`

The local frontend handoff destination is the same-origin operator callback
at `http://127.0.0.1:3210/api/operator/auth/callback`. Production must use
an HTTPS, explicitly configured frontend handoff URL.

## Configuration boundary

Provide configuration through the approved secret manager or process
environment; never commit values. Required interactive variables are
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`,
`STAFFORDOS_OPERATOR_JWT_ISSUER`, `STAFFORDOS_OPERATOR_JWT_AUDIENCE`,
`ISSUER_SESSION_SECRET`, KMS signing configuration (`KMS_PROJECT`,
`KMS_LOCATION`, `KMS_KEY_RING`, `KMS_KEY`),
`STAFFORDOS_OPERATOR_FRONTEND_HANDOFF_URL`,
`STAFFORDOS_OPERATOR_HANDOFF_DATABASE_URL`,
`STAFFORDOS_OPERATOR_HANDOFF_ENCRYPTION_KEY`, and
`STAFFORDOS_OPERATOR_HANDOFF_SHARED_SECRET`. Role and subject allowlists
use `STAFFORDOS_OPERATOR_ROLES`, `STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS`,
and `STAFFORDOS_OPERATOR_ALLOWED_EMAILS`.

`npm start` validates the configuration and applies the handoff migration
before listening. Missing, malformed, or conflicting values fail closed;
interactive mode requires the authenticated one-time handoff path.

## Handoff storage

The migration is applied by `src/migrations.mjs` from
`migrations/001_staffordos_operator_handoff_grants.sql`. Handoff grants are
encrypted at rest, browser-bound, single-use, and expiry-limited. The
database URL and encryption/shared secrets are never sent to the browser.
