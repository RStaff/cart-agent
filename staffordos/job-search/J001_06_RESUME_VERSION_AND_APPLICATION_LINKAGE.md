# J001.06 Resume Version and Application Linkage

Date: 2026-08-08

Status: `RESUME_VERSION_APPLICATION_LINKAGE_READY_FOR_REVIEW`

## Checkpoint Authority

Repository authority was verified at HEAD `512ac5b85b67892ba5f237e58ffb1b09e2ad1544` through:

- J001.05A Manual Application Event Tracking;
- J001.05B Private Application Pipeline Review;
- J001.04 Explainable Fit and Positioning;
- J001.03A and J001.03B Job Analysis and Review;
- S010.02B Career Evidence Contract;
- S010.02C and S010.02C2 Career Evidence Intake;
- S010.02D Role-Focused Review;
- S010.02E High-Value Fact Verification;
- A001 Asset Authority architecture;
- G001 Private Data Git Backstop;
- G002 Professional workspace modes;
- G003 adapter-only read-model authority;
- G004.01 operator write isolation;
- P001 Platform Runtime Roadmap.

The certified current state contains three confirmed manual external Applications, eight ApplicationEvents, three follow-up tasks, one confirmation-needed candidate, incomplete resume references, downstream resume authority, the certification fact as the only newly verified canonical Career fact, and no private Professional data connection to `/os`.

## Resume Version Model

J001.06 preserves the canonical order:

`Career Fact -> Career Evidence -> Positioning -> Resume Version -> Application`

A ResumeVersion is not Career truth. It is a downstream presentation artifact that may contain verified facts, transferable positioning, unresolved wording, stale claims, unsupported claims, or unknown claims.

The private ResumeVersion record includes:

- opaque resume version ID;
- workspace ID;
- temporary Asset-compatible reference;
- source document reference;
- original filename retained only in private records;
- content digest;
- document format;
- observed and source-modified timestamps;
- purpose and target context when safely inferred;
- source authority;
- privacy;
- review status;
- fact-safety status;
- supersession and derivation fields;
- limitations.

The filename is never the primary identifier.

## Application Linkage

J001.06 defines a private `ApplicationResumeLink` record with:

- opaque link ID;
- Application ID;
- ResumeVersion ID when known;
- link type;
- operator-confirmed flag;
- used-for-submission flag;
- confirmation timestamp;
- source authority;
- limitations.

Allowed link types are `USED_FOR_SUBMISSION`, `PREPARED_FOR_APPLICATION`, `CONSIDERED`, `SUPERSEDED`, and `UNKNOWN`.

`USED_FOR_SUBMISSION` requires explicit operator confirmation that the exact private ResumeVersion was actually submitted. Filename similarity, role wording, target-company wording, or candidate ranking cannot create a submitted-resume claim.

## Cover Letter Boundary

Cover letters remain separate artifacts.

The workflow defines a private CoverLetterReference and does not copy cover-letter content into Application records. Cover-letter wording is not canonical Career truth and cannot verify a Career fact.

## Source Inventory

The local workflow inventories only approved private Career source roots established by S010/J001 authority. It does not search the entire home directory.

Supported document types are PDF, DOCX, TXT, MD, and Markdown. Deferred formats remain out of scope unless separately authorized.

Documents are classified as:

- `RESUME`;
- `COVER_LETTER`;
- `CAREER_SOURCE`;
- `UNKNOWN_DOCUMENT`;
- `NON_CAREER_DOCUMENT`.

The implementation does not classify a document as a resume purely from filename when content authority is required.

The private J001.06 run inventoried 20 supported private source records, created 12 private ResumeVersion records, found one cover-letter candidate, identified two exact-duplicate groups, identified two likely-version groups, and produced nine private artifacts outside Git.

## Duplicate and Version Rules

Exact duplicates are detected by content digest.

Likely versions are grouped for review but are not merged silently.

The workflow does not delete, rename, move, or mutate source documents. It records private duplicate/version analysis for later operator review and future Asset Authority migration.

## Fact-Safety Rules

Resume claims are compared to available Career authority and classified as:

- `SUPPORTED_VERIFIED`;
- `SUPPORTED_TRANSFERABLE`;
- `PARTIALLY_SUPPORTED`;
- `NEEDS_EVIDENCE`;
- `CONFLICTING`;
- `STALE`;
- `UNSUPPORTED`;
- `UNKNOWN`.

