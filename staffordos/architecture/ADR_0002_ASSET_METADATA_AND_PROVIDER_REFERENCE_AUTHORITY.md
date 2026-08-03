# ADR-0002: Asset Metadata and Provider Reference Authority

Status: Accepted for A001.00 architecture baseline
Date: 2026-08-03

## Context

StaffordOS needs one platform-level way to govern files, media, documents, generated outputs, provider references, evidence artifacts, proof attachments, resumes, job descriptions, presentations, portfolio materials, family media, and external media references.

Repository discovery found no canonical Asset model. Existing concepts are partial:

- S008 Evidence and Proof define governance foundations but not file or media authority.
- S009 source tracing defines provenance principles but not Asset lifecycle.
- S010 Professional contracts preserve source and evidence boundaries but are workspace-specific.
- ShopiFixer proof fields can reference artifacts but do not provide general Asset governance.
- Existing output manifests include machine-specific or temporary paths that can become stale.
- Planned Personal media text exists, but no Jellyfin or media runtime exists.

ADR_0001 governs ShopiFixer persistence debt. It does not decide cross-workspace Asset metadata, provider references, rights, privacy, or lifecycle.

## Decision

StaffordOS will use a single platform-level Asset Authority for governed asset metadata and provider references.

An Asset record is StaffordOS authority for:

- asset identity;
- workspace;
- owner;
- capability relationship;
- type and media classification;
- privacy and visibility;
- rights;
- provenance;
- lifecycle;
- review and approval;
- relationships to versions, derivatives, source materials, evidence, proof, storage, playback, publication, and audit.

An Asset record is not automatically the binary payload, provider catalog item, playback authority, source truth, Evidence, or Proof.

Provider-specific IDs, URLs, file names, library IDs, and storage locators are aliases or provider references. They must not replace StaffordOS Asset IDs.

Jellyfin may become catalog and playback authority for media it manages, but StaffordOS will not rebuild Jellyfin, copy its catalog without explicit authority, or treat Jellyfin as rights, privacy, ownership, or provenance authority.

## Consequences

- Resumes, job descriptions, cover letters, proof screenshots, customer documents, portfolio materials, media files, generated outputs, and Jellyfin references can use one governance model.
- Workspace ownership is explicit and separate from asset type and storage provider.
- Provider references can be stale or unavailable without destroying Asset authority.
- Evidence and Proof remain explicit relationships rather than automatic meanings of a file.
- Family and child access require identity, membership, visibility, rights, suitability, approval, and audit gates before implementation.
- Current private Career and Job Search files remain outside Git and are not migrated by this ADR.

## Non-Decisions

This ADR does not:

- implement an Asset model;
- choose a database schema;
- create migrations;
- create APIs;
- create routes or UI;
- connect Jellyfin;
- move or scan media;
- read private files;
- authorize external providers;
- change Job Search behavior;
- change ShopiFixer or Abando runtime behavior.

## Follow-Up

The next implementation-adjacent work should not be Asset implementation by default. A001 selects `GOVERNANCE_PRIVATE_PATH_GITIGNORE_BACKSTOP` as the immediate next mission because private Professional data already exists outside Git and needs a repository-level backstop before additional private-data workflows expand.
