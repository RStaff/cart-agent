# J001.03B Private Job Analysis Operator Surface

Date: 2026-08-05

Status: `PRIVATE_JOB_ANALYSIS_SURFACE_DOCUMENTED`

## Authority

Starting authority was verified at:

`723783ef9d779ec300f41f832569dab803fec6d1`

Repository authority used:

- P001 Platform Runtime and Provider Integration Roadmap
- J001.01 Professional Job Command shell
- J001.02 Private Job Opportunity intake bridge
- J001.03A Private Job Requirement and Evidence Mapping Workflow
- S010 Career Evidence contracts and private intake
- G001 Private-data Git backstop
- G003 adapter-only read-model and staticity authority
- G004.01 Minimal Operator Write Surface Isolation
- G002 Professional workspace modes
- A001 Asset Authority

The mission preserves the certified J001.03A result: one private analysis exists outside Git, application state is `SUBMITTED_MANUAL_EXTERNAL`, 33 requirements were extracted, mapping coverage is 0 `PROVEN`, 0 `PARTIAL`, 3 `TRANSFERABLE`, 2 `MISSING`, and 28 `UNKNOWN`, with 15 role-focused review questions and `ALREADY_APPLIED_MONITOR`.

## Chosen Surface Form

Selected form:

`INTERACTIVE_CLI`

Reason:

- smallest usable surface;
- no new server;
- no browser route;
- no public or deployed endpoint;
- no authentication claim;
- no `/os` exposure;
- no `/operator` exposure;
- decisions are written only through an explicit local command with confirmation;
- deterministic regeneration reuses J001.03A workflow helpers.

The local CLI is:

`node staffordos/ui/operator-frontend/lib/staffordos/runPrivateJobAnalysisReview.mjs`

Supported commands:

- `list`
- `summary --latest`
- `next-question --latest`
- `inspect-requirement --latest --requirement-id <id>`
- `decide --latest --review-question-id <id> --requirement-id <id> --decision-type <type> --confirm yes`
- `regenerate --latest`

Normal output hides private paths, raw listing text, source URLs, contacts, and candidate CareerFact/CareerEvidence IDs. The explicit `inspect-requirement` command is the controlled detail view for one requirement at a time.

## Why It Is Safe

The surface is a local Node CLI. It does not bind a port, create a route, start a server, or expose private data through `/os` or `/operator`.

It does not contain:

- API calls;
- provider fetches;
- database calls;
- Prisma imports;
- external AI calls;
- Ollama calls;
- application submission methods;
- message sending methods;
- resume mutation methods;
- OAuth changes;
- G004.01 changes.

The write side is limited to append-only private decision records and optional regenerated private analysis artifacts outside Git.

## Analysis Selection

Existing private analysis runs are listed by redacted metadata:

- opaque analysis run ID;
- opaque Opportunity ID;
- company;
- role;
- analysis timestamp;
- application state;
- requirement count;
- unanswered review-question count;
- recommendation.

No private filesystem path is shown in normal output.

## Review Presentation

The presentation model includes:

- Opportunity summary;
- requirement counts;
- evidence coverage counts;
- 5-15 priority review questions;
- major gap identifiers;
- positioning counts and redacted gap summary;
- safety flags.

Raw listing text is hidden by default.

## Role-Focused Review Question Contract

Each role-focused question includes:

- review question ID;
- Opportunity ID;
- requirement ID;
- question;
- why it matters;
- candidate CareerFact count;
- candidate Evidence count;
- current classification;
- current limitation;
- allowed decision types;
- priority;
- status;
- answered timestamp;
- operator decision ID when answered.

Allowed decisions:

- `CONFIRM_SUPPORTED`
- `CONFIRM_PARTIALLY_SUPPORTED`
- `CONFIRM_TRANSFERABLE`
- `CONFIRM_MISSING`
- `KEEP_UNKNOWN`
- `REJECT_CANDIDATE_EVIDENCE`
- `DEFER`
- `FLAG_CONFLICT`
- `ADD_OPERATOR_CONTEXT`

`CONFIRM_SUPPORTED` is fail-closed unless the mapping is already proven by compatible evidence authority.

## Operator Decision Contract

Operator decisions are private, append-only records with:

- decision ID;
- `professional` workspace ID;
- Opportunity ID;
- analysis run ID;
- review question ID;
- requirement ID;
- decision type;
- operator confirmation;
- selected candidate fact/evidence IDs when needed;
- private operator context;
- limitation;
- creation timestamp;
- supersession reference;
- Ross operator authority;
- owner-private classification.

Rules:

- Ross is the decision authority.
- Existing decisions are not overwritten.
- Later decisions supersede earlier decisions explicitly.
- A job-specific decision does not verify or rewrite canonical Career facts.
- Unsupported metrics, unsupported years, and resume wording alone cannot be confirmed as proven.
- Conflicts remain visible.

