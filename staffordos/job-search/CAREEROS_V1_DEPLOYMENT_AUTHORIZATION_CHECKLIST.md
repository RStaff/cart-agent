# CareerOS Deployment Authorization Checklist

- [ ] Approve `CAREEROS_RENDER_ISOLATED_STACK` and its provider plan.
- [ ] Approve a dedicated CareerOS PostgreSQL target; explicitly reject `cart_agent_db` reuse.
- [ ] Confirm database TLS, backups, retention, and restore-to-isolated-target procedure.
- [ ] Approve the customer origin and DNS/TLS owner.
- [ ] Approve provider secret storage and required environment values.
- [ ] Approve invite-only policy and synthetic pre-invite acceptance.
- [ ] Approve shared rate-limit backend and fail-closed behavior.
- [ ] Approve repository promotion, remote push, migration, and deployment consequences.
- [ ] Confirm rollback without destructive schema rollback.
- [ ] Confirm no real customer data or invitations occur during provisioning proof.

Until all applicable items are approved, the target is a design recommendation only.
