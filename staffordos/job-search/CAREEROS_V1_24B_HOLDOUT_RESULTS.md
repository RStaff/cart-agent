# CareerOS V1.24B Frozen V2D Holdout Evaluation

Offline holdout evaluation only. The V2D formula, weights, labels, preferences, J002/J003/J010, production ranking, shortlist, CareerFact, CareerEvidence, workflow, and application state were not changed.

## Preconditions

- Holdout opportunities: 40
- Completed holdout reviews: 40
- Calibration/holdout overlap: 0 (verified by manifest identity audit)
- Frozen model: MODEL_V2D_ROBUSTNESS_CONTROL (FROZEN_V1_23_V2D)
- Deterministic rerun: PASS
- Self-confidence, interest, would-pursue, and workflow are excluded from capability fit.

## Calibration vs holdout

| Metric | Calibration | Holdout | Delta |
|---|---:|---:|---:|
| top5Precision | 0 | 0.4 | 0.4 |
| top10Precision | 0.3 | 0.3 | 0 |
| strongRecall | 0.33 | 0.5 | 0.17 |
| strongGoodRecall | 0.33 | 0.3 | -0.03 |
| viableRecall | 0.23 | 0.35 | 0.12 |
| falsePositiveRate | 0.75 | 0.73 | -0.02 |
| falseNegativeRate | 0.29 | 0.4 | 0.11 |
| rankCorrelation | 0.13 | 0.28 | 0.15 |
| negativeLeakageTop5 | 2 | 1 | -1 |
| negativeLeakageTop10 | 3 | 2 | -1 |
| hardMismatchLeakageTop10 | 0 | 0 | 0 |
| underRankedViable | 16 | 10 | -6 |
| strongGoodBelow20 | 4 | 5 | 1 |

Calibration values are the frozen V1.23 V2D artifact; holdout values use the same metric definitions and cutoff methodology.

## Holdout distributions

- Preference: {"OUTSIDE_PREFERENCE":18,"UNKNOWN":22}
- Responsibility: {"PARTIAL":40}
- Seniority: {"ADJACENT_LEVEL":10,"UNRESOLVED":2,"UPWARD_STRETCH_WITH_SUPPORTED_SCOPE":28}
- Domain: {"TRANSFERABLE_DOMAIN":38,"UNRESOLVED_DOMAIN":2}

## Role families

| Family | Count | Top-5 precision | Top-10 precision | Strong/good recall | Viable recall | Negative leakage top 10 |
|---|---:|---:|---:|---:|---:|---:|
| AI_AUTOMATION_AGENT | 5 | 0.8 | 0.8 | 1 | 1 | 0 |
| BUSINESS_SYSTEMS_ANALYST | 1 | 0 | 0 | null | 1 | 0 |
| MARTECH_MARKETING_OPERATIONS | 5 | 0.4 | 0.4 | 1 | 1 | 1 |
| OBVIOUS_POOR_FIT_CONTROL | 5 | 0 | 0 | null | 1 | 4 |
| OTHER_CONTROL | 6 | 0 | 0 | null | 1 | 5 |
| PRODUCT | 5 | 0 | 0 | null | 1 | 4 |
| SENIOR_LEADERSHIP_STRETCH | 5 | 0 | 0 | null | 1 | 3 |
| TECHNICAL_PROGRAM_PROJECT_PRODUCT | 3 | 0.33 | 0.33 | 1 | 1 | 0 |
| TRANSFORMATION_SOLUTIONS | 5 | 0.6 | 0.6 | 1 | 1 | 0 |

## Generalization result

**FAILS_TO_GENERALIZE**. The holdout is independent evidence, not a tuning set. A 40-role holdout is too small for statistical certainty; the decision also requires review of leakage and family coverage below.

- False positives in model Top 20: 7
- Viable roles below rank 20: 10
- Required-skills audit samples: 10 negative high-signal and 10 viable low-signal roles.
