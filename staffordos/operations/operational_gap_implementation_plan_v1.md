# OPERATIONAL GAP IMPLEMENTATION PLAN V1

## Section 1 — Executive Summary

StaffordOS now has a **complete, internally consistent constitutional layer** (six
authorities + reconciliation, committed) and **three operational architecture
documents** (Marketing, Campaign, Attribution — authored). The **Wave-0 trust fixes
are committed**: merchant value is separated from Stafford revenue (M3), command
center readiness renders `93/100` instead of `9300%` (M1), and the execution log
now reads live `events/*` history (M2). Operator authority references were
repointed to real authorities.

What is operational today: the payment gate (Stripe-webhook-only), the merchant
lifecycle registry as entity backbone, the Profit Queue and execution log on real
data, ShopiFixer fulfillment truth + proof runs, and relationship resolution.

What remains conceptual: **campaign attribution** (the convergent gap across all
three operational docs), budget/spend/ROI, campaign persistence, governed
marketing/campaign dashboards, and the structural debt the constitution documents
(three-store entity spine, multiple lifecycle vocabularies, uncaptured attribution
IDs). This document turns those documented gaps into one prioritized implementation
roadmap. It designs no architecture and invents no gaps.

This is documentation only. It changes no code, JSON, registries, UI, validators,
constitutional authorities, or operational architecture documents.

---

## Section 2 — Implementation Gap Register

Every gap below is drawn from a prior committed/authored document (B1.8 audit,
Wave-0, revenue certification, constitution certification, and the three
operational architecture docs). None are invented.

| ID | Gap | Source | Current state |
| --- | --- | --- | --- |
| G1 | **Campaign attribution: `campaign_id` on leads** | P2.2, P2.3 | Missing (leads carry no campaign linkage) |
| G2 | UTM tracking | P2.1, P2.3 | Missing |
| G3 | Budget storage | fiscal model, P2.2 | Missing |
| G4 | Spend storage | P2.2, P2.3 | Missing |
| G5 | ROI calculation | P2.2, P2.3 | Blocked (needs G1+G3+G4) |
| G6 | **Pipeline Value inflation** (`campaignResolver` `revenue_at_stake` N-count) | money model, B1.8 | Live defect on primary surface |
| G7 | Campaign store (persistent campaign object + real `campaign_id`) | P2.2 | Missing (campaigns synthesized as type slugs) |
| G8 | Governed surfaces (marketing dashboard, campaign workspace, attribution drill-down) | P2.1–P2.3 | Missing |
| G9 | Leads count rebind (Sent/Queued/Blocked/Temperature/Score) | B1.8 | Not done (counts wrong/fabricated) |
| G10 | Campaign revenue de-duplication (cross-campaign double count) | B1.8, P2.2 | Overlaps G6 |
| G11 | Entity spine reconciliation (Lead/Client/Merchant/Relationship across 3 stores) | constitution cert | Structural debt |
| G12 | Lifecycle vocabulary conformance (≥4 vocabularies → canonical) | B1.8, vocabulary | Structural debt |
| G13 | Money authority code-enforcement (client_registry canonical; rollups derived) | money model | Policy only, not enforced |
| G14 | Department field formalization (informal `revenue`/`unknown`) | dept arch | Informal |
| G15 | Renewal tracking + `renewal_id` | lifecycle, P2.3 | Field-only/thin |
| G16 | Abando `subscription_id` | P2.3 | Missing |
| G17 | Proposal ID / Evidence ID | P2.3 | Missing |
| G18 | Audit ID linkage (exists but unlinked to merchant) | P2.3 | Partial/unlinked |
| G19 | Divergent same-named revenue validators dedup | revenue cert | Two versions |
| G20 | UI terminology (`Shopifixer`→`ShopiFixer`; ShopiFixer=service; Actinventory reserved) | product def, vocabulary | Drift in UI |
| G21 | System-map manifest generator (hand-authored, stale) | B1.8 | No generator |
| G22 | Fiscal/quarter store | fiscal model | Greenfield |

---

## Section 3 — Gap Prioritization

- **P0 — unblocks everything downstream:**
  - **G1 Campaign attribution (`campaign_id` on leads).** Every operational doc
    converges here: without it, traceability, ROI, campaign→revenue roll-up, and
    Marketing measurement are all impossible. Highest leverage, single link.

