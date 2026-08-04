# S007.01I2 OAuth Client Configuration Correction Plan

Date: 2026-08-03

Mission class: documentation, reconciliation, and implementation planning only.

Final classification: `OAUTH_CLIENT_CONFIGURATION_CORRECTION_PLAN_COMMITTED`

## Scope

This mission plans the non-secret configuration corrections required before OAuth secret rotation or browser proof. It uses repository authority and the S007.01I1 operator-observed Google Cloud Console evidence.

No Google Cloud setting was changed. No redirect URI was added. No test user was added. No OAuth client secret was created, disabled, deleted, revoked, rotated, copied, or recorded. No source code or environment file was modified. No issuer was started. No browser login occurred.

## Current Provider Configuration

Authoritative client:

- Project: `staffordos-identity-prod`
- Display name: `StaffordOS Operator Issuer`
- Type: Web application
- Client ID: `109364024720-...q0i.apps.googleusercontent.com`
- Client creation date: July 30, 2026
- Last used date: July 30, 2026
- Last-used limitation: provider UI says usage data may be delayed by a day or more

Configured redirect URIs:

- `https://staffordos-operator.staffordmedia.ai/auth/google/callback`

Configured JavaScript origins:

- `https://staffordos-operator.staffordmedia.ai`

Consent context:

- User type: External
- Publishing status: Testing
- Ross listed as test user: no
- Scopes visible during S007.01I1 observation: no

Secret-slot metadata:

- enabled secret rows: 2
- creation timestamps:
  - `2026-07-30T19:50:41-04:00`
  - `2026-07-30T19:55:52-04:00`

No masked secret endings, secret values, screenshots, tokens, cookies, or JWTs are included in this plan.

## Repository-Required Configuration

Local browser proof requires the provider client to authorize exactly:

- `http://127.0.0.1:8787/auth/google/callback`

The local issuer source uses:

- `GET /login`
- `GET /auth/google/callback`
- `GET /public-key`
- `GET /health`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_ISSUER`
- `GOOGLE_AUDIENCE`

The issuer performs a server-side authorization-code exchange. JavaScript origins are not required for the local browser-proof flow.

The ignored local issuer configuration file remains absent:

- `staffordos/operator-issuer/.env.local`

G004.01 remains the write boundary:

- browser login alone must not authorize StaffordOS writes;
- local writes remain disabled unless the G004.01 local write gate is explicitly satisfied.

## Configuration Gaps

| Gap | Classification | Why it matters | Completion criteria |
| --- | --- | --- | --- |
| Missing local callback URI | `REQUIRED` | Google will reject local browser proof unless the exact callback URI is authorized. | Provider redirect URI list contains exactly `http://127.0.0.1:8787/auth/google/callback`; no wildcard, tunnel, LAN, preview, or arbitrary-port URI is added; redacted evidence captures the final URI list. |
| Ross not listed as test user | `REQUIRED` | External + Testing apps require eligible users for browser proof. | Ross is eligible for the app while it remains Testing, preferably by being listed as a test user; committed evidence records only eligibility result, not the full account identifier. |
| Two enabled secret rows already exist | `REQUIRED` | Later rotation must not assume a third enabled slot is available or disable the wrong row. | Provider secret-slot count is reviewed immediately before rotation; old/new handling is identified by non-secret metadata such as creation timestamp; no secret value or masked ending is recorded. |
| Local issuer configuration absent | `REQUIRED` | Browser proof cannot compare or use the authoritative client until ignored local configuration exists. | A later authorized mission creates or updates ignored local configuration, confirms required key names are present, verifies the provider client ID match privately, and prints no values. |
| Consent scopes not visible in S007.01I1 | `RECOMMENDED` | The source requests only `openid email profile`; provider-visible scopes should not surprise Ross during proof. | Later operator observation or browser proof confirms the requested scopes are only expected OIDC scopes, or records a blocker before continuing. |
| Production-style redirect present | `RECOMMENDED` | A production callback exists before issuer deployment authority. | Later review decides whether it remains deployment-planned, requires removal, or requires separate deployment authority; no change is made without approval. |
| Production-style JavaScript origin present | `RECOMMENDED` | The current local server-side flow does not need it. | Later review records whether it remains deployment-planned or should be removed in a separate approved correction. |
| Secret rotation | `BLOCKED` | Rotation before redirect and test-user correction would not support browser proof. | Remains unperformed until local callback, test-user eligibility, slot handling, and local ignored configuration are ready. |
| Browser OAuth proof | `BLOCKED` | Proof before provider correction would fail or create misleading evidence. | Remains unperformed until corrections are complete and S007.01J is explicitly authorized. |

