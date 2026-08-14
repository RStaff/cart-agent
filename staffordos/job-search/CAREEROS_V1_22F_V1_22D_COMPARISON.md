# V1.22D vs V1.22F Recalibration

Offline-only, same 40 records, labels, V1 formula, weights, cutoff, and ranking method.

## Baseline

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

## Repaired authorities

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

## Deltas

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

V1.22E changes preference/authority diagnostics; it does not feed the new diagnostics into the fit formula, so score ordering is expected to remain unchanged.
