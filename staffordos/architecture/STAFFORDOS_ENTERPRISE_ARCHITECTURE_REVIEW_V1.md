# STAFFORDOS_ENTERPRISE_ARCHITECTURE_REVIEW_V1

Status: Complete
Reviewer role: Independent principal enterprise architect (external review posture)
Basis: Repository evidence only — code, committed S008/S009/S010/J001 authority, the local untracked ADR_0001 artifact, registries, Prisma schema, runtime scripts, and working-tree state at review time. No prior-chat authority used.
Mode: Documentation-only. No source code, routes, schemas, migrations, integrations, deployments, commits, or pushes were created or modified.

Companion artifacts:
- `STAFFORDOS_ENTERPRISE_ARCHITECTURE_REVIEW_V1.json` (structured findings)
- `STAFFORDOS_TARGET_PLATFORM_AND_WORKSPACE_MODEL_V2.md` (target logical architecture)
- `STAFFORDOS_MEDIA_AND_PROVIDER_BOUNDARY_V1.md` (media/Jellyfin/provider boundary)
- `STAFFORDOS_ANTI_DRIFT_REGISTER_V1.md` (drift register)

---

## 1. Executive Summary

StaffordOS is genuinely on a parent-operating-system trajectory, and the most feared failure modes have **not** occurred: `/os` does not duplicate `/operator` loaders or writes (verified — the two shells share zero components, zero loaders, zero API calls); AI is advisory and fail-closed (fixture demo + validator + one certified localhost Ollama proof); private Professional records are outside Git (verified 0 tracked private files; real intake runs landed in `~/.staffordos/private/` with owner-only permissions); and nobody is rebuilding Jellyfin or prematurely elevating Family/Media to workspaces.

The real architectural debt is in the **data plane**, not the UI plane:

1. **Repo-as-database.** `/operator` writes runtime truth into git-tracked JSON (`staffordos/events/*`, snapshots, proof runs). The repo's own ADR_0001 (Accepted 2026-07-27) concedes file-backed surfaces are not durable on Render. This is the single largest blocker to deployment, multi-user access, and Personal/Media work.
2. **Duplicated truth.** At least 11 competing lead/merchant/client/contact stores (reconciled at read time by `relationshipResolver.ts` with explicit conflict states), 3 unrelated decision stores, 3+ action stores, 4 evidence representations, 3 mission-ID namespaces, and a triple-defined workspace taxonomy.
3. **Identity built but unplugged.** A real issuer (`staffordos/operator-issuer/`, EdDSA JWT, roles) and Prisma operator-identity models exist, but the entire operator/os UI — including write-capable endpoints — is unauthenticated, and issuer permissions are all `shopifixer.*` (no workspace-general model).
4. **Static registries vs runtime truth.** All six S008 "foundations" (Objectives/Decisions/Actions/Evidence/Proof/Learning) are hardcoded TypeScript arrays with no write path. They are honestly labeled static, but divergence has already happened once (a real private job opportunity exists on disk while the committed UI permanently renders "No opportunities imported yet").
5. **Uncommitted authority.** J001's cited discovery authorities, the operator-issuer, the M007/M008 production-continuity records, and many other governance artifacts are untracked; A001 validation observed 153 untracked paths before review ratification. Committed missions cite uncommitted authority (a recurring pattern previously flagged in P11.58).

None of this requires a rebuild. The certified model is correct; the corrections are bounded and sequenced in §16. Final classification: **STAFFORDOS_ARCHITECTURE_SOUND_WITH_CORRECTIONS**.

---

## 2. Ross Vision Alignment

The target architecture supports Ross's stated StaffordOS direction without claiming runtime capability that does not exist yet:

- operating Stafford Media through the current runtime-canonical `/operator` surfaces while `/os` matures as the parent shell;
- building and operating ShopiFixer and Abando as Stafford Media capabilities or products, not separate top-level operating systems;
- running Job Search inside Professional and preserving Career Evidence so the same Professional workspace can later support My Job after employment;
- supporting Personal use, family and invited-member access, media watching through providers such as Jellyfin, media creation, music, movies, educational content, social content, and child-safe learning and creativity after identity, membership, Asset authority, provider boundaries, and child-safety gates exist.

These are target capabilities. They are not currently certified as implemented runtime features except where existing S008/S009/S010/J001 authority and code already prove them.

