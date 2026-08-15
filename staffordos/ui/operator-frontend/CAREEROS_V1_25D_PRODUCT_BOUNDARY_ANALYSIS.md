# CareerOS V1.25D Product Boundary Analysis

CareerOS remains a personal career intelligence product, not a TheirStack replacement.

## Allowed product shape

TheirStack discovery observation -> CareerOS canonical opportunity -> personal evidence/qualification/preference analysis -> source link and bounded job display.

The primary user value is Ross-specific capability evidence, fit interpretation, preference compatibility, application intelligence, and workflow.

## Prohibited shape

- General-purpose job search API.
- Raw TheirStack dataset resale.
- API passthrough or query proxy.
- Bulk export of returned records.
- Dataset reconstruction through pagination, webhooks, or exports.
- Public directories or SEO pages that reproduce TheirStack's broader database.

## Retention boundary

Retain a minimal source observation: provider ID, provider job ID, source URL, title, employer, location, timestamps, source digest, the bounded description needed for the active analysis, and provenance. Keep deletion/expiry capability for termination or provider request.

## Decision

The intended CareerOS product can fit the permitted-use language, but implementation must be reviewed against the final TheirStack order/plan before live use.
