# S007.01I1 OAuth Client Candidate Register

Date: 2026-08-03

Status: redacted provider-observation register. No secret value, masked secret ending, token, cookie, JWT, private key, or screenshot is included.

## Candidate Summary

| Candidate ID | Display name | Type | Project | Disposition |
| --- | --- | --- | --- | --- |
| `S007-01I1-GOOGLE-OAUTH-CLIENT-001` | `StaffordOS Operator Issuer` | Web application | `staffordos-identity-prod` | `AUTHORITATIVE_STAFFORDOS_CLIENT` |

## Candidate S007-01I1-GOOGLE-OAUTH-CLIENT-001

Observed provider metadata:

- Display name: `StaffordOS Operator Issuer`
- Client type: Web application
- Project: `staffordos-identity-prod`
- Client ID, redacted: `109364024720-...q0i.apps.googleusercontent.com`
- Creation date: July 30, 2026
- Last used date: July 30, 2026
- Last-used limitation: provider UI says data may be delayed by a day or more

Provider redirect URIs:

- `https://staffordos-operator.staffordmedia.ai/auth/google/callback`

Provider JavaScript origins:

- `https://staffordos-operator.staffordmedia.ai`

Repository comparison:

- Project matches repository authority.
- Client type matches required Web application type.
- Display name matches StaffordOS issuer purpose.
- Production-style callback matches earlier planned deployment architecture.
- Required local callback `http://127.0.0.1:8787/auth/google/callback` is missing.
- Local issuer env file is absent, so provider client ID could not be compared to local `GOOGLE_CLIENT_ID`.

Secret-slot metadata:

- Enabled secret rows: 2
- Creation timestamps:
  - `2026-07-30T19:50:41-04:00`
  - `2026-07-30T19:55:52-04:00`
- Secret values recorded: no
- Masked secret endings recorded: no

Consent context:

- Publishing status: Testing
- User type: External
- Ross listed as test user: no

Confidence:

- `HIGH_WITH_REQUIRED_CONFIGURATION_CORRECTIONS`

Disposition:

- `AUTHORITATIVE_STAFFORDOS_CLIENT`

Reason:

Only one StaffordOS-related Web application client was observed in the provider project, and its display name, project, type, production-style redirect, origin, and usage metadata align with StaffordOS Operator Issuer authority. It is not ready for rotation or local browser proof because required local callback and consent eligibility are not configured.

## Duplicate And Legacy Result

Classification: `NO_DUPLICATE_STAFFORDOS_CLIENT_OBSERVED`

No duplicate, legacy, or competing StaffordOS OAuth Web application client was reported from the provider observation.

No client was deleted, renamed, edited, disabled, or rotated.
