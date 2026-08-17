# CareerOS Provisioning Authority

The mission authorized `CAREEROS_RENDER_ISOLATED_STACK`, but Render CLI authentication was unavailable: `render whoami` returned `unauthorized`. No Render workspace, service, database, secret store, domain, or backup authority could therefore be verified.

Per mission rule, provisioning stopped before any external mutation. The exact blocker is `RENDER_PROVISIONING_ACCESS_BLOCKED`.
