# CareerOS V1.25D TheirStack License Authority

Date: 2026-08-15
Status: PILOT BLOCKED PENDING CREDENTIAL AND PRODUCT-BOUNDARY CONFIRMATION

## Authority reviewed

- [TheirStack Terms and Conditions](https://theirstack.com/en/docs/legal/terms-and-conditions), reviewed 2026-08-15.
- [TheirStack API Reference](https://theirstack.com/en/docs/api-reference).
- [TheirStack Job Search API](https://theirstack.com/en/docs/api-reference/jobs/search_jobs_v1).
- [TheirStack pricing](https://theirstack.com/en/pricing?tab=api).
- [TheirStack credit documentation](https://theirstack.com/en/docs/pricing/credits).

This is an engineering authority audit, not legal advice. The commercial decision below is conservative where the terms require interpretation.

## Proposed use review

| Proposed use | Current authority reading | Gate |
| --- | --- | --- |
| Search jobs across unrelated employers | API searches jobs across many sources/countries; terms permit business and recruiting uses | Permitted for bounded use |
| Retrieve records programmatically | API is explicitly programmatic and bearer-key authenticated | Permitted with account/key |
| Retain normalized metadata | Terms permit licensed-material use during the agreement, but termination deletion applies | Bounded retention only |
| Retain descriptions | Not categorically prohibited, but data remains licensed material and third-party rights are disclaimed | Confirm in product terms/order |
| Analyze privately | Terms expressly permit viewing and analyzing Licensed Materials | Permitted |
| Produce CareerOS-derived analysis | Plausibly within analysis use, provided CareerOS is not a competing job-data service | Product boundary required |
| Display title/company/location/link to authenticated users | Terms expressly permit job-posting reposting, redistribution, and public display; downstream restrictions still apply for non-anonymous recipients | Permitted with controls |
| Display derived analysis | Not expressly named; likely acceptable only as CareerOS analysis, not a substitute dataset | Sales/legal confirmation recommended |
| Paid CareerOS product | Paid plans and platform resale language exist, but non-compete and downstream terms constrain implementation | Supported with product boundaries; confirm commercially |
| Cache for freshness/dedup | Operationally necessary, but deletion obligations apply at termination and repeated API requests consume credits | Bounded cache with deletion runbook |
| Preserve provenance | Required by CareerOS authority model and compatible with licensed-material tracking | Permitted/required |
| Publicly display selected postings | Terms expressly allow job postings on public pages, including SEO pages; do not extend this to other TheirStack datasets | Permitted for job postings only |
| Store only CareerOS subsets | Terms allow partial extracts/subsets but prohibit substantially complete dataset delivery or reconstruction | Required |

## Non-compete conclusion

CareerOS is designed as a career evidence, qualification, preference, and application-intelligence product that uses job data as an input. That is materially different from a general job-data API, searchable job database, or raw dataset reseller **only if the implementation enforces that boundary**.

TheirStack terms prohibit creating a competing product/service, competing distribution of data, and delivery of a whole or substantially complete dataset. They also expressly allow partial resale through a platform and job-posting display. This creates a viable bounded path, not an unconditional approval.

## Classification

`COMMERCIAL_USE_SUPPORTED_WITH_PRODUCT_BOUNDARIES`

The pilot itself is not authorized in this checkout because no authorized API credential is present. Before a live pilot or production adapter mission, obtain written confirmation that CareerOS-derived analysis, authenticated end-user display, bounded retention/cache, and the intended paid SaaS workflow are within the selected plan/order.

## Required product controls

1. No TheirStack API passthrough.
2. No bulk export or dataset reconstruction.
3. No unrestricted raw-job download/export.
4. Store only records needed for an active CareerOS analysis and freshness/dedup operation.
5. Keep TheirStack provenance on every observation.
6. Keep direct ATS observations authoritative when present.
7. Bind authenticated downstream users to terms at least as restrictive as required.
8. Delete or disable licensed data on termination according to the contract.
9. Separate CareerOS-derived analysis from source content.
10. Do not expose company technographic or buying-intent data through the CareerOS job product.

## Credential status

`THEIRSTACK_API_KEY` and `THEIRSTACK_KEY` were absent from the process environment. No credential was fabricated, requested in source, logged, or used.