- **P1 — corrects live financial/trust defects and the cost side of ROI:**
  - **G6/G10 Pipeline Value de-inflation** — an inflated revenue-looking number is
    on a primary surface; must be fixed before any ROI/fiscal work consumes it.
  - **G3 Budget + G4 Spend storage** — the cost side of ROI.
  - **G5 ROI calculation** — becomes possible once G1+G3+G4 land.
  - **G2 UTM tracking** — richer attribution once G1 exists.
  - **G9 Leads count rebind** — restores trust in the daily leads surface.

- **P2 — persistence, surfaces, and structural debt:**
  - G7 Campaign store, G8 governed surfaces, G11 entity reconciliation,
    G12 vocabulary conformance, G13 money-authority enforcement,
    G14 department field, G22 fiscal store.

- **P3 — completeness and cleanup:**
  - G15 renewal, G16 subscription id, G17 proposal/evidence ids, G18 audit linkage,
    G19 validator dedup, G20 UI terminology, G21 system-map generator.

Rationale: fix what is *wrong and visible* (G6, G9) and what *unblocks the chain*
(G1) before building *new surfaces* (G8) or paying down *structural debt* (G11/G12).

---

## Section 4 — Implementation Order (recommended sequence)

1. **G1 Campaign attribution** — Purpose: link campaign→lead. Dependencies: none.
   Repository impact: add `campaign_id` to the lead record + stamp at creation.
   Risk: low-medium (schema-light; the discipline is stamping every entry point).
   Value: unlocks all traceability and ROI.
2. **G6/G10 Pipeline Value de-inflation** — Purpose: stop overstating pipeline.
   Dependencies: none. Impact: `campaignResolver` calc. Risk: medium (shared by
   `/operator` + campaigns). Value: trustworthy pipeline number.
3. **G3+G4 Budget/Spend storage** — Purpose: cost side of ROI. Dependencies: none.
   Impact: new stores. Risk: low. Value: enables ROI + budget governance.
4. **G5 ROI + G2 UTM** — Purpose: campaign ROI + richer attribution.
   Dependencies: G1, G3, G4. Impact: calc + capture. Risk: low. Value: executive
   intelligence questions become answerable.
5. **G9 Leads rebind** — Purpose: correct daily leads counts. Dependencies: none.
   Impact: `loadOperatorLeads` + leads page. Risk: low-medium. Value: trust.
6. **G7 Campaign store + G8 surfaces** — Purpose: persist campaigns; governed
   dashboards/workspace/drill-down. Dependencies: G1, G3–G5. Impact: new stores +
   UI. Risk: medium. Value: operable Marketing/Campaigns.
7. **G11/G12/G13/G14/G22 structural** — Purpose: single entity spine, one lifecycle
   vocabulary, enforced money authority, formal departments, fiscal store.
   Dependencies: constitutional layer (done). Impact: broad. Risk: medium-high.
   Value: durability + fiscal planning.
8. **P3 cleanup** — artifact IDs, validator dedup, UI terminology, system-map
   generator. Low risk, completeness.

---

## Section 5 — Operational Readiness Matrix

| Area | Rating | Why |
| --- | --- | --- |
| Marketing | BLOCKED | No attribution, no campaign store, no dashboard; channels thin (inbound form + manual outreach only) |
| Campaigns | PARTIAL | Synthesized types + health exist; no store, no attribution, inflated revenue |
| Leads | PARTIAL | Registry real; Sent/Queued/Blocked/Temp/Score wrong (G9); no attribution |
| Relationships | PARTIAL | `relationshipResolver` links + workspace exist; spans 3 stores (G11) |
| ShopiFixer (Delivery) | PARTIAL | Fulfillment truth + proof runs + workbench real; command-center readiness fixed (M1) |
| Payments | READY | Stripe-webhook-only gate correct; payment authority intact |
| Customer Success | PARTIAL | `review_status`/outcomes real; renewal thin (G15) |
| Abando | PARTIAL | State machine + `client.abando` real; no `subscription_id`/renewal (G16/G15) |
| Executive Dashboard | PARTIAL | Profit Queue + CEO truth trustworthy (post Wave-0); revenue-at-stake chip inflated (G6); no fiscal/quarterly (G22) |

Only Payments is READY. No area is fully BLOCKED except Marketing (missing its
foundational attribution + surfaces).

---

## Section 6 — Quick Wins (small effort, large value)

- **Commit the three operational architecture docs** (currently authored/untracked).
- **G6 Pipeline Value de-inflation** — a localized `campaignResolver` fix that
  removes an inflated number from a primary surface.
- **G20 UI terminology** — `Shopifixer`→`ShopiFixer`, label ShopiFixer as a service
  (not product), mark Actinventory reserved/hidden. Presentational, low risk.
