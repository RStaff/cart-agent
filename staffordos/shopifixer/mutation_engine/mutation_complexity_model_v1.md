# MUTATION COMPLEXITY MODEL V1

## Purpose

Determine whether a ShopiFixer recommendation is safe, profitable, and appropriate for a fixed-fee sprint.

## Scoring Areas

### Implementation Level

Level 1:
Theme editor setting only.

Level 2:
Section add/reorder/configuration, product binding, copy, CTA, trust placement.

Level 3:
Small custom Liquid section.

Level 4:
Scoped code change across Liquid/CSS/snippet.

Level 5:
Custom project. Not included in standard sprint.

## Complexity Questions

For every proposed mutation, answer:

- Can this be done with existing theme sections?
- Does it require new Liquid?
- Does it require CSS?
- Does it require JavaScript?
- Does it require product/catalog changes?
- Does it require app configuration?
- Does it touch checkout?
- Is rollback simple?
- Is proof visual?

## Sprint Fit

GOOD FIT:

- Level 1, 2, or tightly scoped Level 3
- low risk
- clear proof
- one visible issue
- rollback is simple

CAUTION:

- Level 4
- multiple files touched
- unclear product data
- unclear merchant claims
- proof depends on metrics instead of screenshots

NOT A FIT:

- Level 5
- checkout customization
- major refactor
- app conflict remediation
- unclear scope
- no visual proof

## Decision Labels

EXECUTE:
Safe for ShopiFixer sprint.

HOLD:
Needs missing data or merchant confirmation.

ESCALATE:
Requires custom quote or deeper engagement.

