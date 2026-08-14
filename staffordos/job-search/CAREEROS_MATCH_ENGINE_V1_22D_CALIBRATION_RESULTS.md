# CareerOS Match Engine V1 Calibration Results

Offline evaluation only. No production ranking, fit percentage, shortlist, workflow, CareerFact, or CareerEvidence behavior was changed.

- Dataset: 40 real evaluation records
- Human reviews: 40/40 valid
- Preference authority: explicit; consumed for evaluation only
- Baseline: EXPERIMENTAL_WEIGHT_SET_V1

## Human labels

Evidence fit: {"GOOD_MATCH":6,"HARD_NO":5,"POOR_MATCH":4,"STRETCH":10,"STRONG_MATCH":3,"TRANSFERABLE":12}
Interest: {"HIGH":10,"LOW":11,"MEDIUM":11,"NONE":8}
Would pursue: {"MAYBE":6,"NO":20,"YES":14}
Self-confidence: {"HIGH":3,"LOW":28,"MEDIUM":9}

## Baseline metrics

Metrics use STRONG_MATCH + GOOD_MATCH as the primary positive set. Viable recall adds TRANSFERABLE + STRETCH. Top-k agreement is overlap with the human evidence-fit ordering; false-positive/false-negative rates use the documented median-score cutoff among non-ineligible records.

### EXPERIMENTAL_WEIGHT_SET_V1

```json
{
  "weightSet": {
    "requiredSkillsFit": 35,
    "relevantExperienceFit": 20,
    "roleFunctionFit": 15,
    "responsibilitySimilarity": 10,
    "seniorityFit": 8,
    "domainFit": 7,
    "geographyWorkArrangementFit": 5,
    "compensationFit": 0
  },
  "top5Precision": 0,
  "top10Precision": 0.2,
  "top5Agreement": 0,
  "top10Agreement": 0.2,
  "strongRecall": 0,
  "strongGoodRecall": 0.22,
  "viableRecall": 0.23,
  "falsePositiveRate": 0.75,
  "falseNegativeRate": 0.29,
  "viableFalsePositiveRate": 0.25,
  "rankCorrelation": 0.06,
  "hardMismatchLeakageTop10": 0,
  "actionableHardMismatchLeakage": 0,
  "poorMatchLeakageTop10": 3,
  "underRankedPrimary": 4,
  "underRankedViable": 16,
  "highConfidencePrimaryRate": 0,
  "lowConfidencePrimaryRate": 0.26,
  "threshold": {
    "cutoff": 30.63,
    "falsePositiveRate": 0.75,
    "falseNegativeRate": 0.29,
    "predictedCount": 20
  }
}
```

## Under-ranking

Found 16 viable human-positive roles ranked below 20.
- M21-040 Anthropic — Applied AI Engineer, Enterprise Tech: STRETCH, rank 32, score 1.42, cause AUTHORITY_CONFLICT
- M21-039 Anthropic — Anthropic Fellows Program, The Anthropic Institute (Economics & Policy): STRETCH, rank 37, score 0, cause AUTHORITY_CONFLICT
- M21-038 Anthropic — Anthropic Fellows Program, ML Systems & Reinforcement Learning: STRETCH, rank 36, score 0, cause AUTHORITY_CONFLICT
- M21-034 Scale AI — Engineering Manager, Agent Oversight: STRETCH, rank 31, score 1.51, cause AUTHORITY_CONFLICT
- M21-013 Anthropic — Data Engineer, Safeguards: STRETCH, rank 25, score 15.31, cause GEOGRAPHY_GAP
- M21-006 Anthropic — Director, Global Order-to-Cash Transformation: STRETCH, rank 26, score 5.01, cause AUTHORITY_CONFLICT
- M21-037 Anthropic — Anthropic Fellows Program, AI Safety & Security: TRANSFERABLE, rank 35, score 0, cause AUTHORITY_CONFLICT
- M21-036 Anthropic — Anthropic Fellows Program: TRANSFERABLE, rank 34, score 0, cause AUTHORITY_CONFLICT
- M21-010 Anthropic — Applied AI Architect, Commercial: TRANSFERABLE, rank 22, score 15.31, cause GEOGRAPHY_GAP
- M21-009 Scale AI — AI Builder Intern: TRANSFERABLE, rank 21, score 27.22, cause EVIDENCE_GAP
- M21-004 Scale AI — Frontier Agent Engineering Manager, Enterprise: TRANSFERABLE, rank 33, score 1.23, cause AUTHORITY_CONFLICT
- M21-001 Scale AI — AI Infrastructure Engineer, Sandbox Platform: TRANSFERABLE, rank 40, score 0, cause AUTHORITY_CONFLICT
- M21-011 Anthropic — Applied AI Architect, Enterprise Tech: GOOD_MATCH, rank 23, score 15.31, cause GEOGRAPHY_GAP
- M21-008 Airtable — Program Manager, Professional Services - West: GOOD_MATCH, rank 30, score 2.41, cause AUTHORITY_CONFLICT
- M21-007 Airtable — Program Manager, Professional Services - East: GOOD_MATCH, rank 29, score 2.41, cause AUTHORITY_CONFLICT
- M21-012 Anthropic — Applied AI Architect, Industries: STRONG_MATCH, rank 24, score 15.31, cause GEOGRAPHY_GAP

## Over-ranking

