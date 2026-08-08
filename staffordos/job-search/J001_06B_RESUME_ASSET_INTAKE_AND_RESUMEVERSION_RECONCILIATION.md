# J001.06B Resume Asset Intake and ResumeVersion Reconciliation

Date: 2026-08-08

Status: `RESUME_ASSET_RECONCILIATION_READY_FOR_OPERATOR_REVIEW`

## Checkpoint Authority

Repository authority was verified at HEAD `d277de84f82a8ec9850daa6f598b3faab62978fb`.

The existing authority chain includes:

- J001.05A Manual Application Event Tracking;
- J001.05B Private Application Pipeline Review;
- J001.06 Resume Version and Application Linkage;
- J001.06A Vista Application and Resume Linkage Reconciliation;
- S010.02B Career Evidence Contract;
- S010.02C and S010.02C2 Career Evidence Intake;
- S010.02D Role-Focused Career Evidence Review;
- S010.02E High-Value Career Fact Verification;
- A001 Asset Authority architecture;
- G001 Private Data Git Backstop;
- G003 Adapter-Only Read Model Authority;
- G004.01 Operator Write Isolation;
- P001 Platform Runtime Roadmap.

J001.06 remains the ResumeVersion and ApplicationResumeLink authority. J001.06B does not replace or rebuild that contract.

## Approved Source Authority

The approved owner-private Career intake source is:

`~/staffordos-private-intake/career`

J001.06B scans only configured approved Career source roots. It does not scan the entire home directory, Downloads, Desktop, iCloud Drive, Google Drive, email, browser storage, or unrelated directories.

G001 ignore authority covers private StaffordOS roots and private intake roots. Private artifacts remain outside Git.

## Source Inventory

The workflow inventories supported private documents recursively under the approved Career source root.

Supported source formats:

- PDF;
- DOCX;
- TXT;
- MD;
- Markdown.

Unsupported or unsafe source names, including secret-like, credential-like, token-like, password-like, and recovery-code-like files, are excluded before content processing.

Private source inventory records include digest, original filename, extension, document format, size, observed modified time, source authority, privacy, and limitations. The filename is not the primary identity.

The latest private run inventoried 20 supported source records.

## Document Classification

Each supported source is classified as exactly one of:

- `RESUME`;
- `COVER_LETTER`;
- `CAREER_SOURCE`;
- `UNKNOWN_DOCUMENT`;
- `NON_CAREER_DOCUMENT`.

The latest private run classified:

- 12 resume documents;
- 1 cover-letter document;
- 0 Career source documents;
- 7 unknown documents;
- 0 non-Career documents.

Only `RESUME` records become ResumeVersion candidates. Cover letters remain separate and unknown documents are not forced into resume authority.

## Asset-Compatible Source Model

J001.06B creates private Asset-compatible source records without implementing a production Asset database.

Each private asset source record includes:

- opaque asset reference ID;
- source document ID;
- content digest;
- original filename;
- document format;
- document classification;
- source authority;
- observed timestamp;
- source modified timestamp;
- privacy;
- provenance;
- storage authority;
- rights status;
- limitations.

Asset/source identity is digest-based and independent of filename. Source files are not moved, renamed, deleted, modified, or copied into Git.

The latest private run produced 20 Asset-compatible source records.

## ResumeVersion Reconciliation

J001.06B reuses J001.06 ResumeVersion semantics.

For each resume source, reconciliation classifies the source as:

- `EXISTING_EXACT_RESUMEVERSION`;
- `NEW_RESUMEVERSION`;
- `EXACT_DUPLICATE`;
- `FORMAT_DERIVATIVE`;
- `LIKELY_VERSION`;
- `UNRELATED`;
- `NEEDS_OPERATOR_REVIEW`.

Exact duplicate resume sources are canonicalized to one reconciled ResumeVersion per content digest while preserving duplicate source membership. Likely versions and format derivatives are not silently merged or superseded.

The latest private run reconciled 12 resume documents into 9 canonical ResumeVersion records.

## Duplicate Handling

Exact duplicates are detected by content digest.

The latest private run found 2 exact duplicate groups.

Duplicate files are not deleted, renamed, merged, or rewritten. Duplicate group records remain private and require later operator review before any cleanup or linkage action.

## Format Derivative Handling

Format derivatives require deterministic local evidence, such as matching normalized text digest across different document formats.

The latest private run found 0 format derivative groups.

No conversion, parent-child relationship, merge, or supersession is created by this mission.

## Likely-Version Grouping

Likely-version families are grouped conservatively using deterministic private metadata signals. Filename similarity alone does not create a canonical supersession chain.

The latest private run found 2 likely-version families.

Likely versions require operator review before any version relationship is promoted.

## Fact-Safety Reuse

J001.06B reuses existing J001.06 fact-safety classifications:

- `SUPPORTED_VERIFIED`;
- `SUPPORTED_TRANSFERABLE`;
- `PARTIALLY_SUPPORTED`;
- `NEEDS_EVIDENCE`;
- `CONFLICTING`;
- `STALE`;
- `UNSUPPORTED`;
- `UNKNOWN`.

