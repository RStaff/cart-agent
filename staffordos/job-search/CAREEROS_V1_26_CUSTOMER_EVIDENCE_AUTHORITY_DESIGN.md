# CareerOS V1.26 Customer Career Evidence Authority Design

This is a provider-neutral design; it is not implemented by this mission.

## Minimal source flow

`Customer source -> immutable source record -> reviewed CareerEvidence -> CareerFact -> requirement mapping -> positioning`

## Accepted source classes

1. Resume or exported career history: imported wording, never automatic verification.
2. Employment record: employer/title/date authority where source is authentic.
3. Portfolio/project artifact: bounded work and technical context.
4. GitHub/repository: code/design evidence, with explicit limits on production/customer claims.
5. Certification record: credential-specific authority only.
6. Education record: institution/program/completion authority only.
7. Operator confirmation: separate, labeled, and limited to what the operator confirms.

## Required record fields

- Durable source ID and digest.
- Source type, owner, privacy, observed/created dates, freshness.
- Exact source reference and excerpt.
- Limitations and unsupported conclusions.
- Review status and conflict links.

## Safe customer workflow

1. Import source privately.
2. Extract candidate facts without promotion.
3. Show source excerpts and proposed limitations.
4. Allow customer review/correction.
5. Promote only evidence-supported facts.
6. Map job requirements to direct, partial, transferable, unknown, or missing evidence.
7. Keep positioning downstream and traceable.

## Minimum viable paying-customer authority

For fair matching, CareerOS should obtain at least one authoritative employment/history source, one or more bounded project or portfolio sources for technical claims, and explicit credential/education sources where relevant. Without those, the product must present evidence gaps rather than capability conclusions.
