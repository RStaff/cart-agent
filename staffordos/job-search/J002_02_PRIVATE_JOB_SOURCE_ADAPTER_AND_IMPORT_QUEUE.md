# J002.02 Private Job Source Adapter and Import Queue

## Checkpoint Authority

J002.02 starts from HEAD `e2de2e9c1077fb36a0ec1226c5984fe291e989ca` and builds on:

- J001 JobOpportunity private intake, Application tracking, ResumeVersion authority, and private application pipeline;
- J002.01 Job Discovery and Prioritization Engine;
- S010 Career Evidence authority;
- A001 Asset Authority;
- G001 Private Data Git Backstop;
- G002 Professional Workspace modes;
- G003 adapter-only read-model authority;
- G004.01 operator write isolation;
- P001 Platform Runtime and Provider Integration roadmap.

"CareerOS" remains the Professional Career Operations capability label. This mission does not create a new top-level workspace, shell, authentication domain, UI route, provider login, or application execution path.

## Target Search Lanes

Primary lane: AI Automation, AI Product, AI Governance, Responsible AI, AI Operations, AI Platform Operations, Technical Product/Product Owner, Technical Program Management, Business Technology, Business Systems Analysis, Automation Engineering, AI Solutions/Integration, RevOps AI, GTM AI, Platform Operations, and Digital Transformation.

Secondary bridge lane: Marketing Technology, Marketing Operations, Marketing Automation, Marketing Systems, CRM Operations, Salesforce Operations, Revenue Operations, Lifecycle Operations, Campaign Operations, Marketing Analytics, and Digital Technology.

Traditional narrow marketing roles such as social media, SEO, PPC, content, email, and coordinator roles are excluded by default unless Ross separately authorizes them.

## Adapter Contract

The provider-neutral `JobSourceAdapterContract` is read-only. It describes:

- provider identity and type;
- source authority;
- access mode;
- authentication requirement;
- supported read capabilities;
- provider capability status;
- limitations and explicit no-write flags.

Allowed read methods are conceptual only:

- `normalize`;
- `validate`;
- `buildSourceSnapshot`;
- `buildImportCandidate`.

No adapter exposes apply, submit, message, browser-control, credential, cookie, or login behavior.

## Access Modes

Supported local import modes:

- `OPERATOR_PASTED_URL`;
- `OPERATOR_PASTED_TEXT`;
- `OPERATOR_IMPORTED_JSON`.

Recognized but not connected:

- `PUBLIC_API`;
- `PUBLIC_FEED`;
- `PUBLIC_PAGE`;
- `OPERATOR_IMPORTED_FILE`;
- `UNSUPPORTED_AUTHENTICATED_SOURCE`.

Authenticated job-board or provider access fails closed as `AUTHENTICATED_ACCESS_NOT_CONNECTED`.

## Normalized Source Record

The normalized record contract is `staffordos.job_search.private_job_source_record.v1`.

Core fields include:

- durable opaque source record ID;
- provider identity and provider job ID if known;
- canonical source URL if supplied;
- source and description digests;
- observed timestamp;
- publication date plus publication-date authority;
- title, company, location, remote state, employment type, compensation text, and requisition ID;
- raw-description private reference;
- source authority, freshness, lane disposition, privacy, and limitations.

Unknown values remain unknown. `observedAt` never becomes the publication date. Compensation, remote state, employer response, employer interest, and source freshness are not inferred.

## Source Provenance

J002.02 reuses G003 `SourceSnapshot` authority for every normalized record. Each snapshot retains provider/source type, observed/as-of timing, authorization status, staticity, freshness, digest, and limitations.

Raw job descriptions may remain in owner-private source storage. Redacted read models exclude source URLs, raw descriptions, private paths, credentials, browser state, and action controls.

## Private Import Queue

The import queue contract is `staffordos.job_search.private_job_source_import_queue.v1`.

Queue states:

- `DISCOVERED`;
- `NORMALIZED`;
- `DUPLICATE`;
- `EXISTING_APPLICATION`;
- `NEEDS_OPERATOR_REVIEW`;
- `READY_FOR_OPPORTUNITY_IMPORT`;
- `REJECTED_BY_OPERATOR`;
- `IMPORTED`;
- `STALE`;
- `INVALID`.