A resume cannot verify its own claims. Resume content remains downstream representation and does not promote CareerFacts or mutate CareerEvidence.

The verified PMP fact may support only PMP credential wording. It does not imply years, scale, employer responsibility, financial impact, or program outcomes.

The latest private run marked 9 reconciled ResumeVersions as needing operator review and did not promote any Career fact.

## Source Integrity Rules

J001.06B records digest before processing and verifies digest after processing.

The workflow does not:

- write source documents;
- rename source documents;
- delete source documents;
- move source documents;
- convert source documents into replacement files;
- copy source documents into Git.

The latest private run verified all processed source digests were unchanged.

## Resume Library Health

The private Resume Library Health snapshot is descriptive only. It does not generate scores, grades, success probabilities, or application probabilities.

Latest private health counts:

- 20 total supported source documents;
- 12 resume documents;
- 1 cover letter;
- 9 canonical ResumeVersions;
- 2 exact duplicate groups;
- 0 format derivative groups;
- 2 likely-version families;
- 9 role-targeted resumes;
- 9 resumes needing review;
- 0 orphan ResumeVersions;
- 0 resume source records lacking a ResumeVersion.

## Operator Review Queue

J001.06B creates a private review queue for ambiguity.

Review queue items show only:

- safe resume label;
- format;
- digest prefix;
- observed date;
- classification;
- reason for review;
- possible related safe labels.

They do not show private filesystem paths or raw resume content.

The latest private run created 4 review queue items.

## Application-Linkage Readiness

This mission does not create ApplicationResumeLinks and does not alter existing unknown linkage decisions.

It creates a readiness snapshot only:

- `EXACT_SOURCE_READY`;
- `MULTIPLE_CANDIDATES`;
- `SOURCE_NOT_PRESENT`;
- `NEEDS_OPERATOR_REVIEW`;
- `NO_MATCH`.

The latest private run produced readiness records for 4 submitted Applications:

- 3 `MULTIPLE_CANDIDATES`;
- 1 `SOURCE_NOT_PRESENT`;
- 0 `EXACT_SOURCE_READY`.

No `USED_FOR_SUBMISSION` link was created and no `RESUME_LINK_CONFIRMED` event was created.

## Future Operating Rule

Every new resume used in the job-search workflow should enter approved Career intake authority before or at application time.

Preferred future sequence:

`Opportunity -> Evidence / Fit -> Positioning -> Resume selected or generated by separately authorized workflow -> Resume source registered -> Digest recorded -> ResumeVersion created -> Manual application occurs -> Ross confirms exact submitted ResumeVersion -> ApplicationResumeLink created`

J001.06B implements only the source and ResumeVersion portion of that sequence.

## Private Outputs

Private outputs are written only under owner-private Professional Job Search resume-asset reconciliation storage outside Git.

Private artifacts include:

- resume source inventory;
- Asset-compatible source records;
- ResumeVersion records;
- ResumeVersion reconciliation;
- exact duplicate groups;
- format derivative groups;
- likely-version families;
- fact-safety summary;
- source integrity;
- historical ResumeVersion state;
- Resume Library Health;
- operator review queue;
- application-linkage readiness;
- processing audit summary.

The latest private run wrote 14 JSON artifacts with owner-private permissions.

## Tests

Focused tests cover:

- approved source-root-only scanning;
- no entire-home, Downloads, Desktop, or iCloud scan authority;
- recursive approved-root inventory;
- secret-like source exclusion;
- resume and cover-letter separation;
- filename not used as source or ResumeVersion identity;
- digest-based exact duplicate handling;
- no unnecessary duplicate reconciled ResumeVersions for exact duplicates;
- likely versions not merging or superseding silently;
- deterministic evidence required for format derivatives;
- source files not mutated, renamed, or deleted;
- resume content not verifying Career facts;
- verified PMP supporting only credential wording;
- no CareerFact promotion;
- no ApplicationResumeLink creation;
- existing unknown application links unchanged;
- private outputs outside Git;
- normal CLI output hiding paths and raw content;
- no external action or private UI connection.

J001.06, J001.06A, J001.05A, J001.05B, broader J001, S010, S009, S008, G002, G003, and G004 regressions remain required for commit.

## Known Limitations

The latest private run produced ambiguous application-readiness results, not exact submitted-resume links.

Three submitted Applications have multiple possible candidates and one submitted Application has no matching source document in the approved intake root.

J001.06B does not perform application linkage. A later mission must either resolve the missing-source issue or run operator-confirmed linkage when exact candidates exist.

Fact-safety analysis is conservative and does not rewrite resumes.

## Rollback

Repository rollback:

`git revert <J001.06B commit SHA>`

Private records are separate owner-private artifacts. Do not delete private reconciliation runs, source inventories, health snapshots, or review queues without explicit Ross approval.

## Recommended Next Mission

Because no `EXACT_SOURCE_READY` application candidates were found, the next mission should resolve the proven missing-source issue and review the ambiguous multiple-candidate groups before operator-confirmed application linkage.
