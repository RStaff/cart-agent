# CareerOS Secret Authority

Production secrets must be owned by the selected provider's approved secret/environment facility, never by a developer `.env` file or committed artifact.

Required values: `DATABASE_URL`, `CAREEROS_APP_ORIGIN`, `CAREEROS_SESSION_PEPPER`, invite-only mode, and shared rate-limit database configuration. Future mail secrets remain unconfigured until recovery/verification is separately approved.

The preferred design is a dedicated CareerOS secret namespace bound only to the isolated application and migration job. Startup must fail closed when production-required values are missing or development defaults are detected. No secret was created or accessed in this mission.
