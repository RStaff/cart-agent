# CareerOS Matching Truth Audit V1

Date: 2026-08-13
Mission: `CAREEROS_V1_20_MATCHING_TRUTH_AUDIT_AND_MATCH_ENGINE_V1_CONTRACT`
Result: repository/runtime audit and contract only; production behavior unchanged.

## 1. Authority Verification

- Branch: `main`.
- Starting HEAD: `2dde58d79445223f9791bc95123f76edfbc0695c`.
- Starting staging: empty.
- Existing dirty/untracked work was preserved, including unrelated StaffordOS/Web work and pre-existing job-search documentation.
- StaffordOS agent registry was inspected: 15 registered agents, including 2 high-risk and 11 medium-risk agents. No matching-specific agent was required.
- Validator map `staffordos/qa/validator_map_v1.json` was inspected. It contains 17 governed validators but no dedicated CareerOS matching validator; focused CareerOS tests are local `*.test.mjs` modules.

## 2. Current Opportunity Lifecycle Map

`Greenhouse public board -> normalized source record -> duplicate/freshness review -> J002 discovery prioritization -> private import queue -> Explainable Fit requirements/evidence mappings -> J010 qualification -> J003 recommendation/read model -> command-center projections -> Ross workflow decision -> application intelligence -> truth-bound resume draft -> reviewed export -> manual submission record/artifact link -> follow-up/outcome events.`

The stages are separate artifacts and are joined by combinations of `providerJobId`, `jobSourceRecordId/sourceRecordId`, `opportunityId`, `canonicalOpportunityId`, `applicationId`, packet IDs, resume version IDs, and artifact version IDs. The future contract is needed because these joins are not currently one canonical matching result.

## 3. Discovery Authority

Primary current provider: Greenhouse public-board discovery in `greenhouseDiscoveryProvider.ts`. It captures provider job ID, company, title, location, source URL, description, remote state, employment type, compensation text, provider/source authority, retrieval time, and source digest. Canonical URLs are constructed from the Greenhouse board/job identity. Provider records are normalized into `privateJobSourceImportQueue.ts` and then prioritized by `jobDiscoveryPrioritization.ts`.

Freshness states are `RECENT`, `UNKNOWN`, and `STALE`. Queue state can become `STALE`, `DUPLICATE`, or `NEEDS_OPERATOR_REVIEW`; such records are retained and held from application planning. Duplicate grouping uses deterministic normalized identity/candidate comparisons and creates a canonical member, but duplicate equivalence remains an operator-review boundary for ambiguous cases.

Limits: current source truth does not prove a posting is still open merely because it was captured. Built In, LinkedIn, Indeed, and other providers are not current authorities. Source absence is not a fit judgment.

## 4. Requirement Extraction Authority

`jobRequirementExtractor.ts` parses source text into `PrivateJobRequirementRecord` values using section hints, requirement cues, noise filtering, normalized text, stable IDs derived from normalized requirement text plus source excerpt reference, category, level, years/degree/certification/technology signals, extraction confidence, and ambiguity. Pay/EEO/benefit and section-heading noise is filtered through narrow structural rules.

Required versus preferred is represented by requirement level/importance classification, but extraction itself does not prove a sentence is mandatory in the employer's legal or practical sense. A requirement can be malformed or ambiguous and must retain provenance. One requirement can be mapped to evidence through `candidateEvidenceMapper.ts`, but the mapping is a separate authority.

## 5. Career Evidence Authority

CareerFact and CareerEvidence remain separate, immutable authorities. Evidence mappings classify support such as `PROVEN`, `PARTIAL`, `TRANSFERABLE`, or unsupported and retain explanation, matched signals, safe positioning, and source references. Current Explainable Fit artifacts are reused by J003; no AI confidence or probability is generated.

