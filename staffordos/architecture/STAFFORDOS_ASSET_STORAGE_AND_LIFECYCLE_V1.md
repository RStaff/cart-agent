# STAFFORDOS_ASSET_STORAGE_AND_LIFECYCLE_V1

Status: Accepted architecture authority - documentation only
Date: 2026-08-03
Supersedes: none

## Purpose

This document defines storage-tier responsibilities, retention, deletion, backup, and lifecycle rules for StaffordOS Assets.

## Storage Tiers

DEVICE_LOCAL:

- private Professional and Personal sources;
- temporary private work;
- sensitive drafts;
- local-only intake artifacts.

HOME_SERVER:

- bulk media;
- Jellyfin-accessible media;
- local backups;
- local model runtime;
- family content when approved.

CLOUD:

- business application assets;
- customer-authorized content;
- shared metadata;
- provider integrations;
- approved publications.

Rules:

- Location does not determine ownership.
- Provider does not determine workspace.
- Backup does not become primary authority automatically.
- Synchronization does not grant sharing.
- Git is not user-content storage.
- Database metadata and binary payload storage may be separate.

## Storage Locator Rules

Storage locators must be governed provider references. They must not be:

- temporary OS paths as durable authority;
- repository paths for private user content;
- credentials;
- provider secrets;
- unsigned assumptions about availability;
- substitutes for content digest, rights, privacy, or provenance.

If a locator is stale, missing, or inaccessible, the Asset remains auditable with limitations.

## Retention Classes

Initial retention classes:

- TRANSIENT_WORKING_COPY
- PRIVATE_SOURCE_RECORD
- GOVERNANCE_RECORD
- EVIDENCE_RECORD
- PROOF_RECORD
- PUBLICATION_RECORD
- CUSTOMER_CONTENT
- FAMILY_CONTENT
- CHILD_RESTRICTED_CONTENT
- LEGAL_OR_EVIDENCE_HOLD
- UNKNOWN

Retention class governs how long an Asset record and its provider references should be kept. It does not prove rights or sharing approval.

## Deletion Model

Deletion concepts:

- deletion request;
- soft deletion;
- hard deletion;
- legal or evidence hold;
- provider deletion requested;
- provider deletion confirmed;
- provider deletion failed;
- backup retention;
- derivative cleanup;
- orphan detection;
- external-reference removal;
- proof-preservation exception;
- child or family deletion rules;
- customer-content deletion rules.

Deleting a StaffordOS record must not falsely claim provider deletion succeeded. Deleting a provider item must not silently delete StaffordOS audit or governance history.

## Derivatives and Cleanup

Derivative Assets must retain:

- original Asset reference;
- transformation provider;
- transformation instructions where safe;
- created timestamp;
- reviewer;
- rights and privacy reevaluation;
- limitation;
- publication state.

Cleanup must evaluate thumbnails, transcripts, captions, translations, exports, previews, generated variants, and publication copies. No derivative is deleted silently when the original changes unless a governed deletion policy authorizes it.

## Backup Rules

Backups preserve availability. They do not change:

- workspace;
- owner;
- visibility;
- rights;
- provenance;
- publication state;
- evidence status;
- proof status.

Backup restore must preserve Asset IDs and provider-reference history where possible. If provider references cannot be restored, the Asset remains with limitations and requires review.

## Non-Implementation Statement

This document does not create storage, scan media, connect Jellyfin, move files, read private content, create database tables, or modify runtime code.