---

## 3. Evidence Classification Snapshot

| Area | Status |
|---|---|
| `/operator` shell (14 page routes, live loaders, 5 POST write/exec API routes + 10 server-action directives across 2 pages) | implemented and active — runtime-canonical |
| `/os` shell (16 routes, 7 sections, workspace switcher, registries, Chief of Staff demo, Job Command) | implemented and active — static presentation only, zero fetch/fs/writes |
| S008_08–13 foundations (objective/decision/action/evidence/proof/learning) | implemented as hardcoded TS constants — display-only |
| Chief of Staff (S009): validator + demo surface | implemented and active (fixtures only) |
| Ollama adapter + primary-action source adapter (S009_04B/06) | implemented but not connected (CLI proof harness only; no UI import) |
| S010 career-evidence contracts + private intakes (DOCX/PDF; 795 candidate facts) | implemented; executed for real; outputs private, outside Git |
| J001 Job Command shell (`/os/professional/jobs`) | implemented and active; data-disconnected by design (always-empty queue) |
| J001 intake bridge (`privateJobOpportunityIntake.ts`) | implemented but not connected (no runtime caller; run manually once — 1 real record on disk) |
| Operator identity (Prisma models + issuer + web verifier) | implemented but not connected to the UI |
| Personal workspace | architecture only (planned placeholder, negative leakage enforcement exists in career contracts) |
| Media / Jellyfin / home server | absent, except `stop_workday_v1.sh` uses `ssh ross@home-server` as a backup target |
| Abando | implemented and deployed (`web/` = pay.abando.ai); 0 customers per `revenue_truth_v1.md`; control-plane-only in StaffordOS |
| ShopiFixer | implemented and active as a governed service; boundary enforcement is patchwork (keyword guard, shared Prisma schema, per-writer conventions) |
| Legacy UI roots (`staffordos/ui/command-center`, `send-console`, `frontend/`, templates, debris) | legacy / abandoned |
| J001 discovery docs, operator-issuer, M007/M008/RECOVERY_001 records | implemented/authored but UNCOMMITTED |

---

## 4. Parent OS Assessment (Q1)

**Verdict: becoming a parent OS at the architecture and shell layer; still a single business application plus one deployed product at the runtime layer. Not drifting into parallel applications at the UI level; at risk of it at the data level.**

Evidence for the parent-OS trajectory: the S008_00→14 chain is a disciplined, certified sequence; `/os` implements the canonical taxonomy (Home/Command/Work/Pipeline/Knowledge/Governance/System) as a link-hub over `/operator` exactly as S008_01 prescribed ("Do not import existing data loaders into /os"); capability links carry `currentRoute` into `/operator` rather than re-implementing it; UnifiedHome states, truthfully, "These links open the existing Stafford Media pages. They do not duplicate their data or actions."

Evidence for the parallel-application risk: it is entirely in data. Mission IDs exist in three unreconciled namespaces (mission_001/002 bindings; S008 synthetic `missionId` strings; the untracked Mission Engine proposal). Business identity is spread over 11 stores. The Prisma schema mixes Abando, ShopiFixer, and StaffordOS identity models in one database with no physical or logical partitioning. If new workspaces add their own JSON stores, StaffordOS becomes a federation of file cabinets with one shell in front — the corrective is a single persistence authority (§12), not more shell work.

---

## 5. Workspace Model Assessment (Q2)

**Stafford Media / Professional / Personal are sufficient and correct as the only top-level families.** No evidence supports elevating Family, Media, or Creative: they have no data, no members, no runtime, and no capability that crosses Personal's boundary. Elevation would create empty governance surface area. They should remain capabilities/sharing contexts inside Personal exactly as certified — Family becomes a *membership and sharing* concept (people + visibility), Media a *capability cluster* (Watch/Create/Library), Creative a *mode of Media Studio*.

**Correction needed — the taxonomy is triple-defined:** `workspaceRegistry.ts` (3 workspaces) vs `chiefOfStaffValidator.ts` (duplicate type definitions) vs `staffordos/domains/domain_registry_v1.json` (13 life/business domains, all `active: true` — a legacy layer) vs the name collision with `STAFFORDOS_MERCHANT_WORKSPACE_ARCHITECTURE_V1.md` ("workspace" = merchant-facing fix-status shell). One canonical registry must own the term; the domain registry should be marked legacy or re-labeled as a *dimension* (life areas) rather than a competing workspace list; the merchant "workspace" should be renamed (e.g., "merchant portal") in the next document revision.

