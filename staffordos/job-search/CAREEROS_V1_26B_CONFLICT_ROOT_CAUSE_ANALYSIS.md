# CareerOS V1.26B Conflict Root-Cause Analysis

## Scope

This is a private-runtime aggregate of the governed CareerFact/CareerEvidence loaders. No private record identifiers, paths, statements, or source payloads are committed.

## Current inventory

- CareerFacts loaded: 898
- CareerEvidence loaded: 21
- Verification status: 822 `CONFLICTING`, 67 `PROPOSED`, 5 `VERIFIED`, 3 `PARTIALLY_SUPPORTED`, 1 `HISTORICAL_ONLY`
- Facts with linked source-evidence references: 8
- Existing CareerEvidence support links: 901

## Conflict categories

The classification is diagnostic only. It does not rewrite or resolve a fact.

| Category | Count | Interpretation |
| --- | ---: | --- |
| `UNRESOLVED_VERIFICATION` | 705 | Conflict status exists without a narrower authoritative conflict type. |
| `INFERENCE_VS_SOURCE_CONFLICT` | 96 | Generated or inferred wording is not treated as equivalent to source authority. |
| `TEMPORAL_VERSION_CONFLICT` | 42 | Current, historical, or date-sensitive claims require source chronology review. |
| `OTHER` | 55 | Conflict metadata is insufficient for deterministic resolution. |
| `NORMALIZATION_CONFLICT` | 0 | No current aggregate evidence supports automatic normalization resolution. |
| `SOURCE_VALUE_DISAGREEMENT` | 0 | No explicit source-value conflict type was present in the loaded shape. |

## Resolution boundary

Zero facts are automatically resolved by this mission. A normalized representation may be identified later, but factual meaning is preserved until operator adjudication. The 890 non-projected facts remain reviewable or blocked according to the projection eligibility contract.

The queue prioritizes reusable, evidence-linked, conflict-sensitive capability families. It does not use self-confidence, interest, workflow state, ambition, or job titles as evidence.
