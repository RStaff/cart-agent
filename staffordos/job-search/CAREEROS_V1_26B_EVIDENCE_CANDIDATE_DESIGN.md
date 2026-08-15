# CareerOS V1.26B Evidence Candidate Design

## Candidate authority

The runtime builds deterministic candidates from the existing private CareerFact and CareerEvidence stores. Candidate records contain references and sanitized metadata, not copied raw source content. Decisions are append-only private adjudication events.

Each candidate carries a stable candidate ID, source fact reference, capability family, direct/transferable status, verification, provenance, conflict state, eligibility state, reason, operator decision, and audit flags. The decision explicitly records `canonicalCareerFactMutated: false` and `canonicalCareerEvidenceCreated: false`.

## Operator actions

`CONFIRM`, `CORRECT`, `REJECT`, and `KEEP_UNRESOLVED` are distinct actions. `CORRECT` requires operator text and preserves the original fact. All actions require readback from the private append-only decision log before progress can count.

## Queue

The first bounded queue is 15 candidates from a deterministic 890-candidate review set. The remaining 8 facts with existing source-evidence linkage are excluded from adjudication. Priority is based on reusable capability family, existing source linkage, conflict/provenance state, and evidence semantics; it never uses self-confidence, interest, workflow, or aspiration.
