# S007.01I1 OAuth Client Authority Reconciliation

Date: 2026-08-03

Evidence timestamp: `2026-08-03T19:45:40-0400`

Mission: `S007_01I1_OAUTH_CLIENT_AUTHORITY_RECONCILIATION`

Final classification: `OAUTH_CLIENT_AUTHORITY_RECONCILED_WITH_CORRECTIONS`

## Scope

This mission reconciles the exact Google OAuth client authority for the StaffordOS local operator issuer using repository evidence and Ross-observed Google Cloud Console metadata.

No Google Cloud setting was modified. No OAuth client was created or edited. No client secret was created, disabled, deleted, revoked, rotated, copied, or committed. No browser OAuth flow ran. No local issuer was started. No local environment file was changed. No StaffordOS write authorization was changed.

## Checkpoint Authority

- Starting HEAD: `1d1891547ef38fe0888fe3b1d1f43933a5b8accd`
- Required S007.01H local issuer authority was present.
- Required S007.01I plan, runbook, browser-proof checklist, and verifier dependency map were present.
- Required G004.01 minimal operator write-surface isolation authority was present.
- Certified project authority remains `staffordos-identity-prod`.
- Certified source-backed local callback remains `http://127.0.0.1:8787/auth/google/callback`.
- Local issuer port `8787` was not listening.
- Ollama port `11434` was not listening.

## Worktree Exclusions

The worktree contained pre-existing dirty runtime JSON, web runtime, production, architecture, ShopiFixer, S007, and operator-issuer artifacts. They were excluded from staging except for read-only authority inspection.

No `.env` values were printed. Known ignored local configuration was checked only for S007 key names. The preferred local issuer file `staffordos/operator-issuer/.env.local` was absent and is ignored by the repository root `.gitignore`.

## Repository Client Reference Inventory

| Reference | Location | Classification | Result |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | `staffordos/operator-issuer/src/issuer.mjs` | `ACTIVE_EXPECTED` | Required local issuer env name. |
| `GOOGLE_CLIENT_SECRET` | `staffordos/operator-issuer/src/issuer.mjs` | `ACTIVE_EXPECTED` | Required local issuer env name; value not inspected. |
| `GOOGLE_REDIRECT_URI` | `staffordos/operator-issuer/src/issuer.mjs` | `ACTIVE_EXPECTED` | Required local issuer env name used in authorization request and token exchange. |
| `GOOGLE_ISSUER` | `staffordos/operator-issuer/src/issuer.mjs` | `ACTIVE_EXPECTED` | Defaults to Google accounts issuer. |
| `GOOGLE_AUDIENCE` | `staffordos/operator-issuer/src/issuer.mjs` | `ACTIVE_EXPECTED` | Defaults to `GOOGLE_CLIENT_ID`. |
| `GOOGLE_TOKEN_ENDPOINT` | `staffordos/operator-issuer/src/issuer.mjs` | `ACTIVE_EXPECTED` | Defaults to Google token endpoint. |
| `GOOGLE_JWKS_URI` | `staffordos/operator-issuer/src/issuer.mjs` | `ACTIVE_EXPECTED` | Defaults to Google JWKS endpoint. |
| `http://127.0.0.1:8787/auth/google/callback` | issuer tests and S007.01I | `ACTIVE_EXPECTED` | Source-backed local browser-proof callback. |
| `https://staffordos-operator.staffordmedia.ai/auth/google/callback` | earlier S007 architecture docs | `PLANNED` | Production-style redirect proposed before deployment; not authority for local proof. |
| OAuth client display name | repository | `UNKNOWN` | Not repository-proven before this mission. |
| Active client ID | repository | `UNKNOWN` | Not repository-proven before this mission. |
| `staffordos/operator-issuer/.env.local` | local filesystem metadata | `VALUE_ABSENT` | File absent; no local client ID could be compared. |

## Google Cloud Project Authority

Provider project inspected by Ross:

- `staffordos-identity-prod`

The project matches repository authority from S007.01H and S007.01I.

## Google Cloud Access Method

Authority method: Google Cloud Console operator observation.

The repository states that available `gcloud iap` and `gcloud iam` OAuth commands do not enumerate or manage the generic Google Auth Platform Web Application OAuth client required by the StaffordOS issuer. The current local `gcloud` configuration also had no active project set. Therefore, no CLI OAuth client selection was used.

## OAuth Client Candidates

Ross observed exactly one StaffordOS-related OAuth 2.0 Web application client in project `staffordos-identity-prod`.

Detailed candidate register: `S007_01I1_OAUTH_CLIENT_CANDIDATE_REGISTER.md`.

## Authoritative Client Result

Authoritative client:

- Display name: `StaffordOS Operator Issuer`
- Type: `Web application`
- Project: `staffordos-identity-prod`
- Client ID, redacted for committed evidence: `109364024720-...q0i.apps.googleusercontent.com`

The client is authoritative for StaffordOS based on project match, display-name match, Web application type, StaffordOS production-style redirect/origin, observed last-used metadata, and lack of another plausible StaffordOS-related Web application client.

## Client ID Match Result

Result: `VALUE_ABSENT`

The provider client ID was observed safely as non-secret metadata and is recorded in redacted form. The local issuer expects `GOOGLE_CLIENT_ID`, but the preferred local issuer env file is absent and key-name checks did not find a local S007 client ID in known `.env*` files. No mismatch was proven. A future correction mission must establish the local ignored configuration after provider configuration is corrected and rotation is authorized.

