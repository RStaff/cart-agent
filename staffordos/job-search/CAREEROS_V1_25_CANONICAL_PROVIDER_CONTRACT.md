# CareerOS V1.25 Canonical Provider Contract

The existing `RawJobSourceInput` / `NormalizedJobSourceRecord` contract is the correct extension point. A new provider must adapt into one canonical record and must not create provider-specific matching truth.

## Canonical Fields

| Field | Authority rule |
|---|---|
| provider | Stable provider enum/name |
| providerJobId | Provider-native stable ID; required for API-backed providers where available |
| sourceUrl | Canonical public posting URL, not an application-only redirect when avoidable |
| company/title | Provider source values, normalized only for display/dedup keys |
| location/workArrangement | Explicit provider values; unknown remains unknown |
| employmentType/compensation | Preserve source values; never invent missing values |
| publishedAt/updatedAt | Source-explicit timestamps with authority markers |
| normalizedText | Backward-compatible plain text |
| rawSourceContent/contentType | Private source evidence only; HTML never rendered directly |
| sourceStructure | Ordered source blocks, headings, list items, parser version |
| sourceDigest | Digest of the preserved source payload |
| retrievedAt/lastObservedAt | Retrieval observation timestamps |
| freshness/state | Provider-neutral freshness state plus source observation state |
| provenance | Provider, endpoint/feed, auth mode, terms basis, retrieval run |
| providerConfidence | Confidence in source completeness/identity, not fit |

## Required Invariants

1. Provider adapters are read-only and preserve source provenance.
2. Missing fields remain null/unknown.
3. Raw HTML is private and parsed before consumption.
4. Structured data and normalized text must round-trip deterministically.
5. A provider cannot mutate CareerFact, CareerEvidence, J002, J003, J010, or ranking.
6. Every source observation can be superseded without deleting historical provenance.

## Proposed Additive Metadata

Future providers should add only additive fields already implied by the contract: `contentType`, `rawSourceDigest`, `sourceStructure`, `sourcePublishedAt`, `sourceUpdatedAt`, `lastObservedAt`, `observationState`, `accessBasis`, and `providerConfidence`.
