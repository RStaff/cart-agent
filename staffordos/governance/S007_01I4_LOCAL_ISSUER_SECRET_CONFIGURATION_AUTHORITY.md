# S007.01I4 Local Issuer Secret Configuration Authority

Date: 2026-08-03

Mission: documentation-first, authority-only reconciliation of local StaffordOS Operator Issuer secret configuration.

Final classification: `LOCAL_ISSUER_SECRET_CONFIGURATION_AUTHORITY_DOCUMENTED`

## Scope

This mission inspected repository authority and local configuration metadata only.

No secret value was printed, logged, exposed, hashed, partially revealed, compared, or committed. No environment file was created, modified, deleted, opened for secret contents, or staged. The local issuer was not started. Browser OAuth was not performed. Google Cloud was not modified. No source code, deployment configuration, private data, or operator write behavior was changed.

## Canonical Configuration Authority

The StaffordOS Operator Issuer source is under:

- `staffordos/operator-issuer`

The runtime entrypoint uses ambient process environment:

- `staffordos/operator-issuer/src/index.mjs`
- `staffordos/operator-issuer/src/issuer.mjs`

Source-backed behavior:

- `src/index.mjs` calls `configFromEnv()` and starts the issuer using the returned config.
- `configFromEnv()` reads from `process.env`.
- No dotenv loader is implemented in the issuer source.
- `PORT` defaults to `8787`.

Governance-backed preferred local configuration:

- `staffordos/operator-issuer/.env.local`

Authority basis:

- S007.01I runbook says the replacement secret should be stored in ignored local configuration, preferably `staffordos/operator-issuer/.env.local`, or an equivalent local secret store Ross approves.
- S007.01I2 and S007.01I3 record that `staffordos/operator-issuer/.env.local` is absent and ignored.
- Root `.gitignore` ignores `.env.local` and `.env.*.local`.

Conclusion:

- Canonical local file authority is `staffordos/operator-issuer/.env.local` for the next local proof path.
- Runtime source authority remains ambient `process.env`.
- A later mission must either create the ignored file and load it safely into `process.env`, or explicitly approve an equivalent local secret store and launch procedure.

## Expected Variable Names

Required for real local browser proof from source validation:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `STAFFORDOS_OPERATOR_JWT_ISSUER`
- `STAFFORDOS_OPERATOR_JWT_AUDIENCE`
- `ISSUER_SESSION_SECRET`
- `STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS`
- `KMS_PROJECT`
- `KMS_LOCATION`
- `KMS_KEY_RING`
- `KMS_KEY`

Defaulted but authority-relevant:

- `GOOGLE_ISSUER`
- `GOOGLE_AUDIENCE`
- `GOOGLE_TOKEN_ENDPOINT`
- `GOOGLE_JWKS_URI`
- `KMS_KEY_VERSION`
- `PORT`

Optional or mode-dependent:

- `STAFFORDOS_OPERATOR_ALLOWED_EMAILS`
- `STAFFORDOS_OPERATOR_ROLES`
- `STAFFORDOS_OPERATOR_PERMISSIONS`
- `STAFFORDOS_ASSERTION_TTL_SECONDS`
- `OAUTH_STATE_TTL_SECONDS`
- `KMS_ACCESS_TOKEN`
- `KMS_IMPERSONATE_SERVICE_ACCOUNT`
- `KMS_USE_GCLOUD_AUTH`

Do not use:

- `NEXT_PUBLIC_*` for issuer secrets or identity credentials.
- committed `.env` files.
- Markdown, JSON, chat, issue trackers, screenshots, or shell command arguments for secret values.

## Present Vs Absent Status

Canonical local configuration file:

| Item | Status | Notes |
| --- | --- | --- |
| `staffordos/operator-issuer/.env.local` | `ABSENT` | File does not exist. |
| Git ignore coverage for `.env.local` | `PRESENT` | Root `.gitignore` ignores `.env.local` and `.env.*.local`. |
| Other `.env*` files under `staffordos/operator-issuer` | `ABSENT` | No issuer-local env file was found by path inventory. |
| issuer port `8787` | `NOT_LISTENING` | The issuer was not started. |
| Ollama port `11434` | `NOT_LISTENING` | External AI was not running for this mission. |

Current shell environment status, reported by key presence only:

