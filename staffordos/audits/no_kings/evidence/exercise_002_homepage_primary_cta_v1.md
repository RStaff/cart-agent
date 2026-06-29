# NO KINGS EXERCISE 002 EVIDENCE V1

## Exercise

Mission 001 - Exercise 002
Homepage Primary CTA Promotion

## Before State

- Hero CTA used secondary button styling
- CTA text: `Shop all`
- CTA destination: `shopify://collections/all`
- Homepage structure unchanged

## After State

- Hero CTA uses primary button styling
- CTA text unchanged
- CTA destination unchanged
- Homepage structure unchanged

## Files Changed

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json`

## Validation Result

- JSON structure remains valid
- Homepage CTA style setting now reads `button-primary`
- No other homepage section settings were modified

## Rollback Path

Restore the CTA style setting from `button-primary` to `button-secondary`.

## Lesson Learned

The homepage CTA can be promoted safely by changing the style class alone when copy, destination, and layout are already correct.

## Screenshot Status

Screenshots were not generated in this environment.
This evidence record captures the file-level before/after state and validation notes for the controlled exercise.
