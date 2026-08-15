# CareerOS V1.25 Source Structure Quality

| Source | Expected structure quality | Main limitation |
|---|---|---|
| Greenhouse | High; `content=true` returns HTML and V1.24H preserves blocks | Current corpus is historical/plain-text unless newly ingested |
| Ashby | High; `descriptionHtml`, `descriptionPlain`, sections/list markup likely available | Public endpoint is documented for an organization's board; aggregation terms need confirmation |
| Lever | Medium-high; description/list HTML and workplace/salary fields | Supported HTML is constrained; customer/partner authorization required |
| SmartRecruiters | Medium-high potential; structured Posting API object | Exact description HTML/section behavior requires an authorized sample |
| Workday | Variable | Tenant-specific API and public-site structure; no generic crawler allowed |
| Indeed | Unknown for general discovery | API data and reuse are program/contract dependent |
| Built In | Medium presentation structure | No authorized structured feed identified; republication/terms risk |
| Wellfound | Unknown without agreement | No general discovery API and restrictive terms |

Structure quality must be measured by preserved provenance, not by HTML presence alone: heading identity, list order, source blocks, timestamps, stable ID, and lawful reuse basis are all required.
