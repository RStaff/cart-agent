# A001.00 Asset Authority Discovery and Architecture

Status: Complete - documentation and architecture only
Date: 2026-08-03
Mission: A001_00_STAFFORDOS_ASSET_AUTHORITY_ARCHITECTURE_AND_REVIEW_RATIFICATION

## Checkpoint Authority

Starting HEAD was verified as `f4f2efa80e8ef34c57e32584a14a32fe6141c82d`.

The S008, S009, S010, J001.01, and J001.02 authority chain exists in local Git history. The five independent-review artifacts existed before this mission as local uncommitted review material:

- `STAFFORDOS_ENTERPRISE_ARCHITECTURE_REVIEW_V1.md`
- `STAFFORDOS_ENTERPRISE_ARCHITECTURE_REVIEW_V1.json`
- `STAFFORDOS_TARGET_PLATFORM_AND_WORKSPACE_MODEL_V2.md`
- `STAFFORDOS_MEDIA_AND_PROVIDER_BOUNDARY_V1.md`
- `STAFFORDOS_ANTI_DRIFT_REGISTER_V1.md`

The independent review concluded `STAFFORDOS_ARCHITECTURE_SOUND_WITH_CORRECTIONS`. A001 treats that as a review finding that becomes StaffordOS authority only after correction and ratification.

## Independent Review Validation

Targeted repository inspection validated the direction of the independent review. Numeric and wording corrections were required before ratification.

| Review claim | A001 classification | A001 correction |
|---|---|---|
| Repo-as-database debt | VERIFIED_REPOSITORY_BACKED | Ratified. Runtime truth is still represented in tracked JSON and local output files in multiple places. |
| Eleven relationship stores | NEEDS_LIMITATION | Direction is correct; ratified as at least eleven relationship/contact-like stores, not a precise closed count. |
| Three decision stores | NEEDS_LIMITATION | Ratified as three unrelated decision-like authorities, with the caution that product telemetry decisions are not the same object as platform Decisions. |
| Three mission namespaces | VERIFIED_REPOSITORY_BACKED | Ratified as an actual dormant drift risk. |
| Triple workspace taxonomy | VERIFIED_REPOSITORY_BACKED | Ratified. `workspaceRegistry`, Chief of Staff workspace types, domain registry language, and merchant-workspace wording overlap. |
| Identity built but not connected | VERIFIED_REPOSITORY_BACKED | Ratified. Issuer and identity models exist; UI write surfaces are not connected to that authority. |
| Six write endpoints and five server actions | NEEDS_LIMITATION | Corrected to five observed POST write/exec API routes plus ten server-action directives across two pages. |
| Open or insufficiently protected write surfaces | VERIFIED_REPOSITORY_BACKED | Ratified as a deployment and multi-user blocker or accepted-risk decision. |
| Uncommitted authority chain | VERIFIED_REPOSITORY_BACKED | Ratified. A001 observed 153 untracked paths before review-ratification staging. |
| Static `/os` versus runtime `/operator` divergence | VERIFIED_REPOSITORY_BACKED | Ratified with limitation. `/os` is deliberately static, but a private Job Opportunity already exists outside Git while the UI remains disconnected. |
| Asset fragmentation and temporary-path references | VERIFIED_REPOSITORY_BACKED | Ratified. Existing proof/evidence artifacts include machine-specific or partial locators without a platform Asset authority. |
| Multiple action-like queues | VERIFIED_REPOSITORY_BACKED | Ratified as actual drift to be resolved with the persistence plan. |
| Hardcoded provider URL | VERIFIED_REPOSITORY_BACKED | Ratified as a small local drift item, not a current blocker. |
| Private-data protection lacks `.gitignore` backstop | VERIFIED_REPOSITORY_BACKED | Ratified. Existing code guards work, but defense in depth is missing. |
| Professional registry contradiction | VERIFIED_REPOSITORY_BACKED | Ratified. Professional still says no runtime workflow while Job Command exists. |
| Need for `professionalMode` | REASONABLE_ARCHITECTURAL_INFERENCE | Ratified as the smallest durable way to separate Job Search, My Job, and mode-neutral Career Evidence. |
| Adapter-only Job Search UI wiring rule | VERIFIED_REPOSITORY_BACKED | Ratified. J001.02 already established this boundary. |
| Need for staticity or `asOf` labels | REASONABLE_ARCHITECTURAL_INFERENCE | Ratified for static `/os` surfaces and provider-backed read models. |

## Review Claim Corrections

The review artifacts were corrected narrowly:

- The review basis now distinguishes committed S008/S009/S010/J001 authority from the local untracked ADR_0001 artifact.
- The write-surface count now states five observed POST write/exec API routes plus ten server-action directives.
- The uncommitted-authority statement now uses the A001 observed untracked-path count.
- The media/Jellyfin baseline now notes planned Personal media text while preserving that no Jellyfin, playback, streaming, media-storage, media-library, or standalone Media implementation exists.
- The Enterprise Architecture Review now includes a Ross Vision Alignment section.

## Ross Vision Alignment

The ratified target architecture supports the intended StaffordOS direction without claiming those capabilities are implemented:

