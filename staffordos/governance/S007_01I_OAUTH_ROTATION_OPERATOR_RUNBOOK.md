# S007.01I OAuth Rotation Operator Runbook

Date: 2026-08-03

Status: planning only. Do not execute during S007.01I.

This runbook is for a later operator-controlled rotation mission. It uses placeholders for secrets and must not be copied with real secret values into Git, chat, screenshots, or command history.

## A. Before Opening Google Cloud

1. Confirm repository HEAD matches the expected rotation mission checkpoint.
2. Confirm the intended worktree scope is clean for the rotation mission.
3. Confirm the local issuer is stopped.
4. Confirm no operator frontend write path is enabled unless the later mission explicitly requires local writes; browser proof should not require writes.
5. Confirm no OAuth secret is visible in shell history, clipboard managers, screenshots, or notes where avoidable.
6. Confirm Ross is signed into the authorized Google account for Google Cloud Console access.
7. Confirm the Google Cloud project is `staffordos-identity-prod`.
8. Confirm the expected OAuth client type is Web Application.
9. Confirm the source-backed local callback path is `/auth/google/callback`.
10. Confirm the local proof redirect URI intended for this run, usually `http://127.0.0.1:8787/auth/google/callback`.
11. Confirm no wildcard, tunnel, LAN, preview, or production redirect will be added for local proof.

## B. Google Cloud Console

1. Open Google Cloud Console manually.
2. Select project `staffordos-identity-prod`.
3. Navigate to Google Auth Platform Clients.
4. Locate the existing Web Application OAuth client using non-secret metadata:
   - project;
   - client type;
   - application name;
   - configured redirect URI;
   - configured JavaScript origin, if any;
   - creation metadata visible in the Console.
5. If multiple candidate clients exist and the correct one cannot be distinguished, stop and run `S007_01I1_OAUTH_CLIENT_AUTHORITY_RECONCILIATION`.
6. Verify the redirect URI exactly matches the intended local proof value.
7. Do not add wildcard redirects.
8. Do not add broad production domains.
9. Confirm the client has fewer than two enabled client secrets.
10. If Google Console no longer supports the documented two-secret rotation behavior, stop and record provider behavior as a blocker.
11. Add a replacement secret on the same OAuth client.
12. Do not disable or delete the old secret yet.
13. Copy the replacement secret exactly once into approved local storage.
14. Clear clipboard afterward where practical.

## C. Local Configuration

1. Store the replacement secret in ignored local configuration, preferably `staffordos/operator-issuer/.env.local`, or an equivalent local secret store Ross approves.
2. Do not store the secret in Git, architecture JSON, issue trackers, chat, screenshots, or frontend configuration.
3. Do not use `NEXT_PUBLIC_*`.
4. Set restrictive local file permissions where practical.
5. Verify the required environment variable names are present without printing their values.
6. Required local issuer names include:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `GOOGLE_ISSUER`
   - `GOOGLE_AUDIENCE`
   - `STAFFORDOS_OPERATOR_JWT_ISSUER`
   - `STAFFORDOS_OPERATOR_JWT_AUDIENCE`
   - `ISSUER_SESSION_SECRET`
   - `STAFFORDOS_OPERATOR_ALLOWED_SUBJECTS`
   - `KMS_PROJECT`
   - `KMS_LOCATION`
   - `KMS_KEY_RING`
   - `KMS_KEY`
7. Start the issuer from `staffordos/operator-issuer` only for local proof.
8. Do not deploy the issuer.

## D. Browser Proof

1. Confirm operator writes remain disabled under G004.01.
2. Confirm `GET /health` succeeds locally.
3. Confirm `GET /public-key` returns the expected KMS public-key fingerprint.
4. Open `GET /login` in a real browser.
5. Authenticate using the authorized Ross Google account.
6. Do not copy or print the authorization code.
7. Verify callback success.
8. Verify server-side evidence for:
   - state validation;
   - nonce validation;
   - Google issuer validation;
   - Google audience validation;
   - verified email;
   - operator allowlist acceptance;
   - token time validity;
   - KMS signing;
   - expected `kid`;
   - StaffordOS assertion or future session issuance.
9. Confirm the browser lands on the intended local success destination.
10. Confirm no Packet, merchant, payment, execution, Business, Job Search, or operator write action occurred.
11. Confirm browser login alone does not authorize writes.
12. Confirm negative behavior through synthetic or safe proof without exposing another person's data.

## E. Cutover Decision

1. If browser proof passes, record redacted proof evidence.
2. Disable the old client secret only after Ross reviews the proof result.
3. Re-run the browser proof if old-secret disablement could change behavior.
4. Delete the old secret only after the agreed rollback window expires.
5. Stop the local issuer.
6. Do not deploy as part of this rotation proof unless a later deployment mission explicitly authorizes it.

## F. Rollback

1. If the new secret fails, stop the local issuer.
2. Restore the prior local secret only if it remains enabled and safely retained.
3. Restart the issuer locally.
4. Confirm `GET /health`.
5. Record failure evidence without token or secret values.
6. Do not deploy.
7. Do not revoke a working prior secret until replacement proof passes.
8. If provider behavior prevents safe concurrent rollback, treat rotation as a scheduled cutover with Ross present.
