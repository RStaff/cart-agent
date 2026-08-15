# CareerOS V1.25C Provider Risk Analysis

| Risk | Exposure | Mitigation |
|---|---|---|
| Single-provider outage | High with Greenhouse-only | Hybrid sources plus user-directed fallback |
| Price increase | Medium-high for licensed APIs | Contract caps, observation budgets, provider-neutral adapters |
| Partner revocation | Medium-high for ATS/LinkedIn | Preserve source roles and graceful source retirement |
| Duplicate republication | High for aggregators | Multi-signal dedup and observation retention |
| Stale postings | Medium-high | Source-specific freshness and explicit removal states |
| Raw content rights | High | Contract fields for retention/display/derived-analysis rights |
| Rate limits | Medium | Backoff, bounded refresh, per-provider quotas |
| Coverage gaps | Medium | Multi-mode product and user-supplied source |
| API schema drift | Medium | Contract tests and provider version snapshots |

The largest risk is not API availability; it is assuming public technical access grants ongoing commercial data rights.