- StaffordOS remains the parent operating system.
- Stafford Media remains the current runtime business workspace.
- ShopiFixer and Abando remain Stafford Media products or capabilities.
- Professional supports Job Search now and My Job later.
- Personal can later support personal planning, family and invited-member access, media watching through providers such as Jellyfin, media creation, music, movies, educational content, social content, and child-safe learning and creativity.
- AI remains advisory and fail-closed.
- Human approval remains explicit.
- Private Professional and Personal data remains outside Git.

## Current Asset Authority Discovery

Targeted discovery found no canonical platform-level Asset model. Existing concepts are partial, workspace-specific, provider-specific, temporary, or planned only.

| Existing concept | Classification | A001 finding |
|---|---|---|
| S008 Evidence and Proof foundations | Partial model | Useful governance language, but not a file/media/content authority. |
| S009 source tracing and source snapshots | Partial model | Reusable source/provenance principles; not an Asset record. |
| S010 JobSource, JobOpportunity, CareerEvidence, private intake contracts | Workspace-specific implementation | Reusable Professional-source discipline; not a general Asset authority. |
| Private Career and Job Search storage patterns | Temporary private authority candidate | Correct local privacy pattern; no durable shared Asset authority. |
| `ShopifixerProofReference` and proof artifact fields | Provider/product-specific implementation | Useful evidence/proof association, but not a platform Asset authority. |
| `EmailQueue.attachments` | Provider-specific implementation | Attachment payload shape exists, but does not govern rights, provenance, retention, or workspace sharing. |
| Proof-run output and evidence manifests | Temporary artifact | Demonstrates the need for Asset authority because file locators can rot. |
| Home-server backup script reference | Provider-specific implementation | Shows a possible storage tier, not Asset governance. |
| Personal media capability text | Planned only | No Jellyfin or media implementation exists. |
| Jellyfin | Planned provider boundary only | No repository implementation or catalog connection exists. |

## Asset Authority Ruling

The canonical Asset Authority is defined in:

- `STAFFORDOS_ASSET_AUTHORITY_V1.md`
- `STAFFORDOS_ASSET_PROVIDER_REFERENCE_CONTRACT_V1.md`
- `STAFFORDOS_ASSET_PRIVACY_RIGHTS_AND_PROVENANCE_V1.md`
- `STAFFORDOS_ASSET_STORAGE_AND_LIFECYCLE_V1.md`
- `ADR_0002_ASSET_METADATA_AND_PROVIDER_REFERENCE_AUTHORITY.md`

An Asset is a governed record representing a file, media item, document, generated output, external-provider item, or logical content object that StaffordOS may reference, authorize, transform, review, share, publish, prove, retain, or delete.

StaffordOS owns Asset governance metadata. It does not automatically own the underlying payload, provider catalog, playback system, creation tool, or publication endpoint.

## Data Plane Sequencing

| Item | Classification | Rationale |
|---|---|---|
| Ratify the independent review artifacts | REQUIRED_BEFORE_MORE_JOB_SEARCH | J001 and A001 depend on the corrected review becoming committed authority. |
| Add private-path `.gitignore` backstop | REQUIRED_BEFORE_MORE_JOB_SEARCH | Existing validators protect callers, but Git should also fail safely for predictable private artifacts. |
| Resolve Professional registry and `professionalMode` contradiction | REQUIRED_BEFORE_JOB_SEARCH_UI_CONNECTION | Job Search and My Job need explicit mode separation before richer UI wiring. |
| Enforce adapter-only queue wiring and staticity labels | REQUIRED_BEFORE_JOB_SEARCH_UI_CONNECTION | The Job Command must not read arbitrary private files from UI code. |
| Record or protect current write-surface risk | REQUIRED_BEFORE_MULTI_USER | Open write-capable surfaces cannot be carried into shared or deployed operator access without a decision. |
| Create ADR_0001 persistence-execution plan | REQUIRED_BEFORE_MULTI_USER | Repo-as-database debt blocks reliable runtime operation and multi-user access. |
| Adopt Asset metadata and provider-reference authority | REQUIRED_BEFORE_PERSONAL_MEDIA | Media, family sharing, portfolio, proof, and publication need one Asset authority first. |
| Implement Asset contract and validator | MAY_WAIT | Architecture is now defined; implementation should follow only after higher-priority governance backstops. |
| Connect Personal media providers | LONG_TERM | Provider integrations require Asset authority, identity, membership, rights, and child gates. |

## ADR Decision

A new ADR is appropriate because Asset Authority establishes a durable cross-workspace boundary that is broader than the ShopiFixer-specific persistence decision in ADR_0001.

Created:

- `ADR_0002_ASSET_METADATA_AND_PROVIDER_REFERENCE_AUTHORITY.md`

ADR_0001 remains intact and continues to govern ShopiFixer persistence debt.

## Selected Next Mission

Selected next mission: `GOVERNANCE_PRIVATE_PATH_GITIGNORE_BACKSTOP`.

Reason: repository evidence shows private Career and Job Search data already exists outside Git, validators reject unsafe paths, and `git ls-files` shows no tracked private artifacts. The missing `.gitignore` backstop is the smallest required defense-in-depth correction before more Job Search or Professional private-data work.

## Non-Impact

This mission created documentation authority only. It did not create an Asset model, Prisma schema, migration, API, route, UI, provider integration, Jellyfin connection, Job Search behavior, deployment, or push. It did not read private Career, Job Search, or media source contents.
