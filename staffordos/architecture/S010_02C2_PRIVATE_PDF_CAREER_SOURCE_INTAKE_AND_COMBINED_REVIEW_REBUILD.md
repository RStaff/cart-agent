# S010.02C2 Private PDF Career Source Intake and Combined Review Rebuild

## Mission

`S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD`
creates a new private combined career-evidence candidate set from supported PDF
and DOCX files currently present in the authorized private intake folder.

This mission does not generate a resume, score job fit, verify career facts,
select a canonical resume, invoke Ollama, call an external AI service, add UI,
add routes, write to a database, or inspect Apple Pages content.

The governing chain remains:

`FACT -> EVIDENCE -> OPERATOR VERIFICATION -> POSITIONING -> RESUME OR APPLICATION ARTIFACT`

## Checkpoint Authority

- Starting HEAD verified: `329eeb4da17bdcc68a96d50e1d26f3a56a849528`
- Branch observed: `main`
- No staged files were present before this mission.
- Required authorities verified:
  - `staffordos/architecture/S010_02A_CAREER_EVIDENCE_DISCOVERY_AND_CANONICAL_AUTHORITY.md`
  - `staffordos/architecture/S010_02B_CAREER_EVIDENCE_CONTRACT_AND_STATIC_VALIDATOR.md`
  - `staffordos/architecture/S010_02C_PRIVATE_CAREER_EVIDENCE_INTAKE_AND_CONFLICT_REGISTER.md`
  - `staffordos/ui/operator-frontend/lib/staffordos/careerEvidenceContracts.ts`
  - `staffordos/ui/operator-frontend/lib/staffordos/privateCareerEvidenceIntake.ts`
  - existing private S010.02C artifacts outside Git

Certified prior baseline:

- The DOCX-only S010.02C review queue had 14 items.
- S010.02C produced 98 noncanonical candidate facts and 3 private evidence
  records.
- No canonical resume was selected.
- No career fact was automatically verified.
- S010.02C1 Pages automation was blocked and no S010.02C1 commit exists.
- Private Pages-derived exports are uncertified and were excluded.

## Working Tree Exclusions

The repository contained broad preexisting unrelated modified and untracked
files. They were inventoried and excluded.

Only the following repository files are authorized for this mission:

- `staffordos/ui/operator-frontend/lib/staffordos/privatePdfCareerEvidenceIntake.ts`
- `staffordos/ui/operator-frontend/lib/staffordos/privatePdfCareerEvidenceIntake.test.mjs`
- `staffordos/architecture/S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD.md`
- `staffordos/architecture/S010_02C2_PRIVATE_PDF_CAREER_SOURCE_INTAKE_AND_COMBINED_REVIEW_REBUILD.json`

## Ollama Stopped State

`lsof -nP -iTCP:11434 -sTCP:LISTEN` returned no listener.

Ollama was not started or invoked.

## Authorized Private Source Location

Authorized folder:

`~/staffordos-private-intake/career`

The intake did not search Downloads, Desktop, Documents, email, cloud drives,
browser storage, or prior private export directories.

## Supported Source Inventory

Observed source counts:

| Source class | Count | Handling |
| --- | ---: | --- |
| PDF | 16 | Processed |
| DOCX | 4 | Processed |
| TXT or Markdown | 0 | None observed |
| Apple Pages file entries | 29 | Deferred; not inspected |
| Apple Pages package entries | 1 | Observed by filesystem only; not inspected |
| `.DS_Store` | 1 | Ignored |
| Other unsupported files | 0 | None observed |

Private source filenames, source IDs, digests, and local paths are retained only
in private local artifacts.

## PDF Extraction Result

PDF extraction used `/usr/bin/textutil` locally.

Result:

- PDF sources processed: 16
- PDF extraction failures: 0
- OCR used: false
- external API used: false
- external upload: false
- embedded links opened: false

Text extraction cache files remain private and outside Git.

## DOCX Extraction Result

DOCX extraction reused the S010.02C local DOCX XML reader.

Result:

- DOCX sources processed: 4
- DOCX extraction failures: 0
- macros executed: false
- embedded objects executed: false
- external links opened: false

## Deferred Pages Result

Apple Pages sources were not opened, parsed, converted, renamed, moved, copied,
deleted, or modified during this mission.

S010.02C1 private pilot and partial batch exports remain uncertified and were not
used as source authority.

## Document Purpose Classification

Aggregate document-purpose counts:

| Purpose | Count |
| --- | ---: |
| LinkedIn or profile export | 9 |
| Needs operator review | 3 |
| Non-career document or excluded source | 35 |
| Project or product evidence | 3 |

Purpose classification prepares review only. It does not select a canonical
resume or verify facts.

## Document Version and Duplicate Review

Aggregate duplicate and version classifications:

| Classification | Count |
| --- | ---: |
| Exact duplicate | 7 |
| Format derivative | 4 |
| Non-career source | 5 |
| Unique evidence source | 4 |
| Unknown purpose | 30 |

Modification time, repetition, source freshness, and document detail were not
used to select a canonical resume.

