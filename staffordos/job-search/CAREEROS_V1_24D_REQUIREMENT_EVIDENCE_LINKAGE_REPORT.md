# CareerOS V1.24D Requirement Evidence and Responsibility Equivalence Repair

Offline diagnostic only. V2D weights/formula and all production authorities remain unchanged.

## Frozen authority

- Calibration labels: 18023e8a944331b3c938f62174f4ce60881c1c114298c73049bea6f26b135b85
- Holdout labels: 0d77e5b1ec98285c42cb0115ae9ec4be8bde2077d15740a58cbd0509314593e0
- Formula: FROZEN_V1_23_V2D
- Weights: {"relevantExperience":40,"roleFunction":25,"responsibility":25,"seniority":10}

## Before/after metrics

| Metric | Calibration before | Calibration after | Delta |
|---|---:|---:|---:|
| top5Precision | 0 | 0 | 0 |
| top10Precision | 0.3 | 0.3 | 0 |
| strongRecall | 0.33 | 0.33 | 0 |
| strongGoodRecall | 0.33 | 0.33 | 0 |
| viableRecall | 0.23 | 0.23 | 0 |
| falsePositiveRate | 0.72 | 0.75 | 0.03 |
| falseNegativeRate | 0.29 | 0.29 | 0 |
| rankCorrelation | 0.14 | 0.13 | -0.01 |
| negativeLeakageTop5 | 2 | 2 | 0 |
| negativeLeakageTop10 | 3 | 3 | 0 |
| hardMismatchLeakageTop10 | 0 | 0 | 0 |
| underRankedViable | 16 | 16 | 0 |
| strongGoodBelow20 | 4 | 4 | 0 |

| Metric | Holdout before | Holdout after | Delta |
|---|---:|---:|---:|
| top5Precision | 0.4 | 0.4 | 0 |
| top10Precision | 0.3 | 0.3 | 0 |
| strongRecall | 0.5 | 0.5 | 0 |
| strongGoodRecall | 0.3 | 0.3 | 0 |
| viableRecall | 0.35 | 0.35 | 0 |
| falsePositiveRate | 0.74 | 0.73 | -0.01 |
| falseNegativeRate | 0.4 | 0.4 | 0 |
| rankCorrelation | 0.21 | 0.26 | 0.05 |
| negativeLeakageTop5 | 1 | 1 | 0 |
| negativeLeakageTop10 | 2 | 2 | 0 |
| hardMismatchLeakageTop10 | 0 | 0 | 0 |
| underRankedViable | 11 | 10 | -1 |
| strongGoodBelow20 | 5 | 5 | 0 |

## Linkage coverage

{
  "totalComparisons": 1683,
  "exact": 0,
  "transferable": 618,
  "partial": 0,
  "unresolved": 1061,
  "noSupportedEquivalent": 4,
  "convertedToTransferable": 399,
  "falseEquivalenceRemoved": 38,
  "authoritativeLinkageRate": 0.37
}

Only already-linked CareerEvidence references were considered. Unknown and missing states remain unresolved unless an existing reference passed the bounded semantic/category and action checks. Exact support was never inferred from wording alone. Specialist requirements require matching specialist evidence; generic leadership/operations language is not sufficient.
