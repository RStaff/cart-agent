# S007.01I3 Operator-Controlled OAuth Client Configuration Correction

Date: 2026-08-03

Mission type: interactive operator-controlled Google OAuth configuration correction, provider-state verification, redacted evidence capture, documentation, validation, and governed local commit.

Final classification: `OAUTH_CLIENT_CONFIGURATION_CORRECTED`

## Checkpoint Authority

Starting HEAD:

- `41fb2cf42cff12b8c3d39fd07c202fc4265205f3`

Authorities verified before provider action:

- S007.01H Local Operator Issuer
- S007.01I OAuth Rotation and Browser Proof Plan
- S007.01I1 OAuth Client Authority Reconciliation
- S007.01I2 OAuth Client Configuration Correction Plan
- G004.01 Minimal Operator Write Surface Isolation

Safe baseline:

- repository root: `/Users/rossstafford/projects/cart-agent`
- branch: `main`
- staged files before documentation: none
- issuer port `8787`: not listening
- Ollama port `11434`: not listening
- G004.01 local write enablement flag: absent
- local issuer environment file: absent and ignored

The worktree contained unrelated modified and untracked files before this mission. They were excluded from this mission and were not staged.

## Authorized Scope

This mission authorized exactly two non-secret Google Cloud provider corrections:

1. Add the exact local OAuth redirect URI:
   - `http://127.0.0.1:8787/auth/google/callback`
2. Add Ross's intended Google account as an OAuth test user.

No other provider, secret, source-code, environment, runtime, or deployment change was authorized.

## Before State

Provider authority before correction:

- project: `staffordos-identity-prod`
- authoritative OAuth client: `StaffordOS Operator Issuer`
- client type: Web application
- client ID: `109364024720-...q0i.apps.googleusercontent.com`
- audience: External
- publishing status: Testing
- StaffordOS-related Web clients: one
- Ross test-user eligibility: absent
- enabled secret rows: two

Authorized redirect URIs before correction:

- `https://staffordos-operator.staffordmedia.ai/auth/google/callback`

Authorized JavaScript origins before correction:

- `https://staffordos-operator.staffordmedia.ai`

Missing repository-required local callback:

- `http://127.0.0.1:8787/auth/google/callback`

## Project And Client Verification

Ross confirmed before editing:

- active project: `staffordos-identity-prod`
- selected OAuth client: `StaffordOS Operator Issuer`
- client type: Web application

The mission did not proceed against any other OAuth client.

## Redirect Correction

Before editing, Ross confirmed:

- the production callback was present:
  - `https://staffordos-operator.staffordmedia.ai/auth/google/callback`
- the local development callback was absent:
  - `http://127.0.0.1:8787/auth/google/callback`

Ross then added exactly:

- `http://127.0.0.1:8787/auth/google/callback`

Post-save redirect verification:

- `https://staffordos-operator.staffordmedia.ai/auth/google/callback`
- `http://127.0.0.1:8787/auth/google/callback`

No other redirect URI was added or removed.

Correction classification:

- `LOCAL_REDIRECT_CORRECTED`

## Test-User Correction

Before editing, Ross confirmed the app remained:

- audience: External
- publishing status: Testing

Ross added his intended Google account directly in Google Cloud Console.

Committed evidence records only:

- `ROSS_TEST_USER_PRESENT`

No email address is recorded in this artifact.

Correction classification:

- `ROSS_TEST_USER_ELIGIBILITY_CORRECTED`

## Post-Change Provider Verification

Ross confirmed after both changes:

- display name unchanged: `StaffordOS Operator Issuer`
- client type unchanged: Web application
- only the expected redirect URIs are present:
  - `https://staffordos-operator.staffordmedia.ai/auth/google/callback`
  - `http://127.0.0.1:8787/auth/google/callback`
- JavaScript origin unchanged:
  - `https://staffordos-operator.staffordmedia.ai`