Found 3 POOR_MATCH/HARD_NO roles in the engine top 10.
- M21-015 Scale AI — [Annotations] Operations Program Manager: HARD_NO, rank 1, score 54.44, cause TRANSFERABILITY_UNDERVALUE
- M21-023 Anthropic — Cloud Partner Enablement Lead: POOR_MATCH, rank 3, score 30.63, cause GEOGRAPHY_GAP
- M21-026 Airtable — Delivery Consultant: POOR_MATCH, rank 6, score 54.44, cause GEOGRAPHY_GAP

## Component diagnostics

Component correlations are Spearman correlations against the ordinal human evidence-fit labels. They are descriptive only and do not authorize new weights.

```json
{
  "requiredSkillsFit": {
    "count": 32,
    "correlation": -0.25,
    "meanByLabel": {
      "HARD_NO": 3.82,
      "POOR_MATCH": 8.68,
      "STRETCH": 2.57,
      "TRANSFERABLE": 0.9,
      "GOOD_MATCH": 2.75,
      "STRONG_MATCH": 1.15
    }
  },
  "relevantExperienceFit": {
    "count": 40,
    "correlation": 0.19,
    "meanByLabel": {
      "HARD_NO": 14,
      "POOR_MATCH": 70,
      "STRETCH": 31.5,
      "TRANSFERABLE": 40.83,
      "GOOD_MATCH": 40.83,
      "STRONG_MATCH": 58.33
    }
  },
  "roleFunctionFit": {
    "count": 40,
    "correlation": 0.19,
    "meanByLabel": {
      "HARD_NO": 14,
      "POOR_MATCH": 70,
      "STRETCH": 31.5,
      "TRANSFERABLE": 40.83,
      "GOOD_MATCH": 40.83,
      "STRONG_MATCH": 58.33
    }
  },
  "responsibilitySimilarity": {
    "count": 40,
    "correlation": null,
    "meanByLabel": {
      "HARD_NO": 0,
      "POOR_MATCH": 0,
      "STRETCH": 0,
      "TRANSFERABLE": 0,
      "GOOD_MATCH": 0,
      "STRONG_MATCH": 0
    }
  },
  "seniorityFit": {
    "count": 0,
    "correlation": null,
    "meanByLabel": {
      "HARD_NO": null,
      "POOR_MATCH": null,
      "STRETCH": null,
      "TRANSFERABLE": null,
      "GOOD_MATCH": null,
      "STRONG_MATCH": null
    }
  },
  "domainFit": {
    "count": 0,
    "correlation": null,
    "meanByLabel": {
      "HARD_NO": null,
      "POOR_MATCH": null,
      "STRETCH": null,
      "TRANSFERABLE": null,
      "GOOD_MATCH": null,
      "STRONG_MATCH": null
    }
  },
  "geographyWorkArrangementFit": {
    "count": 18,
    "correlation": null,
    "meanByLabel": {
      "HARD_NO": null,
      "POOR_MATCH": 0,
      "STRETCH": 0,
      "TRANSFERABLE": 0,
      "GOOD_MATCH": 0,
      "STRONG_MATCH": 0
    }
  },
  "compensationFit": {
    "count": 0,
    "correlation": null,
    "meanByLabel": {
      "HARD_NO": null,
      "POOR_MATCH": null,
      "STRETCH": null,
      "TRANSFERABLE": null,
      "GOOD_MATCH": null,
      "STRONG_MATCH": null
    }
  }
}
```

## Confidence

Confidence is evaluated separately from fit. Self-confidence is not used in any score, rank, or weight calculation.

```json
{
  "highConfidenceCount": 3,
  "lowConfidenceCount": 19,
  "primaryRateHigh": 0,
  "primaryRateLow": 0.26,
  "selfConfidenceNotUsed": true
}
```

## Preference and geography

```json
{
  "distribution": {
    "OUTSIDE_PREFERENCE": 18,
    "UNKNOWN": 22
  },
  "geographyJudgment": {
    "ACCEPTABLE": 32,
    "NOT_ACCEPTABLE": 5,
    "UNKNOWN": 3
  },
  "mismatches": 20
}
```

## Robustness

Leave-one-out results are descriptive because this sample is small; they are not statistical validation.

```json
{
  "EXPERIMENTAL_WEIGHT_SET_V1": {
    "leaveOneOutTop5PrecisionRange": [
      0,
      0
    ],
    "leaveOneOutStrongGoodRecallRange": [
      0.13,
      0.25
    ]
  },
  "EXPERIMENTAL_WEIGHT_SET_V1B": {
    "leaveOneOutTop5PrecisionRange": [
      0,
      0
    ],
    "leaveOneOutStrongGoodRecallRange": [
      0.13,
      0.25
    ]
  },
  "EXPERIMENTAL_WEIGHT_SET_V1C": {
    "leaveOneOutTop5PrecisionRange": [
      0,
      0
    ],
    "leaveOneOutStrongGoodRecallRange": [
      0.13,
      0.25
    ]
  },
  "EXPERIMENTAL_WEIGHT_SET_V1D": {
    "leaveOneOutTop5PrecisionRange": [
      0,
      0
    ],
    "leaveOneOutStrongGoodRecallRange": [
      0.13,
      0.25
    ]
  }
}
```

## Promotion

NOT_READY: the 40-role sample is useful for diagnosis, but the experimental model remains dependent on incomplete evidence authorities, contains known preference/qualification contamination in source compatibility, and has no approved production thresholds or weights.