Safe matching input: operator-confirmed/documented career facts and evidence with provenance. Resume wording is not career truth. Unsupported or unresolved evidence cannot be promoted to exact support. Current evidence linkage is explicit at the requirement mapping layer, but the compact recommendation read model carries only evidence counts, not the full mapping.

## 6. Qualification Authority

`opportunityQualification.ts`, version `J010.01`, is deterministic categorical qualification. States are `HARD_MISMATCH`, `TRANSFERABLE_BUT_NOT_DIRECT`, `PLAUSIBLE_TARGET`, and `INSUFFICIENT_EVIDENCE`. Rules cover unsupported required certification/licensure/clearance, specialist engineering/research/security patterns, incompatible role families, and certain mandatory location language. Unknown evidence alone is not a hard mismatch.

Shortlist projection independently checks qualification, recommendation state, supporting evidence, total score, and role patterns. Qualification is not ranking and does not calculate a percentage.

## 7. Recommendation/Ranking Authority

`opportunityRecommendationEngine.ts`, version `J003.01`, consumes the J002 queue, existing Explainable Fit artifacts, and resume-version authority. It orders queue items by J002 `rankingSummary.totalScore` with deterministic company/role/ID tie breakers. Recommendation states are `APPLY_NOW`, `REVIEW`, `WAIT`, and `SKIP`.

`WAIT` is generated for stale/duplicate/operator-review queue items, missing fit, low-priority/low-total-score records, or other unresolved planning conditions. `REVIEW` is generated when evidence, resume safety, or fit review is needed. The compact read model exposes recommendation, qualification, shortlist flag, evidence/missing counts, readiness, and captured time, but not location, work arrangement, full requirements, or full evidence mappings.

### Numeric fit result

**CareerOS does not currently have a canonical numeric fit score.** J002 `totalScore` is a prioritization/ranking score with no documented fit-percentage formula in the inspected J002/J003 authorities. Explainable Fit has categorical recommendation/coverage/blocker data. No percentage, hiring probability, interview probability, or AI confidence score is generated.

## 8. Preference Authority

V1.19B/V1.19C `jobSearchPreferences.ts` and `jobSearchPreferencesAuthority.ts` define the canonical explicit job-search preference authority. It is separate from CareerFact, CareerEvidence, and workflow history. It supports preferred/acceptable semantic regions, remote/hybrid/on-site acceptance, and relocation. `projectJobSearchCompatibility` returns `MATCH`, `PARTIAL_MATCH`, `OUTSIDE_PREFERENCE`, or `UNKNOWN` with human-safe reasoning and qualification-block metadata.

Runtime inspection found no explicit Ross preference record in the private store. The loaded state is `AWAITING_ROSS_CONFIRMATION` / unresolved, so current compatibility remains `UNKNOWN` and geography filtering is not active. No preference was inferred or invented.

## 9. Application Intelligence Linkage

Application Intelligence joins recommendation/source/fit/requirement/evidence records through source record, opportunity, queue, and fit identifiers. It carries identity, requirements, mappings, gaps, resume safety/readiness, positioning, and operator review constraints. It explicitly excludes raw job text, source URLs, raw resume text, private paths, and execution controls from its read model.

The linkage is adequate for current artifacts when IDs resolve, but it is not a single immutable `OpportunityMatchResult`; missing or historical IDs can yield UNKNOWN states.

## 10. Resume/Application Lifecycle Linkage

The intended current chain is opportunity/source identity -> packet -> resume version -> reviewed draft -> artifact version -> manual submission -> application/follow-up events. Manual submission recording requires operator confirmation, submission date, source/job packet linkage, and a non-submitted export artifact. It records `MANUAL_EXTERNAL` and preserves artifact linkage when available.

The current submission read model contains one submitted Business Systems Analyst sample and exposes application/artifact status, company/role, submitted date, stage, resume artifact information, and safe known/unknown flags. It does not surface the opportunity ID in the compact read model, although the private result contract carries `jobOpportunityId`; this is a P1 linkage/read-model defect for auditability. Historical UNKNOWN linkage must be reconciled before migration.

