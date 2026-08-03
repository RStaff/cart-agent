# STAFFORDOS_ANTI_DRIFT_REGISTER_V1

Status: Complete (companion to STAFFORDOS_ENTERPRISE_ARCHITECTURE_REVIEW_V1)
Each entry: evidence → severity → why it matters → actual drift vs future risk → corrective action → required now?

---

## D01 — /os recreating /operator
- **Evidence:** Zero shared components/loaders/API calls between `components/operator/*` and `components/staffordos/*`; `/os` has zero fetch/fs/writes; capabilities deep-link to `/operator` (`capabilities.ts` currentRoute fields).
- **Severity:** Low today. **Verdict: NOT drift — future risk only.** The temptation returns the day `/os` needs live data.
- **Why it matters:** Duplicated loaders would fork truth and double the write surface.
- **Correction:** Hard rule — `/os` gains data only via governed read-model adapters (S009_05); adopt as a gate check on any /os PR. **Required now?** Rule adoption yes; work no.

## D02 — Professional becoming only a Job Search app
- **Evidence:** Only `/os/professional/jobs` exists; Opportunities/Applications/etc. planned; **but** `workspaceRegistry.ts` lists both modes and S010 career evidence is deliberately mode-neutral (`FACT → EVIDENCE → POSITIONING`).
- **Severity:** Medium. **Verdict: partial actual drift** (surface-level), mitigated at the data layer.
- **Why it matters:** If My Job semantics never appear in contracts, transition day becomes a rebuild.
- **Correction:** Add `professionalMode` field to Professional contracts now; name My Job surfaces in the J-series plan (build later). **Required now?** The field, yes (cheap); surfaces, no.

## D03 — Personal being omitted
- **Evidence:** Registered planned workspace; honest placeholder UI; negative enforcement exists (`careerEvidenceContracts.ts` rejects personal-workspace records as leakage).
- **Severity:** Low. **Verdict: not drift** — deliberate deferral, correctly labeled.
- **Correction:** None until Personal implementation begins (then follow review §16 "before Personal/Media" list). **Required now?** No.

## D04 — Family/Creative becoming premature top-level workspaces
- **Evidence:** Zero artifacts elevate them; they appear only as futureCapabilityGroups text.
- **Severity:** Low. **Verdict: not drift.**
- **Correction:** Promotion requires a governed decision citing boundary-need evidence (TARGET_MODEL_V2 §3.2). **Required now?** No.

## D05 — Media being built as a standalone app
- **Evidence:** Planned media capability text exists in S008 and `/os`, but targeted discovery found no Jellyfin, playback, streaming, media-storage, media-library, or standalone Media app implementation.
- **Severity:** Low. **Verdict: not drift.** Boundary doc now pre-constrains it. **Required now?** No.

## D06 — StaffordOS rebuilding Jellyfin
- **Evidence:** No playback/streaming/catalog code anywhere.
- **Severity:** Low. **Verdict: not drift.** `MEDIA_AND_PROVIDER_BOUNDARY_V1` §1 forbids it explicitly. **Required now?** No.

## D07 — Workspace context mistaken for authorization
- **Evidence:** `WorkspaceContext.tsx` is in-memory React state, self-documented "not an authorization boundary" (also in `chiefOfStaffValidator.ts`); nothing gates data on it. **However, the entire app has no authentication**, including 5 observed POST write/exec API routes (`execute-primary-action`, `lead-registry/action`, `workday/start|stop`, `abando-recovery/run`) plus 10 server-action directives across command-center and ShopiFixer pilot pages.
- **Severity:** High at any network exposure; medium local-only. **Verdict: not drift in code; the adjacent risk (open writes) is actual.**
- **Why it matters:** The first deploy or shared network makes every write public.
- **Correction:** Minimal token/localhost binding on write endpoints now, or a recorded accepted-risk decision; issuer connection before any second user. **Required now?** Yes (decision at minimum).

## D08 — Static registries mistaken for runtime truth
- **Evidence:** All six S008 foundations are hardcoded TS arrays (no write paths); honestly labeled static — but divergence has occurred: one real normalized job opportunity exists at `~/.staffordos/private/.../opportunities/*.private.json` while the committed UI permanently renders "No opportunities imported yet"; /os Home's static primary-action copy can silently diverge from the live `/operator` snapshot.
- **Severity:** Medium-high. **Verdict: actual (one observed divergence) + growing risk.**
- **Correction:** `asOf`/staticity labels on every static surface; adapter-only wiring rule (D01). **Required now?** Labels yes; adapters when Job Search wiring begins.

## D09 — Private files exposed through UI or Git
- **Evidence:** Code guards reject repo-internal private paths (fail-closed, tested); disclosure contract hard-codes `privatePathsVisible: false`; `git ls-files` shows zero `*.private.*` tracked; real private outputs live outside repo with 0600/0700 perms. **Gap:** no `.gitignore` backstop for `*.private.json` / `staffordos-private-intake/` / `.staffordos/`; guard depends on callers passing correct `repositoryRoot`.
- **Severity:** Medium (consequence severe, likelihood currently low). **Verdict: not drift — single-layer defense risk.**
- **Correction:** Add `.gitignore` entries (defense in depth); keep disclosure-contract tests. **Required now?** Yes (minutes of work).

