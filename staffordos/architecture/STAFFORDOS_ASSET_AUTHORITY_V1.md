# STAFFORDOS_ASSET_AUTHORITY_V1

Status: Accepted architecture authority - documentation only
Date: 2026-08-03
Supersedes: none
Related ADR: `ADR_0002_ASSET_METADATA_AND_PROVIDER_REFERENCE_AUTHORITY.md`

## Definition

An Asset is a governed record representing a file, media item, document, generated output, external-provider item, or logical content object that StaffordOS may reference, authorize, transform, review, share, publish, prove, retain, or delete.

An Asset record is not the same thing as the underlying file, media bytes, provider catalog item, playback stream, generated output service, or publication endpoint.

StaffordOS owns the governance record. Payload and provider authority remain explicit.

## Authority Separation

| Layer | Meaning | StaffordOS role |
|---|---|---|
| Asset record | Governance and metadata authority | Owns workspace, privacy, provenance, lifecycle, rights, approvals, relationships, and audit references. |
| Binary or content payload | The underlying file or content | Stores only when a StaffordOS storage provider is authorized. Otherwise references provider authority. |
| Storage provider | Where the payload is stored | Referenced through a governed locator; never replaced by Git. |
| Playback or delivery provider | Where the asset may be viewed, streamed, downloaded, or consumed | Referenced as provider authority for playback or delivery state. |
| Creation or transformation provider | Tool that created or transformed the asset | Recorded as provenance; never becomes owner by default. |
| Publication provider | Where an approved copy may be published | Recorded as a publication reference only after approval. |

## Type Model

Asset type describes content purpose or handling. It does not encode workspace ownership, product ownership, or provider name.

Initial asset categories:

- DOCUMENT
- RESUME
- JOB_DESCRIPTION
- PRESENTATION
- EVIDENCE
- PROOF
- IMAGE
- AUDIO
- MUSIC
- VIDEO
- MOVIE
- EDUCATIONAL_CONTENT
- SOCIAL_CONTENT
- SOURCE_MATERIAL
- GENERATED_OUTPUT
- DATA_EXPORT
- EXTERNAL_MEDIA_REFERENCE
- OTHER

ShopiFixer, Abando, Job Search, Family, and Jellyfin are not Asset types. They belong in workspace scope, capability relationships, provider references, or sharing records.

## Conceptual Asset Contract

The minimum conceptual record is:

| Field | Requirement | Rule |
|---|---|---|
| assetId | Required | Durable StaffordOS ID; never a provider URL, file path, Jellyfin ID, email address, or sequential public identifier. |
| workspaceId | Required | One of the platform workspaces. Location or provider does not determine workspace. |
| ownerUserId | Required when identity exists | Records the responsible owner or member. |
| capabilityId | Optional | Connects the asset to Job Search, ShopiFixer, Media Studio, or another capability without changing type. |
| title | Required when known | Human label; not authority for ownership or rights. |
| description | Optional | Summary; must not replace source content. |
| assetType | Required | Purpose/handling category. |
| mediaType | Optional | MIME or media classification when known. |
| sourceAuthority | Required | Whether StaffordOS stores the payload, references a provider, or needs verification. |
| privacyClassification | Required | Data sensitivity and workspace privacy boundary. |
| visibilityClassification | Required | Who may view the asset. Defaults to owner-private where uncertain. |
| lifecycleStatus | Required | Intake, active, archived, deleted, held, or needs review. |
| reviewStatus | Required | Operator, rights, safety, or governance review state. |
| approvalStatus | Required when sharing or publishing | No sharing, publication, or final representation without explicit approval. |
| rightsStatus | Required | Ownership, license, third-party, or unknown rights classification. |
| provenanceStatus | Required | Origin and transformation classification. |
| createdAt | Optional | Creation time of the Asset record or source when known. |
| updatedAt | Optional | Update time of the Asset record. |
| observedAt | Required for external or imported assets | When StaffordOS observed the asset. Not source creation time. |
| effectiveAt | Optional | Date the content became effective, only when source-backed. |
| contentDigest | Optional | Digest when bytes or content can be safely hashed. |
| contentSize | Optional | Size when known. |
| version | Optional | StaffordOS version label; not provider version authority by itself. |
| parentAssetId | Optional | Parent in a version, revision, or derivative relationship. |
| originalAssetId | Optional | Original source asset when this is a derivative. |
| sourceAssetIds | Optional | Inputs used to create or support this asset. |
| derivativeAssetIds | Optional | Derived outputs, thumbnails, transcripts, captions, or publications. |
| storageLocator | Optional | Storage provider reference, never a secret and never a temporary path as durable authority. |
| playbackLocator | Optional | Playback provider reference. |
| publicationLocator | Optional | Publication provider reference after approval. |
| providerReferences | Optional | Provider-neutral references governed by the provider-reference contract. |
| externalAliases | Optional | Provider IDs, URLs, or file names retained only as aliases. |
| retentionPolicy | Required | Retention class and deletion constraints. |
| deletionStatus | Required | StaffordOS and provider deletion state must remain distinct. |
| limitations | Required | Unknowns, unavailable source data, rights limits, provider limits, or stale locators. |
| evidenceReferences | Optional | Explicit Evidence or Proof relationships. Asset alone is not Evidence. |
| auditReferences | Optional | Governance events and approvals. |