---

## 6. Professional Continuity: Job Search → My Job (Q3)

**The transition can be clean, and S010 already made the key architectural decision correctly:** `FACT → EVIDENCE → OPERATOR VERIFICATION → POSITIONING → ARTIFACT`. Career facts and evidence are *mode-independent*; resumes, applications, and pipelines are *mode-specific positioning artifacts*. That is exactly the separation that survives an employment transition.

What must survive Job Search → My Job (already mode-neutral by design): CareerFact / CareerEvidence records; professional relationships (recruiters become colleagues/network); learning records; achievements (a My Job achievement is just a new CareerFact with evidence); the private-storage pattern (`~/.staffordos/private/professional/...`).

What is Job Search-mode-only and should be archived, not migrated: opportunity queue, applications, interview pipeline, fit analyses, outreach artifacts.

What My Job mode adds later: current-role objectives, performance evidence capture (feeding the same CareerFact store), compensation records, workplace relationships.

**Corrective actions:** (1) `workspaceRegistry.ts` still says Professional has "no runtime workflow yet" while J001 shipped an Available-now route inside it — update the registry truthfully (mode: Job Search partially live; My Job planned). (2) Model "mode" explicitly on Professional records now (a `professionalMode: job_search | my_job | mode_neutral` field in the contracts) so nothing later needs re-tagging. (3) Never let opportunity/application semantics into CareerFact records — the existing `BUSINESS_OR_PERSONAL_LEAKAGE` validator shows the pattern; add a mode-leakage rule beside it.

---

## 7. Personal and Family Assessment

Personal is a well-behaved placeholder: registered as planned, rendered honestly ("No personal data is connected yet"), and — unusually good — *negatively enforced* in code (`careerEvidenceContracts.ts` rejects `workspaceId === "personal"` records as leakage; the Ollama adapter asserts no Personal data supplied). Nothing Personal exists to leak.

Family requires **zero build now** but a firm rule: Family is a *membership overlay* (guardian/adult/child roles + sharing scopes on assets), not a data silo and not a workspace. The blocking dependencies for any Family capability are the platform primitives: identity/membership (§14), the Asset model (§13), and default-deny permissions. Building any family-visible surface before those exist would be the drift; none is being built.

---

## 8. Media and Jellyfin Boundary (Q6)

Full boundary specification in `STAFFORDOS_MEDIA_AND_PROVIDER_BOUNDARY_V1.md`. Summary of the ruling:

- **Jellyfin = playback authority and library-catalog authority for watchable media it manages.** StaffordOS references Jellyfin item IDs; it never re-implements scanning, transcoding, streaming, or player UX. Jellyfin is simultaneously *one provider among several* (other players/services may exist later) and *authoritative for its own library's metadata*.
- **Source storage (home server / NAS / cloud buckets) = storage authority.** StaffordOS stores locators, never bulk media bytes, and never in Git.
- **StaffordOS = governance overlay and catalog-of-record for *ownership, rights, provenance, privacy, sharing approvals, and family visibility*** — the things no media server models. It holds Asset records that *reference* provider authority.
- **Media Studio = a Personal-workspace capability (creation),** producing assets into storage and registering them as Asset records with provenance (tool, model, inputs). It is not a standalone app and must not get its own asset model.
- **Publishing platforms = distribution endpoints behind adapters,** with publication as a governed, approved Action that records publication locators on the Asset.
- Current evidence state reinforces the need: the only "asset registry" today (evidence manifest) contains broken machine-specific temp-dir paths (`/var/folders/...`) with `exists: false` — proof that ungoverned file references rot.

The home server already exists operationally (ssh backup target in `stop_workday_v1.sh`); it is the natural host for Jellyfin, bulk storage, and the local model runtime, but that is a deployment decision (§15), not an architecture requirement.

---

## 9. Content Creation Platform Assessment (Q7)

One shared Media Studio capability **can** serve business content, professional portfolio, personal/family media, and children's educational content — but only on top of the Asset model, because the safety property lives on the asset, not the studio: every asset carries `workspaceId`, `ownerId`, rights, privacy class, and an approval chain; **publication authority stays per-workspace** (business publish gates ≠ personal share gates ≠ child gates). The studio is a tool; the workspace owns the output.

