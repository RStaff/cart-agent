# G002.00 Professional Mode and Workspace Registry Reconciliation

Status: Complete - repository-backed workspace model reconciliation
Date: 2026-08-03
Mission: G002_00_PROFESSIONAL_MODE_AND_WORKSPACE_REGISTRY_RECONCILIATION

## Checkpoint Authority

Current HEAD at mission start was `d6a09095ebee5dd0ea8a60f100dd552f6b79a75c`.

Required commits were present:

- `625b9150` - Ratify StaffordOS enterprise architecture review
- `eae4f9dd` - A001 define StaffordOS Asset Authority architecture
- `d6a09095` - G001 add private-data Git backstop

Required authorities existed:

- StaffordOS Enterprise Architecture Review V1
- StaffordOS Target Platform and Workspace Model V2
- StaffordOS Anti-Drift Register V1
- S008 multi-workspace architecture
- S008 workspace registry and presentation-only WorkspaceContext
- J001 Professional Job Command shell
- J001 local Job Opportunity intake bridge

## Taxonomy Discovery

Targeted discovery found these workspace-related concepts:

| Concept | Classification | G002 decision |
|---|---|---|
| `workspaceRegistry.ts` | StaffordOS top-level workspace registry | Canonical registry for `stafford-media`, `professional`, and `personal`. |
| `WorkspaceContext.tsx` | UI-only presentation context | Preserved as presentation-only; not access control. |
| `WorkspaceSelector.tsx` | UI-only presentation selector | Copy updated so Professional is a read-only foundation, not planned-only. |
| `StaffordOsShell.tsx` | Canonical `/os` shell | Reused; no second Professional shell created. |
| `capabilities.ts` | Capability registry | Professional Career Home and Job Search foundation now available; My Job remains planned. |
| `homePresentation.ts` and `UnifiedHome.tsx` | Workspace-aware Home presentation | Updated Professional copy and links without connecting private records. |
| `/os/professional/jobs` | Job Search foundation route | Preserved as Job Command. |
| `/os/professional` | Professional mode route | Added as static Career Home route. |
| `domains/domain_registry_v1.json` | Legacy life-domain map | Not edited; remains separate from the top-level workspace registry. |
| Merchant "workspace" architecture wording | Merchant or execution context | Not edited in this mission; not a top-level StaffordOS workspace. |
| S008 historical decision memory | Historical architecture record | Not rewritten; it reflects prior decisions and needs staticity handling later. |

## Canonical Workspace Registry

Top-level workspaces remain exactly:

- Stafford Media
- Professional
- Personal

Professional remains one workspace. Job Search and My Job are modes inside Professional, not new workspaces.

The registry now records Professional as available at foundation level:

- Career Home: available now
- Job Search: available now at Job Command foundation level
- My Job: planned

It also records that live Professional records and access controls are not connected.

## Professional Mode Contract

Created `professionalModes.ts` with:

- `ProfessionalModeId`
- `ProfessionalMode`
- `ProfessionalModeTransition`
- `ProfessionalNavigationItem`
- `PROFESSIONAL_MODES`
- `PROFESSIONAL_MODE_TRANSITIONS`
- `PROFESSIONAL_RETAINED_RECORDS`
- `JOB_SEARCH_SPECIFIC_RECORDS`
- `MY_JOB_FUTURE_RECORDS`

The initial modes are:

| Mode | Availability | Route | Operator question |
|---|---|---|---|
| CAREER_HOME | Available now | `/os/professional` | What deserves my attention in my professional life? |
| JOB_SEARCH | Available now | `/os/professional/jobs` | What should I do next in my job search? |
| MY_JOB | Planned | none | What should I do next to succeed in my role? |

## Transition Model

Mode transitions are conceptual and read-only. No transition command was implemented.

Rules:

- A mode change does not delete records.
- Job opportunities and applications can become historical or less active, but they are not erased.
- Career evidence survives.
- Resume authority survives.
- Professional relationships survive.
- Achievements survive.
- Learning survives.
- Decisions and outcomes survive.
- Employment records remain separate from applications.
- A job offer does not automatically activate My Job.
- Ross explicitly confirms an employment transition.
- Changing presentation mode does not grant access or permission.

## Retained Records

Records intended to remain available across Professional modes:

- CareerFact
- CareerEvidence
- ResumeVersion
- Achievement
- Project
- Skill and technology context
- Certification
- Education
- Professional Relationship
- Decision
- Action
- Evidence
- Proof
- Learning
- Asset reference
- Job Outcome
- employment history

Job Search-specific records remain separate from future employment records:

- JobOpportunity
- JobRequirement
- Application
- Interview
- recruiter follow-up
- offer
- rejection
- withdrawal

Future My Job records were named but not implemented:

- Employment
- Role Responsibility
- Objective
- Work Project
- Commitment
- Meeting reference
- Manager or coworker relationship
- Accomplishment
- Feedback
- Performance Review
- Promotion Goal
- Compensation event
- Learning plan

