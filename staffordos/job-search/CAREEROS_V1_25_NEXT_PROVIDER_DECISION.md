# CareerOS V1.25 Next Provider Decision

**Decision:** `PROVIDER_EXPANSION_ARCHITECTURE_READY`

**Recommended first additional provider:** Ashby, subject to written confirmation that CareerOS's intended cross-employer discovery use is permitted. Use only the documented listed-job board endpoint, preserve `descriptionHtml` and `descriptionPlain`, and begin with a small deterministic pilot.

**Recommended sequence:** Ashby pilot, Lever authorized feed, SmartRecruiters authorized API/partner path, Workday tenant integrations. Keep Indeed/Built In/Wellfound out of default discovery until an explicit commercial/API agreement is obtained. `angelbase.co` is unresolved and should not be treated as Wellfound.

**No implementation authorization:** This artifact authorizes architecture planning only. It does not authorize credentials, network retrieval, scraping, or production provider expansion.