## 11. Source Freshness Matrix

| Surface | Authority/read model | Current observed lineage | Freshness result |
|---|---|---|---|
| Today's Brief / Priorities | `careerOsDailyJobSearchExperience.ts` from command-center projection and workflow state | current loader combines recommendation captured time, preference projection, and workflow artifacts | current recommendation timestamp is available; mixed artifact ages remain possible |
| Top Opportunities | `careerOsCommandCenterPresentation.ts` / V1.19A projection | filtered decision projection, not a new ranking authority | current J003 run; source timestamp is not prominent in card data |
| Opportunity Decisions | command-center presentation from J003 recommendation read model | current shortlisted J003 records plus workflow state | current recommendation artifact, workflow may be older |
| Application Intelligence | `applicationIntelligencePacket.ts` read model | latest private packet exports joined by opportunity/source IDs | artifact-specific; linkage can be UNKNOWN |
| Resume Drafts | `truthBoundResumeDraft.ts` read model | latest private draft read model | draft timestamp/version-specific |
| Resume Files | `reviewedResumeDraftExport.ts` read model | latest export run; current private runtime has export artifacts | export lineage is explicit by artifact version |
| Application Pipeline | `privateApplicationPipelineReview.ts` | current application/follow-up store projection | application history may predate current recommendation |
| Follow-Up & Outcomes | application engagement/event read models | application IDs and event history | valid historical state, not recommendation freshness |
| Search Health | Greenhouse discovery audit/queue summary | latest Greenhouse run | source/provider freshness, not fit freshness |

No deletion or artifact rewrite was performed. Current loader chooses latest matching artifact families but does not prove that every joined family was generated from one atomic run. Future Match Engine results must carry captured-at/run lineage explicitly.

## 12. Runtime Sample Findings

Inspected current private J003.01 recommendations: 253 records. Runtime counts previously observed from the same current artifact are 0 PLAUSIBLE_TARGET, 183 TRANSFERABLE_BUT_NOT_DIRECT, 24 INSUFFICIENT_EVIDENCE, and 46 HARD_MISMATCH. The compact recommendation records carry no numeric fit score.

| Sample | Qualification | Recommendation/shortlist | Preference | Linkage observation |
|---|---|---|---|---|
| Datadog, Director TPM - Technical Solutions Operations | TRANSFERABLE_BUT_NOT_DIRECT | REVIEW / shortlisted | UNKNOWN because preferences unresolved | recommendation/source/fit linkage exists |
| Datadog, Director Product Management - AI Observability | TRANSFERABLE_BUT_NOT_DIRECT | REVIEW / shortlisted | UNKNOWN | current decision candidate |
| Scale AI, AI Infrastructure Engineer, Sandbox Platform | HARD_MISMATCH | WAIT / not shortlisted | UNKNOWN | canonical recommendation retained; hard mismatch visible in private truth |
| Anthropic, Cash Manager, Treasury | HARD_MISMATCH | WAIT / not shortlisted | UNKNOWN | canonical recommendation retained; unrelated role-family mismatch |
| Figma, AV Production Specialist | INSUFFICIENT_EVIDENCE | WAIT / not shortlisted | UNKNOWN | weak/unknown evidence case |
| Anthropic, Business Systems Analyst | TRANSFERABLE_BUT_NOT_DIRECT | REVIEW / shortlisted in recommendation | UNKNOWN in current unresolved preference state | submitted sample has artifact linkage, but compact submission view omits opportunity ID |

The current private recommendation record does not carry location/work arrangement. Those facts exist on normalized source records and require a source-record join for runtime verification. The inspected current artifact set did not provide a clean runtime record with explicit Ross preferences, so compatible/outside examples cannot be claimed as active filtered runtime proof.

## 13. UI/Read-Model Consistency Findings

