# CAREEROS_APPLICATION_INTELLIGENCE_V1_02_APPLICATION_INTELLIGENCE_PACKET

## Checkpoint Authority

- Branch authority: `main`
- Starting HEAD authority: `e4ddb6d41787e60157fe053ef60dc873c2b52de4`
- Governance authority: StaffordOS governed local-only commit path is available at `staffordos/operator_daemon/run_task_with_local_commit_gate_v1.sh`.
- CareerOS authorities reused: JobOpportunity, Job Source Import Queue, Explainable Fit, Opportunity Recommendation, CareerEvidence, CareerFact, ResumeVersion, Application prevention, and Daily Job Search Experience.

## Purpose

Create one deterministic Application Intelligence Packet for a normalized CareerOS JobOpportunity. The packet tells Ross how the role fits, why it fits, what gaps and claim-safety risks remain, which existing ResumeVersion is the best candidate, and what the next governed action should be.

This packet is private planning authority only. It does not generate resumes, cover letters, messages, applications, or external actions.

## Packet Contract

Schema: `staffordos.careeros.application_intelligence_packet.v1`

The packet contains:

- identity and source provenance from existing JobOpportunity and Job Source records;
- fit and ranked lanes from existing Explainable Fit and recommendation outputs;
- matched and unmatched requirements with truth dispositions;
- gap and risk sections that preserve unknowns;
- CareerFact and CareerEvidence references by ID and authority metadata where supplied;
- recommended ResumeVersion candidate, safety state, unsupported claims, and limitations;
- APPLY_NOW, REVIEW, WAIT, or SKIP from the existing recommendation engine;
- deterministic next action such as REVIEW_RESUME, REVIEW_EVIDENCE, REVIEW_APPLICATION_PACKAGE, READY_TO_APPLY, SKIP, or HOLD.

## Truth Boundary

CareerFact and CareerEvidence remain canonical career authority. ResumeVersions are downstream presentation artifacts and cannot verify their own claims.

The packet never promotes unsupported claims. Unsupported metrics, dates, employers, titles, technologies, customer adoption, production usage, revenue impact, seniority, and years of experience remain blocked unless existing authority supports them.

## ResumeVersion Handling

The packet reuses the existing J003.01 ResumeVersion recommendation and J001.06 ResumeVersion safety metadata.

If no safe ResumeVersion exists, the packet still identifies the best available candidate when recommendation metadata allows it, but marks reuse as blocked or operator-review required.

## UI

The existing `/os/professional/jobs` route is extended with a read-only Application Intelligence section. It reads the redacted packet read model only and does not expose raw job text, source URL values, private filesystem paths, or raw resume content.

The existing V1.01 Analyze Job server action now writes a packet after a successful intake analysis when queue and recommendation artifacts exist.

## Private Outputs

Private packet artifacts are written outside Git under the existing owner-private CareerOS job-search storage authority.

Runtime artifacts may include:

- `application_intelligence_packet_result.json`
- `application_intelligence_packets.json`
- `application_intelligence_packet_read_model.json`
- `resume_blockers.json`
- `unsupported_claims.json`
- `application_intelligence_packet_audit.json`

Directories are written with `0700`; files are written with `0600`.

## CLI

Local runner:

`node staffordos/ui/operator-frontend/lib/staffordos/runApplicationIntelligencePacket.mjs`

Commands:

- `build --queue-result <file> --recommendation-result <file>`
- `from-intake --intake-result <file>`
- `latest`

`--write` writes private packet artifacts outside Git.

## Tests

Focused tests cover:

- packet assembly;
- reuse of Explainable Fit and recommendation outputs;
- CareerFact and CareerEvidence reference attachment;
- unsupported claim preservation;
- ResumeVersion candidate selection;
- no-safe-resume behavior;
- missing evidence behavior;
- existing Application prevention boundary;
- redacted read model privacy;
- deterministic private writes;
- static closure of external actions, Application creation, and resume generation.

## Limitations

- The packet does not create a tailored resume, cover letter, networking message, Application, or ApplicationEvent.
- Seniority and overqualification concerns remain unevaluated unless existing deterministic authority supports them.
- CareerFact and CareerEvidence records are attached by reference; raw private evidence text is not duplicated in the redacted read model.
- URL-only job retrieval remains out of scope.

## Rollback

Revert the V1.02 local commit through the governed local-only path or an authorized governed revert process. Private packet artifacts can be superseded by rerunning the workflow; do not move private artifacts into Git.

## Recommended Next Mission

`CAREEROS_APPLICATION_INTELLIGENCE_V1_03_TRUTH_BOUND_RESUME_DRAFT_AND_ARTIFACT_VERSIONING`
