# CareerOS V1.24A1 Holdout Identity Integrity Report

## Decision

**CAREEROS_V1_24A1_NO_DUPLICATE_PROVEN**

The current holdout contains 40 unique canonical opportunity IDs, 40 unique
source-record IDs, and 40 unique queue IDs. No calibration/holdout identity
overlap or review identity defect was found. No manifest or private review
authority mutation was performed.

## Authority and preservation snapshot

- Starting HEAD: `33008bf8`
- Holdout manifest: 40 rows
- Persisted holdout reviews: 29
- Calibration reviews: 40
- Holdout review IDs: `H24-001` through `H24-029`
- Holdout review snapshot SHA-256: `7fcaa3d4896bf2bdc5f6c7ce05397fb5b1b4979453b5660b52551438270a36cb`
- Manifest identity snapshot SHA-256: `67259e3209e64d39d49c6bc52c7959a0808512225cae6f4ffed974a07b6749e7`

The snapshot hashes cover the review values and manifest identity fields used
for this audit. No review values were changed.

## Duplicate audit

| Check | Result |
| --- | --- |
| Exact holdout ID duplicate | 0 |
| Exact canonical opportunity duplicate | 0 |
| Exact source-record duplicate | 0 |
| Exact queue-item duplicate | 0 |
| Exact normalized company/role groups | 1 candidate group |
| Calibration/holdout canonical-ID overlap | 0 |
| Calibration/holdout normalized company/role overlap | 0 |

The one normalized company/role candidate is Braze, `Applied AI Architect,
G&A`, at H24-002, H24-003, and H24-004. Source authority distinguishes these
as three provider jobs with different provider job IDs and locations: New York
City, Austin, and Chicago. They are therefore distinct opportunities, not a
proven duplicate. Their three persisted reviews remain attached to their exact
H24 identities.

The canonical 253-record universe contains other normalized company/role
candidate groups. These are source-level duplicate candidates, not proof that
the selected holdout rows are the same real job. No fuzzy merge was performed.

Near-duplicate candidate: Airtable `Senior Solutions Architect` and `Senior
Solutions Architect- West Coast`. Their source identities differ and the title
explicitly carries a regional distinction; this is not proven duplicate.

## Opportunity 30 trace

Holdout position 30 is `H24-030`, Anthropic, `Data Science, Finance & Strategy`.
It maps to exactly one canonical opportunity and exactly one source record in
the current J003 universe. The source authority has one provider job identity,
one requisition, and one source URL for that role.

No other holdout position contains that canonical ID, source ID, or normalized
company/role. The calibration set also contains no equivalent record.

The role appears in approximately 43 historical private workflow/recommendation
artifacts from earlier daily-search runs. That explains why it can feel
repeated, but those historical artifacts are not additional holdout rows and
do not affect the calibration route's index mapping.

## Review identity audit

All 29 persisted H24 reviews resolve to a current manifest row. There are:

- 0 orphan reviews
- 0 invalid H24 IDs
- 0 duplicate persisted reviews for one H24 identity
- 0 index-shifted or misattached reviews proven
- 0 reviews requiring operator confirmation

The route persists by H24 sample ID, not by navigation index. The manifest
order maps position 30 deterministically to H24-030, and Previous/Next only
changes the selected manifest index.

## Progress reconciliation

- Distinct holdout opportunities: 40
- Valid preserved reviews: 29
- Operator confirmation required: 0
- Remaining reviews: 11
- Correct resume progress: **29 / 40**
- Next missing record: **H24-030**, position 30

No progress change is justified.

## Repair result

No replacement was selected because no duplicate was proven. No labels were
deleted, recreated, moved, or reinterpreted. V2D, J002, J003, J010, workflow
state, CareerFact, and CareerEvidence were not modified.

## Runtime limitation

The managed environment did not expose a reachable local browser/HTTP runtime
during this audit. Repository and private-authority readback, route identity
inspection, and focused integrity tests were performed. Browser navigation
acceptance remains a runtime limitation.

## Resume decision

The dataset is identity-safe at canonical/provider identity level. Ross may
resume at H24-030 / 29 of 40. The Braze same-title rows remain visibly distinct
only when source location/provider identity is shown; exposing those fields in
the review surface is a follow-up usability improvement, not an identity
repair.
