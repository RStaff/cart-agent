# CareerOS V1.26A Evidence Projection Design

## Shape

`CareerFact -> eligibility/provenance gate -> CareerEvidence candidate -> operator verification when required -> canonical CareerEvidence -> existing matcher`

This reuses the existing authorities; it is not a parallel profile or database.

## Projection classes

1. `DIRECT_VERIFIED`: verified source-backed fact, narrow claim, no conflict.
2. `TRANSFERABLE_REVIEW`: evidence-backed adjacent responsibility; never exact.
3. `PARTIAL_REVIEW`: some scope or source support exists; limitations required.
4. `UNRESOLVED_REVIEW`: conflict, unknown support, or missing provenance.
5. `SPECIALIST_BLOCKED`: generic evidence cannot satisfy a specialist requirement.

## Required safeguards

- Stable source lineage and reversible candidate ID.
- No source text copied into committed artifacts.
- No automatic projection for conflicting/proposed/unknown facts.
- No expansion of claim scope during normalization.
- No self-confidence, interest, workflow, title, or model inference inputs.
- Existing J010/J003/V2D authorities remain unchanged.