- **G1 field addition** — adding `campaign_id` to the lead record + stamping at
  creation is small; the value (traceability) is large.

---

## Section 7 — Major Projects (larger efforts, repository-supported)

- **Attribution end-to-end** — G1 + G2 + G7 campaign store + G8 drill-down: makes
  "every dollar traces to a campaign" true.
- **Financial truth** — G3 + G4 + G5 + G13: budget/spend storage, ROI, enforced
  money authority; enables fiscal planning on actuals.
- **Entity spine reconciliation (G11)** — the largest structural effort: unify
  Lead/Client/Merchant/Relationship; high blast radius (B1.8 showed loader
  fragility), so sequence carefully.
- **Governed operator surfaces (G8)** — marketing dashboard, campaign workspace,
  attribution drill-down.

---

## Section 8 — Suggested Milestones (no dates)

- **Milestone A — Attribution Foundation:** G1 `campaign_id`, G2 UTM, G7 campaign
  store. Outcome: campaign→lead link exists; traceability head closed.
- **Milestone B — Financial Truth:** G6 de-inflate, G3/G4 budget+spend, G5 ROI,
  G13 money-authority enforcement. Outcome: real, trustworthy campaign ROI and
  fiscal actuals.
- **Milestone C — Trust & Surfaces:** G9 leads rebind, G8 dashboards/workspace/
  drill-down, G20 UI terminology. Outcome: operator-facing completeness.
- **Milestone D — Structural Debt & Completeness:** G11 entity spine, G12 vocabulary
  conformance, G14 department field, G22 fiscal store, G15–G18 artifact IDs,
  G19 validator dedup, G21 system-map generator. Outcome: durable, scalable base.

---

## Section 9 — Known Risks

- **Dependency risk:** ROI (G5) is blocked until attribution (G1) and spend (G4)
  land; sequencing must respect this.
- **Data quality:** current data is dev-store-only ($0 Stafford revenue, $100
  merchant proof, placeholder `send_target` URLs) — implementations must not assume
  real pipeline exists.
- **Technical debt:** three-store entity spine + flat-JSON registries constrain
  scale (~1k merchants) and make G11 high blast-radius.
- **Authority drift:** the constitution is documentation with no conformance
  validator; code can drift from it (the B1.8 failure class) — a conformance check
  is itself a candidate implementation.
- **Implementation complexity:** shared loaders (campaignResolver, loadExecutionLog)
  feed multiple surfaces; changes need the same regression discipline used in
  Wave-0.

---

## Section 10 — Certification

# GO — StaffordOS is ready to begin implementation.

The constitutional and operational architecture layers are complete, internally
consistent, and (constitution) committed; the Wave-0 trust defects are fixed and
committed; and every remaining gap is well-defined, repository-grounded
implementation work with a clear, dependency-ordered sequence and a single P0
(campaign attribution). There is no architectural blocker to beginning
implementation.

Discipline conditions (sequencing, not blockers): do G1 (attribution) first because
everything downstream depends on it; de-inflate Pipeline Value (G6) before any ROI/
fiscal work consumes it; and treat G11 (entity spine) as a carefully-sequenced
structural project, not a quick change. Continue committing each mission and
re-verifying (as done through Wave-0) so implementation does not reintroduce the
trust defects the constitution was built to prevent.

This is documentation only. No code, JSON, registries, UI, validators,
constitutional authorities, or operational architecture documents were changed.

---

## Deliverables (summary)

- **Executive Summary** — constitution + Wave-0 committed; attribution is the
  convergent remaining gap (Section 1).
- **Implementation Gap Register** — 22 repository-grounded gaps (Section 2).
- **Prioritized Backlog** — P0 (attribution) → P1 (pipeline/budget/spend/ROI/UTM/
  leads) → P2 (store/surfaces/debt) → P3 (cleanup) (Section 3).
- **Implementation Roadmap** — 8-step dependency-ordered sequence (Section 4).
- **Operational Readiness Matrix** — Payments READY; most areas PARTIAL; Marketing
  BLOCKED (Section 5).
- **Quick Wins** — commit ops docs, de-inflate pipeline, UI terminology, add
  `campaign_id` (Section 6).
- **Major Projects** — attribution end-to-end, financial truth, entity spine,
  governed surfaces (Section 7).
- **Milestones** — A Attribution Foundation, B Financial Truth, C Trust & Surfaces,
  D Structural Debt (Section 8).
- **Known Risks** — dependency, data quality, technical debt, authority drift,
  complexity (Section 9).
- **Certification** — GO to begin implementation (Section 10).
