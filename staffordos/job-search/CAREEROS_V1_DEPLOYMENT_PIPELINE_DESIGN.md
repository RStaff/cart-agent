# CareerOS Deployment Pipeline Design

## Future governed flow

1. Operator approves provider, isolated service, database, origin, expected cost, backup policy, and remote-push consequence.
2. A validated local commit is promoted through the approved repository path.
3. Provider build runs the CareerOS runtime only.
4. A controlled migration job verifies target identity and applies the additive migration.
5. Health check verifies startup, database connectivity, and environment mode.
6. Synthetic invite, session, tenant-isolation, text lifecycle, export, and deletion smoke acceptance runs.
7. Operator reviews the result before any invite is issued.

No deployment path for CareerOS currently exists. Existing workflows target Abando/static web or generic repository checks and cannot be treated as a CareerOS deployment pipeline.

## Rollback

Stop traffic or revert the application to the last known image. Do not roll back schema destructively. Restore the database only through the approved provider restore procedure after target identity and backup state are confirmed.
