# CareerOS V1.23 Scoring Model Evaluation

Offline only. No production ranking, UI, shortlist, J002, J003, J010, CareerFact, CareerEvidence, workflow, or application behavior changed.

Ground truth is Ross's independent evidence-fit label. Self-confidence, interest, would-pursue, and workflow state are excluded from capability fit.

## Candidate results

## MODEL_V1

- Weights: {"requiredSkills":35,"relevantExperience":20,"roleFunction":15,"responsibility":10,"seniority":8,"domain":7,"geographyWorkArrangement":5,"compensation":0,"baseline":true}
- Top-5 precision: 0
- Top-10 precision: 0.2
- Strong/good recall: 0.22
- Viable recall: 0.23
- False-positive rate: 0.75
- False-negative rate: 0.29
- Rank correlation: 0.06
- Negative leakage top 10: 3
- Hard-mismatch leakage top 10: 0
- Viable below rank 20: 16
- Robustness: ROBUST

## MODEL_V2A_TRANSFERABILITY_AWARE

- Weights: {"requiredSkills":10,"relevantExperience":30,"roleFunction":15,"responsibility":25,"seniority":10,"domain":10,"evidenceCoverage":0}
- Top-5 precision: 0
- Top-10 precision: 0.2
- Strong/good recall: 0.22
- Viable recall: 0.23
- False-positive rate: 0.75
- False-negative rate: 0.43
- Rank correlation: 0.09
- Negative leakage top 10: 3
- Hard-mismatch leakage top 10: 0
- Viable below rank 20: 16
- Robustness: ROBUST

## MODEL_V2B_CAPABILITY_SCOPE

- Weights: {"requiredSkills":5,"relevantExperience":30,"roleFunction":15,"responsibility":30,"seniority":15,"domain":5,"evidenceCoverage":0}
- Top-5 precision: 0
- Top-10 precision: 0.2
- Strong/good recall: 0.22
- Viable recall: 0.23
- False-positive rate: 0.75
- False-negative rate: 0.43
- Rank correlation: 0.09
- Negative leakage top 10: 3
- Hard-mismatch leakage top 10: 0
- Viable below rank 20: 16
- Robustness: ROBUST

## MODEL_V2C_BALANCED_MATCH

- Weights: {"requiredSkills":10,"relevantExperience":25,"roleFunction":15,"responsibility":20,"seniority":10,"domain":10,"evidenceCoverage":10}
- Top-5 precision: 0
- Top-10 precision: 0.2
- Strong/good recall: 0.22
- Viable recall: 0.19
- False-positive rate: 0.85
- False-negative rate: 0.71
- Rank correlation: 0.07
- Negative leakage top 10: 4
- Hard-mismatch leakage top 10: 0
- Viable below rank 20: 16
- Robustness: ROBUST

## MODEL_V2D_ROBUSTNESS_CONTROL

- Weights: {"requiredSkills":0,"relevantExperience":40,"roleFunction":25,"responsibility":25,"seniority":10,"domain":0,"evidenceCoverage":0}
- Top-5 precision: 0
- Top-10 precision: 0.3
- Strong/good recall: 0.33
- Viable recall: 0.23
- False-positive rate: 0.75
- False-negative rate: 0.29
- Rank correlation: 0.13
- Negative leakage top 10: 3
- Hard-mismatch leakage top 10: 0
- Viable below rank 20: 16
- Robustness: ROBUST

## Selection

**MODEL_V2D_ROBUSTNESS_CONTROL**

Selection requires improved Top-10 precision, preserved viable recall, no increased negative leakage, no hard-mismatch leakage, and non-fragile robustness.
