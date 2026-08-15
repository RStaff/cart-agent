# CareerOS V1.25 Cross-Provider Deduplication Design

Deduplication is an identity-resolution decision, not a string-match deletion.

## Identity Evidence

Use these signals in descending authority:

1. Same provider plus provider job ID.
2. Same canonical employer posting URL.
3. Same requisition ID with the same employer.
4. Same employer plus normalized title plus compatible location plus strong description fingerprint.
5. Same employer plus title/location/date with structured-content similarity.

Company/title similarity alone is only a candidate duplicate. A fuzzy match must never erase a distinct opening.

## Canonical Record Model

Maintain one canonical opportunity identity with a collection of source observations:

```text
canonicalOpportunityId
  observations[]
    provider
    providerJobId
    sourceUrl
    sourceDigest
    firstObservedAt
    lastObservedAt
    state
    sourcePriority
```

The canonical opportunity owns the deduplicated presentation. All source URLs, IDs, timestamps, and digests remain auditable.

## Resolution States

- `UNIQUE`
- `PROBABLE_DUPLICATE_REVIEW_REQUIRED`
- `CONFIRMED_DUPLICATE`
- `CONFLICTING_SOURCE_OBSERVATIONS`
- `SEPARATE_OPENINGS`

When two providers disagree on title, location, or description, preserve both observations and require deterministic conflict rules or operator review. Do not merge solely to improve coverage.

## Description Fingerprints

Use normalized structure-aware fingerprints only as corroboration. Keep both raw-source digests because republished content can legitimately differ by provider, locale, or update time.
