# CareerOS P0 Observability Privacy

Operational logs may contain request IDs, route names, status, timing, error classes, and tenant-safe opaque IDs. They must not contain passwords, session tokens, raw career text, resume contents, CareerEvidence payloads, filesystem paths, or database connection strings. Customer error responses remain generic and do not reveal cross-tenant record existence.