Today, business content machinery (campaigns, outreach, messaging docs) exists and personal/creative content architecture does not — and they are correctly not conflated. The corrective is sequencing only: do not build any creation surface before the Asset model and identity exist. Reuse the S009 adapter pattern for media-generation APIs (same guard/validator/audit envelope shape).

---

## 10. UI Authority and Duplication Assessment (Q4)

**The /operator–/os boundary is sound and is being honored in code.** Verified facts: root redirects to `/operator`; `/os` has zero `fetch`, zero `node:fs`, zero server actions, zero write endpoints; the two component trees (`components/operator/*` vs `components/staffordos/*`) share nothing but global CSS; every "available now" /os capability deep-links to the /operator surface instead of re-implementing it. The repo's own J001 duplication matrix already made correct calls (PRESERVE_BOTH_FOR_NOW, EXTEND_CANONICAL, REUSE_CONCEPT_ONLY, DEPRECATE_LATER for OperatorNav).

Where duplication actually lives:

1. **Conceptual/staleness duplication** — /os Home's static "primary action" copy vs /operator's live snapshot; static registries vs live logs. This is drift-by-staleness, not code duplication. Corrective: freshness/`asOf` labeling now; governed read-model adapters (S009_05 pattern) later. Never ad-hoc imports of `/operator` loaders.
2. **Legacy duplication** — `staffordos/ui/command-center/` and `send-console/` re-implement lead/send flows `/operator` now owns; 7 orphaned operator components (incl. `RossCommandCenterSurface`, sole consumer of a dead API route); root-level template/debris frontends. Corrective: a deletion/containment wave (low risk, high hygiene value).
3. **Internal /operator near-duplicates** — cockpit vs command-center vs /os/command answer the same question. The matrix's MIGRATE_INTO_CANONICAL_LATER is right; do not consolidate during Job Search work.

Reuse / adapt / link / migrate / leave alone: **reuse** StaffordOsShell + the /os surface components for all new workspace UI; **adapt** /operator truth into /os only through governed read adapters; **link** (current state) until parity per S008_01 rule 6; **migrate** cockpit/command-center family later under one mission; **leave alone** all write-capable routes and ShopiFixer writers, exactly as S008_01 rule 5 commands.

---

## 11. Shared Platform Primitives (Q5)

Ruling per primitive — G = must be a global platform primitive; the current state and the correction:

| Primitive | Ruling | Current state → correction |
|---|---|---|
| Identity | G | Built (issuer + Prisma models + web verifier), unplugged; permissions all `shopifixer.*`. → Generalize permission namespace (`workspace.capability.action`), deploy issuer, connect UI. |
| Membership | G | Absent (single implicit user). → Define Member(person, workspace, role, guardianOf?) before any second user. |
| Permissions | G | Role maps duplicated in two codebases. → One shared permission module; default-deny. |
| Workspace context | G | Presentation-only React state (correctly self-labeled "not authorization"). → Keep presentation-only until identity lands; then a server-derived context object. |
| Actions | G | 3+ stores (static registry, events JSON, snapshots) + per-capability queues. → One Action store in Postgres; registries become views. |
| Decisions | G | 3 unrelated stores. → One Decision store; DecisionLog (cart telemetry) stays product-scoped and is *not* the platform Decision object. |
| Objectives | G | Static TS only. → Persist; keep S008 contract shape. |
| Evidence / Proof | G | 4 representations; broken artifact paths. → Fold into Asset + Proof records referencing assets by hash. |
| Learning | G | 3 fragments. → One Learning store fed by proof outcomes. |
| Relationships | G | 11 stores + read-time resolver with conflict states. → One Party/Relationship model with facets (lead/client/merchant/recruiter/colleague/family); resolver becomes the migration tool, then dies. |
| Search | G (later) | Absent. Defer until data is in one store — search over 11 JSON files is wasted work. |
| Notifications | G (later) | Absent (placeholder in shell). Defer until multi-user. |
| Files/Assets | G | Embryonic and broken. → Asset authority (§13) **before any Media work**. |
| Approvals | G | Most mature primitive (ShopifixerRepairApproval, ExecutionGrant, gates). → Generalize the existing pattern; don't reinvent. |
| Policy | G | Doctrine docs + validators. → Fine as documents + deterministic validators for now. |
| Audit | G | Real on Postgres side (SystemEvent, LeadEvent, OperatorEvent w/ idempotency); mutable JSON on file side. → All new writes audit to Postgres. |
| Agents / AI | G | S009 pattern is the certified template (guard → validator → advisory only). → All future agents use it; no exceptions. |
| Provider adapters | G | One certified adapter (Ollama); everything else one-off. → Canonical provider contract (§13 of boundary doc). |

