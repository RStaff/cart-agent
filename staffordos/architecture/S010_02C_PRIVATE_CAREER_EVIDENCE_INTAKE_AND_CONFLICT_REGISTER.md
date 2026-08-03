# S010.02C Private Career Evidence Intake and Conflict Register

## Mission

`S010_02C_PRIVATE_CAREER_EVIDENCE_INTAKE_AND_CONFLICT_REGISTER` creates a
governed private intake path for Ross Stafford's real career source materials.

The mission processes only explicitly authorized private DOCX files. It does not
make resumes canonical truth, verify facts, generate resumes, calculate fit,
invoke Ollama, call external AI, create UI, create routes, write to a database,
or modify source documents.

The required operating relationship remains:

`FACT -> EVIDENCE -> OPERATOR VERIFICATION -> POSITIONING -> RESUME OR APPLICATION ARTIFACT`

## Checkpoint Authority

- Starting HEAD verified: `8c515090df176b49c5f55d3132ecb8e8f2418f3c`
- Branch observed: `main`
- No staged files were present before this mission.
- Required authorities verified:
  - `staffordos/architecture/STAFFORDOS_ARCHITECTURE_V1.md`
  - `staffordos/architecture/S010_00_PROFESSIONAL_WORKSPACE_JOB_SEARCH_COMMAND_DISCOVERY.md`
  - `staffordos/architecture/S010_01_JOB_OPPORTUNITY_AND_REQUIREMENT_CONTRACT.md`
  - `staffordos/architecture/S010_02A_CAREER_EVIDENCE_DISCOVERY_AND_CANONICAL_AUTHORITY.md`
  - `staffordos/architecture/S010_02B_CAREER_EVIDENCE_CONTRACT_AND_STATIC_VALIDATOR.md`
  - `staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.ts`
  - `staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.test.mjs`
  - S008 Evidence, Proof, and Learning foundations
  - S009 source-tracing and validation doctrine

Certified baseline:

- CareerFact and CareerEvidence contracts exist.
- No real Ross career records existed in canonical StaffordOS authority.
- No resume is canonical truth.
- Real Professional data is owner-private.
- Generated documents cannot establish truth by themselves.
- Conflicts remain unresolved until Ross reviews them.
- No resume generation or job-fit scoring is authorized.

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked
files. They were inventoried and excluded from this mission.

Excluded categories:

- `RUNTIME_OR_DAEMON`
- `WEB_OR_PRISMA`
- `S007_IDENTITY_OR_ISSUER`
- `MISSION_EVIDENCE`
- `GENERATED`
- `PREEXISTING_UNRELATED`

Authorized committed files:

- `staffordos/ui/operator-frontend/lib/staffordos/privateCareerEvidenceIntake.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/privateCareerEvidenceIntake.test.mjs`
- `staffordos/architecture/S010_02C_PRIVATE_CAREER_EVIDENCE_INTAKE_AND_CONFLICT_REGISTER.md`
- `staffordos/architecture/S010_02C_PRIVATE_CAREER_EVIDENCE_INTAKE_AND_CONFLICT_REGISTER.json`

## Ollama Stopped State

`lsof -nP -iTCP:11434 -sTCP:LISTEN` returned no listener before intake and after
private artifact creation.

Ollama was not started, invoked, or connected to private career materials.

## Authorized Private Intake Location

Authorized source directory:

`~/staffordos-private-intake/career`

Scope decision:

- Process only DOCX files.
- Ignore `.DS_Store`.
- Do not open, parse, convert, rename, move, copy, delete, or modify `.pages`
  files.
- Record `.pages` files as deferred unsupported source files.
- Do not broaden supported source types.

## Source Document Inventory

Observed source-type counts:

| Type | Count | Handling |
| --- | ---: | --- |
| DOCX | 3 | Processed |
| Pages | 29 | Deferred unsupported source files |
| `.DS_Store` | 1 | Ignored |
| Other unsupported files | 0 | None observed |

