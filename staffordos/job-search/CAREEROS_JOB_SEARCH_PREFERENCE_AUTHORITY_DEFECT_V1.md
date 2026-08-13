# CareerOS Job-Search Preference Authority Defect V1

Status: BLOCKING V1.22 calibration

## Observed State

The current owner-private CareerOS job-search preference authority is absent at runtime. No explicit preference record or preference audit event was found.

Observed state:

- authority: `AWAITING_ROSS_CONFIRMATION`
- resolution: `UNRESOLVED`
- preferred regions: unresolved
- additional acceptable regions: unresolved
- remote preference: unresolved
- hybrid preference: unresolved
- on-site preference: unresolved
- relocation preference: unresolved
- save/reload round-trip: not testable because no saved authority exists

## Impact

Preference compatibility must remain `UNKNOWN`. Geography mismatch leakage cannot be measured against Ross's actual preferences, and the calibration cannot safely classify a role as acceptable or unacceptable geography.

## Root-Cause Classification

This is an unresolved/absent authority state, not evidence that Ross selected any particular geography. No repair or preference mutation was performed.

## Required Operator Action

Ross must save explicit preferences through the CareerOS Professional preference control. The calibration can then be rerun read-only against that authority.

Ross must also label all 40 review rows with fit, interest, geography, and realistic-pursuit values. Workflow decisions cannot substitute for those labels.
