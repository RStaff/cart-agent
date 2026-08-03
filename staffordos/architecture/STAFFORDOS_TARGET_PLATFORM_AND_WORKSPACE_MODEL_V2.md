# STAFFORDOS_TARGET_PLATFORM_AND_WORKSPACE_MODEL_V2

Status: Proposed target logical architecture (documentation only — nothing here authorizes implementation)
Derived from: STAFFORDOS_ENTERPRISE_ARCHITECTURE_REVIEW_V1; supersedes nothing — extends S008_04's platform model with the data-ownership rulings the review found missing. S008 chain remains the certified baseline.

---

## 1. Logical Architecture

```
+---------------------------------------------------------------------------------+
| STAFFORDOS PLATFORM (Level 1 — global primitives; one implementation each)      |
|                                                                                 |
|  Identity & Membership      Workspace Context        Governance & Policy        |
|  (issuer, members, roles,   (server-derived, per-    (doctrine docs +           |
|   guardian links)            request; presentation    deterministic validators,  |
|                              until identity lands)    approval gates)            |
|                                                                                 |
|  Actions & Decisions        Evidence, Proof,          Search & Notifications    |
|  (ONE store each; queues     & Learning               (deferred until data      |
|   are views, not stores)    (reference Assets by hash) is unified)              |
|                                                                                 |
|  Asset & File Authority     Provider & Adapter Layer  Chief of Staff            |
|  (single Asset model;       (canonical provider       (advisory only; guard →   |
|   stored vs provider-ref)    contract; ONLY crossing   validator → operator;     |
|                              point to external systems) reads via governed       |
|                                                        read-model adapters)     |
|                                                                                 |
|  Audit (append-only, Postgres-side, idempotency keys — extend existing pattern) |
+---------------------------------------------------------------------------------+
                    |                    |                     |
        +-----------+-----+   +----------+--------+   +--------+---------+
        | STAFFORD MEDIA  |   | PROFESSIONAL      |   | PERSONAL         |
        | (Business)      |   | modes: Job Search |   |                  |
        |                 |   |        My Job     |   |                  |
        | Capabilities:   |   | Capabilities:     |   | Capabilities:    |
        |  ShopiFixer     |   |  Job Search       |   |  Private planning|
        |  Abando         |   |  My Job           |   |  Family (member- |
        |  CRM/relation-  |   |  Career evidence  |   |   ship + sharing |
        |   ships         |   |   (mode-neutral)  |   |   overlay)       |
        |  Finance        |   |  Achievements     |   |  Learning        |
        |  Delivery       |   |  Learning         |   |  Media Studio    |
        |  Business       |   |  Professional     |   |   (creation)     |
        |   content       |   |   relationships   |   |                  |
        |                 |   |  Portfolio content|   | Media capability |
        |                 |   |                   |   | cluster:         |
        |                 |   |                   |   |  Watch / Create /|
        |                 |   |                   |   |  Projects /      |
        |                 |   |                   |   |  Library / Shared|
        |                 |   |                   |   |  With Me /       |
        |                 |   |                   |   |  Approvals /     |
        |                 |   |                   |   |  Rights & Prov.  |
        +-----------------+   +-------------------+   +------------------+
                    |                    |                     |
+---------------------------------------------------------------------------------+
| PROVIDER & ADAPTER LAYER (every external/local system behind a governed adapter) |
|  Jellyfin | Storage (home server/NAS/buckets) | Media-generation APIs |          |
|  Publishing platforms | Email (ONE mechanism) | Calendar | Model providers      |
|  (Ollama certified; cloud requires new authority) | Job sources | Stripe |       |
|  Shopify | Render | GitHub                                                       |
+---------------------------------------------------------------------------------+
```

## 2. Data Ownership Rulings (own vs reference)

| Layer | OWNS | REFERENCES (provider-authoritative) |
|---|---|---|
| Platform | identity, membership, workspace registry (ONE), policy, audit, Action/Decision/Objective/Evidence/Proof/Learning stores, Asset records, Share records | — |
| Stafford Media | its workspace-scoped records (relationships via the single Party model, packets/proof via existing Postgres) | Stripe payment truth, Shopify store truth, Render deploy truth |
| Professional | CareerFact/CareerEvidence (user-private store), opportunities/applications (mode-scoped, private), portfolio assets | job-source listings (external), employer systems |
| Personal | plans, family membership overlay, Media Studio project records, Asset records for created media | Jellyfin library/playback state, storage bytes |
| Adapters | adapter config, audit envelopes, cached read models with asOf stamps | ALL provider internal state |

Rules: (1) every workspace-scoped record carries `workspaceId` as a mandatory field, not a folder convention; (2) crossing a workspace boundary is an approved Action producing a new record/asset with provenance — never a silent copy; (3) provider truth is cached, stamped `asOf`, and never asserted as StaffordOS truth; (4) user-private records live outside Git and outside the shared DB (`~/.staffordos/private/` pattern, plus an explicit encrypted backup path).

## 3. Workspace Model Rulings

1. Top-level families remain exactly: **Stafford Media, Professional, Personal.**
2. **Family, Media, Creative are NOT workspaces.** Family = membership + sharing overlay (guardian/adult/child roles, Share records). Media = capability cluster inside Personal (Watch/Create/Projects/Library/Shared With Me/Approvals/Rights). Creative = a mode of Media Studio. Promotion to workspace requires a governed decision citing evidence of boundary need (distinct members + distinct authority + distinct data lifecycle) — none exists today.
3. **Professional has modes, not sub-workspaces:** `professionalMode: job_search | my_job | mode_neutral` on Professional records. Career evidence is mode_neutral and survives the employment transition; pipelines are mode-scoped and archived at transition.
4. The taxonomy is defined ONCE (`workspaceRegistry` as the single source). `domains/domain_registry_v1.json` is re-labeled a legacy *life-dimension* map; the merchant-facing "workspace" is renamed (merchant portal) at next revision of that document.
5. Products (ShopiFixer, Abando, future Actinventory) are **capabilities/lenses inside Stafford Media**, never workspaces — consistent with S008_04.

## 4. UI Authority Rulings

1. `/operator` remains runtime-canonical for Stafford Media until per-surface parity migrations (S008_01 rules 4–6).
2. `/os` remains the canonical shell and information architecture; it gains data ONLY through governed read-model adapters (S009_05 shape) — never by importing `/operator` loaders, never by direct fs/DB reads in components.
3. All static /os surfaces display an `asOf`/staticity label until adapter-backed.
4. New workspace surfaces (Professional, Personal) are built ONLY under `/os` with StaffordOsShell — `/operator` gets no new non-Business surfaces.
5. Write authority arrives in `/os` only after identity: server actions gated by permission checks, auditing to the platform Audit store.

## 5. Sequencing Constraints (what unlocks what)

- Identity connection unlocks: any second user, any /os write authority, family anything.
- Asset authority unlocks: Media Studio, portfolio content, durable proof artifacts, publishing.
- ADR_0001 execution (runtime truth → Postgres) unlocks: deploying the operator UI, degraded/offline modes, honest snapshots.
- Party/Relationship consolidation unlocks: CRM growth, recruiter/professional relationships without a 12th store.
- Canonical provider contract unlocks: Jellyfin, media-generation, calendar, job-source adapters as routine work instead of one-offs.
