# CareerOS schema reconciliation and reviewed adoption

This is an operator-reviewed, one-shot procedure for the existing
`careos-private-beta` database. It is not part of normal startup and must not
be run against production without explicit approval.

The Render service uses the literal repository root
`staffordos/ui/operator-frontend/careeros-beta`; `careos-beta` is not a
repository or Render path. The service branch remains exactly
`careeros/private-beta`. This runbook supersedes any earlier stacked-PR or
`#134` merge instruction; no separate package merge is required.

## Preconditions

1. Verify a provider backup and a successful restore to a separate database.
2. Restore to a separate database and run
   `prepare-careeros-adoption-evidence.mjs` after reconciliation, supplying
   an independently generated clean-reference JSON via
   `CAREEROS_SCHEMA_REFERENCE_PATH`. It derives the executing source revision,
   adoption-critical source-file digests, full catalog fingerprint, and all
   eight SQL checksums from this checkout; no values are manually assembled.
   Generate that JSON by applying all eight reviewed migrations to a clean
   disposable database and serializing `readCareerOSSchema` through
   `referenceFingerprint`; the older v2 hashes that omitted
   `triggers`, `routines`, and `policies` are superseded and must not be reused.
3. Run `reconcile-careeros-story-status.mjs` with
   `CAREEROS_LEGACY_SCHEMA_FINGERPRINT`. This adds only the exact missing
   column from migration `20260817010000_add_career_story_status`.
4. Recompute the full post-reconciliation fingerprint. Do not continue if
   any catalog difference remains.
   Record the `careeros-schema-fingerprint-v2` format alongside the digest;
   the prior fingerprint format is historical evidence only.
5. Keep the service stopped or read-only while the adoption transaction runs;
   both utilities take the `careeros-migration-v1` transaction advisory lock
   and re-read the fingerprint while holding it.

## Adoption

Run `adopt-careeros-schema.mjs` with the generated evidence manifest and a
separately authenticated Ed25519 approval artifact. The approval must bind
the target database identity, source revision, post-correction fingerprint,
and all eight migration checksums; editable manifest fields alone are never
authority. It
atomically creates the normal ledger and
`CareerOSMigrationAdoption`, inserts all eight checksums, and records
`REVIEWED_SCHEMA_ADOPTION`. It rejects an existing ledger, adoption record,
unexpected tables, fingerprint mismatch or checksum mismatch.

The existing startup runner remains unchanged and will subsequently no-op
against the adopted ledger. It never performs automatic adoption.

The adoption transaction creates both ledger tables, inserts all eight
checksums, and inserts the durable `REVIEWED_SCHEMA_ADOPTION` record. Any
failure rolls back all of those writes together.

The generated manifest is not an approval. It must match the independent
reference across tables, columns, constraints, indexes, relations,
triggers, routines and policies. Supply the approval artifact via
`CAREEROS_ADOPTION_APPROVAL_PATH`; trusted Ed25519 public keys come from the
secure runtime source `CAREEROS_ADOPTION_TRUSTED_KEYS_JSON`. This is a
key-id-to-base64-SPKI map and must never be committed or logged. The verifier
compares live `current_database`, database user, schema, server address/port,
executing source revision, every adoption-critical source-file digest, clean
reference fingerprint, post-correction fingerprint and every checksum before
verifying the signature. Edited or replayed artifacts fail closed.

## Live-database preparation gate (required before merge)

This is a separate owner-approved step between successful restore rehearsal
and merging the migration-runner PR (#133). It is not performed by CI or
normal startup.

1. **Schema revalidation.** Freeze or coordinate every CareerOS writer,
   record the live database identifier and UTC time, and rerun the catalog
   fingerprint against the live database without selecting application rows.
   The fingerprint must match the restored rehearsal result. If it differs,
   stop and reconcile the difference separately.
2. **Backup freshness.** Confirm a new provider backup/export completed after
   the final schema revalidation and record its provider ID, UTC timestamp,
   restore point and retention window. Do not use an older rehearsal backup
   as the live recovery guarantee.
3. **Maintenance/write coordination.** Place the CareerOS service in its
   documented maintenance/read-only state, or stop all writers, and verify no
   migration/startup process is running. Keep the maintenance window open
   through correction, adoption, post-adoption runner verification and the
   first health probe.
   For the Render private-beta service (`srv-da16c39t0dsc73b434ig`), the
   concrete entry action is the service dashboard's **Suspend service** (or
   the owner-approved maintenance control); confirm public `/career/login`
   returns `503`. Suspend every other identified CareerOS writer/worker too:
   maintenance mode alone does not stop background writers. From a
   privileged metadata-only database connection, verify `pg_stat_activity`
   has no non-idle application writers and the active-job count is zero.
   Keep the window open and do not describe suspended routes as reachable.
4. **Recovery procedure.** If any check fails, stop the operation and restore
   the fresh backup to a separate recovery database. Validate its catalog
   fingerprint there, then obtain a new owner decision before any service
   connection change. Never delete ledger rows or restore in place as an
   unreviewed rollback.
5. **Approval record.** Ross records the live fingerprint, backup/export ID,
   maintenance window, source revision, generated eight-checksum manifest,
   reviewer identity and recovery target before authorizing the one-shot
   reconciliation/adoption commands.
6. **Deployment verification and exit.** After the approved merge, confirm
   Render reports this service at the exact merge SHA, predeploy/startup
   migration completed (the adopted ledger is a no-op), and `/health` is
   healthy. Probe only unauthenticated protected-route rejection until
   these checks pass. Resume the service from the dashboard only afterward,
   then verify `/career/login` and repeat the metadata-only writer/job checks.
   If deployment or health fails, leave traffic paused and restore the fresh
   recovery point to a separate target for diagnosis.

## Required release sequence

The only approved order is:

1. Complete the separate restore rehearsal and validate its catalog,
   backup/export evidence, correction, adoption, and normal-runner repeat.
2. Obtain approval for the live-database preparation gate, then perform the
   live schema revalidation, fresh-backup confirmation, maintenance/write
   coordination, correction and reviewed adoption.
3. Merge PR #133 into `careeros/private-beta`; do not merge this package or
   #133 before the live gate is approved.
4. Verify Render's automatic deployment: exact merge revision, startup
   migration result/no-op ledger validation, service health, and protected
   route behavior.

Merge remains blocked until steps 1 and 2 are complete. #133 supplies the
normal runner; this package supplies the explicit reviewed correction/adoption
procedure and must not be treated as an automatic dependency of startup.

The provider recovery mechanism is Render Postgres Recovery/PITR and logical
exports. Recovery creates a new database instance; it does not overwrite the
source. A logical export can be downloaded from the database Recovery page
and restored only into an empty target with the matching PostgreSQL client
tools. Confirm workspace access, recovery-window availability and any new
database cost before starting either operation.

## Recovery

Keep the original database unchanged until the restored copy and adoption
verification succeed. On failure, discard the separate target and restore
the verified backup to a separately approved target; do not delete ledger
rows or perform an in-place rollback.
