# CAREEROS_APPLICATION_INTELLIGENCE_V1_04_MANUAL_SUBMISSION_RECORD_AND_ARTIFACT_LINKAGE

## Checkpoint Authority

- Workspace: Professional / Career Operations.
- Builds on CareerOS Application Intelligence V1.01, V1.02, V1.03, V1.03B, and the StaffordOS governed local-only commit path.
- Reuses existing Application authority, ApplicationEvent authority, ApplicationArtifactVersion authority, Application Intelligence Packet authority, and J004.01 follow-up tracking.
- No parallel Application model, resume authority, tracker, provider, browser automation, or external execution path is created.

## Purpose

After Ross manually submits an application outside CareerOS, CareerOS can record that fact and link the exact approved resume `ApplicationArtifactVersion` to the authoritative private Application record.

The capability answers:

- Which application was submitted?
- When did Ross submit it?
- Which exact resume artifact was submitted?
- Which packet and job source produced it?
- What follow-up state applies now?

## Submission Boundary

This workflow starts only after Ross has manually submitted outside CareerOS.

CareerOS records the confirmed fact. It does not:

- open an employer site;
- upload a resume;
- submit a form;
- create an external account;
- send a message;
- infer submission from download activity;
- mutate the resume artifact.

## Preconditions

A submission record requires:

- explicit operator confirmation;
- submitted date;
- `JobOpportunity` identity through the Application Intelligence Packet;
- company and role through the packet;
- canonical job source URL through the packet;
- approved resume export artifact:
  - `artifactType = RESUME`;
  - `operatorApprovalState = APPROVED`;
  - `exportState = DOCX_READY`;
  - `submissionStatus = NOT_SUBMITTED`;
  - created DOCX file reference.

If these are missing, the workflow fails closed and creates no Application.

## Application Authority Reuse

V1.04 calls the existing manual Application tracking authority to create a private `Application` only after operator-confirmed manual submission. The created Application keeps:

- `submissionMethod = MANUAL_EXTERNAL`;
- `submittedByStaffordOS = false`;
- `applicationSubmittedByThisWorkflow = false`;
- no employer interest, fit, interview probability, or outcome inference.

Duplicate Application prevention remains delegated to the existing Application authority.

## Exact Artifact Linkage

V1.04 records an append-only private link:

- `Application`
- `ApplicationEvent`
- `JobOpportunity`
- `ApplicationIntelligencePacket`
- exact resume `ApplicationArtifactVersion`
- exported DOCX filename and digest

This is distinct from canonical `ResumeVersion` authority. A job-specific exported artifact does not become career truth and does not create or mutate a `ResumeVersion`.

## Application Event

The existing `SUBMITTED_MANUAL_EXTERNAL` ApplicationEvent is used as the `APPLICATION_SUBMITTED` equivalent.

The event references the exact artifact submission link and artifact ID. It remains append-only and records that no StaffordOS external action occurred.

## Follow-Up Integration

After recording the Application, V1.04 reuses J004.01 follow-up/response tracking to derive:

- follow-up state;
- due-date knowledge;
- response state;
- next engagement action.

No follow-up message is generated or sent.

## UI

The existing `/os/professional/jobs` surface is extended narrowly:

- approved exported DOCX artifacts can show `Mark as Submitted`;
- Ross supplies submitted date and optional channel;
- after confirmation the same card shows `SUBMITTED`, date, exact resume artifact knowledge, and follow-up state.

No new shell, route family, dashboard, provider, or external action is added.

## Private Storage

Runtime records remain owner-private outside Git. Files are written with `0600`; directories with `0700`.

Private artifacts include:

- manual submission result;
- Application records;
- ApplicationEvent records;
- follow-up review tasks;
- artifact submission links;
- submitted artifact state projections;
- redacted manual submission read model;
- validation/audit outputs.

## Tests

Focused tests cover:

- manual confirmation requirement;
- no Application before submission confirmation;
- duplicate Application prevention;
- exact artifact linkage;
- artifact submitted-state projection;
- artifact immutability;
- ApplicationEvent creation;
- follow-up handoff;
- UNKNOWN historical linkage preservation;
- no filename guessing;
- source URL requirement;
- no external action;
- private permissions and redacted read model.

## Rollback

Revert the V1.04 commit. Private runtime artifacts may be superseded or archived under owner-private CareerOS storage; do not delete historical application records unless Ross explicitly authorizes a separate governed correction.

## Limitations

- V1.04 does not reconcile historical Applications with UNKNOWN resume linkage.
- V1.04 does not submit applications or verify employer receipt.
- V1.04 supports resume artifact linkage only; cover-letter artifact linkage remains future work.
- V1.04 requires an approved V1.03B DOCX export before creating exact artifact linkage.

## Next Mission

Reassess based on real usage. Likely candidates:

- evidence-review unblock for real resume export;
- cover-letter generation and versioning;
- recruiter/networking tracking;
- interview-preparation capture.
