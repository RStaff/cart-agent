# S007.01I OAuth Secret Rotation and Browser Proof Plan

Date: 2026-08-03

Mission: `S007_01I_OAUTH_SECRET_ROTATION_AND_BROWSER_PROOF_PLAN`

Final classification target: documentation and local commit only.

## Scope

This mission plans OAuth secret rotation and browser proof for the local StaffordOS operator issuer. It does not rotate any secret, change Google Cloud configuration, start a browser login, deploy the issuer, connect authentication to `/operator` or `/os`, modify G004.01 write isolation, or expose private data.

The S007.01I artifacts are stored in `staffordos/governance` because this mission is a cross-cutting governance dependency for G004.01 write isolation, future verifier integration, and Job Search server authorization. Existing S007 implementation and proof artifacts remain in `staffordos/shopifixer` and `staffordos/operator-issuer` unchanged.

## Checkpoint Authority

- Starting HEAD verified for this mission: `8d5217c18c190efb1b594a1b88fd724685616ccb`.
- Required commits were present in local history:
  - `625b9150` - Ratify StaffordOS enterprise architecture review
  - `eae4f9dd` - A001 define StaffordOS Asset Authority architecture
  - `d6a09095` - G001 add private-data Git backstop
  - `f5728284` - G002 reconcile Professional workspace modes
  - `64ac3b4b` - G003 enforce adapter-only read models and staticity
  - `8d5217c1` - G004 isolate operator write surfaces
- Required S007.01H local issuer authority exists:
  - `staffordos/operator-issuer/src/server.mjs`
  - `staffordos/operator-issuer/src/issuer.mjs`
  - `staffordos/operator-issuer/test/issuer.test.mjs`
  - `staffordos/shopifixer/S007_01H_LOCAL_OPERATOR_ISSUER.md`
  - `staffordos/shopifixer/S007_01H_LOCAL_OPERATOR_ISSUER.json`
- G003 and G004.01 governance authorities exist under `staffordos/governance`.
- Ollama was not listening on TCP `11434`.
- The local issuer was not running on TCP `8787` during planning.

## Worktree Exclusions

The worktree contained pre-existing dirty runtime JSON, web runtime, production, architecture, ShopiFixer, S007, and operator-issuer artifacts. They were excluded from staging unless used as read-only authority for this mission.

No `.env` value was opened or printed. A path-only `.env*` inventory and targeted environment-name reference scans were used.

## OAuth Implementation Inventory

