# J004.01 Application Follow-Up And Response Tracking

## Authority

J004.01 starts the Career Engagement capability after the governed pre-application workflow is complete.

It reuses:

- existing private Application records;
- existing private ApplicationEvents;
- existing follow-up review tasks;
- existing Application pipeline storage and loading authority;
- existing Opportunity references where already present on Applications;
- StaffordOS governance boundaries.

It does not create a parallel Application contract.

If no Application exists, the workflow fails closed.

## Purpose

CareerOS needs to help Ross understand what happened after application submission and which existing Applications require attention.

The workflow is:

```text
Existing Application
  -> Application Event History
  -> Follow-Up State
  -> Response State
  -> Next Engagement Action
  -> Career Engagement Queue
```

This mission is planning and tracking only.

## Follow-Up State

Supported follow-up states:

- `NOT_DUE`;
- `DUE`;
- `OVERDUE`;
- `COMPLETED`;
- `NOT_REQUIRED`.

Follow-up state is derived from existing follow-up review tasks, Application next-review dates, or a documented deterministic fallback policy.

The fallback policy is:

If no follow-up task or Application next-review date exists, and the Application has a valid submitted date, compute a local 10-business-day review date from the submitted date.

The fallback does not overwrite the Application.

## Response State

Supported response states:

- `NO_RESPONSE`;
- `RECRUITER_CONTACT`;
- `HIRING_MANAGER_CONTACT`;
- `INTERVIEW_REQUEST`;
- `REJECTION`;
- `WITHDRAWN`;
- `OTHER_RESPONSE`.

ApplicationEvents are preferred authority for response state.

Application record stage and employer-response status are used only when no response event exists.

No employer intent, recruiter interest, response probability, interview probability, or success probability is inferred.

## Career Engagement Queue

Each engagement item includes:

- Application ID;
- company;
- role;
- application date;
- current application status;
- current stage;
- last ApplicationEvent;
- follow-up state;
- follow-up due date when available;
- response state;
- recommended next engagement action;
- blocking issues;
- limitations.

The queue includes Applications that need attention because they have a response, interview handoff, due or overdue follow-up, close-out action, or blocking issue.

## Next Engagement Actions

Supported planning actions:

- `FOLLOW_UP`;
- `REVIEW_RESPONSE`;
- `PREPARE_FOR_INTERVIEW`;
- `NO_ACTION`;
- `CLOSE_OUT`.

These are planning recommendations only.

`FOLLOW_UP` does not send or draft a message.

`PREPARE_FOR_INTERVIEW` is a handoff marker only. Interview preparation belongs to a later mission.

`CLOSE_OUT` does not invent rejection reasons and does not mutate the Application.

## Private Outputs

Runtime outputs may include:

- `career_engagement_queue.json`;
- `application_engagement_items.json`;
- `application_engagement_read_model.json`;
- `follow_up_states.json`;
- `response_states.json`;
- `career_engagement_audit.json`.

Real runtime outputs are owner-private and remain outside Git.

## CLI

Local CLI:

```text
node staffordos/ui/operator-frontend/lib/staffordos/runApplicationFollowUpResponseTracking.mjs
```

Commands:

```text
queue
inspect
```

Options:

```text
--store <private-store-json>
--application-root <owner-private-application-root>
--write
--output-root <owner-private-output-root>
--as-of YYYY-MM-DD
--json
```

## Tests

Focused tests verify:

- deterministic follow-up, response, and next-action constants;
- no existing Application fails closed;
- due, overdue, and not-due follow-up states;
- deterministic fallback follow-up date policy;
- recruiter response mapping;
- interview handoff to `PREPARE_FOR_INTERVIEW`;
- rejection and withdrawal close-out behavior without invented reasons;
- redacted read model;
- private output storage outside Git;
- repository output roots rejected;
- loader and CLI summary behavior;
- existing Application authority reused without a parallel contract;
- no communication, submission, provider, route, AI, Ollama, or resume mutation path.

## Non-Impact

J004.01 does not:

- send email;
- send recruiter messages;
- generate outreach copy;
- submit applications;
- create Applications;
- append ApplicationEvents;
- mutate Applications;
- generate resumes;
- mutate resumes;
- create cover letters;
- use browser automation;
- integrate calendars;
- add providers;
- use OAuth;
- connect private data to `/os` or `/operator`;
- invoke external AI or Ollama;
- deploy or push.

## Limitations

The engagement queue depends on recorded Application authority. Unknown responses remain `NO_RESPONSE`.

`HIRING_MANAGER_CONTACT` is supported as a state but is not currently produced by the existing J001.05A event vocabulary unless a future authoritative event or Application field distinguishes it.

The deterministic fallback follow-up date is a review policy only. Employer or recruiter guidance overrides generic timing when recorded.

## Rollback

Rollback source changes with:

```text
git revert <J004.01 commit>
```

Owner-private runtime artifacts should be removed separately only if Ross wants to discard local engagement outputs.

## Next Mission

Recommended next slice:

`J004_02_FOLLOW_UP_DRAFT_PREPARATION`

That mission should prepare drafts for Ross review only. It must still avoid sending messages or contacting anyone.