Resume wording alone cannot verify a Career fact.

Unsupported metrics, years, titles, dates, production usage, scale claims, and employer responsibility remain unsupported or unknown unless Career evidence independently supports them.

The workflow creates private safety reports only. It does not rewrite, clean, generate, or mutate any resume.

## PMP Treatment

The verified certification fact may support only credential wording where the resume directly references that credential.

It does not imply years of credentialed experience, project scale, employer responsibility, financial impact, program outcomes, or production system authority.

## Application Reconciliation

The three confirmed Applications remain manual external submissions. StaffordOS did not submit them.

Each confirmed Application receives an `UNKNOWN` link until Ross confirms the exact private ResumeVersion used for submission.

The confirmation-needed candidate remains blocked from resume linkage until the underlying Application is confirmed.

When Ross later confirms an exact submitted resume, the workflow will create an append-only `RESUME_LINK_CONFIRMED` ApplicationEvent. It will not rewrite submission history.

## Private CLI

The local CLI is:

`node staffordos/ui/operator-frontend/lib/staffordos/runResumeVersionApplicationLinkage.mjs`

Supported commands:

- `inventory`;
- `inventory --write`;
- `review`.

Normal output uses aggregate counts and safe labels. It does not print raw resume text, source document contents, private filesystem paths, contact information, portal data, or credentials.

## Asset Compatibility

J001.06 remains compatible with A001 by using temporary private asset-reference semantics:

`ResumeVersion -> Asset metadata -> storage/provider reference`

No production Asset database is created in this mission.

Source files are not moved or copied into Git.

## Future UI Read Model

The private workflow prepares a redacted future read model for an authorized Professional UI.

Allowed future fields include:

- safe resume label;
- version reference;
- purpose;
- whether it was used for an Application;
- fact-safety status;
- review status;
- captured timestamp;
- limitations.

Excluded fields include private filesystem paths, raw resume text, private contact information, document internals, credentials, and source-document details not needed for display.

The read model is not connected to `/os`, `/operator`, an API, a database, browser storage, or any provider. G003 remains authoritative.

## Tests

Focused tests cover:

- ResumeVersion separation from CareerFact and CareerEvidence;
- filename not used as primary ID;
- digest-based exact duplicate handling;
- likely-version grouping without silent merge;
- `USED_FOR_SUBMISSION` requiring operator confirmation;
- no submitted-resume inference from filename;
- cover-letter separation;
- resume wording not verifying Career facts;
- credential support limited to the verified credential claim;
- unsupported metrics and years requiring evidence;
- conflicting employment facts preserved;
- stale resume flagging;
- source files not mutated or copied into Git;
- private paths hidden from read models;
- append-only ApplicationEvent creation;
- Application-specific unknown links preserved until confirmation;
- confirmation-needed candidate link blocked;
- no resume generation, resume mutation, submission, message, provider fetch, external AI, Ollama, API, database, `/os`, or `/operator` capability;
- synthetic fixture cleanliness.

## Private Outputs

Real outputs are written only to owner-private Professional Job Search resume-linkage storage outside Git.

Private artifacts include:

- resume inventory;
- ResumeVersion records;
- duplicate/version analysis;
- resume fact-safety reports;
- ApplicationResumeLinks;
- cover-letter references;
- resume-link ApplicationEvents;
- future UI read model;
- processing audit summary.

Artifacts are versioned by run and written with owner-private permissions.

## Limitations

The workflow prepares linkage authority but does not confirm any exact submitted resume without Ross.

The initial private run produced zero confirmed submitted-resume links and three unknown Application links.

The workflow does not inspect deferred formats, rewrite resumes, create a production Asset database, or connect private data to a browser UI.

Fact-safety analysis is conservative. Unknown claims require later Career Evidence review or explicit operator linkage decisions.

## Rollback

Repository rollback:

`git revert <J001.06 commit SHA>`

Private resume-linkage artifacts are separate owner-private records. Do not delete private resume inventory, linkage decisions, safety reports, or generated events without explicit Ross approval.

## Next Mission

Recommended next mission:

`J001_07_RELATIONSHIP_AND_FOLLOW_UP`

Reason: the application pipeline can now identify missing resume linkage safely, while the highest immediate job-search value is tracking relationship and follow-up context without sending messages automatically.