| Item | Source | Classification | Result |
| --- | --- | --- | --- |
| Login route | `GET /login` in `staffordos/operator-issuer/src/server.mjs` | `IMPLEMENTED_NOT_BROWSER_PROVEN` | Builds a Google authorization redirect and state cookie. |
| Callback route | `GET /auth/google/callback` | `IMPLEMENTED_NOT_BROWSER_PROVEN` | Validates state and nonce, exchanges code server-side, verifies Google ID token, signs StaffordOS assertion. |
| OAuth authorization endpoint | `https://accounts.google.com/o/oauth2/v2/auth` | `IMPLEMENTED_AND_TESTED` | Tested through synthetic redirect construction. |
| Token endpoint | `GOOGLE_TOKEN_ENDPOINT`, default Google token endpoint | `IMPLEMENTED_NOT_BROWSER_PROVEN` | Implemented and test-injected; not proven with a real browser flow. |
| Requested scopes | `openid email profile` | `IMPLEMENTED_AND_TESTED` | Minimal OIDC identity scopes. |
| State generation and storage | HMAC-signed `staffordos_oauth_state` cookie | `IMPLEMENTED_AND_TESTED` | HttpOnly, SameSite=Lax, path `/`, bounded max age. |
| Nonce generation and validation | state-cookie payload plus Google ID token nonce check | `IMPLEMENTED_AND_TESTED` | Negative nonce test exists. |
| PKCE | none in current confidential web-server flow | `NOT_REQUIRED_FOR_CURRENT_CONFIDENTIAL_WEB_FLOW` | Re-evaluate if the issuer becomes a public or native client flow. |
| Client ID env | `GOOGLE_CLIENT_ID` | `IMPLEMENTED_AND_TESTED` | Name only inventoried; no value recorded. |
| Client secret env | `GOOGLE_CLIENT_SECRET` | `IMPLEMENTED_NOT_BROWSER_PROVEN` | Name only inventoried; no value recorded. |
| Redirect URI env | `GOOGLE_REDIRECT_URI` | `IMPLEMENTED_AND_TESTED` | Exact local proof URI still requires operator confirmation in Google Cloud Console. |
| Google issuer | `GOOGLE_ISSUER`, default Google accounts issuer | `IMPLEMENTED_AND_TESTED` | Invalid issuer rejected in tests. |
| Google audience | `GOOGLE_AUDIENCE`, default client ID | `IMPLEMENTED_AND_TESTED` | Invalid audience rejected in tests. |
| Verified-email requirement | Google ID token `email_verified` | `IMPLEMENTED_AND_TESTED` | Unverified email rejected. |
| Operator allowlist | `STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS`, optional email allowlist | `IMPLEMENTED_AND_TESTED` | Stable Google subject is required. |
| StaffordOS JWT signing | Cloud KMS Ed25519 signer | `IMPLEMENTED_AND_TESTED` | KMS signing proof passed in S007.01H. |
| JWT expiration | bounded assertion TTL | `IMPLEMENTED_AND_TESTED` | Expired assertion rejected in tests. |
| Cookie behavior | OAuth state cookie only | `PARTIAL` | No durable StaffordOS browser session cookie exists yet. |
| Public-key endpoint | `GET /public-key` | `IMPLEMENTED_AND_TESTED` | Returns KMS public key metadata, no secrets. |
| Health endpoint | `GET /health` | `IMPLEMENTED_AND_TESTED` | Local health route exists. |
| Logout behavior | issuer runtime | `MISSING` | Logout exists only in an unconnected verifier-side local worktree route. |
| Error handling | sanitized issuer errors | `IMPLEMENTED_AND_TESTED` | Returns stable error codes without details. |
| Local port assumption | `PORT`, default `8787` | `IMPLEMENTED_AND_TESTED` | Local proof fixtures use port `8787`. |

## OAuth Client Authority

Repository-backed non-secret authority:

- Google Cloud project: `staffordos-identity-prod`.
- Google Cloud project number: `109364024720`.
- OAuth branding and Web Application client were configured before S007.01H.
- The OAuth client secret was previously exposed outside this mission and must be treated as compromised before any issuer deployment.

Not repository-proven:

- Exact OAuth client display name.
- Exact OAuth client ID.
- Authorized JavaScript origins currently configured in Google Cloud Console.
- Authorized redirect URIs currently configured in Google Cloud Console.
- Consent-screen publication status.
- Test-user restrictions.
- Secret creation timestamps.
- Whether the project contains more than one candidate Web Application OAuth client.

Decision: the correct project is known, but the exact client authority is not fully proven from repository evidence alone. Ross must identify the exact Web Application OAuth client in Google Cloud Console before any rotation. If multiple candidates exist and cannot be distinguished by non-secret metadata, the next mission must stop before rotation.

## Redirect URI Authority

Source-backed callback path:

- `GET /auth/google/callback`

Source-backed local issuer port:

- default `PORT=8787`

Source-backed local proof fixture:

- `http://127.0.0.1:8787/auth/google/callback`

The issuer uses the explicit `GOOGLE_REDIRECT_URI` value in both the authorization request and token exchange. Google Cloud Console must contain an exact authorized redirect URI matching the runtime value.

Minimum local proof recommendation:

- use `http://127.0.0.1:8787/auth/google/callback` when `GOOGLE_REDIRECT_URI` is set to that exact value;
- do not add wildcard redirects;
- do not add LAN, tunnel, preview, or production redirects during local proof;
- do not add both `localhost` and `127.0.0.1` unless the runbook deliberately tests both exact values.