- two enabled secret rows remain present
- no secret was created, revealed, disabled, deleted, or rotated
- audience unchanged: External
- publishing status unchanged: Testing
- Ross is eligible as a test user
- no additional test user was added by this mission
- scopes were not changed
- branding was not changed

Provider verification classification:

- `CONFIGURATION_CORRECTIONS_VERIFIED`

## Secret Non-Impact

Confirmed non-impact:

- no client secret was created
- no client secret was disabled
- no client secret was deleted
- no client secret was rotated
- no client secret value was copied
- no masked secret ending was copied or recorded
- no token, authorization code, cookie, or JWT was created or recorded
- two enabled secret rows remain present
- local issuer configuration remains absent

Secret non-impact classification:

- `SECRET_CONFIGURATION_UNCHANGED`

## Browser-Proof Readiness

Provider configuration prerequisites now satisfied:

- authoritative client proven
- exact local callback present
- Ross test-user eligibility present
- app remains External and Testing
- production callback preserved
- JavaScript origin unchanged
- secret rows unchanged
- no unexpected redirect conflict introduced

Browser proof remains blocked because:

- local issuer `.env.local` is absent
- local secret configuration has not been authorized
- OAuth secret rotation was previously required before issuer deployment
- this mission did not start the issuer
- this mission did not run browser OAuth

Readiness classification:

- `BLOCKED_ON_LOCAL_SECRET_CONFIGURATION`

## Evidence Capture

Redacted evidence captured:

- project identifier
- client display name
- client type
- redacted client ID
- correction timestamp
- exact local redirect classification
- production redirect preserved
- test-user eligibility status
- External/Testing status
- secret-row count unchanged
- operator confirmations
- limitations

Evidence intentionally excluded:

- Ross's email address
- client secret value
- masked secret ending
- full client ID
- screenshots
- authorization code
- ID token
- access token
- refresh token
- StaffordOS JWT or assertion
- session cookie
- private key

## Provider Rollback

Provider rollback must not be executed automatically.

If a later approved rollback mission is required, Ross may remove only:

- the local callback URI added by this mission:
  - `http://127.0.0.1:8787/auth/google/callback`
- Ross's test-user entry added by this mission

Provider rollback must not remove or modify:

- production callback
- production JavaScript origin
- OAuth client
- client secrets
- other test users
- audience
- publishing status
- scopes
- branding

## Repository Rollback

Repository rollback:

```bash
git revert <S007.01I3 commit SHA>
```

Repository rollback removes only this governance record. It does not revert Google Cloud configuration and does not affect OAuth clients, secrets, local issuer configuration, source code, private records, runtime state, deployments, or operator write isolation.

## Known Limitations

- Local browser proof has not occurred.
- Local issuer configuration remains absent.
- OAuth secret rotation has not occurred.
- Verifier and session integration remain incomplete.
- Browser login alone must not authorize StaffordOS writes.
- G004.01 remains the current write-surface isolation boundary.
- Production-style redirect and JavaScript origin remain present but unchanged.

## Selected Next Mission

`S007_01I4_LOCAL_ISSUER_SECRET_CONFIGURATION_AUTHORITY`

Reason: provider configuration is corrected, but local issuer secret configuration remains absent. Browser proof and secret rotation should not proceed until the ignored local configuration authority is established without exposing secret values.

## Confirmation Of Non-Impact

This mission did not:

- create another OAuth client
- rename the client
- change client type
- remove the production callback
- remove or modify the production JavaScript origin
- add localhost variants
- add wildcard redirect URIs
- add LAN, tunnel, preview, or temporary URLs
- add any other test user
- change publishing status
- change audience
- add or remove scopes
- modify consent branding
- create, disable, delete, reveal, or rotate client secrets
- start the local issuer
- run browser OAuth
- modify `.env.local`
- modify source code
- modify private data
- invoke an operator write
- deploy
- push
