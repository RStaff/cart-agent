# V1.26E Baseline vs Adjudicated Metrics

Offline only. Frozen V2D formula and weights were reused.

## Calibration

- Baseline: {"top5Precision":0,"top10Precision":0.3,"strongRecall":0.33,"strongGoodRecall":0.33,"viableRecall":0.23,"falsePositiveRate":0.75,"falseNegativeRate":0.29,"rankCorrelation":0.13,"negativeLeakageTop5":2,"negativeLeakageTop10":3,"hardMismatchLeakageTop10":0,"underRankedViable":16,"strongGoodBelow20":4,"threshold":{"cutoff":71.25,"predictedCount":20,"falsePositiveRate":0.75,"falseNegativeRate":0.29}}
- Adjudicated: {"top5Precision":0,"top10Precision":0.3,"strongRecall":0.33,"strongGoodRecall":0.33,"viableRecall":0.23,"falsePositiveRate":0.75,"falseNegativeRate":0.29,"rankCorrelation":0.13,"negativeLeakageTop5":2,"negativeLeakageTop10":3,"hardMismatchLeakageTop10":0,"underRankedViable":16,"strongGoodBelow20":4,"threshold":{"cutoff":71.25,"predictedCount":20,"falsePositiveRate":0.75,"falseNegativeRate":0.29}}
- Delta: {"top5Precision":0,"top10Precision":0,"strongRecall":0,"strongGoodRecall":0,"viableRecall":0,"falsePositiveRate":0,"falseNegativeRate":0,"rankCorrelation":0,"negativeLeakageTop5":0,"negativeLeakageTop10":0,"hardMismatchLeakageTop10":0,"underRankedViable":0,"strongGoodBelow20":0,"threshold":null}

## Holdout

- Baseline: {"top5Precision":0.4,"top10Precision":0.3,"strongRecall":0.5,"strongGoodRecall":0.3,"viableRecall":0.35,"falsePositiveRate":0.73,"falseNegativeRate":0.4,"rankCorrelation":0.28,"negativeLeakageTop5":1,"negativeLeakageTop10":2,"hardMismatchLeakageTop10":0,"underRankedViable":10,"strongGoodBelow20":5,"threshold":{"cutoff":72.25,"predictedCount":22,"falsePositiveRate":0.73,"falseNegativeRate":0.4}}
- Adjudicated: {"top5Precision":0.4,"top10Precision":0.3,"strongRecall":0.5,"strongGoodRecall":0.3,"viableRecall":0.35,"falsePositiveRate":0.73,"falseNegativeRate":0.4,"rankCorrelation":0.28,"negativeLeakageTop5":1,"negativeLeakageTop10":2,"hardMismatchLeakageTop10":0,"underRankedViable":10,"strongGoodBelow20":5,"threshold":{"cutoff":72.25,"predictedCount":22,"falsePositiveRate":0.73,"falseNegativeRate":0.4}}
- Delta: {"top5Precision":0,"top10Precision":0,"strongRecall":0,"strongGoodRecall":0,"viableRecall":0,"falsePositiveRate":0,"falseNegativeRate":0,"rankCorrelation":0,"negativeLeakageTop5":0,"negativeLeakageTop10":0,"hardMismatchLeakageTop10":0,"underRankedViable":0,"strongGoodBelow20":0,"threshold":null}
