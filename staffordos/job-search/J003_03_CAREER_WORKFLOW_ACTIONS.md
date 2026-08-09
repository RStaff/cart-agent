# J003.03 Career Workflow Actions

## Authority

J003.03 starts from `0e5c61d6` on `main` and treats the following as authoritative:

- J001 Know Me and Application Tracking;
- J002.01 Job Discovery and Prioritization;
- J002.02A Private Job Source Import Queue;
- J002.02B Greenhouse Discovery MVP;
- J003.01 Opportunity Recommendation Engine;
- J003.02 CareerOS Command Center;
- Explainable Fit read-model output;
- ResumeVersion authority;
- G001 private data Git backstop;
- G003 adapter/read-model authority;
- G004.01 operator write isolation.

This mission does not redesign discovery, modify recommendation logic, add a provider, generate or mutate resumes, create Applications, submit applications, send messages, connect private data to `/os` or `/operator`, deploy, or push.

## Workflow Action Contract

Each existing recommendation may receive exactly one owner-private workflow action:

- `APPLY`;
- `REVIEW_LATER`;
- `SKIP`;
- `NOT_INTERESTED`.

Actions are Ross-confirmed deterministic state transitions. They are persisted as append-only private decision records outside Git.

## State Model

The state projection is:

```text
Recommendation
  -> Workflow Action
  -> Workflow State
```

Supported authoritative workflow states are:

- `READY_TO_APPLY`;
- `REVIEW_LATER`;
- `SKIPPED`;
- `NOT_INTERESTED`.

Recommendations with no workflow action remain in today's queue with `NO_WORKFLOW_ACTION_RECORDED`.

## APPLY Boundary

`APPLY` moves an existing `APPLY_NOW` recommendation into a private Application Workspace planning queue as `READY_TO_APPLY`.

It does not:

- create an Application;
- submit an application;
- upload a resume;
- generate or mutate a resume;
- generate a cover letter;
- contact a recruiter or employer;
- call a provider.

`APPLY` is accepted only when the existing recommendation read model says:

- recommendation is `APPLY_NOW`;
- application readiness is `READY_FOR_OPERATOR_APPROVED_APPLICATION`.

## Other Actions

`REVIEW_LATER` returns the recommendation to a future work queue.

`SKIP` removes the recommendation from today's queue without permanently excluding it from future recommendations.

`NOT_INTERESTED` excludes the opportunity from future recommendations until Ross explicitly restores it through a later authorized workflow.

## Read Model Reuse

J003.03 reads the existing J003.01 `OpportunityRecommendationResult` and reuses:

- Opportunity Queue identity;
- Recommendation;
- Explainable Fit summary;
- ResumeVersion safe label and safety status;
- supporting evidence count;
- missing skill count;
- estimated resume update effort;
- recommended next action;
- application readiness.

It does not recalculate ranking, fit, resume selection, duplicate detection, or provider discovery.

## Private Outputs

Runtime outputs remain owner-private and outside Git. The workflow may write:

- `workflow_actions.ndjson`;
- `workflow_state.json`;
- `application_workspace_ready_to_apply.json`;
- `future_work_queue.json`;
- `todays_queue.json`;
- `skipped_today.json`;
- `excluded_from_future_recommendations.json`;
- `workflow_audit.json`.

Normal CLI output is redacted and does not print private paths, raw job text, raw resume text, source URLs, or private document internals.

## CLI

Command:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runCareerWorkflowActions.mjs state --recommendations <recommendation-result.json>
```

Record one action:

```bash
node staffordos/ui/operator-frontend/lib/staffordos/runCareerWorkflowActions.mjs act --recommendations <recommendation-result.json> --recommendation-id <id> --action APPLY --confirm yes
```

`--write` persists a private state snapshot outside Git.

## Tests

Focused tests verify:

- supported action and state constants;
- `APPLY` creates only `READY_TO_APPLY` planning state;
- `REVIEW_LATER`, `SKIP`, and `NOT_INTERESTED` produce distinct state transitions;
- pending recommendations remain in today's queue;
- each recommendation may receive exactly one action;
- `APPLY` cannot bypass existing recommendation/application readiness;
- explicit Ross operator confirmation is required;
- recommendation read-model fields are reused;
- private writers reject repository paths;
- private artifacts avoid Application and message records;
- CLI summary remains redacted;
- no recommendation, discovery, provider, AI, resume, message, or application execution path is added.

## Limitations

J003.03 does not implement restore for `NOT_INTERESTED`; that requires a later explicit operator workflow.

J003.03 does not create Application records. A later workflow must convert a `READY_TO_APPLY` planning item into an Application only after separate operator authority.

The `/os/professional/jobs` route remains a safe read-only dashboard without a private storage loader.

## Rollback

Rollback is a normal Git revert of the J003.03 commit. Owner-private workflow action and state artifacts can be removed separately from the private output root if Ross wants to discard runtime decisions.

## Recommended Next Mission

Recommended next mission: `J003_04_READY_TO_APPLY_APPLICATION_PACKAGE`.

That mission should turn `READY_TO_APPLY` planning items into operator-reviewed application packages without submitting applications.
