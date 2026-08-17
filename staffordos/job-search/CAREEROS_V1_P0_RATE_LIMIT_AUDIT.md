# CareerOS P0 Rate Limit Audit

Signup and login use a bounded in-memory limiter only in development. Production uses the tenant-independent `CareerRateLimitBucket` PostgreSQL table with row-locked window updates, so process-local memory is never represented as multi-instance protection.

Required production limits cover signup and login. Recovery is not implemented and remains a pre-public-beta requirement. No credentials or limiter configuration is committed.
