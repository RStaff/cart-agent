# CareerOS V1.25B Lever Terms Review

## Findings

- **Public access:** Lever documents the Postings API as publicly accessible for a company's published job postings.
- **General API authentication:** Lever's API overview says API requests require authentication; API keys are account-scoped and privileged.
- **Public posting scope:** The public postings surface is company/site based, not an unrestricted cross-company search contract.
- **Job-board partner path:** Lever documents customer XML feeds for public postings and asks prospective job-board integrations to use its partner-interest process.
- **Application boundary:** This mission did not call application endpoints and is not authorized to submit applications.
- **Rate limits:** Lever documents `429 Too Many Requests` and links rate-limit guidance, but no approved pilot quota was established here.

## Commercial/Reuse Decision

The public documentation establishes technical availability, not CareerOS's commercial rights to retain, analyze, display, or redistribute cross-employer job data. That ambiguity is material under this mission. No retrieval or adapter implementation is authorized.

Sources:

- https://hire.lever.co/developer/documentation
- https://hire.lever.co/developer/support
- https://hire.lever.co/developer/usecases

This is a technical terms audit, not legal advice.
