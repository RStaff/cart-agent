# CareerOS Database Target Decision

CareerOS requires a dedicated managed PostgreSQL database or at minimum a dedicated logical database with separately owned migration authority. The existing `cart_agent_db` is an Abando/shared product boundary and is explicitly excluded.

Preferred target: a dedicated managed PostgreSQL service attached to the isolated Render CareerOS service, with TLS, automated backups, retention, restore-to-isolated-target support, Prisma compatibility, and connection limits appropriate for a Next.js Node runtime.

Fallback: Cloud SQL PostgreSQL attached to Cloud Run after GCP authority is confirmed.

The database is not created, accessed, migrated, or authorized by this mission. Approval must identify the database owner, backup owner, migration executor, environment, and rollback/restore procedure.
