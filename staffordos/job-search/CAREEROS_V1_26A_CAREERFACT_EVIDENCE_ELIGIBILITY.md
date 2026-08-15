# CareerOS V1.26A CareerFact to CareerEvidence Eligibility

## Existing rule

The current contract requires source reference, limitations, authority classification, verification state, privacy classification, support level, and explicit fact/evidence links. Resume wording alone cannot verify a fact. Repository artifacts support only bounded project context. Credentials verify only the matching credential requirement.

## Proposed projection gate

Projection should be `MIXED`:

### Automatic only for already-proven semantics

Automatic projection is safe only when an existing CareerFact is already `VERIFIED`, has authoritative supporting evidence, has no unresolved conflict, and the projected evidence claim is no broader than the source. This should preserve the original source authority and mark the result reversible.

### Operator-approved for everything else

Facts that are proposed, conflicting, partially supported, unknown-support, transferable, scope-sensitive, metric-bearing, production/customer-related, or title/date-sensitive require operator review before canonical CareerEvidence promotion.

## Explicit prohibitions

- Aspiration, interest, self-confidence, or workflow state cannot become evidence.
- Job title cannot establish capability without supporting facts.
- Model similarity cannot verify a fact.
- Missing evidence cannot become a capability gap.
- Transferable support cannot become exact support.
- A credential cannot verify unrelated employment, scope, or outcome claims.

## Projection record requirements

Every candidate must preserve source reference, source authority, original verification state, direct/transferable support, context/domain, scope, limitations, operator review status, and a supersession/reversal link.
