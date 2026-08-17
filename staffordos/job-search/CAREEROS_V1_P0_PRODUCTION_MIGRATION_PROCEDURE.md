# Production Migration Procedure

1. Confirm the target database, environment, backup/snapshot, migration owner, and maintenance window.
2. Validate production environment variables without printing values.
3. Run the contained CareerOS migration through the approved migration runner; do not use ad hoc SQL.
4. Verify CareerOS tables, foreign keys, uniqueness, indexes, and session/rate-limit rows.
5. Run the synthetic smoke flow against the target without real customer text.
6. Confirm logs contain no secrets or career text, then enable invite-only text intake.

Failure handling is restore-from-provider-snapshot or replacement of the target database followed by migration replay. No remote migration or rollback was performed in this mission.
