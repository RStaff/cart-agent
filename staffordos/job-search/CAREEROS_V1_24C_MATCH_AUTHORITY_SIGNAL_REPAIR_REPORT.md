# CareerOS V1.24C Match Authority Signal Repair

Offline diagnostic only. V2D weights/formula, production ranking, J002/J003/J010, CareerFact, CareerEvidence, preferences, workflow, and labels were not changed.

## Locked experiment

- Calibration: 40 records; holdout: 40 records; labels complete and unchanged.
- Calibration label SHA-256: 18023e8a944331b3c938f62174f4ce60881c1c114298c73049bea6f26b135b85
- Holdout label SHA-256: 0d77e5b1ec98285c42cb0115ae9ec4be8bde2077d15740a58cbd0509314593e0
- Formula: FROZEN_V1_23_V2D
- Weights: {"relevantExperience":40,"roleFunction":25,"responsibility":25,"seniority":10}

## Metrics

### Calibration

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| top5Precision | 0 | 0 | 0 |
| top10Precision | 0.3 | 0.3 | 0 |
| strongRecall | 0.33 | 0.33 | 0 |
| strongGoodRecall | 0.33 | 0.33 | 0 |
| viableRecall | 0.23 | 0.23 | 0 |
| falsePositiveRate | 0.75 | 0.72 | -0.03 |
| falseNegativeRate | 0.29 | 0.29 | 0 |
| rankCorrelation | 0.13 | 0.14 | 0.01 |
| negativeLeakageTop5 | 2 | 2 | 0 |
| negativeLeakageTop10 | 3 | 3 | 0 |
| hardMismatchLeakageTop10 | 0 | 0 | 0 |
| underRankedViable | 16 | 16 | 0 |
| strongGoodBelow20 | 4 | 4 | 0 |

### Holdout

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| top5Precision | 0.4 | 0.4 | 0 |
| top10Precision | 0.3 | 0.3 | 0 |
| strongRecall | 0.5 | 0.5 | 0 |
| strongGoodRecall | 0.3 | 0.3 | 0 |
| viableRecall | 0.35 | 0.35 | 0 |
| falsePositiveRate | 0.73 | 0.74 | 0.01 |
| falseNegativeRate | 0.4 | 0.4 | 0 |
| rankCorrelation | 0.28 | 0.21 | -0.07 |
| negativeLeakageTop5 | 1 | 1 | 0 |
| negativeLeakageTop10 | 2 | 2 | 0 |
| hardMismatchLeakageTop10 | 0 | 0 | 0 |
| underRankedViable | 10 | 11 | 1 |
| strongGoodBelow20 | 5 | 5 | 0 |

## Requirement audit

{
  "total": 1683,
  "duplicateRows": 3,
  "structuralOrBoilerplate": 280,
  "responsibility": 577,
  "specialistDomain": 95,
  "capabilityOrContext": 731,
  "softSkillNoise": 109,
  "provenancePreserved": true
}

## Authority conclusion

The repair suppresses structural/generic requirement text from responsibility evidence and adds semantic role-family diagnostics. It does not create CareerEvidence or convert missing/unknown evidence into capability failure. Any remaining ranking weakness is a signal-coverage or frozen-formula limitation, not a weight change.