---

## 12. Data Architecture (Q10)

Record classification ruling:

- **Globally shared:** identity, membership, workspace registry, policy, permission definitions, audit log.
- **Workspace-scoped:** objectives, actions, decisions, relationships, assets, evidence/proof, learning. Workspace ID is a mandatory column, not a folder convention.
- **Capability-scoped:** pipeline/queue state (job-search queue, lead pipeline, media render queue) — always owned by a workspace-scoped parent record.
- **User-private (never in Git, never in shared DB without encryption/consent):** career facts/evidence/positioning, personal planning, private opportunity intake. The `~/.staffordos/private/` + 0600/0700 pattern is correct; its durability (backup) is currently only the ssh workday checkpoint — define an explicit encrypted backup path.
- **Family-shared:** explicit Share records on assets (subject, audience, scope, expiry) — sharing is a record, not a folder.
- **Externally referenced:** Jellyfin items, GitHub artifacts, published posts — StaffordOS stores provider ID + locator + last-verified metadata only.
- **Provider-authoritative:** payment state (Stripe), email delivery state (Resend), playback/library state (Jellyfin), employment-market listings. StaffordOS caches read models with `asOf`; it never claims to own these truths.
- **Copied only by explicit approval:** anything crossing a workspace boundary (business → portfolio; family → published) — the copy is an approved Action producing a new asset with provenance pointing at the source.

**The overriding correction is ADR_0001 execution:** git-tracked JSON is not a runtime database. Runtime truth → Postgres (already the durable store for packets/identity); private truth → local private store; Git keeps code, architecture, doctrine, and *sealed* evidence exports only.

---

## 13. File and Asset Authority (Q11)

The reusable Asset model (full field ruling also in the boundary doc):

`Asset { id, workspaceId, ownerId (member), kind (document|image|audio|video|resume|proof|generated|dataset), origin (created|generated|ingested|external_reference), sourceAuthority (staffordos_stored | provider_authoritative), storageLocator, playbackLocator?, publicationLocators[], contentHash, sizeBytes, mimeType, provenance { createdBy, tool?, model?, promptOrInputsRef?, parentAssetId?, transformation? }, rights { license, usageConstraints, subjectConsents[] }, privacy (private | workspace | family_shared | public), version, retention { policy, deleteAfter?, legalHold? }, externalProviderIds { jellyfin?, stripe?, github?, platform? }, status (active|archived|deleted) }`

Rules: source authority is explicit per asset — StaffordOS either *stores* it (and the locator is a StaffordOS-managed store, never a temp dir, never the Git repo for binaries) or *references* provider authority (and must tolerate the provider disagreeing). Derivatives always point at parents. Deletion is a governed action honoring retention. Resumes and proof artifacts are just assets with `kind` set — one model serves career evidence, ShopiFixer proof, and family photos alike.

The evidence manifest's broken `/var/folders/...` paths and the machine-specific `stored_path` entries are the standing counterexample this model exists to eliminate.

---

## 14. Identity and Multi-User Readiness (Q12)

Gate ladder (each gate blocks the next audience, nothing more):

1. **Ross solo, production:** durable persistence (ADR_0001 execution) + at minimum a local shared-secret/token on the observed write/exec surfaces. Identity UI login optional while single-user and local-only, but write-capable surfaces must not stay open the day anything is network-reachable.
2. **Employee/contractor on Business:** deploy `operator-issuer`; connect the existing verifier pattern to the Next UI (middleware); generalize permissions beyond `shopifixer.*`; de-duplicate the two role-map copies; membership records; audit on every write.
3. **Ross in My Job mode:** no new identity work — requires only the Professional mode field and continued private-store discipline.
4. **Children/family on Personal Media:** everything in gate 2 plus guardian relationships, default-deny visibility, content rating on assets, no-external-communication capability for child roles, age-appropriate shell, consent/retention/deletion records, moderation queue for shares, full audit of child-visible surfaces.
5. **Invited external viewers:** scoped share tokens per asset/collection, expiry, watermarking policy decision, and audit.