## Job Search Boundary

Job Search remains a Professional mode. It uses the existing Job Command route and current local intake bridge authority. It does not search job boards, submit applications, tailor resumes, calculate fit, send messages, read private records, or create Application records.

## My Job Boundary

My Job is planned only. G002 did not create My Job routes, records, fixtures, employers, managers, coworkers, goals, meetings, reviews, compensation events, or performance tracking.

## Registry Contradictions Corrected

Corrected current source/UI statements that described Professional as planned-only despite the Job Command foundation:

- `workspaceRegistry.ts`
- `WorkspaceSelector.tsx`
- `WorkspacePage.tsx`
- `homePresentation.ts`
- `UnifiedHome.tsx`
- `capabilities.ts`
- `jobSearchCommandPresentation.ts`
- S009 Chief of Staff fixture/copy text

Historical S008 decision memory was not rewritten because it records a timestamped prior decision. G003 should add staticity and `asOf` authority so historic records are not mistaken for current workspace truth.

## Professional Navigation Result

Professional navigation now appears only in Professional context and links only existing routes:

- Career Home -> `/os/professional`
- Job Command -> `/os/professional/jobs`

Planned or not-connected entries remain unlinked:

- Opportunities
- Applications
- Relationships
- Interviews
- Outcomes
- My Job
- Career Evidence
- Achievements
- Learning

No second sidebar, shell, workspace selector, or Job Command route was created.

## Career Home Route Decision

G002 added `/os/professional`.

Reason: CAREER_HOME is now an available Professional mode. The existing `/os` Home can show Professional after client-side workspace selection, but it is not a direct route authority for the Professional landing context. A static `/os/professional` route gives Professional a canonical address while reusing the existing `/os` layout.

The route is read-only and contains no real Professional records.

## Staticity Disclosures

New and updated presentation copy distinguishes:

- available foundation;
- planned capability;
- not connected yet;
- private data not connected;
- live prioritization not connected;
- access controls not connected;
- Ross decides when his work status changes.

Mode selection is presentation only.

## Tests

Focused tests cover:

- workspace IDs remain exactly Stafford Media, Professional, Personal;
- Family, Media, Creative are not top-level workspaces;
- Professional modes are CAREER_HOME, JOB_SEARCH, MY_JOB;
- Job Search and My Job are not workspaces;
- Career Home and Job Search are available now at foundation level;
- My Job is planned and has no fake route;
- mode changes do not delete records;
- retained Professional records survive transitions;
- Job Search records are not employment records;
- employment records are not applications;
- Ross remains transition authority;
- WorkspaceContext remains presentation-only;
- Professional navigation links only existing routes;
- no real employers, coworkers, jobs, or private paths exist;
- no API, database, AI, Ollama, or `/operator` loader path exists.

## Route Results

Required routes were checked through the local Next server:

- `200 /os`
- `200 /os/professional`
- `200 /os/professional/jobs`
- `200 /os/capabilities`
- `200 /os/actions`
- `200 /os/objectives`
- `200 /os/decisions`
- `200 /os/chief-of-staff`
- `200 /operator`
- `200 /operator/leads`
- `200 /operator/campaigns`
- `200 /operator/revenue-command`
- `200 /operator/command-center`

## Validation Results

- Focused G002 test: passed.
- Existing workspace tests: passed.
- J001 regression tests: passed through the StaffordOS library test sweep.
- S010 regression tests: passed through the StaffordOS library test sweep.
- S009 regression tests: passed through the StaffordOS library test sweep.
- S008 regression tests: passed through the StaffordOS library test sweep.
- StaffordOS library test sweep: `495` passed, `0` failed.
- `npm run build`: passed with exit code `0`.
- Build note: Next emitted an existing NFT warning and recoverable static-generation messages from `/operator/shopifixer-pilot`; G002 did not modify `/operator`.
- Local route checks: passed.
- Ollama listener on TCP `11434`: absent.

## Known Limitations

- My Job remains planned.
- No private Professional data is connected.
- No durable Professional runtime authority is created.
- Historic S008 decision memory still reflects its original planned-workspace decision and needs staticity handling.
- `/os` remains static except for existing presentation state.

## Rollback

Repository rollback:

`git revert <G002.00 commit SHA>`

Rollback removes the Professional mode foundation changes and G002 documentation. It does not affect private data, employment records, Job Opportunity records, databases, providers, or deployments.

## Exact Next Mission

Selected next mission:

`G003_00_ADAPTER_ONLY_READ_MODEL_AND_STATICITY_AUTHORITY`

Reason: after the Professional mode contradiction is resolved, the next ratified correction is to ensure `/os` receives runtime data only through governed read-model adapters and static surfaces show staticity or `asOf` labels.

## Non-Impact

This mission did not connect private career data, modify Job Opportunity records, implement employment-management features, create My Job runtime data, add authentication, modify `/operator`, deploy, push, invoke Ollama, call external AI, create APIs, modify Prisma, create migrations, or access private files.
