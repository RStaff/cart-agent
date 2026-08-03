# S007.01I Verifier Dependency Map

Date: 2026-08-03

Status: planning only. No verifier or session integration is implemented by S007.01I.

## Dependency Classifications

| Dependency | Classification | Evidence | Required next step |
| --- | --- | --- | --- |
| Verifier library or middleware | `PARTIAL` | Local unconnected verifier code exists in `web/src/lib/staffordosOperatorAuthority.js`. | Decide the first integration surface after browser proof. |
| Issuer allowlist | `EXISTS_LOCAL` | Local issuer requires `STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS` and optionally `STAFFORDOS_OPERATOR_ALLOWED_EMAILS`. | Preserve stable-subject authority in browser proof. |
| Google audience verification | `EXISTS_LOCAL` | Local issuer rejects invalid Google audience in tests. | Prove with real browser flow after rotation. |
| StaffordOS audience verification | `PARTIAL` | Local verifier checks StaffordOS assertion audience, but is not connected to operator frontend. | Connect only after browser proof and session architecture. |
| Signature verification | `PARTIAL` | Local verifier can verify EdDSA assertions with configured public key. | Define public-key distribution or JWKS-like authority. |
| Expiration check | `EXISTS_LOCAL` | Issuer and verifier reject expired assertions. | Preserve in future middleware. |
| `jti` check | `PARTIAL` | Assertion contains `jti`; future replay/session persistence is not complete. | Add replay/session policy with persistence. |
| Session extraction | `PARTIAL` | Verifier can consume bearer assertions; issuer does not issue durable session cookie. | Design browser session extraction. |
| User identity context | `PARTIAL` | Verifier can project operator context when provisioned. | Connect to operator frontend only after session proof. |
| Workspace membership lookup | `MISSING` | No StaffordOS-wide workspace membership runtime is connected. | Add membership authority before multi-workspace writes. |
| Capability permission lookup | `PARTIAL` | Current roles and permissions are ShopiFixer-specific. | Extend to workspace and capability-scoped permissions. |
| Action-specific approval | `MISSING` | G004.01 is a local write gate, not approval. | Add approval records for high-impact actions. |
| Audit context | `PARTIAL` | Some local verifier functions create events; operator frontend writes are not integrated. | Add request IDs and audit policy during write integration. |
| Failure responses | `PARTIAL` | Verifier has sanitized error helpers; frontend behavior is not connected. | Define consistent operator-facing auth failures. |
| Logout and invalidation | `PARTIAL` | Web route has unconnected logout; issuer lacks durable session invalidation. | Add logout/session invalidation after browser proof. |
| Deployment readiness | `BLOCKED_ON_DEPLOYMENT` | No issuer deployment has occurred. | Do not deploy until OAuth rotation, browser proof, and verifier plan are complete. |
| Browser proof | `BLOCKED_ON_BROWSER_PROOF` | S007.01H used synthetic and KMS proof only. | Run S007.01J or client-authority reconciliation first, depending on readiness. |

## First Local Integration Prerequisites

Before operator writes can use S007 identity locally:

1. Complete OAuth client authority reconciliation.
2. Rotate the OAuth client secret under operator control.
3. Complete one real local browser proof.
4. Define session transport without exposing assertions to browser JavaScript unnecessarily.
5. Connect verifier/session checks server-side.
6. Preserve the G004.01 local write gate.
7. Add workspace and capability permission context for each protected write surface.
8. Add action-specific approval for high-impact writes.
9. Add audit context and request IDs.

## Target Control Stack

Local authenticated operation:

`explicit local write flag + proven loopback + valid StaffordOS session + workspace membership + capability permission + action-specific approval when required + audit`

Deployed operation:

`deployment policy + valid StaffordOS session + workspace membership + capability permission + action-specific approval when required + audit`

Browser login alone is not sufficient authority for any write.