The current filesystem inventory observed 29 `.pages` files. Filenames and
private source IDs are retained only in the private local source inventory.

## Supported DOCX Sources Processed

Supported DOCX sources processed: 3

All supported DOCX sources were processed read-only. Full filenames, private
source IDs, extracted text, and source-specific facts remain only in private
local artifacts.

## Private Storage Boundary

Private source files stayed outside Git.

Private output directory:

`~/.staffordos/private/professional/career/s010_02c`

Private output files are owner-readable/writable only and are not committed.

No repository symlink, route, API, model access, database access, cloud upload,
or automatic sharing was introduced.

## Content Extraction Result

DOCX extraction used a local reader built with Node standard-library ZIP, XML,
hashing, and filesystem APIs.

Extraction results:

- Supported DOCX sources processed: 3
- DOCX extraction failures: 0
- Source files modified: false
- OCR used: false
- Macros or embedded content executed: false
- External upload: false
- Model invocation: false

Section-level provenance is preserved through private source IDs and paragraph
references.

## Candidate Career Facts

Private candidate facts created: 98

Counts by fact type:

| Fact type | Count |
| --- | ---: |
| Achievement | 5 |
| Certification | 10 |
| Education | 13 |
| Employment | 22 |
| Leadership | 23 |
| Project | 9 |
| Technology | 16 |

Every candidate fact remains noncanonical and unverified. The intake uses only
these statuses:

- `PROPOSED`
- `NEEDS_EVIDENCE`
- `PARTIALLY_SUPPORTED`
- `CONFLICTING`
- `HISTORICAL_ONLY`

No fact was marked `VERIFIED`.

## Career Evidence Result

Private evidence records created: 3

Each DOCX was treated as resume evidence with generated-document authority. A
resume may support or challenge a claim, but it does not verify career truth by
itself.

## Employment Conflicts

Employment conflict records created: 1

The conflict register preserves differing employment wording and date-bearing
claims without choosing a winner. The private artifact contains the source IDs
and exact review material.

## Education and Certification Conflicts

Education conflict records created: 1

Certification conflict records created: 1

No education or certification claim was verified from resume wording alone.

## Skill and Technology Context

Technology candidate facts created: 16

Skill-list appearances were classified as needing verification. The intake does
not infer production use, recency, proficiency, or years of experience from a
skill list.

## Accomplishment and Metric Review

Achievement candidate facts created: 5

Metric-related review items created: 7

Resume wording alone did not verify any metric. Metrics remain unsupported or
needing review until an approved measurement source exists.

## Business-to-Professional Evidence References

Cross-workspace candidate evidence references created: 1

This register identifies references to StaffordOS, ShopiFixer, Abando, AI
automation, CI/CD, or DevOps as Professional review candidates only. It does not
copy Business data into Professional authority or authorize model use.

## Document Version and Duplicate Review

The intake preserved duplicate and variant status without choosing a canonical
resume.

Observed result:

- DOCX sources: 3
- exact duplicates detected: 0
- content variants: present
- canonical resume selected: false

Modification time was recorded as file metadata only. It was not treated as
career fact authority.

## Operator Review Queue

Private review items created: 14

Counts by category:

| Category | Count |
| --- | ---: |
| Identity and contact details | 1 |
| Employment | 1 |
| Education | 1 |
| Certification | 1 |
| Project | 1 |
| Technology | 1 |
| Achievement | 1 |
| Accomplishments and metrics | 7 |

Every review item has permitted operator decisions and no automatic selection.

## Deferred Pages Sources

Deferred `.pages` source records created: 29

Each deferred record includes:

- private source ID
- filename
- extension
- size
- modified time
- status: `DEFERRED_UNSUPPORTED_SOURCE_FILE`
- required operator action: export to PDF or DOCX
- content inspected: false

The `.pages` files were not opened, parsed, converted, renamed, moved, copied,
deleted, or modified.

## DOCX Extraction Failures

DOCX extraction failures: 0

No unsafe fallback was attempted.

## Private Local Artifacts