## Secret Consumer Inventory

| Consumer | Names | Status | Rotation impact |
| --- | --- | --- | --- |
| Local operator issuer runtime | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_ISSUER`, `GOOGLE_AUDIENCE`, `GOOGLE_TOKEN_ENDPOINT`, `GOOGLE_JWKS_URI`, `STAFFORDOS_OPERATOR_JWT_ISSUER`, `STAFFORDOS_OPERATOR_JWT_AUDIENCE`, `ISSUER_SESSION_SECRET`, allowlist names, role names, KMS names | Active local source | Must receive replacement client secret for browser proof. |
| Local issuer tests | Same conceptual names through synthetic config | Synthetic only | No real rotation required. |
| Local KMS proof script | OAuth and KMS env names with synthetic placeholders where OAuth is not used | Proof-only | No real OAuth token flow should run through this script. |
| Unconnected verifier worktree | `STAFFORDOS_OPERATOR_JWT_ISSUER`, `STAFFORDOS_OPERATOR_JWT_AUDIENCE`, `STAFFORDOS_OPERATOR_JWT_PUBLIC_KEY_PEM`, bootstrap names | Future verifier | Does not consume Google client secret. |
| G004.01 write isolation | `STAFFORDOS_LOCAL_OPERATOR_WRITES_ENABLED` | Active local gate | Unchanged by OAuth rotation. |
| Deployment providers | none proven for issuer deployment | Not deployed | Future deployment secret store must be configured only in a later deployment-authority mission. |
| Ignored local env files | key-only check of known `.env*` paths | No S007 key values printed | Local storage may be added later only in ignored local configuration. |

No duplicate Google OAuth secret-name consumer was proven. No `NEXT_PUBLIC_*` OAuth secret consumer was found in the scoped scan.

## Secret Storage Boundary

Local proof storage:

- Store the replacement secret only in an ignored local environment file for the local issuer, preferably `staffordos/operator-issuer/.env.local`, or in an equivalent local secret store if Ross already uses one.
- Root `.gitignore` already ignores `.env.local` and `.env.*.local`.
- Set restrictive permissions on the local secret file where practical.
- Verify variable presence by checking keys only; do not echo values.

Future deployment storage:

- Store deployment secrets only in the selected deployment provider's secret manager or environment configuration after deployment authority exists.
- Do not copy the local replacement secret into Render, Vercel, GitHub, Kubernetes, or any other provider during S007.01I.

Prohibited storage:

- Git, committed `.env`, architecture JSON, issue trackers, chat, screenshots, shell-history commands, command arguments visible in process lists, browser bookmarks, frontend environment variables, `NEXT_PUBLIC_*`, and client bundles.

## Rotation Strategy

Official Google Cloud Help currently documents that OAuth clients can have a second enabled secret during rotation, with a maximum of two client secrets, then the old secret can be disabled and later deleted after migration. This mission did not mutate Google Cloud. Source: `https://support.google.com/cloud/answer/15549257`.

Planned rotation:

1. Confirm the exact OAuth client in Google Cloud Console.
2. Confirm the exact authorized redirect URI.
3. Confirm the client has capacity for a replacement secret.
4. Add a replacement secret on the same OAuth client.
5. Store the replacement secret once in ignored local storage.
6. Restart only the local issuer.
7. Execute one controlled local browser proof.
8. Run S007 negative tests.
9. Confirm no write action became authorized from login alone.
10. Disable the old secret only after successful proof and rollback review.
11. Re-run proof after old-secret disablement if needed.
12. Delete the old secret only after a short, explicit rollback window.

Creating a new OAuth client is not the default path. It is only appropriate if the existing client cannot support same-client rotation, is compromised beyond secret rotation, or is mis-scoped beyond correction.

## Rollback Plan

Rollback triggers:

- replacement secret rejected;
- redirect mismatch;
- consent or invalid-client error;
- token exchange failure;
- callback failure;
- state or nonce mismatch;
- Google issuer or audience mismatch;
- unverified email;
- operator allowlist rejection;
- KMS signing failure;
- public-key mismatch;
- session or assertion handling failure;
- browser loop;
- unexpected scope request.

Rollback sequence:

1. Stop the local issuer.
2. Restore the previous local secret only if it remains enabled and safely retained.
3. Restart the issuer locally.
4. Confirm `GET /health`.
5. Preserve redacted error evidence.
6. Do not deploy.
7. Do not revoke a working prior secret until the replacement is proven.
8. If Google Console behavior prevents safe concurrent rollback, treat rotation as a scheduled cutover with Ross present.

## Real Browser Proof Contract

The next proof mission must:

1. Confirm G004.01 operator writes remain disabled.
2. Start the local issuer with the replacement secret.
3. Confirm `GET /health`.
4. Confirm `GET /public-key` and the expected KMS fingerprint.
5. Open `GET /login` in a real browser.
6. Authenticate with the authorized Ross Google account.
7. Observe callback success without exposing the authorization code.
8. Verify state, nonce, Google issuer, Google audience, verified email, operator allowlist, time validity, KMS signing, correct `kid`, and one StaffordOS operator assertion or future session.
9. Verify the browser lands on the intended local success destination.
10. Verify no Packet, merchant, payment, execution, Business, Job Search, or operator write action occurred.
11. Verify login alone does not authorize writes.
12. Confirm session or assertion metadata without printing tokens or cookies.
13. Confirm invalid-account behavior through synthetic or safe negative proof.

Google's OpenID Connect documentation treats `sub` as the stable Google Account identifier and requires verification of ID token issuer and audience. Source: `https://developers.google.com/identity/openid-connect/openid-connect`.

## Session Proof Requirements

Current issuer behavior:

- `staffordos_oauth_state` cookie exists for OAuth state only.
- The callback returns a StaffordOS operator assertion JSON.
- No durable browser session cookie is issued by the local issuer.
- No `/operator` or `/os` runtime consumes the assertion.
- Logout/invalidation is not implemented in the issuer service.

Future browser proof must document:

- cookie or assertion transport;
- HttpOnly behavior;
- Secure behavior for local HTTP versus future HTTPS;
- SameSite;
- Path;
- Max-Age or expiration;
- session ID;
- JWT expiration;
- rotation behavior;
- logout or invalidation;
- replay considerations;
- CSRF relationship;
- state and nonce lifetime;
- whether credentials are server-side only;
- whether frontend JavaScript can access credentials;
- whether any refresh mechanism exists.

Defects to carry forward:

- durable session storage is missing;
- verifier integration is not connected to operator frontend;
- replay protection beyond short JWT expiration and future `jti` handling is incomplete;
- logout is not issuer-integrated.

## JWT Claim and Trust Review

Current StaffordOS assertion claims:

- Identity facts: `sub`, `email`, `email_verified`, `provider`, `operator.external_subject`, `operator.email`, `operator.email_verified`, `operator.display_name`.
- Token facts: `iss`, `aud`, `iat`, `exp`, `jti`, `kid`, `session_id`.
- Authorization-like claims: `roles`, `permissions`.

Current limitations:

- Roles and permissions are static issuer configuration and are mainly ShopiFixer-specific.
- Roles and permissions can become stale without server-side membership lookup.
- No Merchant or Packet data belongs in the identity token, and the implementation avoids those fields.
- Future verifier must check signature, `kid`, issuer, audience, expiration, `jti`, subject, verified email, and operator allowlist before deriving any application context.

## Verifier Dependency Map

Detailed dependency mapping is in `S007_01I_VERIFIER_DEPENDENCY_MAP.md`.

Summary:

- Local JWT verification logic exists in unconnected worktree authority.
- Issuer allowlist and Google claim validation exist locally.
- Operator frontend session enforcement is missing.
- Workspace membership is missing.
- Capability permission mapping is partial and ShopiFixer-specific.
- Action-specific approval and durable audit remain missing.
- Browser proof must happen before verifier/session integration.

## G004.01 Integration Boundary

Current write control:

`explicit local write flag + proven loopback request`

Future local authenticated control:

`explicit local write flag + proven loopback request + valid StaffordOS session + workspace membership + capability permission + action-specific approval when required + audit`

Future deployed control:

`deployment policy + valid StaffordOS session + workspace membership + capability permission + action-specific approval when required + audit`

Browser login alone must not authorize writes.

## Job Search Impact

Allowed before browser proof:

- private opportunity intake;
- private career review outside UI;
- static Job Search contracts;
- synthetic requirement extraction;
- architecture;
- local private records outside UI;
- read-only public/static `/os` surfaces.

Blocked before browser proof and still blocked after browser proof alone:

- real private opportunity display in UI;
- private career record display in UI;
- application creation;
- resume mutation;
- application approval;
- submission;
- recruiter messages;
- external fetching requiring a private identity;
- My Job private records.

These remain blocked until verifier/session integration and server authorization exist.

## Rotation Readiness Decision

Decision: `BLOCKED_ON_CLIENT_AUTHORITY`

Reason:

- The Google Cloud project is known.
- The local redirect path and port are source-backed.
- Secret consumers and storage boundaries are inventoried.
- Google's current provider rotation behavior is documented from official Google Help.
- The exact OAuth client display name, client ID, configured redirect URIs, and client-secret slots are not proven from repository evidence.

This is a narrow blocker. The next mission should reconcile the OAuth client authority in Google Cloud Console using non-secret metadata, without rotating the secret.

## Validation

Required validation for this mission:

- OAuth implementation inventory consistency check: planned against source and this document.
- Client and redirect reference consistency check: planned against source and this document.
- Environment-name reference scan: planned against source and this document.
- Secret-value absence scan: planned against new S007.01I docs only.
- JWT-claim consistency check: planned against source and this document.
- G004.01 integration consistency check: planned against G004.01 docs and this document.
- Job Search blocked/allowed consistency check: planned against this document and JSON.
- Runbook/checklist consistency check: planned across S007.01I docs.
- JSON validation: planned for `S007_01I_OAUTH_SECRET_ROTATION_AND_BROWSER_PROOF_PLAN.json`.
- Diff checks: planned before and after staging.

## Files Created

- `staffordos/governance/S007_01I_OAUTH_SECRET_ROTATION_AND_BROWSER_PROOF_PLAN.md`
- `staffordos/governance/S007_01I_OAUTH_SECRET_ROTATION_AND_BROWSER_PROOF_PLAN.json`
- `staffordos/governance/S007_01I_OAUTH_ROTATION_OPERATOR_RUNBOOK.md`
- `staffordos/governance/S007_01I_BROWSER_PROOF_CHECKLIST.md`
- `staffordos/governance/S007_01I_VERIFIER_DEPENDENCY_MAP.md`

## Known Limitations

- Exact OAuth client authority is not repository-proven.
- No real browser proof has been executed.
- No secret was rotated.
- No issuer deployment exists.
- No operator frontend session integration exists.
- No workspace membership or permission runtime exists.
- No action-specific approval runtime exists.
- G004.01 remains an interim local write gate, not authentication or authorization.

## Rollback

Repository rollback:

```bash
git revert <S007.01I commit SHA>
```

Rollback affects documentation only. No OAuth client, secret, issuer runtime, verifier, operator frontend, private record, database, provider, deployment, or Google Cloud rollback should be required.

## Selected Next Mission

`S007_01I1_OAUTH_CLIENT_AUTHORITY_RECONCILIATION`

Reason: before Ross can safely rotate the client secret, StaffordOS must identify the exact OAuth client in Google Cloud Console by non-secret metadata and confirm the exact redirect URI set.
