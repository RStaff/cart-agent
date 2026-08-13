# CareerOS Match Engine V1 Contract

Status: contract only. This document does not authorize production scoring, ranking, provider calls, or mutation of CareerFact or CareerEvidence.

## Purpose

`OpportunityMatchResult` is the future canonical, evidence-first projection for one opportunity. It must make the distinction between source facts, extracted requirements, Ross's career authority, qualification, fit, confidence, preferences, recommendation, workflow, and application state explicit.

The current repository does not implement this result as one authority. Current `J002.01` ranking, `J003.01` recommendation, `J010.01` qualification, Explainable Fit, and V1.19B preference compatibility remain separate authorities until a future implementation is validated.

## Contract

The JSON shape is defined in `CAREEROS_MATCH_ENGINE_V1_SCHEMA.json`.

Required top-level fields:

- Opportunity facts: `opportunityId`, `opportunityIdentity`, `sourceProvider`, `sourceJobId`, `canonicalUrl`, `company`, `title`, `location`, `workArrangement`, `employmentType`, `compensation`, `capturedAt`, `freshnessState`.
- Eligibility: `state`, `blockingReasons`.
- Qualification: categorical state and reasons from qualification authority; it is not ranking.
- Requirement summary: mandatory/preferred counts and supported/unsupported counts.
- Evidence summary: exact, transferable, weak, and unsupported counts.
- Fit: score contract, status, components, explanation.
- Confidence: separate score contract, status, missing inputs, explanation.
- Preferences: V1.19B compatibility and inspectable reasons.
- Recommendation: action state and reasons.
- Workflow: Ross's decision and decision time.
- Application: application, resume, and submission states.

## Authority Separation

1. Opportunity facts come from normalized source records and preserve provider provenance.
2. Requirements come from the requirement extractor; extraction does not prove Ross satisfies them.
3. CareerFact is immutable career history authority.
4. CareerEvidence is immutable/supporting evidence authority unless a separate governed mission changes it.
5. Qualification is deterministic categorical eligibility/fit-family assessment.
6. Fit scoring is a future derived projection and must not replace qualification.
7. Confidence describes trustworthiness/completeness of the assessment, not desirability.
8. Preferences are explicit operator-controlled job-search constraints, separate from career truth.
9. Workflow decisions are historical operator actions and never mutate preferences.
10. Application state is lifecycle state, not evidence of fit.

## Fit Score Contract

CareerOS currently has no canonical numeric fit score. Existing J002 `rankingSummary.totalScore` is a prioritization input, not a documented fit percentage or fit formula. Existing Explainable Fit supplies categorical recommendations, coverage, blockers, mappings, and limitations; it does not authorize a percentage.

The future `fit.scoreStatus` must be:

- `NOT_IMPLEMENTED`: no score is produced; `score` is null.
- `PARTIAL`: only explicitly approved components are calculated; incomplete inputs remain visible.
- `CALCULATED`: every approved component and weight is present and traceable.

Potential components are required-skill fit, relevant-experience fit, role/function fit, seniority fit, domain fit, responsibility similarity, geography/work-arrangement fit, and compensation fit. Weights, normalization, thresholds, and aggregation are TBD and require offline evaluation plus operator approval. No percentage is valid before that work.

## Confidence Contract

Confidence is separate from fit. It may eventually account for job-description completeness, evidence coverage, location certainty, compensation certainty, extraction certainty, and CareerEvidence authority quality. The contract permits a score, but current implementation must use `NOT_IMPLEMENTED` or `PARTIAL`; no confidence percentage is implied by evidence counts.

## Eligibility and Fail-Closed Rules

- Deterministic blockers may yield `INELIGIBLE` even when geography matches.
- Unknown location, work arrangement, requirement level, evidence, or stale state remains unknown/review-required.
- Absence of evidence is not evidence of absence.
- Transferable evidence is not exact-role evidence.
- Preference compatibility cannot rescue a hard qualification mismatch.
- Outside preference preserves the canonical opportunity and affects only the current derived presentation where V1.19B explicitly permits it.
- Every reason must link to a source fact, requirement, evidence mapping, authority state, or workflow record.

## Recommendation Contract

Recommendation is an operational projection, not a fit score. It may reuse current `APPLY_NOW`, `REVIEW`, `WAIT`, and `SKIP` states while preserving their existing semantics. `WAIT` must never be presented as a strong/top opportunity without its state and reason visible. Recommendation ordering must be deterministic and must not override hard blockers.

## Human Review Boundary

The result supports operator review. It does not submit applications, send messages, generate unsupported resume claims, or replace Ross's approval before external action.