Nothing beyond gate 1 is needed now; the drift risk is only if any surface becomes multi-user before its gate.

---

## 15. Deployment and Runtime Topology (Q13)

Current: Render (Express `web` = pay.abando.ai, Postgres), Vercel (abando-frontend), the operator/os Next app running locally and writing into the Git working tree, home server reachable by ssh (backup target), Ollama installed locally (stopped). No queue infrastructure beyond Prisma Job/EmailQueue; daemons are local node scripts.

Assessment: supports cloud product services today; does **not** support deploying the operator UI (repo-as-database), offline/degraded operation (no local DB), or media streaming (nothing exists). The topology decision that unlocks the roadmap: **three tiers** — (a) cloud: products + shared Postgres platform data; (b) home server: Jellyfin, bulk asset storage, local model runtime, private backups; (c) device-local: `~/.staffordos/private/` user-private truth. Provider adapters are the only crossing points between tiers. This is a target, not a current requirement; the only *current* blocker to fix is (a)'s dependency on removing repo-as-database.

---

## 16. Governance Risks and Roadmap (Q14–15)

Full register with evidence and severities in `STAFFORDOS_ANTI_DRIFT_REGISTER_V1.md`. The materialized risks are: duplicated truth (high), repo-as-database / accidental source mutation via UI writes (high), unauthenticated write endpoints (high at any network exposure), single-layer private-data defense (medium; no `.gitignore` backstop for `*.private.json`/private paths), uncommitted authority chain (medium-high), static/runtime divergence already observed once (medium), three mission namespaces (medium). Explicitly *not* materialized: /os duplication, silent AI authority, workspace-context-as-auth, premature Family/Media, Jellyfin rebuild, provider logic in UI (one hardcoded URL aside).

**Smallest corrective sequence:**

*Must correct before more Job Search implementation (cheap, ordered):*
1. Commit the cited-but-untracked authority: J001 discovery docs, operator-issuer, S-series/M007/M008 governance records (one containment wave, pattern already proven in P11.58).
2. Add the `.gitignore` backstop: `*.private.json`, `staffordos-private-intake/`, `.staffordos/` — defense-in-depth behind the code guards.
3. Fix the Professional registry contradiction (planned vs live route) and add the `professionalMode` field to Professional contracts.
4. Decide the wiring rule for the jobs queue: UI reads private data only through a governed read adapter (S009_05 shape) with the disclosure contract — never direct fs reads in components.
5. Put a minimal auth token on the observed write/exec surfaces (or record an explicit accepted-risk decision while local-only).

*Must define before any Personal/Media implementation:*
6. Asset/File authority (adopt §13; supersedes the evidence-manifest pattern for new artifacts).
7. Membership + guardian model (definition only).
8. Media/provider boundary (done — `STAFFORDOS_MEDIA_AND_PROVIDER_BOUNDARY_V1.md`; ratify it).
9. ADR_0001 execution plan: which runtime JSON stores move to Postgres first (events, snapshots, action log lead the list).

*Can wait until Abando has customers / CRM work resumes:*
10. Party/Relationship consolidation (11 → 1, resolver as migration tool).
11. Email-mechanism unification (Resend vs SMTP scripts).

*Can wait until multi-user access:*
12. Full RBAC in UI, notifications, search, share tokens.

*Long-term optimization only:*
13. Mission-namespace unification; legacy UI deletion wave; cockpit/command-center consolidation; monorepo product split.

---

## 17. Final Classification

**STAFFORDOS_ARCHITECTURE_SOUND_WITH_CORRECTIONS**

The certified model (parent OS, three workspace families, operating loop, advisory AI, adapter-mediated providers, /operator runtime-canonical with /os as emerging shell) is internally consistent, matches the code where code exists, and the discipline that matters most — boundary honesty — is demonstrably practiced. The corrections are real but bounded: unify truth storage, plug in the identity that already exists, protect private paths with a second layer, commit the authority chain, and define Asset authority before Media. No rebuild is required, and proceeding on the current path *with the §16 sequence* avoids future rebuilding.
