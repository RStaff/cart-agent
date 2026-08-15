# CareerOS V1.25 Provider Feasibility Matrix

**Scope:** architecture audit only. No provider was implemented, called, scraped, or added to discovery.

## Decision Summary

| Source | Classification | Safe next step |
|---|---|---|
| Greenhouse | Existing direct source | Preserve as current authority |
| Ashby | PUBLIC_STRUCTURED_SOURCE_POSSIBLE | Bounded terms-reviewed pilot |
| Lever | PARTNER_API_POSSIBLE | Customer-authorized Posting API/XML feed |
| SmartRecruiters | PARTNER_API_POSSIBLE | Customer/API-key or Job Board partner path |
| Workday | PARTNER_API_POSSIBLE | Tenant/customer-specific integration only |
| Indeed | PUBLIC_WEB_ONLY_REQUIRES_TERMS_REVIEW | Written API/partner approval only |
| Built In | PUBLIC_WEB_ONLY_REQUIRES_TERMS_REVIEW | Publisher/feed partnership or no integration |
| Wellfound | NOT_CURRENTLY_SUITABLE | Written commercial agreement required |
| angelbase.co | UNKNOWN | Identify intended source before evaluation |

## Important Boundary

Public visibility is not permission for automated commercial retrieval. Indeed's terms prohibit automated access and extraction without express written permission. Wellfound's terms restrict scraping, commercial/competitive use, and use by external third-party recruiters or marketplaces. Workday terms prohibit scraping and unauthorized automated applications. These sources are therefore not default providers.

## Sources

- [Indeed Terms](https://www.indeed.com/legal)
- [Indeed API terms FAQ](https://www.indeed.com/legal/termsfaq)
- [Lever developer documentation](https://hire.lever.co/developer/documentation)
- [Lever job-board use case](https://hire.lever.co/developer/usecases)
- [Ashby public Job Postings API](https://developers.ashbyhq.com/docs/public-job-posting-api)
- [SmartRecruiters Posting API](https://developers.smartrecruiters.com/docs/posting-api)
- [Workday developer APIs](https://developer.workday.com/rest-api-explorer)
- [Workday site terms](https://www.workday.com/en-in/legal/site-terms.html)
- [Wellfound General Terms](https://wellfound.com/terms)
- [Wellfound Jobs Terms](https://wellfound.com/terms/jobs)

This is a technical access audit, not legal advice. Counsel or provider contracting must approve any commercial use.
