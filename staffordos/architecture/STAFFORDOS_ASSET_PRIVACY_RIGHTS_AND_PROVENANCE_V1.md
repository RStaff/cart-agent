# STAFFORDOS_ASSET_PRIVACY_RIGHTS_AND_PROVENANCE_V1

Status: Accepted architecture authority - documentation only
Date: 2026-08-03
Supersedes: none

## Purpose

This document defines the privacy, visibility, rights, and provenance rules for StaffordOS Assets. It applies across Stafford Media, Professional, and Personal without turning Family, Media, ShopiFixer, Abando, Job Search, or Jellyfin into Asset types.

## Visibility Classifications

- OWNER_PRIVATE
- WORKSPACE_PRIVATE
- TEAM_SHARED
- FAMILY_SHARED
- FRIEND_SHARED
- INVITED_VIEWER
- CHILD_RESTRICTED
- PUBLIC_APPROVED
- PROVIDER_MANAGED

Default visibility is owner-private when the correct visibility is unknown.

Family sharing must not grant access to the whole Personal workspace. A shared Asset must not imply shared access to its source memory, parent project, related private Assets, source materials, or audit history.

## Rights Classifications

- OWNED
- LICENSED
- THIRD_PARTY_REFERENCE
- FAIR_USE_REVIEW_REQUIRED
- PERSONAL_USE_ONLY
- FAMILY_USE_ONLY
- BUSINESS_USE_APPROVED
- PUBLICATION_APPROVED
- RESTRICTED
- UNKNOWN

Unknown rights must remain unknown. Rights status controls use, sharing, transformation, and publication. A provider locator does not prove usage rights.

## Provenance Classifications

- ORIGINAL_OPERATOR_CREATED
- FAMILY_MEMBER_CREATED
- EMPLOYEE_CREATED
- CUSTOMER_PROVIDED
- PROVIDER_GENERATED
- AI_GENERATED
- IMPORTED
- TRANSFORMED
- EXTERNAL_REFERENCE
- UNKNOWN

Provenance identifies where the asset came from and what transformations occurred. It does not override rights, privacy, or workspace boundaries.

## AI-Generated Content

AI-generated content must retain:

- generating provider;
- model identity when available;
- generation timestamp;
- source inputs or safe input references;
- transformation instructions where safe;
- human reviewer;
- approval state;
- limitations.

Unsafe prompts, credentials, private source contents, and provider secrets must not be stored in Asset records.

AI may classify, summarize, propose metadata, suggest relationships, draft content, and identify missing rights information.

AI may not change ownership, grant access, approve publication, claim rights, delete assets, share with children, publish externally, override retention, or silently merge assets.

## Workspace Privacy Rules

Stafford Media:

- Business documents, ShopiFixer proof, Abando assets, customer-authorized materials, marketing content, and case-study assets are Stafford Media scoped.
- Customer material requires customer authorization before reuse or publication.
- Business-to-Professional portfolio use requires explicit approval and provenance.

Professional:

- Resumes, job descriptions, cover letters, career evidence, portfolio material, application attachments, and employer-provided documents are owner-private by default.
- Resumes are presentation artifacts, not source truth.
- Career Evidence and Job Search private files remain outside Git until a governed encrypted storage authority exists.

Personal:

- Private documents, family media, learning materials, photos, movies, music, and creative projects are owner-private by default.
- Family access requires explicit membership and share records.
- Media providers do not determine family visibility.

## Child and Family Boundary

Before a child or restricted member can access Assets, StaffordOS requires:

- guardian authority;
- explicit membership;
- default-deny access;
- age-appropriate visibility;
- no unapproved external communication;
- no unapproved publishing;
- creation limits;
- provider limits;
- download limits;
- sharing limits;
- content-rating or suitability labels;
- review and moderation;
- audit;
- consent;
- retention;
- deletion;
- report or block mechanisms.

These are future multi-user gates. This document does not implement them.

## Approval Boundary

Human approval is required for:

- publishing;
- family sharing;
- child-visible access;
- public portfolio use;
- business use of customer-provided assets;
- final representations made in Ross's name;
- deletion that affects provider content;
- rights status changes;
- workspace boundary crossings.

No provider, model, generated document, imported file, or repeated wording can grant approval by itself.