## Required Correction Order

1. Reconfirm active project `staffordos-identity-prod` and client `StaffordOS Operator Issuer`.
2. Add exact local callback URI `http://127.0.0.1:8787/auth/google/callback`.
3. Resolve External/Testing eligibility for Ross without committing the full account identifier.
4. Review provider scopes visible to Ross or during browser proof.
5. Review existing production-style redirect and JavaScript origin.
6. Review the two enabled secret rows and define old/new handling using non-secret metadata only.
7. Create or update ignored local issuer configuration only after a later mission authorizes local configuration changes.
8. Proceed to controlled rotation and browser proof only after the correction evidence passes.

## Browser Proof Prerequisites

Browser proof remains blocked until:

- exact local callback URI is present;
- Ross is eligible for the External/Testing app;
- local ignored issuer configuration exists and is privately matched to the authoritative client ID;
- G004.01 writes are confirmed disabled;
- issuer is started only by an authorized browser-proof mission;
- no write path is enabled by login alone;
- evidence capture rules are ready.

## Secret Rotation Prerequisites

Secret rotation remains blocked until:

- provider redirect configuration supports local proof;
- Ross can complete consent;
- two enabled secret rows are reviewed;
- provider behavior and slot capacity are confirmed immediately before action;
- local ignored secret storage is ready;
- rollback preserves a working prior secret until replacement proof passes;
- no secret value will be printed, screenshotted, committed, or pasted into chat.

## Rollback Strategy

For provider configuration correction:

1. Capture pre-change redirect URI list, JavaScript origin list, consent status, and test-user eligibility in redacted form.
2. Apply only the approved correction in the later execution mission.
3. Capture post-change metadata.
4. If the local proof plan still fails before secret rotation, revert only the non-secret provider configuration change that caused the failure.
5. Do not touch client secrets during configuration rollback.

For later secret rotation:

1. Keep a working prior secret enabled until replacement proof succeeds, if provider behavior allows.
2. If two enabled rows block creation of a replacement secret, stop and obtain Ross approval for the exact row-handling plan before disabling anything.
3. Never commit secret values, masked endings, tokens, cookies, JWTs, authorization codes, or screenshots containing sensitive values.

## Validation Checklist

Before any configuration correction mission:

- [ ] HEAD and scope verified.
- [ ] No source or environment file changes staged.
- [ ] Correct project and client display name reconfirmed.
- [ ] Current redirect list recorded in redacted form.
- [ ] Current JavaScript origin list recorded in redacted form.
- [ ] Consent status and user type recorded.
- [ ] Ross test-user eligibility recorded without full account identifier.
- [ ] Secret row count and creation timestamps recorded without values or masked endings.
- [ ] Exact correction list approved by Ross.

After a later correction mission:

- [ ] Exact local callback URI is present.
- [ ] No unsafe redirect URI is added.
- [ ] Ross is eligible for browser proof.
- [ ] Secret rows are unchanged unless a separate secret mission authorized action.
- [ ] No browser OAuth flow was run unless explicitly authorized.
- [ ] No Google Cloud secret was created, disabled, deleted, revoked, or rotated unless explicitly authorized.
- [ ] Evidence contains no secret or token material.

## Evidence Required For Certification

Required redacted evidence:

- project ID;
- client display name;
- client type;
- redacted client ID;
- pre-change redirect URI list;
- approved correction intent;
- post-change redirect URI list;
- JavaScript origin classification;
- consent user type and publishing status;
- Ross eligibility result without full account identifier;
- secret-slot count and creation timestamps without values or masked endings;
- timestamp;
- operator confirmation;
- no-secret/no-token scan result.

Prohibited evidence:

- client secret value;
- masked secret ending;
- authorization code;
- ID token;
- access token;
- refresh token;
- StaffordOS JWT or assertion;
- cookie;
- private key;
- screenshot containing sensitive values.

## Next Mission

`S007_01I3_OPERATOR_CONTROLLED_OAUTH_CLIENT_CONFIGURATION_CORRECTION`

Purpose: perform only the approved non-secret provider configuration corrections, with Ross in control, before any secret rotation or browser proof.

## Rollback

Repository rollback:

```bash
git revert <S007.01I2 commit SHA>
```

This rollback removes only documentation. It does not affect Google Cloud, OAuth clients, secrets, local issuer configuration, source code, private records, runtime state, or deployments.