Each queue item explains source, company, role, freshness, duplicate status, application status, ranking summary, knowns, unknowns, Ross approval requirements, completion proof, and limitations.

## Ranking Integration

J002.02 converts normalized records into private J002.01 ranking inputs and calls the existing J002.01 prioritization engine. It does not fork the ranking model.

J002.01 weights remain:

- AI / Automation: 45;
- Business Technology: 25;
- Product / TPM: 15;
- Marketing Technology: 15.

Ranking remains deterministic and explanation-based. It does not generate interview probability, offer probability, success probability, employer interest, or validated fit.

## Duplicate and Application Prevention

Duplicate review reuses J002.01 signals:

- provider record ID;
- source URL;
- source digest;
- company plus requisition;
- company plus normalized role;
- existing Opportunity aliases where supplied.

Existing confirmed Applications are checked before an item can become an apply candidate. If an Application match exists, the queue item becomes `EXISTING_APPLICATION` and is not recommended for application.

No duplicate is silently merged.

## Operator Approval

External job source records do not become canonical private JobOpportunity records automatically.

The only approval path is an owner-private decision of `APPROVE_IMPORT_OPPORTUNITY`, which creates a private JobOpportunity intake candidate. It does not create an Application, ApplicationEvent, ResumeVersion, resume, cover letter, recruiter message, or provider action.

Other decision states are `REJECT`, `DEFER`, `INSPECT_SUMMARY`, and `STOP`.

## Provider Capability Matrix

Provider identities are recorded for future routing only:

- Greenhouse: not connected;
- Lever: not connected;
- Ashby: not connected;
- Workday: authenticated access not connected;
- LinkedIn: authenticated access not connected;
- Indeed: not connected;
- employer career site: operator input only;
- other source: operator input only.

Provider identity does not imply integration.

## CLI

Local commands:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobSourceImport.mjs inspect
node staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobSourceImport.mjs import-url --url <url> --title <role> --company <company>
node staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobSourceImport.mjs import-text --text <text> --title <role> --company <company>
node staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobSourceImport.mjs import-json --input <owner-private-json-file>
node staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobSourceImport.mjs queue --sample
```

The CLI does not fetch URLs. Imported JSON files must be outside the repository.

## Private Outputs

When `--write` is used, owner-private outputs are written outside Git:

- source snapshots;
- normalized source records;
- import queue;
- priority queue;
- provider capability matrix;
- import audit.

## Future Roadmap

Expected progression:

1. J002.02 provider-neutral private import queue.
2. J002.03 public/read-only real provider discovery.
3. J002.04 scheduled discovery and dedupe.
4. J002.05 Opportunity review plus ResumeVersion recommendation.
5. J002.06 resume and cover-letter preparation under separate authority.
6. J002.07 operator approval package.
7. Future governed application execution.

Automatic application submission remains out of scope and requires future authority for identity, session authorization, per-application approval, exact ResumeVersion, application-question review, employer terms, external communication approval, audit, replay prevention, failure handling, and submission proof.

## Tests

Focused tests verify read-only adapters, failed-closed authenticated sources, unknown publication dates, no invented compensation or remote state, G003 provenance, J002.01 ranking reuse, duplicate detection, existing Application prevention, operator approval gating, text-only review handling, default lane exclusions, read-model redaction, private-output repository rejection, provider capability status, and absence of submission, messaging, resume generation, provider calls, external AI, `/os`, and `/operator` connections.

## Known Limitations

J002.02 does not call real providers, browse pages, authenticate to job boards, create scheduled discovery, create Applications, recommend exact resumes, generate resumes, or connect to a visual private-data UI. Real source data remains owner-private and must be supplied through approved local import modes.

## Rollback

Rollback with:

```bash
git revert <J002.02 commit SHA>
```

No real job listings or private source payloads are committed.

## Recommended Next Mission

`J002_03_REAL_READ_ONLY_JOB_DISCOVERY_PROVIDER`

Select the safest real source available after discovery, preferring public API, public feed, or public employer-career endpoints before authenticated job-board scraping.