## CareerFact Boundary

This mission may create:

- role-specific review decisions;
- analysis mapping updates;
- private review notes;
- recommended future Career review actions.

It does not directly mark Career facts as `VERIFIED`.

## Deterministic Reanalysis

Regeneration:

1. loads the original private analysis;
2. loads append-only private operator decisions;
3. applies only the latest decision per requirement;
4. preserves unaffected mappings;
5. preserves source traces;
6. preserves conflicts;
7. recalculates coverage;
8. recalculates explainable assessment;
9. recalculates positioning;
10. recalculates next action;
11. writes a new versioned private analysis run;
12. writes a private change report.

The original analysis run is not overwritten.

## Change Report

A regenerated run includes `change_report.json` with:

- decisions applied;
- classification changes;
- unchanged classifications;
- conflicts added;
- conflicts resolved;
- coverage before and after;
- recommendation before and after;
- positioning-change flag;
- next-action before and after;
- remaining high-priority question count.

No change report was generated during this repository commit because Ross had not selected a decision type to save.

## Application State Protection

The current manual external submission state is preserved:

- `SUBMITTED_MANUAL_EXTERNAL`;
- no duplicate Application record;
- no submission action;
- no message action;
- no inferred recruiter review;
- no inferred employer interest;
- no invented submission date;
- no invented resume filename.

The likely recommendation remains `ALREADY_APPLIED_MONITOR` unless Ross later records new outcome evidence.

## Private Output Handling

Private decisions are written under:

`$HOME/.staffordos/private/professional/job-search/analysis-decisions/<opportunity>/<analysis-run>/decisions.ndjson`

Regenerated analyses are written under:

`$HOME/.staffordos/private/professional/job-search/analysis/<opportunity>/<run>/`

Generated files use owner-private permissions. Generated HTML was not created. No generated private report is committed.

## Tests

Focused tests verify:

- analysis selection uses opaque IDs;
- private paths are hidden;
- raw listing text is hidden by default;
- operator decisions require confirmation;
- decisions are append-only;
- supersession is explicit;
- `DEFER` changes no mapping;
- `KEEP_UNKNOWN` remains `UNKNOWN`;
- `CONFIRM_TRANSFERABLE` cannot become `PROVEN`;
- `CONFIRM_PARTIALLY_SUPPORTED` cannot become `PROVEN`;
- `CONFIRM_SUPPORTED` requires compatible evidence authority;
- unsupported years cannot be confirmed;
- resume wording alone cannot verify;
- conflicts remain visible;
- reanalysis creates a new version;
- original analysis remains unchanged;
- unaffected mappings remain unchanged;
- updated coverage is deterministic;
- recommendation remains explainable;
- no employer-success probability is created;
- manual Application state is preserved;
- no duplicate Application, submission, message, resume mutation, provider fetch, API, database, external AI, Ollama, `/os`, or `/operator` path exists.

Validation run for this mission:

- focused J001.03B tests: 15 passed after the TypeScript fix;
- focused J001.03B plus J001.03A workflow batch: 40 passed;
- J001 regression tests: 121 passed;
- S010 regression tests: 103 passed;
- S009 regression tests: 126 passed;
- S008, G002, G003, and G004.01 regression batch: 202 passed;
- `npm run build` passed in `staffordos/ui/operator-frontend`;
- repository JSON validation passed;
- private analysis JSON validation passed for the existing private bundle;
- private permission check passed with owner-private permissions;
- source scans found no real private Opportunity ID, real employer, role, secret, token, `/os` route, `/operator` route, server, provider, API, database, AI, submission, message, or resume-mutation path in the J001.03B implementation.

The build still emitted pre-existing operator-frontend warnings concerning Turbopack tracing and `/operator/shopifixer-pilot` static generation. They were outside the J001.03B scope and did not fail the build.

## Limitations

- This is a local CLI, not a visual deployed Professional UI.
- It does not authenticate Ross.
- It does not authorize production writes.
- It does not connect private data to `/os`.
- It does not modify canonical Career facts.
- It does not generate a final resume.
- It does not submit applications or send messages.

## Rollback

Repository rollback:

`git revert <J001.03B commit SHA>`

Private decisions and regenerated analyses are separate owner-private records. They must not be deleted automatically; deletion requires explicit Ross approval.

## Next Mission

Selected next mission:

`S010_02D_ROLE_FOCUSED_CAREER_EVIDENCE_REVIEW`

Reason:

The private review surface now exists, but the selected analysis still has many `UNKNOWN` mappings. The next highest-value slice is to answer and reconcile the small role-focused Career evidence questions so later positioning and resume work has stronger evidence without exposing private data through `/os`.
