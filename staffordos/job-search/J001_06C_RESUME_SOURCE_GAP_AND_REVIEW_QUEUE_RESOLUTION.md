# J001.06C Resume Source Gap and Review Queue Resolution

## Authority

J001.06C is a follow-on mission to the committed J001.06B Resume Asset Intake and ResumeVersion Reconciliation authority. It does not replace J001.06B and does not rebuild the ResumeVersion or ApplicationResumeLink contracts.

The mission uses only existing owner-private J001.06B outputs, private Application metadata, duplicate groups, likely-version families, source-gap records, and operator review queue items.

## Review Queue Baseline

The certified private baseline for this mission is:

- 20 supported Career source documents;
- 12 resume documents;
- 1 cover letter;
- 7 unknown documents;
- 9 canonical ResumeVersions;
- 2 exact duplicate groups;
- 0 format derivative groups;
- 2 likely-version families;
- 4 operator review items;
- 4 submitted Applications under readiness review;
- 3 readiness records with multiple candidates;
- 1 readiness record with source not present;
- 0 exact submitted-resume links.

These counts are descriptive private workflow outputs. They do not create ApplicationResumeLinks.

## Ambiguity Reasons

J001.06C explains unresolved review items with explicit reason codes:

- `DUPLICATE_SOURCE_ALIAS`;
- `LIKELY_VERSION_FAMILY`;
- `MULTIPLE_ROLE_TARGETED_CANDIDATES`;
- `FILENAME_VARIATION`;
- `TIMESTAMP_AMBIGUITY`;
- `SOURCE_NOT_PRESENT`;
- `ROLE_CONTEXT_AMBIGUITY`;
- `MULTIPLE_FORMATS`;
- `INSUFFICIENT_METADATA`;
- `OTHER`.

Reasons are used for review clarity only. They do not prove which resume was submitted.

## Candidate Narrowing Rules

J001.06C may compare deterministic private metadata:

- exact original filename;
- normalized filename stem;
- role and company tokens;
- file extension;
- source modified timestamp;
- ResumeVersion observation timestamp;
- digest equality;
- duplicate group membership;
- likely-version-family membership;
- deterministic document purpose;
- deterministic target-role classification;
- existing private Application metadata.

It does not use external AI, guessed employer intent, guessed chronology, newest-file-wins, role-target inference, or filename-only proof.

## Candidate Elimination Rules

A candidate may be eliminated only with an explicit deterministic reason:

- `ROLE_MISMATCH`;
- `COMPANY_TARGET_MISMATCH`;
- `DATE_AFTER_APPLICATION`;
- `DUPLICATE_ALIAS_OF_OTHER_CANDIDATE`;
- `DOCUMENT_NOT_RESUME`;
- `COVER_LETTER`;
- `SOURCE_MISSING`;
- `EXACT_DIGEST_ALREADY_REPRESENTED`;
- `OTHER_DETERMINISTIC_CONFLICT`.

Subjective resume quality is never an elimination basis.

## Duplicate Presentation

Exact digest duplicates are collapsed for operator display while preserving private source aliases and duplicate history.

J001.06C does not delete, rename, merge, rewrite, or supersede duplicate source files.

## Likely Version Family Handling

Likely-version families may classify members as:

- `OLDER_VARIANT`;
- `NEWER_VARIANT`;
- `ROLE_TARGETED_VARIANT`;
- `GENERAL_VARIANT`;
- `FORMAT_VARIANT`;
- `UNRESOLVED_FAMILY`.

Modified timestamp may support chronology but not semantic superiority. No supersession is created by this mission.

## Source Gap Result

For source-not-present readiness, J001.06C confirms whether the approved private source authority lacks:

- exact filename match;
- normalized filename match;
- digest-backed source;
- role/company-targeted source;
- duplicate alias resolution.

When all checks fail, the workflow records a private `SOURCE_DOCUMENT_NEEDED` action. It does not import any document.

## Operator Decision Model

J001.06C supports append-only owner-private review decisions:

- `CANDIDATE_PREFERRED`;
- `CANDIDATE_REJECTED`;
- `UNKNOWN`;
- `DEFER`;
- `SOURCE_MISSING_CONFIRMED`.

`CANDIDATE_PREFERRED` means only that the candidate should be carried forward for later submitted-resume confirmation. It does not mean `USED_FOR_SUBMISSION`.

## Readiness States

Application readiness after resolution is one of:

- `EXACT_SOURCE_READY`;
- `SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION`;
- `MULTIPLE_CANDIDATES`;
- `SOURCE_NOT_PRESENT`;
- `UNRESOLVED`.

The generated read-model output may also report `CONFIRMED_SOURCE_GAP` when no approved private source exists.

## Future J001.06D Boundary

J001.06D may create `USED_FOR_SUBMISSION` links only for Applications that reach `EXACT_SOURCE_READY` or `SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION`.

J001.06D must still require explicit Ross confirmation before creating an ApplicationResumeLink.

## Tests

Focused J001.06C tests verify:

- duplicate alias collapse without source deletion;
- deterministic candidate elimination;
- no newest-file-wins behavior;
- filename and role matches do not prove submission;
- review decisions do not create ApplicationResumeLinks;
- source-gap confirmation does not import files;
- private outputs remain owner-private and outside Git;
- no external actions or private UI route connections are introduced.

## Private Outputs

J001.06C may write owner-private artifacts for:

- review queue explanations;
- candidate elimination records;
- duplicate collapse records;
- likely-version-family analysis;
- source-gap records;
- operator review decisions;
- regenerated application-linkage readiness;
- processing audit summary.

No real source documents, resume filenames, document digests, private paths, or ApplicationResumeLinks are committed.

## Limitations

J001.06C cannot prove historical submitted-resume usage. It can only narrow the review queue or confirm a source gap under approved private authority.

Applications may remain `MULTIPLE_CANDIDATES`, `SOURCE_NOT_PRESENT`, or `UNRESOLVED` when deterministic evidence is insufficient.

## Rollback

Rollback is limited to removing the J001.06C generic code, tests, and documentation commit. Owner-private review decision artifacts should be superseded or removed only with explicit owner approval.

## Next Mission

If one or more Applications reach `SINGLE_CANDIDATE_NEEDS_OPERATOR_CONFIRMATION` or `EXACT_SOURCE_READY`, proceed to `J001_06D_OPERATOR_CONFIRMED_EXACT_RESUME_LINKAGE`.

If source gaps remain dominant, resolve only the proven missing-source issue before creating submitted-resume links.
