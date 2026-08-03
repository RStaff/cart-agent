# S007.01I1 OAuth Client Operator Decision Brief

Date: 2026-08-03

## Decision

The authoritative Google OAuth client is:

- `StaffordOS Operator Issuer`
- Web application
- Project: `staffordos-identity-prod`
- Client ID, redacted: `109364024720-...q0i.apps.googleusercontent.com`

Decision code:

`CLIENT_REQUIRED_REDIRECT_MISSING`

## Why This Client Is Authoritative

Ross observed one StaffordOS-related Web application client in the correct Google Cloud project. Its display name, type, project, production-style callback/origin, creation date, and last-used metadata align with the StaffordOS Operator Issuer.

No competing StaffordOS OAuth client was observed.

## What Is Not Ready

Secret rotation is not ready.

The provider client does not currently include the repository-backed local callback:

`http://127.0.0.1:8787/auth/google/callback`

The app is External and in Testing, and Ross is not currently listed as a test user. That blocks the later local browser proof unless consent eligibility is corrected.

Two enabled secret rows already exist. A later mission must review slot handling before creating or replacing any secret.

## What Must Be Corrected Later

The next mission should plan these corrections:

1. Add the exact local callback URI.
2. Resolve External/Testing test-user eligibility for Ross.
3. Review the production-style redirect and JavaScript origin before deployment.
4. Review the two enabled secret rows and decide safe old-secret handling.
5. Define when ignored local issuer configuration may be created or updated.

No correction is authorized by this mission.

## What Ross Must Not Expose

Do not paste, screenshot, commit, or share:

- client secret values;
- masked secret endings;
- authorization codes;
- ID tokens;
- access tokens;
- refresh tokens;
- StaffordOS JWTs or assertions;
- cookies;
- private keys.

## Next Mission

`S007_01I2_OAUTH_CLIENT_CONFIGURATION_CORRECTION_PLAN`

Reason: the exact client is now identified, but non-secret configuration correction must be planned before secret rotation or browser proof.
