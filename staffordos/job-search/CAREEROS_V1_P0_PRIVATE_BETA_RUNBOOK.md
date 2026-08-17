# CareerOS Private-Beta Runbook

This runbook is not executable until Render access is restored and the isolated stack is provisioned.

1. Verify `careos-private-beta` and `careos-private-beta-db` identities.
2. Confirm database TLS, backups, retention, and restore authority.
3. Bind provider secrets without writing repository `.env` files.
4. Run the additive CareerOS migration only against the new database.
5. Deploy the customer runtime and verify HTTPS, origin, secure cookies, and invite-only mode.
6. Run synthetic invite, two-tenant isolation, session, text lifecycle, export, deletion, and privacy acceptance.
7. Review logs and backup proof before any external invitation.

No customer invitations are authorized by this mission.
