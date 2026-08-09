# CAREEROS_V1_01 Daily Job Search Experience

## Authority

This mission begins CareerOS V1 from the completed CareerOS backend workflow:

- J001 Know Me and Application authority
- J002 Opportunity Discovery
- J003 Recommendation Workflow
- J004.01 Career Engagement Follow-up
- G001 private-data containment
- G002 Professional workspace modes
- G003 governed read-model boundary
- G004.01 operator write isolation

It does not redesign the backend, discovery, recommendation, package, review, or engagement logic.

## Objective

CareerOS now exposes the first integrated daily job-search workspace at the existing Professional Job Command route. The screen answers:

> What should I do next in my job search?

The experience is action-first. It presents professional tasks instead of internal mission IDs, queue mechanics, implementation contracts, or architecture language.

## User Experience

The CareerOS screen shows:

- Good morning header
- Today's Brief
- Today's Priorities
- Today's Top Opportunities
- Application Work
- Application Pipeline
- Daily Actions
- Search Health
- Human review boundary

Visible recommendations are converted to user-facing labels:

- APPLY NOW
- REVIEW
- WAIT
- SKIP

Internal workflow states remain hidden from the visible UI.

## Existing Outputs Reused

The V1 presentation composes existing outputs only:

- opportunity recommendation output
- application package output
- application review workspace output
- application pipeline output
- career engagement follow-up output
- existing Command Center presentation output

The presentation layer does not recompute ranking, duplicate detection, Explainable Fit, resume selection, package readiness, review decisions, or follow-up state.

## Private Artifact Boundary

The route uses a server-side local loader for owner-private CareerOS artifacts. It does not create an API route, provider endpoint, browser automation surface, or client-side private-data loader.

The loader reads the latest governed private artifacts when available and degrades to empty user-facing sections when artifacts are absent.

The UI does not display:

- private filesystem paths
- raw job descriptions
- raw resume text
- raw internal artifact structures
- source snapshot internals
- execution controls

## Daily Actions

Daily actions are planning controls only:

- Review Package
- Open Opportunity
- View Resume
- Review Evidence
- Follow Up
- Prepare Interview

Buttons are intentionally disabled in this slice because no external action is authorized.

## Application Pipeline

The pipeline section shows user-facing stages:

- Applied
- Interview
- Offer
- Closed

Counts come from existing application tracking and outcome history. No outcome is inferred.

## Non-Impact

This mission does not:

- submit applications
- create Applications
- send email or recruiter messages
- generate outreach copy
- generate or mutate resumes
- generate cover letters
- add providers
- call Greenhouse or any provider
- run browser automation
- add OAuth
- call external AI
- call Ollama
- deploy
- push

## Tests

Focused tests cover:

- empty action-first experience
- daily briefing composition
- deterministic priority ordering
- user-facing recommendation labels
- application work projection
- private artifact loader degradation
- route and surface V1 wiring
- absence of external action, provider, AI, and API route surfaces
- private-path and raw-text redaction

Regression tests should continue to pass for the existing StaffordOS operator-frontend suite.

## Limitations

The screen can show only artifacts that already exist in owner-private CareerOS storage. If opportunity recommendations, packages, or review workspace outputs have not been generated, those sections display empty-state guidance.

Actions are display-only planning controls in this slice. Later missions may add governed internal navigation or explicit review workflows, but external application activity remains outside this mission.

## Rollback

Rollback is a normal Git revert of the mission commit. Private artifacts are read-only inputs and do not require rollback.

## Recommended Next Mission

The highest-value next slice is a governed internal navigation/review interaction that opens the existing package, opportunity, resume, evidence, and follow-up details inside CareerOS without adding external execution.
