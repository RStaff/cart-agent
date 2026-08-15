# Calibration vs Holdout

The frozen calibration baseline is compared with the independent 40-role holdout using unchanged definitions.



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
