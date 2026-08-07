# J001.04 Explainable Fit and Positioning

Date: 2026-08-06

Status: `EXPLAINABLE_FIT_AND_POSITIONING_IMPLEMENTED`

## Objective

J001.04 adds an owner-private local workflow that converts completed private Job Analysis and Career Evidence Review results into reusable, evidence-safe positioning.

The workflow supports resumes, interviews, LinkedIn, networking, recruiter conversations, and future job analyses through recommendations only. It does not mutate any public or external artifact.

## Inputs

The workflow consumes:

- one private Job Analysis run;
- the latest owner-private Career Evidence Review decisions reflected in that run;
- private Career candidate facts;
- private Career evidence summaries;
- approved requirement-to-evidence mappings.

Private records remain outside Git.

## Outputs

The private output set includes:

- explainable fit summary;
- positioning knowledge base;
- positioning cards;
- resume positioning recommendations;
- LinkedIn positioning recommendations;
- interview guidance;
- recruiter talking points;
- reusability report;
- owner-private Markdown report.

## Evidence Boundary

J001.04 does not:

- upgrade `UNKNOWN` to `VERIFIED`;
- upgrade `TRANSFERABLE` to `PROVEN`;
- infer years of experience;
- infer production deployments;
- infer ownership that did not exist;
- infer certifications;
- infer employer responsibilities;
- treat resume wording alone as verification.

Every positioning card includes prohibited wording and a confidence/risk classification.

## Surface

The implementation is an owner-private local CLI and reusable library.

It creates no:

- `/os` route;
- `/operator` route;
- API;
- database;
- provider integration;
- external AI or Ollama call;
- resume mutation;
- LinkedIn mutation;
- application submission;
- recruiter or employer message.

## Reusability

Positioning is organized by reusable categories:

- AI Product
- AI Governance
- AI Automation
- Digital Transformation
- Technical Program Management
- Marketing Technology
- DevOps
- Platform Operations
- Customer Discovery
- Stakeholder Management
- Leadership
- Data
- Analytics
- Automation

## Validation

Validation covers:

- focused J001.04 tests;
- J001.03A/J001.03B/S010.02D regressions;
- S010/G003/G004/S008/S009 regressions where relevant;
- JSON validation;
- private-data absence scan;
- source-safety scan;
- build verification;
- diff checks.

## Rollback

Repository rollback:

`git revert <J001.04 commit SHA>`

Owner-private positioning outputs are separate records and should not be deleted without explicit Ross approval.

## Next Step

Use the J001.04 private positioning cards to prepare evidence-safe resume edits, interview stories, or recruiter-screen notes in a later governed mission. Do not modify resumes or LinkedIn automatically.
