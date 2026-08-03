# STAFFORDOS_ASSET_PROVIDER_REFERENCE_CONTRACT_V1

Status: Accepted architecture authority - documentation only
Date: 2026-08-03
Supersedes: none

## Purpose

AssetProviderReference is the provider-neutral relationship between a StaffordOS Asset record and an external, local, cloud, or home-server system that stores, catalogs, plays, creates, transforms, publishes, backs up, or references the underlying content.

Provider IDs and locators are aliases or references. They are not StaffordOS Asset IDs.

## Conceptual Contract

| Field | Requirement | Rule |
|---|---|---|
| providerReferenceId | Required | Durable StaffordOS reference ID. |
| assetId | Required | StaffordOS Asset ID. |
| providerType | Required | Storage, playback, catalog, publication, model, document, source, backup, or other provider class. |
| providerName | Required | Human-readable provider name. |
| providerInstanceId | Optional | Identifies the configured provider instance without exposing secrets. |
| externalItemId | Optional | Provider item ID or file ID; alias only. |
| externalLibraryId | Optional | Provider library, bucket, collection, or catalog ID where applicable. |
| authorityRole | Required | The role the provider plays for this Asset. |
| locator | Optional | Safe locator or pointer. It must not contain credentials. |
| contentDigest | Optional | Provider-observed digest when available. |
| observedAt | Required | When StaffordOS observed the provider relationship. |
| synchronizedAt | Optional | Last successful provider sync time. |
| providerStatus | Required | Available, unavailable, stale, deleted, inaccessible, unknown, or needs review. |
| privacy | Required | Provider-visible privacy classification. |
| limitations | Required | Missing permissions, stale state, provider mismatch, inaccessible item, or unknown rights. |

## Authority Roles

One provider may hold multiple roles for one Asset.

- STORAGE_AUTHORITY
- CATALOG_AUTHORITY
- PLAYBACK_AUTHORITY
- CREATION_AUTHORITY
- TRANSFORMATION_AUTHORITY
- PUBLICATION_AUTHORITY
- DELIVERY_AUTHORITY
- BACKUP_AUTHORITY
- REFERENCE_ONLY

No single provider is assumed to own the full Asset lifecycle.

## Provider Rules

- Provider identifiers never replace StaffordOS Asset IDs.
- Provider state is cached with an `asOf` or observed timestamp.
- Provider unavailability must not destroy Asset authority.
- Provider deletion and StaffordOS deletion are separate facts.
- Provider references must not contain secrets, tokens, signed URLs with embedded credentials, or private prompt contents.
- UI components must not call providers directly.
- Provider writes require governed actions, permission checks, and audit records.
- External provider data is not StaffordOS truth unless explicitly adopted by a governed authority decision.

## Jellyfin Boundary

Jellyfin is one provider among several.

Jellyfin may be catalog authority and playback authority for items it manages. Home-server or NAS storage may remain storage authority. StaffordOS owns governance metadata, workspace scope, permissions, decisions, approvals, provenance, and provider references.

StaffordOS must not:

- rebuild Jellyfin playback;
- scan or copy an entire Jellyfin catalog without explicit authority;
- treat Jellyfin item IDs as StaffordOS Asset IDs;
- delete StaffordOS Asset authority because Jellyfin is offline;
- treat Jellyfin metadata as rights, ownership, family visibility, or provenance authority.

## Adapter Boundary

Future provider adapters must declare:

- identity and version;
- supported operations;
- authority scope;
- request and response schemas;
- data ownership;
- secret handling;
- failure behavior;
- audit envelope;
- health probe;
- isolation and network rules.

This follows the S009 adapter discipline: guarded input, deterministic validation, fail-closed behavior, advisory AI boundaries, and operator approval where required.

## Non-Implementation Statement

This contract defines architecture only. It does not connect to Jellyfin, storage, media-generation APIs, publication platforms, job sources, email, calendar, or any other provider.