Private local artifacts created outside Git:

- `~/.staffordos/private/professional/career/s010_02c/career_source_inventory.private.json`
- `~/.staffordos/private/professional/career/s010_02c/deferred_sources.private.json`
- `~/.staffordos/private/professional/career/s010_02c/candidate_career_facts.private.json`
- `~/.staffordos/private/professional/career/s010_02c/career_evidence.private.json`
- `~/.staffordos/private/professional/career/s010_02c/career_conflicts.private.json`
- `~/.staffordos/private/professional/career/s010_02c/career_review_queue.private.json`

All private artifacts are explicitly noncanonical.

## Real-Data Commit Scan

The committed diff contains no private career source text, contact values,
private file paths, source document contents, extracted real facts, recruiter
names, education details, certification details, or resume text.

Private source filenames and extracted content remain in private local artifacts
only.

## Tests

Focused synthetic tests cover:

- explicit intake directory requirement
- repository path rejection
- unsupported and deferred file handling
- source-file non-mutation
- deterministic content digests
- DOCX paragraph-level provenance
- source references for extracted facts
- unverified fact status
- employer, title, and date conflict preservation
- contact isolation
- unsupported metrics
- skill-list context limits
- generated resume boundary
- cross-workspace candidate evidence
- duplicate detection without merging
- deterministic review queue
- noncanonical private outputs
- private outputs outside Git
- source test privacy
- non-mutating conflict detection
- no network, model, database, route, or persistence dependency

Focused test result: `24/24` passed.

Regression and validation results:

- S010.02B Career Evidence contract tests: `38/38` passed.
- S010.01 Job Opportunity contract tests: `37/37` passed.
- S009 focused tests: `126/126` passed.
- S008 focused tests: `127/127` passed.
- `npm run build` in `staffordos/ui/operator-frontend`: passed with existing
  Next/Turbopack and `/operator/shopifixer-pilot` static-generation warnings.
- `jq` validation for committed S010.02C JSON: passed.
- `jq` validation for private local JSON artifacts: passed.
- `git diff --check`: passed.

## Boundary Safety

Confirmed:

- no external upload occurred
- no model was invoked
- no Ollama listener existed
- no source file was modified
- no resume was rewritten
- no fact was silently verified
- no conflict was silently resolved
- no private output was staged
- no personal information entered Git
- no database or API was used
- no route or UI was added
- no application was created
- no job fit was calculated
- no external communication occurred

## Files Changed

- `staffordos/ui/operator-frontend/lib/staffordos/privateCareerEvidenceIntake.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/privateCareerEvidenceIntake.test.mjs`
- `staffordos/architecture/S010_02C_PRIVATE_CAREER_EVIDENCE_INTAKE_AND_CONFLICT_REGISTER.md`
- `staffordos/architecture/S010_02C_PRIVATE_CAREER_EVIDENCE_INTAKE_AND_CONFLICT_REGISTER.json`

## Known Limitations

- Only DOCX files are processed in this mission.
- `.pages` files require a separate operator-controlled export mission.
- Extraction is deterministic and heuristic; it prepares review, not truth.
- Candidate facts are not canonical.
- Contact values remain isolated.
- No resume generation, fit scoring, persistence, UI, route, or model use exists.
- Future verification requires Ross's explicit review.

## Operator Export Action Required

Export deferred `.pages` files to PDF or DOCX in a separate operator-controlled
mission if they should be included in career evidence intake.

## Rollback

Repository rollback:

`git revert <S010.02C commit SHA>`

Private local artifacts are not removed by Git rollback. Deleting private
evidence artifacts requires separate Ross authorization. Do not delete source
resumes.

## Recommended Next Mission

`S010_02D_PRIVATE_CAREER_EVIDENCE_OPERATOR_REVIEW_DECISIONS`

Recommended scope:

- review private conflict and metric queues with Ross
- promote only explicitly approved facts to verified career authority
- keep private artifacts outside Git
- do not generate resumes or calculate job fit
