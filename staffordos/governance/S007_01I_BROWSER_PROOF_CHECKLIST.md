# S007.01I Browser Proof Checklist

Date: 2026-08-03

Status: checklist for a later mission. Do not execute during S007.01I.

## Preconditions

- [ ] Correct OAuth client identified in Google Cloud Console by non-secret metadata.
- [ ] Exact local redirect URI confirmed in the Console.
- [ ] Replacement client secret created on the same OAuth client.
- [ ] Replacement secret stored only in ignored local storage.
- [ ] Old secret still enabled for rollback, if provider behavior allows.
- [ ] Local issuer source is unchanged from the certified checkpoint or differences are reviewed.
- [ ] G004.01 operator writes are disabled.
- [ ] No deployment or tunnel is active.
- [ ] No browser login flow has already been started for this proof.

## Local Issuer Checks

- [ ] Start local issuer from `staffordos/operator-issuer`.
- [ ] Confirm `GET /health`.
- [ ] Confirm `GET /public-key`.
- [ ] Confirm public-key fingerprint matches `495fb2767eab522482962b8746a2bf8369be4437f399a5cf022a2f4040ef5c54`.
- [ ] Confirm no secret, token, cookie, or authorization code appears in logs.

## Browser OAuth Flow

- [ ] Open local `GET /login`.
- [ ] Authenticate with Ross's authorized Google account.
- [ ] Confirm the authorization request uses only `openid email profile`.
- [ ] Confirm callback returns successfully.
- [ ] Do not print the authorization code.
- [ ] Do not print Google tokens.
- [ ] Do not print the StaffordOS assertion.
- [ ] Do not print cookies.

## Required Server-Side Validation Evidence

- [ ] OAuth state valid.
- [ ] Nonce valid.
- [ ] Google ID token signature valid.
- [ ] Google issuer valid.
- [ ] Google audience valid.
- [ ] Google subject present.
- [ ] Email present and verified.
- [ ] Operator subject allowlist accepted.
- [ ] Optional operator email allowlist accepted, when configured.
- [ ] Google token timestamps valid.
- [ ] StaffordOS assertion signed by Cloud KMS.
- [ ] StaffordOS assertion `kid` expected.
- [ ] StaffordOS assertion issuer expected.
- [ ] StaffordOS assertion audience expected.
- [ ] StaffordOS assertion expiration bounded.
- [ ] StaffordOS assertion contains no Merchant or Packet data.

## Session Evidence

- [ ] Current issuer behavior confirmed: assertion JSON only, no durable browser session cookie.
- [ ] If a later mission adds a session cookie, confirm HttpOnly, Secure behavior, SameSite, path, max age, expiration, and logout/invalidation.
- [ ] Confirm browser JavaScript cannot read credentials unless a later architecture explicitly permits a different design.
- [ ] Confirm no refresh-token storage is introduced without a separate authority.
- [ ] Confirm replay protection limitations are recorded.

## No-Write Evidence

- [ ] No Packet created.
- [ ] No merchant state changed.
- [ ] No payment changed.
- [ ] No execution triggered.
- [ ] No operator write gate weakened.
- [ ] No Job Search record connected to UI.
- [ ] No `/operator` or `/os` write becomes authorized from browser login alone.

## Negative Checks

- [ ] Invalid audience remains rejected by tests.
- [ ] Invalid issuer remains rejected by tests.
- [ ] Bad state remains rejected by tests.
- [ ] Bad nonce remains rejected by tests.
- [ ] Unverified email remains rejected by tests.
- [ ] Expired StaffordOS assertion remains rejected by tests.
- [ ] Tampered StaffordOS assertion remains rejected by tests.
- [ ] Denied operator or invalid-account behavior is proven safely without exposing another person's data.

## Proof Artifacts

Record only redacted or non-secret evidence:

- [ ] OAuth client non-secret identity.
- [ ] Redirect URI.
- [ ] Proof timestamp.
- [ ] Browser used.
- [ ] Authorized operator identity in redacted form.
- [ ] Callback success.
- [ ] State and nonce validation result.
- [ ] Audience and issuer validation result.
- [ ] Verified-email result.
- [ ] KMS signing result.
- [ ] Public-key fingerprint.
- [ ] Session or assertion result without token value.
- [ ] Negative-test result.
- [ ] Old-secret revocation status.
- [ ] No-write-effect evidence.
- [ ] Known limitations.

Never record:

- secret value;
- authorization code;
- ID token;
- access token;
- refresh token;
- StaffordOS assertion value;
- JWT;
- session cookie.
