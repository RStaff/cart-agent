# CareerOS V1.25A Ashby Access Authority

**Decision: `PARTNER_PERMISSION_REQUIRED` for the proposed cross-employer CareerOS pilot.**

Ashby's public Job Postings API documents a board-name endpoint for all currently published postings belonging to an organization and describes the use case as populating that organization's own careers page. It exposes `descriptionHtml`, `descriptionPlain`, location, workplace type, employment type, dates, URLs, listed state, and optional compensation.

That documentation proves technical access to a named organization's public board. It does not prove that CareerOS may index multiple unrelated Ashby customers' boards as a commercial discovery product. Ashby's authenticated API requires customer-managed permissions, and Ashby's customer terms restrict service use and third-party access. No adapter or request was made.

Sources:

- https://developers.ashbyhq.com/docs/public-job-posting-api
- https://developers.ashbyhq.com/reference/authentication
- https://developers.ashbyhq.com/reference/jobpostinglist
- https://www.ashbyhq.com/resources/terms

Required next authority: written Ashby permission, or written authorization from each participating employer, covering cross-employer retrieval, retention of descriptions/HTML, commercial analysis, rate limits, and redistribution/display boundaries.
