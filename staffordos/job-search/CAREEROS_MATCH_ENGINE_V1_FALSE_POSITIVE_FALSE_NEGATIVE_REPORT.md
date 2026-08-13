# CareerOS Match Engine V1 False Positive / False Negative Report

## Current Status

Human labels are not yet available. The generated 40-record review packet uses `PENDING_ROSS_REVIEW` for every record. Therefore false-positive and false-negative rates, top-five/top-ten agreement, rank correlation, and confidence calibration are intentionally not calculated.

Workflow actions such as Apply, Skip, Review Later, and Not Interested were not used as fit ground truth because they may reflect timing, location, interest, or workflow state.

## Automated Safety Findings

- Identical-input rerun comparison passed.
- Unsupported evidence is not promoted to exact evidence.
- Transferable evidence remains a separate count.
- J010 `HARD_MISMATCH` results are `INELIGIBLE` and cannot be rescued by the experimental score.
- Current runtime preference authority is unresolved, so active geography leakage cannot be measured.
- Unknown preference compatibility is preserved for every evaluated runtime record.

## Required Human Review

Ross must label the review packet with `STRONG_MATCH`, `GOOD_MATCH`, `TRANSFERABLE`, `STRETCH`, `POOR_MATCH`, or `HARD_NO`, plus optional confidence and a short correction reason. Only then can false-positive/false-negative categories be computed.

## Interpretation Boundary

The current automated top-tier hard-mismatch count is a safety diagnostic, not a human-fit accuracy result. No production promotion is justified by this report alone.
