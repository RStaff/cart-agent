# CareerOS V1.25B Lever Access Authority

**Classification: `PARTNER_PERMISSION_REQUIRED`.**

Lever distinguishes its authenticated API from the publicly accessible Postings API. The public surface exposes a company's published postings and is commonly used for that company's custom jobs page. Lever's general API documentation states that API requests are authenticated; the Postings API is a narrower public-posting surface.

The documentation does not establish that CareerOS may index multiple unrelated Lever-hosted employers, retain descriptions/HTML for matching, or commercially redistribute job summaries. Therefore the cross-employer pilot is stopped before retrieval.

Relevant official sources:

- https://hire.lever.co/developer/support
- https://hire.lever.co/developer/documentation
- https://hire.lever.co/developer/usecases

Required authority for a future pilot: written Lever/partner permission or employer-by-employer authorization covering company-site discovery, retention of normalized content and private source structure, commercial analysis, display/linking, rate limits, and removal handling.
