# CareerOS V1.25C Provider Economics

Exact commercial pricing is unavailable for most serious sources and is marked `PRICING_REQUIRES_QUOTE` rather than invented.

## Known/Published Signals

- **Adzuna:** 14-day commercial validation trial; default API limits 25/minute, 250/day, 1,000/week, 2,500/month. Ongoing commercial use requires written consent/license and higher-volume pricing discussion.
- **The Muse:** 500 requests/hour unregistered; 3,600/hour with registered API key. Public API terms are restrictive and do not imply unrestricted data resale.
- **TheirStack:** Free tier limits are documented; paid tier is rate-limited at 4 requests/second, with datasets and API credits available. Exact commercial plan cost requires account/quote.
- **Lightcast:** Enterprise/OAuth licensed access; pricing requires quote.
- **USAJOBS:** API key request process; no public charge identified, but federal-only coverage.
- **Jooble:** Publisher tools are described as free; commercial partner/API economics require contact.

## Scenario Economics

No user count alone determines data cost. Use observation volume:

`monthly_observations = active_users * refreshes_per_user * jobs_per_refresh`

For 10, 100, and 1,000 users, the engineering recommendation is:

- 10 users: start with user-directed sources plus Greenhouse; add only a low-quota licensed pilot.
- 100 users: price one licensed aggregator contract and cache only within permitted retention windows.
- 1,000 users: require enterprise SLA, deletion events, rate-limit headroom, and a second source to avoid outage dependence.

No monthly dollar estimate is asserted without provider quotes and a defined refresh policy.
