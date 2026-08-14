# CareerOS V1.22F Recalibration Results

Offline-only measurement using the unchanged V1 formula, V1 weights, 40 records, 40 Ross reviews, and V1.22E authority projections.

## Result

The repaired authorities materially improve diagnostic truth, especially independent preference compatibility, but do not change fit ordering because the new diagnostics are intentionally not consumed by the current fit formula.

### Baseline metrics
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

### Repaired-authority metrics
```json
{
  "top5Precision": 0,
  "top10Precision": 0.2,
  "top5Agreement": 0,
  "top10Agreement": 0.2,
  "strongRecall": 0,
  "strongGoodRecall": 0.22,
  "viableRecall": 0.23,
  "falsePositiveRate": 0.75,
  "falseNegativeRate": 0.29,
  "rankCorrelation": 0.06,
  "hardMismatchLeakageTop10": 0,
  "poorMatchLeakageTop10": 3,
  "underRankedViable": 16
}
```

### Metric deltas
```json
{
  "top5Precision": 0,
  "top10Precision": 0,
  "top5Agreement": 0,
  "top10Agreement": 0,
  "strongRecall": 0,
  "strongGoodRecall": 0,
  "viableRecall": 0,
  "falsePositiveRate": 0,
  "falseNegativeRate": 0,
  "rankCorrelation": 0,
  "hardMismatchLeakageTop10": 0,
  "poorMatchLeakageTop10": 0,
  "underRankedViable": 0
}
```

Under-ranked viable roles: 16. Over-ranked negative roles in top 10: 3. Preference distribution after repair: {"OUTSIDE_PREFERENCE":27,"UNKNOWN":13}.

## Decision

**READY_FOR_WEIGHT_SENSITIVITY** for offline-only analysis. No production promotion or ranking change is authorized.