| Variable | Status |
| --- | --- |
| `GOOGLE_CLIENT_ID` | `UNSET` |
| `GOOGLE_CLIENT_SECRET` | `UNSET` |
| `GOOGLE_REDIRECT_URI` | `UNSET` |
| `GOOGLE_ISSUER` | `UNSET` |
| `GOOGLE_AUDIENCE` | `UNSET` |
| `GOOGLE_TOKEN_ENDPOINT` | `UNSET` |
| `GOOGLE_JWKS_URI` | `UNSET` |
| `STAFFORDOS_OPERATOR_JWT_ISSUER` | `UNSET` |
| `STAFFORDOS_OPERATOR_JWT_AUDIENCE` | `UNSET` |
| `ISSUER_SESSION_SECRET` | `UNSET` |
| `STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS` | `UNSET` |
| `STAFFORDOS_OPERATOR_ALLOWED_EMAILS` | `UNSET` |
| `STAFFORDOS_OPERATOR_ROLES` | `UNSET` |
| `STAFFORDOS_OPERATOR_PERMISSIONS` | `UNSET` |
| `STAFFORDOS_ASSERTION_TTL_SECONDS` | `UNSET` |
| `OAUTH_STATE_TTL_SECONDS` | `UNSET` |
| `KMS_PROJECT` | `UNSET` |
| `KMS_LOCATION` | `UNSET` |
| `KMS_KEY_RING` | `UNSET` |
| `KMS_KEY` | `UNSET` |
| `KMS_KEY_VERSION` | `UNSET` |
| `KMS_ACCESS_TOKEN` | `UNSET` |
| `KMS_IMPERSONATE_SERVICE_ACCOUNT` | `UNSET` |
| `KMS_USE_GCLOUD_AUTH` | `UNSET` |
| `PORT` | `UNSET` |

No variable value was printed or compared.

## Configuration Readiness

Readiness classification:

- `NOT_READY_LOCAL_CONFIGURATION_ABSENT`

Reasons:

- canonical issuer-local config file is absent;
- current shell has no required issuer variables set;
- required Google OAuth values are absent;
- required StaffordOS JWT issuer/audience/session values are absent;
- required operator subject allowlist is absent;
- required KMS locator values are absent;
- no approved local secret-loading procedure has been established for browser proof.

Provider-side OAuth configuration is ready from S007.01I3, but local issuer configuration is not.

## Missing Prerequisites

Required before local browser proof:

- approve the exact local secret-storage mechanism;
- create or populate ignored local issuer configuration outside Git;
- set `GOOGLE_CLIENT_ID` to the authoritative provider client ID without committing it;
- set `GOOGLE_CLIENT_SECRET` only through approved local secret handling;
- set `GOOGLE_REDIRECT_URI` to `http://127.0.0.1:8787/auth/google/callback`;
- set StaffordOS JWT issuer and audience;
- create a strong local `ISSUER_SESSION_SECRET`;
- set `STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS` using Ross's stable Google subject after it is safely known;
- set KMS project/location/key-ring/key locator values;
- choose KMS authentication mode for local proof without exposing tokens;
- verify required key names are present without printing values;
- confirm G004.01 writes remain disabled before any login proof.

Recommended before browser proof:

- decide whether `GOOGLE_AUDIENCE` should be explicit or safely default to `GOOGLE_CLIENT_ID`;
- decide whether `GOOGLE_ISSUER` should be explicit or safely default to Google accounts issuer;
- decide whether `KMS_KEY_VERSION` should be explicit or safely default to version `1`;
- keep `STAFFORDOS_OPERATOR_ALLOWED_EMAILS` unset unless a second allowlist check is intentionally wanted;
- keep roles and permissions minimal because verifier/session integration is not connected.

## Browser-Proof Readiness

Browser-proof readiness:

- `BLOCKED_ON_LOCAL_ISSUER_SECRET_CONFIGURATION`

Ready pieces:

- provider client authority is reconciled;
- exact local callback is authorized in Google Cloud;
- Ross test-user eligibility is present;
- issuer routes exist in source;
- local port default is `8787`;
- G004.01 operator writes remain isolated.

Blocked pieces:

- local issuer config is absent;
- current shell has required issuer variables unset;
- no local secret has been configured;
- no local secret-loading procedure has been approved;
- issuer has not been started;
- browser OAuth has not run;
- secret rotation remains unperformed;
- verifier/session integration remains incomplete.

## Rollback

Repository rollback for this documentation:

```bash
git revert <S007.01I4 commit SHA>
```

If these files are not committed, rollback is simply removal of the S007.01I4 governance artifacts before staging.

No provider rollback is applicable because this mission changed no Google Cloud setting.

No secret rollback is applicable because this mission created, modified, read, or deleted no secret.

No runtime rollback is applicable because this mission did not start the issuer or modify source code.

## Next Recommended Mission

`S007_01I5_LOCAL_ISSUER_SECRET_CONFIGURATION_OPERATOR_RUNBOOK`

Purpose: create the operator-executable runbook for safely creating or populating ignored local issuer configuration without printing or committing secret values.

Do not proceed directly to browser proof until that local configuration authority is executed and verified by presence-only checks.