## Combined Candidate Career Facts

Private candidate facts created: 795

Counts by fact type:

| Fact type | Count |
| --- | ---: |
| Achievement | 26 |
| Certification | 11 |
| Education | 19 |
| Employment | 20 |
| Leadership | 48 |
| Presentation | 2 |
| Product | 607 |
| Project | 3 |
| Technology | 59 |

Every candidate fact remains noncanonical and unverified.

## Combined Career Evidence

Private evidence records created: 11

Evidence records preserve source references and limitations. They do not verify
career truth by themselves.

## Contact and Identity Review

Contact and identity values were detected and isolated privately.

Committed artifacts contain only aggregate counts and redacted classifications.

## Employment Conflicts

Employment-related conflict groups created: 1

No employer, title, date, client relationship, or positioning wording was
selected as canonical.

## Education and Certification Conflicts

Education conflict groups created: 1

Certification conflict groups created: 1

Resume or profile repetition did not verify education or credentials.

## Skill and Technology Context

Technology candidate facts created: 59

Skill-list appearances do not prove production use, recency, proficiency, or
years of experience.

## Project and Product Status Review

Project/product status conflict groups created: 2

Product and architecture claims require maturity review before they can support
career authority.

## Accomplishment and Metric Review

Metric review items created: 26

Material metric review items: 4

No metric was verified automatically.

## Positioning Variant Review

Positioning review items created: 1

Positioning language remains downstream from verified facts and cannot replace
official career facts.

## Business-to-Professional Evidence References

Cross-workspace candidate evidence records were created privately for
project/product references.

No Business data was copied into Professional authority and no model use was
authorized.

## Combined Operator Review Queue

Private combined review items created: 36

Counts by review category:

| Category | Count |
| --- | ---: |
| Achievement | 1 |
| Accomplishments and metrics | 22 |
| Certification | 1 |
| Contact and identity consistency | 1 |
| Education | 1 |
| Employment | 1 |
| Material metrics | 4 |
| Presentation | 1 |
| Product | 1 |
| Project | 1 |
| Positioning variants | 1 |
| Technology | 1 |

The review queue is private, noncanonical, and requires Ross review.

## Prior Queue Supersession

The prior DOCX-only S010.02C review queue was privately marked:

`SUPERSEDED_BY_S010_02C2_COMBINED_REVIEW`

The old queue was not deleted.

## Private Local Artifacts

Private artifact directory:

`~/.staffordos/private/professional/career/s010_02c2`

Private files:

- `combined_source_inventory.private.json`
- `combined_document_classification.private.json`
- `combined_document_version_review.private.json`
- `combined_candidate_career_facts.private.json`
- `combined_career_evidence.private.json`
- `combined_conflicts.private.json`
- `combined_contact_review.private.json`
- `combined_skill_context.private.json`
- `combined_project_product_review.private.json`
- `combined_metric_review.private.json`
- `combined_cross_workspace_evidence.private.json`
- `combined_operator_review_queue.private.json`

Private PDF text-cache files may also exist under the same private mission
directory. They are outside Git.

## Original Source Integrity

Supported source digests were checked before and after processing.

Result:

- source mutation detected: false
- original PDFs modified: false
- original DOCX files modified: false
- Pages inspected: false

## Privacy Controls

Confirmed:

- no real source filenames in committed artifacts
- no private absolute paths in committed artifacts
- no contact values in committed artifacts
- no real employer, title, date, school, certification, metric, PDF text, resume
  text, cover-letter text, or profile text in committed artifacts
- no private artifacts staged
- no external upload
- no AI or Ollama invocation
- no database, route, UI, or API path

## Tests

Focused synthetic S010.02C2 tests: `41/41` passed.

Regression validation:

- S010.02C: `24/24` passed.
- S010.02B: `38/38` passed.
- S010.01: `37/37` passed.
- S009: `126/126` passed.
- S008: `127/127` passed.

Build validation passed with the existing Next/Turbopack NFT warning and
existing `/operator/shopifixer-pilot` static-generation messages.

The committed S010.02C2 JSON and private S010.02C2 JSON artifacts passed `jq`.

## Known Limitations

- PDF extraction uses local `textutil` and may preserve line-level rather than
  semantically rich page structure.
- Candidate facts are heuristic review inputs, not canonical truth.
- Large product/project claim volume requires Ross review before verification.
- Apple Pages sources remain deferred.
- Uncertified S010.02C1 private exports remain excluded.
- No resume generation, job-fit scoring, persistence, UI, route, or model use
  exists.

## Rollback

Repository rollback:

`git revert <S010.02C2 commit SHA>`

Git rollback does not delete source PDFs, source DOCX files, original Pages
files, private combined artifacts, prior S010.02C artifacts, or uncertified
Pages-derived exports.

## Recommended Next Mission

`S010_02D_PRIVATE_CAREER_EVIDENCE_OPERATOR_REVIEW_DECISIONS`

That mission must use:

`combined_operator_review_queue.private.json`

It must not use the superseded DOCX-only queue.
