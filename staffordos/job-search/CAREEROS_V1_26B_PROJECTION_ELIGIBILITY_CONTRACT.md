# CareerOS V1.26B Projection Eligibility Contract

## Purpose

This contract gates private evidence adjudication. It does not create CareerFacts or CareerEvidence.

## States

- `AUTO_PROJECTABLE`: only a verified, conflict-free, narrow fact with authoritative linked evidence and no semantic expansion. Current acceptance uses a reversible fixture; no broad auto-projection ran.
- `OPERATOR_REVIEW_REQUIRED`: transferable, scope-sensitive, proposed, metric-bearing, or semantically ambiguous authority.
- `INSUFFICIENT_PROVENANCE`: no linked authoritative source evidence is available.
- `CONFLICT_BLOCKED`: a substantive conflict remains visible.
- `UNSUPPORTED`: the source fact is rejected or otherwise cannot support a candidate.
- `ALREADY_PROJECTED`: an existing source-evidence linkage is present; it is not added to the review queue.

## Non-negotiable rules

CareerFact text is not automatically CareerEvidence. A title, aspiration, interest, self-confidence value, workflow state, or model inference cannot create evidence. Missing evidence is unresolved, not proof of inability. Corrections are appended as operator adjudications and never rewrite historical source authority.

## Projection boundary

An operator decision records what should happen next. This mission does not call the canonical CareerEvidence writer. A future projection must preserve source references, verification, scope, uncertainty, and reversibility, then pass the existing CareerEvidence validator.
