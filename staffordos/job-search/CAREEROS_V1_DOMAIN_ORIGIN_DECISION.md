# CareerOS Domain and Origin Decision

No CareerOS customer origin or DNS authority is proven in the repository. Existing `abando.ai`, `pay.abando.ai`, and Render service URLs belong to other product surfaces and must not be reused.

Candidate origin for operator approval: `careeros.staffordmediaconsulting.com`. This is only a candidate; domain ownership, DNS control, certificate issuance, and product approval must be confirmed before configuration.

Required proof: HTTPS/TLS, exact `APP_ORIGIN`, secure cookie behavior, same-origin mutation checks, and no customer session path over HTTP. No DNS or TLS change was made.
