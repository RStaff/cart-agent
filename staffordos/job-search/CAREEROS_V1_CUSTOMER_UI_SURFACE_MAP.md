# CareerOS V1 Customer UI Surface Map

## Minimum V1

- `/career/onboarding`: account, source intake, consent, progress.
- `/career/profile`: source and career-history summary.
- `/career/capabilities`: capability authority, scope, evidence confidence, and targeted questions.
- `/career/jobs`: user-supplied/saved opportunities and source status.
- `/career/jobs/[id]`: match explanation and requirement-level detail.
- `/career/settings`: account, privacy, export, deletion, and entitlement controls.

`/career/matches` may be a filtered view over `/career/jobs` and is not required as a separate first route.

## Separation

`/os/professional/*`, operator evidence review, private authority loaders, validator output, and governance controls remain StaffordOS operator surfaces. They are not customer routes and must not be mounted into the customer authorization boundary.
