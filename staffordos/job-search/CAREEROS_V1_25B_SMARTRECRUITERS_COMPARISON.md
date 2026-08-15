# Lever vs SmartRecruiters Comparative Note

| Dimension | Lever | SmartRecruiters |
|---|---|---|
| Public posting access | Public Postings API for a company's published jobs | Posting API exposes postings made public by a company |
| Authentication | Public Postings API is distinct from authenticated general API; exact integration scope must be approved | Posting API documentation says API key authentication; platform docs also describe customer/partner authentication |
| Structured fields | Strong: posting ID, title, content/list HTML, location, workplace type, salary fields, dates, URLs | Strong posting object and location filters; exact description HTML structure requires authorized sample |
| Partner path | Customer XML feed and partner-interest path documented | Job Board API and customer Posting API paths documented |
| Cross-employer commercial rights | Not established by public docs | Not established by public docs |
| Source fidelity | Likely high for public postings; supported HTML is constrained | Potentially high, but requires customer-authorized sample validation |
| Adapter effort | Moderate: public/partner scope and content variants | Moderate: API key/customer authorization and schema validation |

SmartRecruiters should remain the next candidate if Lever permission cannot be obtained, but it also requires explicit customer/partner authority for a commercial CareerOS use case. Sources: [Lever](https://hire.lever.co/developer/documentation), [Lever partner use cases](https://hire.lever.co/developer/usecases), [SmartRecruiters Posting API](https://developers.smartrecruiters.com/docs/posting-api), [SmartRecruiters authentication](https://developers.smartrecruiters.com/docs/authentication).
