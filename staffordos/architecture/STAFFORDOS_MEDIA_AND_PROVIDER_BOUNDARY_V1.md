# STAFFORDOS_MEDIA_AND_PROVIDER_BOUNDARY_V1

Status: Proposed boundary ruling (documentation only)
Purpose: Define the responsibility boundary among StaffordOS, Media Studio, Jellyfin, storage, generated assets, metadata, playback, creation APIs, publishing platforms, family sharing, and child-safe access — before any media implementation exists. Also defines the minimum canonical provider contract for all future adapters.
Evidence baseline: targeted repository discovery found no Jellyfin, playback, streaming, media-storage, or media-library implementation. Planned Personal media text exists in S008 and `/os` capability records. The home server exists only as an ssh backup target (`staffordos/operating_loop/stop_workday_v1.sh`), and `personal-media` is planned-capability text only. This document therefore constrains future work rather than correcting existing code.

---

## 1. Role Rulings

| System | Role | Explicitly NOT its role |
|---|---|---|
| **Jellyfin** | Playback authority and library-catalog authority for the watchable media it manages. One provider among several for playback; authoritative for its own library metadata (items, streams, watch state, transcoding). | Not the system of record for rights, provenance, ownership, sharing approvals, or family visibility. Not a storage manager StaffordOS depends on for anything but playback locators. |
| **Source storage** (home server / NAS / buckets) | Storage authority — holds the bytes. | Never Git. Never StaffordOS's database. |
| **StaffordOS** | Governance overlay and catalog-of-record for *governed meaning*: Asset records, ownership, rights, provenance, privacy class, Share records, approvals, audit. References provider IDs/locators. | **Must not rebuild Jellyfin** — no scanning, transcoding, streaming, player UX, or duplicate library catalog. Must not hold media bytes. |
| **Media Studio** | A Personal-workspace *capability* for creation: projects, drafts, generation requests (via adapters), edits. Outputs land in storage and are registered as Asset records with provenance. | Not a standalone app; not a second asset model; not a publisher (publication is a governed Action). |
| **Media-generation APIs** | Providers behind adapters (same guard/validator/audit envelope pattern as the certified Ollama adapter). | Never called from UI components; never auto-publish. |
| **Publishing platforms** | Distribution endpoints behind adapters. Publication = an approved Action that records `publicationLocators` on the Asset. | No platform is the system of record for the asset itself. |
| **Family sharing** | Share records on Assets (audience, scope, expiry) under the Family membership overlay. | Not folder conventions; not Jellyfin user accounts as the authority (Jellyfin profiles are an *enforcement surface* configured from StaffordOS decisions, not the source of truth). |
| **Child-safe access** | A permission profile: default-deny, guardian-approved visibility, rating labels on Assets, no external-communication capability, age-appropriate shell, full audit. | Never a filtered view bolted on afterward; it is a precondition gate for any child access (see review §14 gate 4). |

## 2. Watch / Create Flow (target, not build order)

- **Watch:** StaffordOS Library surface lists Asset records (and Jellyfin-referenced items) → playback deep-links to Jellyfin (playbackLocator). StaffordOS may cache Jellyfin read models (`asOf`-stamped) for presentation.
- **Create:** Media Studio project → generation/edit via adapters → bytes to storage → Asset record with provenance (tool, model, inputsRef, parentAssetId) → optional approval → optional Share (family) or Publish (platform) as governed Actions.
- **Shared With Me:** a query over Share records, not a copy of files.

## 3. Minimum Canonical Provider Contract

Every adapter (Jellyfin, storage, media-generation, publishing, email, calendar, model providers, job sources) must declare:

1. **Identity:** `providerId`, `adapterKind`, `providerName`, `versionPin` (model digest / API version — as the Ollama adapter pins `qwen2.5:1.5b` by digest).
2. **Capabilities:** enumerated operations it supports (read_catalog, playback_locator, generate, publish, send…).
3. **Authority scope:** read / write / publish, and which workspace(s) may invoke it.
4. **Request/response schemas** with a structural guard (fail closed on shape violations).
5. **Data-ownership declaration:** which returned fields are provider-authoritative vs StaffordOS-referenced; cached reads stamped `asOf`.
6. **Secrets:** env-alias only; never literals; never reachable from UI components.
7. **Failure behavior:** timeout, fail-closed default, no silent retries with side effects.
8. **Audit envelope:** every invocation recorded (who, workspace, operation, request hash, result class).
9. **Health probe:** a safe read-side check.
10. **Isolation:** network allowlist where applicable (the Ollama adapter's hardcoded `127.0.0.1:11434` is the precedent; cloud providers require explicit new authority — none authorized today).

Existing integrations (Stripe, Resend/SMTP, Gmail-for-GitHub, Shopify) predate this contract; they are grandfathered but any rework brings them under it. The two competing email mechanisms must converge to one adapter when next touched.

## 4. Standing Counterexample This Document Exists to Prevent

`staffordos/proof_runs/output/evidence_manifest_v1.json` contains machine-specific stored paths under `/var/folders/...` (macOS temp) with `exists: false` — media/asset references that rotted because no Asset authority governed storage locators. No media file may ever be referenced that way.
