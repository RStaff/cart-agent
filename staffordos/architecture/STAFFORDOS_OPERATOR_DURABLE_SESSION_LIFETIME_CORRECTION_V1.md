# StaffordOS operator durable-session lifetime correction v1

Status: focused local review patch; issuer policy unchanged.

The operator issuer continues to issue short-lived, signed assertions and
one-time browser-bound handoffs. The frontend verifies the assertion before
creating a durable `StaffordosOperatorSession`. The durable session expires at
the configured bounded frontend TTL (maximum 28,800 seconds), independently of
the assertion's `exp` claim. The session cookie `Max-Age` matches that durable
expiry.

Every protected request still checks the durable session expiry, revocation,
operator status, and active durable roles/permissions. Logout and administrative
revocation therefore fail closed immediately. Issuer-side role changes are not
retroactively synchronized into existing sessions; they require a new
issuer handoff unless a separately approved propagation policy is added.

No issuer assertion TTL, signature algorithm, issuer/audience checks, browser
binding, one-time handoff, cookie scope, or production configuration changes
are included.

QA must use a separate browser profile or cookie jar for 3211 because host-only
cookies are not partitioned by port; 3210 and 3211 must not share a browser
profile during a session test.