- Today's Priorities and Opportunity Decisions are derived from current command-center/read-model projections, but source freshness and complete location evidence are not self-contained in each card.
- Shortlisted Opportunities is a derived decision set, not the canonical opportunity universe. It must not be described as all discovered jobs or as a percentage-ranked list.
- Top Opportunities is safe only when it uses the curated shortlist/qualification projection; raw first-N recommendation projection is semantically unsafe.
- Application Intelligence exposes useful fit/gap/resume readiness but requires joins and progressive disclosure.
- Resume draft/export flows preserve human approval and truth-bound constraints; they are not matching evidence.
- Follow-up/outcome state is application lifecycle history and must not influence durable preferences automatically.
- Career Home/Professional navigation and placeholder controls remain usability findings from prior audits; no UI was changed here.
- No UI surface was found that displays a canonical numeric score; adding one without a formula would be misleading.

## 14. Defect Classification

### P0

No new P0 defect was reproduced in this audit. No external action, CareerFact/CareerEvidence mutation, or destructive migration occurred.

### P1

- No canonical numeric fit score; current operator cannot compare a defensible percentage.
- Matching truth is fragmented across J002 ranking, J003 recommendation, J010 qualification, Explainable Fit, source records, and preference projection.
- Hard mismatches remain in the recommendation universe and require safe projection boundaries.
- Current preference authority is unresolved, so real geography filtering is inactive.
- Submitted compact read model does not expose opportunity linkage, requiring private joins to verify lifecycle continuity.

### P2

- Location/work arrangement are not carried in the compact recommendation record.
- Artifact families can have different timestamps/run lineages; atomic cross-artifact freshness is not proven.
- Requirement ambiguity and evidence detail are collapsed to counts in compact projections.
- Provider coverage is limited to current Greenhouse authority; missing providers are not distinguishable from absent opportunities in the operator surface.

### P3

- Naming/presentation polish around score-like language, freshness, and source provenance remains for later UI work.

## 15. Canonical Match Engine V1 Summary

The contract and JSON schema created alongside this audit define `OpportunityMatchResult`, with explicit eligibility, qualification, requirement/evidence summaries, non-fabricated fit/confidence score status, preference compatibility, recommendation, workflow, and application state. It preserves fail-closed unknowns, deterministic traceability, immutable career authorities, and human approval.

## 16. Offline Evaluation Plan

The companion plan specifies a 30-50 opportunity stratified evaluation, human labels, evidence/geography/explanation checks, deterministic reruns, proposed safety gates, and operator approval for thresholds. It intentionally does not invent accuracy percentages or scoring weights.

## 17. Changes and Validation

Created only the five requested documentation/contract artifacts under the existing `staffordos/job-search` authority location. No production source, UI, provider, private artifact, CareerFact, CareerEvidence, application, or workflow record changed. JSON files were parsed with Node; focused source inspection and current private-artifact inspection were performed. Existing relevant CareerOS test files were identified but no production test behavior was modified.

## 18. Limitations and Next Mission

The current Node runtime cannot directly execute the TypeScript loader without the repository's Next/TypeScript module resolution, so runtime verification used read-only inspection of the current private JSON artifacts and source-defined loader paths. A browser acceptance test was not needed for this audit-only contract mission. Exact preference compatibility examples remain unproven because Ross's explicit preference record is unresolved.

Recommended next bounded mission: implement and offline-evaluate the contract-driven Match Engine V1 against 30-50 reviewed opportunities, after operator approval of labels and thresholds. Do not begin that mission as part of this audit.

## Confirmations

NO PUSH. NO DEPLOY. NO APPLICATION SUBMISSION. NO MESSAGE. NO PROVIDER EXPANSION. NO CAREERFACT MUTATION. NO CAREEREVIDENCE MUTATION. NO AUTOMATIC PREFERENCE LEARNING. NO NEW RANKING ENGINE. NO NEW FIT PERCENTAGE IN PRODUCTION. NO EXTERNAL ACTION.