Unknown values must remain unknown. The contract must not require every field for every Asset.

## Lifecycle Statuses

Initial lifecycle states:

- PROPOSED
- IN_REVIEW
- ACTIVE
- ARCHIVED
- SUPERSEDED
- HELD
- DELETION_REQUESTED
- PROVIDER_DELETION_PENDING
- DELETED_FROM_STAFFORDOS
- PROVIDER_DELETED
- UNKNOWN

Deleting a StaffordOS Asset record must not falsely claim provider deletion succeeded. Deleting a provider item must not silently erase StaffordOS governance or audit history.

## Asset Relationships

Supported relationship kinds:

- ORIGINAL
- VERSION
- REVISION
- DERIVATIVE
- TRANSFORMATION
- EXCERPT
- THUMBNAIL
- TRANSCRIPT
- CAPTION
- TRANSLATION
- COMPILATION
- SOURCE_MATERIAL
- PUBLICATION_COPY
- PLAYBACK_COPY
- PROOF_ATTACHMENT
- EVIDENCE_ATTACHMENT

Rules:

- Do not create duplicate Assets solely because one payload appears through multiple providers.
- Do not silently replace originals.
- Do not lose transformation history.
- Generated outputs must retain source provenance.
- Published copies do not become source truth automatically.
- Format variants must not double-count evidence strength.

## Workspace Compatibility

Stafford Media examples:

- business documents
- ShopiFixer proof
- Abando materials
- customer-authorized materials
- marketing content
- case-study assets

Professional examples:

- resumes
- job descriptions
- cover letters
- career evidence artifacts
- portfolio assets
- application attachments
- employer-provided documents

Personal examples:

- private documents
- family media
- learning materials
- personal photos
- movies
- music
- creative projects

Workspace is explicit on the Asset record. Provider, folder, file type, or storage location does not determine workspace.

## Evidence and Proof Boundary

An Asset is not automatically Evidence. An Asset is not automatically Proof.

An Asset becomes supporting Evidence or Proof only through an explicit relationship and authority decision.

Examples:

- a screenshot Asset may support a Proof record;
- a resume Asset may contain candidate Career facts;
- a job-description Asset may support JobRequirement extraction;
- a video Asset may be a publication output;
- a media file may be family entertainment without evidentiary meaning.

## Implementation Boundary

This document does not authorize schema work, migrations, APIs, routes, UI, provider integration, Jellyfin integration, storage changes, or content migration.
