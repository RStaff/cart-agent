# CareerOS P0 Intake Privacy Audit

Synthetic text only was used in tests. Candidate responses expose bounded statements and source excerpts only to the authenticated tenant owner. Raw text is not logged by the intake service, included in error responses, or written to Git artifacts.

The local adapter may persist pasted text only for local/synthetic operation. Binary documents are rejected until secure object storage and retention/deletion controls are available. Production identity hardening, audit logging, export, deletion, and rate limits remain required before external customer data.
