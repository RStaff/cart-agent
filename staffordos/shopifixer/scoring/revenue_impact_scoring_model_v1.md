# REVENUE IMPACT SCORING MODEL V1

## Purpose

Rank findings before selecting a ShopiFixer sprint.

The goal is to solve the highest-value problem first.

## Scoring Categories

### Revenue Impact

How much could this affect purchasing behavior?

Score:
1-10

### Confidence

How certain are we that this finding is real?

Score:
1-10

### Proofability

How easy is it to demonstrate before/after evidence?

Score:
1-10

### Implementation Effort

How difficult is the implementation?

Score:
1-10

Lower effort is preferred.

### Risk

How likely is the change to create unintended consequences?

Score:
1-10

Lower risk is preferred.

## Priority Formula

Priority should favor:

- high impact
- high confidence
- easy proof
- lower effort
- lower risk

## Example

Finding:

Homepage product discovery delay

Revenue Impact:
7

Confidence:
8

Proofability:
9

Effort:
4

Risk:
3

Priority:
HIGH

---

Finding:

Missing product catalog

Revenue Impact:
10

Confidence:
10

Proofability:
10

Effort:
2

Risk:
1

Priority:
CRITICAL

## New Rule

No ShopiFixer sprint should be selected until findings have been scored.

## Success Standard

ShopiFixer should be able to explain:

Why this finding?

Why not the others?

Why now?

