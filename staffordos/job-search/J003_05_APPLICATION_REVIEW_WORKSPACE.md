# J003.05 Application Review Workspace

## Authority

J003.05 continues the CareerOS workflow on top of:

- J003.03 Career Workflow Actions;
- J003.04 Ready To Apply Application Package;
- J003.01 Opportunity Recommendation Engine;
- J002 Opportunity Queue;
- Explainable Fit;
- ResumeVersion authority;
- Career Evidence authority;
- private Application tracking authority.

The mission does not redesign discovery, recommendation, package generation, ResumeVersion, or Application tracking.

## Purpose

CareerOS now creates deterministic application packages for items that Ross has explicitly moved into `READY_TO_APPLY`.

J003.05 adds the human-review layer:

```text
READY_TO_APPLY
  -> Application Package
  -> Human Review Workspace
  -> Review Decision
  -> Manual Application Ready
```

This layer records Ross's private disposition of each package before any external application activity occurs.

## Review Workspace

The workspace reads existing J003.04 package artifacts and projects each package for owner-private review.

Each workspace item includes:

- company;
- role;
- canonical job URL;
- opportunity ID;
- recommendation;
- Explainable Fit summary;
- recommended ResumeVersion;
- supporting Career Evidence;
- relevant strengths;
- missing skills and gaps;
- resume update requirements;
- blocking issues;
- application readiness;
- recommended next action;
- human review required.

J003.05 does not duplicate package logic. If package readiness, resume guidance, or evidence analysis needs to change, the J003.04 package must be regenerated from upstream authority.

## Review Decisions

Supported deterministic decisions:

- `REVIEWED_READY`;
- `NEEDS_CHANGES`;
- `HOLD`;
- `CANCELLED`.

`REVIEWED_READY` means Ross reviewed the package and considers it ready for manual application outside StaffordOS.

It does not mean:

- an Application record exists;
- an application was submitted;
- a browser was opened;
- a resume was generated or changed;
- a cover letter was created;
- a message was sent;
- any provider was contacted.

`REVIEWED_READY` is allowed only for packages whose J003.04 readiness is `READY`.

## Persistence

Review decisions are owner-private records outside Git.

Each decision preserves:

- package ID;
- opportunity ID;
- recommendation ID;
- queue item ID;
- company and role;
- review decision;
- review timestamp;
- package blocking issues at review time;
- optional review notes;
- source authority references;
- superseded decision ID when a later explicit decision replaces an earlier projected state.

Decisions are append-only. The workspace projects the latest decision deterministically without deleting earlier decisions.

## Private Outputs

Runtime outputs may include:

- application review decisions NDJSON;
- application review workspace;
- application review read model;
- manual application ready list;
- pending review list;
- needs changes list;
- held packages;
- cancelled packages;
- audit summary.

Real runtime outputs remain under owner-private storage and are not committed.

## Read Model

The read model is redacted and excludes:

- canonical job URL values;
- private filesystem paths;
- raw job text;
- raw resume text;
- execution controls.

The owner-private workspace item may display the canonical job URL for human review, but J003.05 does not connect this to `/os` or `/operator`.

## CLI

Local CLI:

```text
node staffordos/ui/operator-frontend/lib/staffordos/runApplicationReviewWorkspace.mjs
```

Commands:

```text
workspace --packages <file>
decide --packages <file> --package-id <id> --decision <decision> --confirm yes
```

Optional flags:

```text
--decisions <application-review-decisions.ndjson|json>
--write
--as-of YYYY-MM-DD
--decision-root <private-decision-root>
--output-root <private-output-root>
--notes <private-review-notes>
```

No manual JSON editing is required for normal operation.

## Tests

Focused tests verify:

- deterministic decision names and review states;
- package fields are displayed from J003.04 output;
- `REVIEWED_READY` records manual application readiness only;
- `REVIEWED_READY` cannot override a non-ready package;
- `NEEDS_CHANGES`, `HOLD`, and `CANCELLED` project correctly;
- decisions are append-only;
- private writers reject repository output roots;
- loaders accept package and decision files;
- read models hide URL values, raw payloads, and private paths;
- no discovery, recommendation, ranking, or package logic is duplicated;
- no application submission, resume mutation, provider call, route connection, AI, or Ollama path exists.

## Limitations

J003.05 does not create Application records. If a future workflow needs a pre-submission Application planning state, it must reuse an existing authoritative Application contract or add one under separate governance.

J003.05 does not generate application answers, resumes, cover letters, messages, or browser actions.

## Rollback

Rollback source changes with:

```text
git revert <J003.05 commit>
```

Owner-private runtime artifacts should be removed separately only if Ross wants to discard local review outputs.

## Next Mission

Recommended next slice:

`J003_06_MANUAL_APPLICATION_EXECUTION_PROOF`

That mission should record proof after Ross manually applies outside StaffordOS. It must still avoid automated submission unless separately authorized.
