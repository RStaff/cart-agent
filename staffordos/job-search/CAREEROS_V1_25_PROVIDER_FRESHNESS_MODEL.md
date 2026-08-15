# CareerOS V1.25 Provider-Neutral Freshness Model

## Timestamps

Every observation should preserve:

- `sourcePublishedAt`: provider-declared publication time
- `sourceUpdatedAt`: provider-declared update time, if present
- `retrievedAt`: time CareerOS retrieved the observation
- `lastObservedAt`: latest successful observation of the same source identity
- `sourceClosedAt`: explicit closure/removal observation, if available

## State

`OPEN_CONFIRMED`, `OPEN_LAST_OBSERVED`, `CLOSED_CONFIRMED`, `REMOVED_OBSERVED`, `STALE_UNCONFIRMED`, and `UNKNOWN`.

An aggregator observation can refresh `lastObservedAt`, but cannot override a direct source's closure. Absence from one retrieval is not proof of closure unless the provider contract says the feed is complete and authoritative for active postings.

## Freshness Policy

Freshness is source-specific and must be configured from provider documentation or agreement. Do not use one global TTL as a truth claim. The UI should show source and observation age, not imply that an unobserved posting remains open.
