# CAREEROS_APPLICATION_INTELLIGENCE_V1_01_JOB_DESCRIPTION_INTAKE_BRIDGE

## Authority

This mission extends the existing J002.02 private Job Source Import Queue authority. It does not create a new JobOpportunity contract, recommendation engine, fit engine, provider system, application tracker, or CareerOS shell.

Reused authority:

- private Job Source Import Queue
- private JobOpportunity intake contract
- source provenance and digests
- duplicate detection
- existing-application detection
- deterministic prioritization
- Explainable Fit
- Opportunity Recommendation Engine
- CareerOS daily job-search experience at `/os/professional/jobs`

## Root Gap

CareerOS could accept conceptual URL, text, and JSON imports, but an arbitrary pasted URL did not safely fetch, parse, or normalize a job. This bridge closes the practical operator gap by supporting pasted job descriptions and URL-plus-description provenance without adding general web scraping.

## Intake Modes

- `PASTED_DESCRIPTION`: normalizes explicit labeled fields from pasted job text and routes the source through the existing import queue. Without an HTTPS source URL, canonical JobOpportunity import remains review-required.
- `URL_PLUS_DESCRIPTION`: preserves the HTTPS URL as provenance and uses the pasted description as the content authority. If the queue item is ready and Ross approves import, it can create a private JobOpportunity candidate.
- `URL_ONLY`: fails closed as `DESCRIPTION_REQUIRED`. Generic public HTTP retrieval is not enabled by this bridge.

## Normalization

The bridge extracts only deterministic labeled fields such as company, role, location, employment type, compensation, publication date, and requisition ID. Missing fields remain `UNKNOWN`, `null`, or review-required. It does not infer employer intent, publication date, compensation, remote status, or application state.

Raw job descriptions remain owner-private and are not committed to Git.

## Pipeline Integration

A successful approved URL-plus-description intake follows:

```text
operator-supplied job source
  -> private Job Source Import Queue
  -> duplicate / existing-application checks
  -> private JobOpportunity candidate
  -> Explainable Fit
  -> Opportunity Recommendation Engine
  -> CareerOS daily read model
```

No application is created by this bridge.

## UI

The existing `/os/professional/jobs` page adds a small `Add Job` form:

- Job URL
- Job Description
- Analyze Job

The form writes private artifacts through existing CareerOS output roots and then reloads the existing daily experience. It does not redesign the dashboard or introduce a new route.

## Privacy

The implementation preserves:

- private directories as `0700`
- private files as `0600`
- no raw job description in repository fixtures
- no real job URL or description in committed documentation
- no resume, CareerEvidence, CareerFact, application, or operator-specific runtime data in Git

## Non-Impact

This mission does not:

- submit applications
- create Applications
- generate or mutate resumes
- generate cover letters
- send messages
- perform browser automation
- log into providers
- scrape authenticated sources
- call external AI
- call Ollama
- change ranking weights
- change recommendation thresholds
- add another provider

## Tests

Focused tests cover:

- pasted description intake
- URL plus description intake
- URL-only fail-closed behavior
- malformed and unsupported URL handling
- missing-field handling
- provenance and digest preservation
- private/raw-description boundary
- duplicate detection integration
- existing Application prevention
- JobOpportunity compatibility
- Explainable Fit compatibility
- recommendation compatibility
- no external action
- no Application creation
- no resume generation

## Rollback

Remove the bridge source, CLI, tests, docs, and the small `/os/professional/jobs` form wiring. Private runtime artifacts under the job-description-intake output root can be superseded or deleted only under owner-private operational policy.

## Known Limitations

- URL-only intake intentionally requires pasted description text.
- Field extraction is deterministic and conservative; unlabeled company or role text remains review-required.
- Description-only intake cannot become a canonical JobOpportunity because the existing private JobOpportunity contract requires an HTTPS source URL.
- Recommendations still depend on existing Career Evidence and ResumeVersion safety authority.

## Recommended Next Mission

`CAREEROS_APPLICATION_INTELLIGENCE_V1_02_APPLICATION_INTELLIGENCE_PACKET`
