# CareerOS V1.26 Next Stage Decision

## Decision

`EVIDENCE_AUTHORITY_EXPANSION_REQUIRED`

## Rationale

The evidence contract and mapping semantics are mature enough to preserve distinctions among direct, transferable, adjacent, missing, domain, title, true capability gap, and unknown. However, the real CareerFacts/CareerEvidence corpus is owner-private and not sufficiently inspectable or complete for another Match Engine experiment.

## Highest-value next authority work

1. Create a governed read-only export/snapshot of private CareerFact and CareerEvidence IDs, source references, limitations, support levels, and verification states for offline diagnostics without exposing sensitive excerpts.
2. Reconcile employment history, titles, dates, scope, and leadership evidence from authoritative sources.
3. Add bounded project/portfolio/GitHub evidence for architecture, automation, AI, systems, and analytics claims.
4. Preserve credential-specific verification separately from broader capability claims.
5. Re-run the Datadog TPM and locked 80-role authority audit only after those sources are available.

No weight tuning is recommended before these steps.