## Redirect URI Result

Classification: `REQUIRED_URI_MISSING`

Provider-configured redirect URI observed:

- `https://staffordos-operator.staffordmedia.ai/auth/google/callback`

Repository-backed required local proof redirect URI:

- `http://127.0.0.1:8787/auth/google/callback`

Result:

- Required local URI is missing from provider configuration.
- Production-style URI is present.
- No wildcard, tunnel, LAN, preview, or arbitrary local-port redirect was reported.
- No Google Cloud redirect setting was changed.

## JavaScript Origin Result

Classification: `PRESENT_BUT_NOT_REQUIRED`

Provider-configured origin observed:

- `https://staffordos-operator.staffordmedia.ai`

The current StaffordOS local issuer performs server-side redirect and token exchange. A JavaScript origin is not required for the planned local authorization-code proof. The production-style origin should be reviewed before deployment but was not modified.

## Secret Slot Metadata

Classification: `MULTIPLE_SECRET_CUTOVER_SUPPORTED`

Observed provider metadata:

- two enabled client-secret rows exist;
- creation timestamps:
  - `2026-07-30T19:50:41-04:00`
  - `2026-07-30T19:55:52-04:00`

The masked secret endings shown by the Console were intentionally excluded from committed evidence. No secret values or partial secret identifiers are recorded in repository artifacts.

Because two enabled rows already exist, a later rotation mission must review provider slot capacity and decide which row is safe to disable or replace before attempting another replacement secret.

## Consent Screen Context

Observed provider state:

- Publishing status: `Testing`
- User type: `External`
- Scopes: not visible in the operator observation

No consent-screen setting was changed.

## Authorized Operator Eligibility

Classification: `TEST_USER_REQUIRED`

Ross is not currently listed as a test user. A later configuration-correction mission must either add Ross as an authorized test user or document another provider-supported way for Ross to complete the local browser proof while the app remains External and Testing.

No test user was added in this mission.

## Duplicate Or Legacy Client Result

Classification: `NO_DUPLICATE_STAFFORDOS_CLIENT_OBSERVED`

Ross observed one StaffordOS-related Web application client in the project. No duplicate, legacy, or competing StaffordOS OAuth client was identified from provider observation or repository evidence.

## Client Authority Decision

Decision: `CLIENT_REQUIRED_REDIRECT_MISSING`

The authoritative client is reconciled, but the provider configuration is not ready for local browser proof or secret rotation because the exact local callback URI is missing.

## Rotation Readiness Update

Updated readiness: `BLOCKED_ON_REDIRECT_CORRECTION`

Additional correction prerequisites:

- consent/test-user eligibility must be corrected or explicitly authorized;
- two enabled secret rows require slot review before any controlled rotation;
- local ignored issuer configuration remains absent and must be created only during a later authorized mission.

Secret rotation is not ready.

## Configuration Correction Plan

Next mission should plan, not execute, the following corrections:

1. Add exact local redirect URI `http://127.0.0.1:8787/auth/google/callback`.
2. Confirm whether the existing production-style redirect and JavaScript origin should remain, be marked deployment-planned, or be removed in a later approved correction.
3. Add Ross as a test user or otherwise resolve External/Testing eligibility.
4. Review two enabled secret rows and identify the safe old-secret handling sequence without exposing values.
5. Define when ignored local issuer configuration may be created or updated.

No correction was performed during S007.01I1.

## Evidence Capture

Evidence captured:

- project ID;
- display name;
- client type;
- redacted client ID;
- redirect URI classification;
- JavaScript origin classification;
- consent screen context;
- test-user eligibility result;
- secret-slot count, statuses, and creation timestamps;
- client creation date;
- last-used date with provider delay warning;
- operator confirmation.

Never captured or committed:

- client secret value;
- masked secret ending;
- authorization code;
- token;
- cookie;
- JWT;
- screenshot.

## Validation

Validation required before commit:

- repository client-reference consistency check;
- callback URI consistency check;
- provider/client evidence consistency check;
- local-config match check without secret output;
- duplicate-client reconciliation check;
- secret-value absence scan;
- token/cookie/JWT absence scan;
- decision/readiness consistency check;
- `jq` validation;
- `git diff --check`;
- `git diff --cached --check`.

## Files Created

- `staffordos/governance/S007_01I1_OAUTH_CLIENT_AUTHORITY_RECONCILIATION.md`
- `staffordos/governance/S007_01I1_OAUTH_CLIENT_AUTHORITY_RECONCILIATION.json`
- `staffordos/governance/S007_01I1_OAUTH_CLIENT_CANDIDATE_REGISTER.md`
- `staffordos/governance/S007_01I1_OAUTH_CLIENT_OPERATOR_DECISION_BRIEF.md`

## Rollback

Repository rollback:

```bash
git revert <S007.01I1 commit SHA>
```

Rollback affects documentation only. No OAuth client, secret, Google Cloud setting, issuer runtime, session, private record, or deployment rollback should be required.

## Selected Next Mission

`S007_01I2_OAUTH_CLIENT_CONFIGURATION_CORRECTION_PLAN`

Reason: exact client authority is reconciled, but local redirect, test-user eligibility, and secret-slot handling must be planned before any rotation or browser proof.
