# CareerOS P0 CSRF Audit

The customer runtime uses HTTP-only SameSite cookies. In production, every mutating CareerOS route also requires `Origin` to equal `CAREEROS_APP_ORIGIN`; missing or mismatched origin fails closed. Local development accepts same-process synthetic requests without an origin. A production deployment must retain same-origin frontend/API hosting or provide an explicitly approved CSRF token strategy.