## D10 — AI recommendations displayed as authority
- **Evidence:** Chief of Staff surface renders validator-gated fixtures with 4 deliberately blocked examples; max authority state "Candidate recommendation / Operator review required"; Ollama adapter localhost-pinned, temp 0, fail-closed, never imported by UI. Residual: cloud keys exist in env; prohibition is procedural, and the local-provider allowlist lives only in the one adapter's hardcoded URL.
- **Severity:** Low. **Verdict: not drift** — the best-governed area of the system.
- **Correction:** Encode provider allowlisting in the adapter contract (boundary doc §3.10) as adapters multiply. **Required now?** No.

## D11 — Duplicate relationship/contact models
- **Evidence:** ≥11 stores (3 Prisma models, 6+ JSON registries/queues, outreach lists, scheduler registry); `relationshipResolver.ts` exists to reconcile them with explicit `identity_conflict`/`contact_conflict` states; lineage audits acknowledge the overlap.
- **Severity:** High. **Verdict: actual drift** — the largest duplicated-truth cluster.
- **Why it matters:** Every new capability (recruiter relationships, family members) either joins the one model or becomes store #12.
- **Correction:** Party/Relationship consolidation plan (resolver becomes the migration tool); rule now: no new relationship/contact store may be created. **Required now?** The rule yes; migration can wait until CRM work resumes (Abando has 0 customers).

## D12 — Duplicate file and asset models
- **Evidence:** 4 evidence/proof representations; evidence manifest with broken machine-specific temp paths (`exists: false`); Prisma `ShopifixerProofReference.artifactUri` with nothing durable behind it; no Asset model.
- **Severity:** Medium (becomes high the day Media starts). **Verdict: actual embryonic drift.**
- **Correction:** Adopt the Asset authority (review §13) before Personal/Media; new proof artifacts use it. **Required now?** Definition before Media; not before Job Search.

## D13 — Separate action queues per capability
- **Evidence:** action events JSON + snapshots + Prisma Job/EmailQueue + daemon send-ledger + static actionRegistry — five action-ish stores.
- **Severity:** Medium. **Verdict: actual drift**, tolerable single-user.
- **Correction:** One Action store under ADR_0001 execution; queues become views. **Required now?** No — bundle with persistence migration.

## D14 — Provider-specific logic leaking into UI components
- **Evidence:** Clean overall (no provider SDKs in UI); one hardcoded `"https://pay.abando.ai"` in `app/operator/relationship/[id]/page.tsx:135` (a helper exists and is used elsewhere).
- **Severity:** Low. **Verdict: trivial actual instance.**
- **Correction:** Route through `getAbandoBaseUrl()` next time that file is touched. **Required now?** No.

## D15 — (Beyond mission list) Repo-as-database / accidental source mutation
- **Evidence:** UI writes land in git-tracked files (`staffordos/events/*`, snapshots, proof runs — visibly modified in git status); ADR_0001 concedes non-durability; production incident lineage (RECOVERY_001, M007/M008) shows the operational cost of fragile state.
- **Severity:** High. **Verdict: actual — the central architectural debt.**
- **Correction:** ADR_0001 execution plan (events/snapshots/actions to Postgres first). **Required now?** Plan yes; migration before deployment/multi-user.

## D16 — (Beyond mission list) Uncommitted authority chain
- **Evidence:** Committed J001_01 cites four untracked discovery docs; operator-issuer, M007/M008/RECOVERY_001, S-series ShopiFixer records, and many other artifacts are untracked; A001 validation observed 153 untracked paths before review ratification. This is a recurrence of the P11.58 pattern.
- **Severity:** Medium-high (governance traceability). **Verdict: actual, recurring.**
- **Correction:** Containment commit wave; gate rule: cited authority must be committed. **Required now?** Yes.

## D17 — (Beyond mission list) Three mission-ID namespaces
- **Evidence:** mission_001/002 bindings vs S008 synthetic missionIds vs untracked Mission Engine proposal; S008_14 admits no Mission Registry exists.
- **Severity:** Medium. **Verdict: actual, dormant.**
- **Correction:** One reconciliation doc choosing the canonical namespace when the Mission Registry is built. **Required now?** No.

---

## Summary

| Verdict | Entries |
|---|---|
| Actual drift requiring action now | D07 (open writes — decision), D08 (labels), D09 (gitignore), D16 (commit wave), D02 (mode field) |
| Actual drift, scheduled later | D11, D12, D13, D15 (plan now, migrate before deploy/multi-user), D17, D14 |
| Future risk only — rule adoption suffices | D01 |
| Not drift | D03, D04, D05, D06, D10 |
