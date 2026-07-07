# FISCAL OPERATING MODEL V1

## Executive Summary

This document is the canonical Fiscal Operating Model for Stafford Media
Consulting. It defines how the business plans, executes, reviews, and improves
across an entire fiscal year — the operating constitution for the company, not a
budget spreadsheet and not a software implementation plan.

It governs business rhythm (annual → quarterly → monthly → weekly → daily),
departments, KPIs, budgets, decision authority, and continuous improvement. It
uses the existing authorities as inputs and does not contradict them:

- `staffordos/authority/canonical_business_lifecycle_v1.md` (how a merchant moves
  through S1–S11, including human approval gates and the S7 payment gate).
- `staffordos/authority/product_definitions_v1.md` (StaffordOS = internal system;
  ShopiFixer = service; Abando = separate SaaS; Actinventory = reserved).
- `staffordos/authority/canonical_money_model_v1.md` (Stafford Revenue vs Merchant
  Value vs Pipeline/Opportunity Value; capture only via Stripe webhook).

Repository truth today: the fiscal, budget, and department layers are largely
greenfield. The informal `department` field in runtime data only carries values
like `revenue`/`unknown`; there is no budget store; marketing attribution and
referral tracking are not operationally implemented. This document defines the
target operating model; it marks everything not yet implemented as future.

This is documentation only. It changes no code, JSON, registries, UI, validators,
or other authority documents (it references them).

---

## Section 1 — Purpose

The Fiscal Operating Model governs **business planning and execution**, not
software implementation. It answers: how does Stafford Media Consulting run a
fiscal year — set targets, allocate effort and budget, deliver work, review
results, and institutionalize lessons — using StaffordOS as its operating system.

It is a constitution: it defines responsibilities, cadence, and authority. It does
not prescribe UI, code, or specific dollar figures. Where it names capabilities
StaffordOS does not yet have, it marks them as future.

---

## Section 2 — Fiscal Calendar

Stafford Media Consulting operates on a **calendar-aligned fiscal year**.

- **Fiscal Year (FY):** January 1 – December 31. The current planning year is
  **FY2027** (Jan 1 – Dec 31, 2027).
- **Quarter:** Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep, Q4 Oct–Dec. The primary unit
  of planning and objectives.
- **Month:** the primary unit of review (financial and operational).
- **Week:** the primary unit of operating rhythm (plan Monday, review Friday).
- **Day:** the primary unit of execution — Ross's governed workday inside
  StaffordOS.

How StaffordOS organizes work across periods: annual targets decompose into
quarterly objectives; quarterly objectives decompose into monthly reviews and
weekly priorities; weekly priorities drive the daily Profit Queue. Actuals roll
up in the reverse direction — daily execution → weekly/monthly review → quarterly
results → annual outcome — using only captured Stafford Revenue for financial
roll-up (per the money model).

---

## Section 3 — Annual Planning

Annual planning is owned by the Executive (Ross) and sets the frame for the year.

- **Revenue targets:** annual Stafford Revenue target (one-time + recurring),
  expressed in captured-revenue terms only — never merchant value or pipeline
  estimates.
- **Product strategy:** Abando (SaaS) growth; whether/when a reserved capability
  (e.g. Actinventory) activates. Product identity per product_definitions.
- **Service strategy:** ShopiFixer service capacity, positioning ($950 Fix
  Sprint), and quality bar.
- **Marketing strategy:** channels, campaigns, and attribution intent for the
  year (attribution is a known gap — see Section 15).
- **Operational investments:** StaffordOS capabilities, tooling, and governance to
  build during the year.
- **Capacity planning:** how much delivery and sales throughput the company (Ross
  + agents + any future employees) can sustain.

---

## Section 4 — Quarterly Planning

Each quarter defines, at minimum:

- **Objectives:** 3–5 outcomes for the quarter.
- **Key Results:** measurable signals that an objective is met.
- **Budget:** planned spend by department (marketing, engineering, operations, AI,
  reserve) — see Section 10.
- **Campaign plan:** the outreach/conversion motions for the quarter (bound to the
  Campaign concept in the lifecycle).
- **Revenue goals:** quarterly Stafford Revenue target (captured only).
- **Operational priorities:** the StaffordOS/operations work for the quarter.
- **Product priorities:** Abando roadmap items.
- **Service improvements:** ShopiFixer delivery/quality improvements.
- **AI improvements:** agent capability, accuracy, and governance improvements.
- **Risk review:** the top risks for the quarter and their mitigations.

Quarterly planning must not count Merchant Value, Opportunity Value, or Pipeline
Value as revenue targets (money model rule).

---

## Section 5 — Monthly Review

Each month reviews performance against the quarter:

- **Financial review:** captured Stafford Revenue vs target; recurring vs one-time;
  reconciliation to the money source of record (client_registry).
- **Marketing review:** campaign activity and (once implemented) attribution/ROI.
- **Sales review:** qualification, offers out, close rate, pipeline health.
- **Delivery review:** ShopiFixer sprints in delivery, cycle time, proof completion.
- **Operations review:** StaffordOS health, blockers, throughput.
- **Customer outcomes:** merchant success, reviews, at-risk accounts.
- **AI performance:** agent output quality, accuracy, rule suggestions.
- **Governance review:** authority adherence, drift, and any authority updates.

---

## Section 6 — Weekly Operating Rhythm

- **Monday planning:** set the week's priorities from the quarterly objectives and
  the Profit Queue.
- **Midweek execution review:** check progress, unblock, re-prioritize.
- **Friday operational review:** review what shipped, revenue movement, and
  customer/delivery state; capture lessons.
- **Backlog refinement:** keep the lead/opportunity/mission backlog current and
  ranked.
- **Risk review:** review open blockers and emerging risks weekly.

---

## Section 7 — Daily Operating Rhythm

Ross runs a governed workday inside StaffordOS. The flow describes
**responsibilities**, not exact UI:

```
Open Operator (start workday)
  ↓
Today's Profit Queue      — work the highest-value governed missions first
  ↓
Review Campaigns          — outreach/conversion motions needing attention
  ↓
Review Leads              — qualify and approve outreach (human gate)
  ↓
Review Relationships      — advance the highest-priority merchant relationships
  ↓
Revenue Command           — payments waiting, offers out, revenue state (captured vs merchant value)
  ↓
Delivery                  — approve scope; agents execute approved ShopiFixer work
  ↓
Evidence                  — review before/after proof and proof packages (human gate)
  ↓
Execution Log             — verify what actually ran and its outcomes
  ↓
Close Workday (stop)      — capture the day's outcomes and set tomorrow's first move
```

Responsibilities, not screens: the daily rhythm exists to (a) always work the
highest-value governed action next, (b) pass every human approval gate that the
lifecycle requires (qualification, offer, scope, proof), and (c) close the day
with truth captured. StaffordOS supports start/stop of the workday; this document
does not prescribe the specific pages or layout.

---

## Section 8 — Business Departments

The canonical department authority is
`staffordos/authority/canonical_department_architecture_v1.md`. This section is a
fiscal-context summary that defers to that authority and does not redefine
departments; on any difference, the Department Architecture wins. The runtime
`department` field is informal today (Section 15).

- **Executive** — Purpose: set strategy, targets, and approve gates. Owner: Ross.
  KPIs: annual/quarterly attainment, governance health. Authorities: this model;
  all authority docs. Inputs: all department reviews. Outputs: targets, approvals,
  budgets.
- **Marketing** — Purpose: create awareness and leads. Owner: Marketing. KPIs:
  campaigns run, lead volume/quality, (future) attribution & Campaign ROI.
  Authorities: campaign concept in the lifecycle. Inputs: channels, budget.
  Outputs: leads, source data.
- **Sales** — Purpose: qualify, route, offer, and close. Owner: Sales (Ross
  approves offers). KPIs: qualified rate, offers out, close rate, pipeline.
  Authorities: lifecycle S3–S5, product_routing_authority. Inputs: leads. Outputs:
  accepted offers → payment intent.
- **Client Success** — Purpose: acceptance, satisfaction, retention, referral.
  Owner: Client Success. KPIs: CSAT, review completion, referral rate, retention.
  Authorities: lifecycle S8–S9. Inputs: delivered work + proof. Outputs: outcomes,
  testimonials, referrals, upsell readiness.
- **Engineering** — Purpose: build/operate StaffordOS and product engines. Owner:
  Engineering. KPIs: capability delivery, reliability, defect/drift rate.
  Authorities: authority_registry, execution authority. Inputs: operational
  priorities. Outputs: StaffordOS + product capabilities.
- **Delivery** — Purpose: execute approved ShopiFixer engagements with proof.
  Owner: Delivery (agents execute; Ross approves scope/proof). KPIs: delivery
  time, proof completion, QA pass rate. Authorities: lifecycle S6,
  shopifixer_fulfillment_truth. Inputs: paid engagements. Outputs: fixes, proof
  packages.
- **Finance** — Purpose: revenue truth, reconciliation, reporting. Owner: Finance
  (Ross). KPIs: captured Stafford Revenue, MRR, LTV, reconciliation accuracy.
  Authorities: canonical_money_model, payment authority, client_registry. Inputs:
  Stripe-verified payments. Outputs: revenue reporting, fiscal actuals.
- **Operations** — Purpose: keep the operating rhythm and backlog healthy. Owner:
  Operations. KPIs: throughput, blocker resolution time, cadence adherence.
  Authorities: this model. Inputs: cross-department state. Outputs: prioritized
  operating queue.
- **AI Governance** — Purpose: govern agent behavior, accuracy, and authority
  adherence. Owner: AI Governance (Ross). KPIs: agent accuracy, gate adherence,
  drift caught. Authorities: agent_registry, agent_role_alias_map,
  operator_action_authority. Inputs: agent outputs/events. Outputs: rules,
  corrections, governance decisions.

---

## Section 9 — Quarterly KPIs (conceptual; no numbers)

- **Pipeline** — estimated potential revenue (Pipeline Value estimate; not
  captured revenue).
- **Close Rate** — share of qualified opportunities that convert to paid.
- **Revenue** — captured Stafford Revenue (money model source of record).
- **Merchant Value** — recovered/proven merchant value (never counted as revenue).
- **MRR** — recurring Abando subscription revenue.
- **Delivery Time** — time from paid to completed ShopiFixer sprint with proof.
- **Customer Satisfaction** — merchant acceptance/satisfaction signal.
- **Campaign ROI** — captured Stafford Revenue attributable to a campaign ÷ spend
  (requires attribution — a known gap).
- **AI Accuracy** — correctness/quality of agent outputs and recommendations.

All financial KPIs use captured Stafford Revenue only; estimates and merchant
value are reported separately and never as revenue.

---

## Section 10 — Budget Governance

Budgets are planned per quarter and approved by the Executive:

- **Marketing budget** — campaign and channel spend.
- **Engineering budget** — StaffordOS and product-engine build.
- **Operations budget** — tooling and operating costs.
- **AI budget** — model/agent usage and capability.
- **Reserve budget** — contingency held against risk.
- **Approval authority** — the Executive (Ross) approves and adjusts budgets.

There is no budget store in the repository today; budget governance is a target
model, not an implemented capability (Section 15). No implementation is performed
here.

---

## Section 11 — Decision Authority

This section must never contradict the lifecycle human gates or the payment
authority.

- **Ross (Executive, human):** qualification approval (S3), product routing on
  non-obvious cases (S4), offer/proposal approval (S5), execution scope and proof
  package approval (S6), referral request (S9), Abando upsell approval (S10), and
  objectives/budgets/targets (S11/annual). Ross owns all irreversible-change
  approvals.
- **Stripe webhook (system authority):** the ONLY authority that converts a
  pending payment into earned Stafford Revenue. Neither Ross nor any agent may
  grant `payment_received` by any other path (payment authority).
- **StaffordOS (system):** coordinate, rank, and project truth; produce the Profit
  Queue and derived rollups; enforce governance. It recommends; it does not
  approve human gates or grant payment.
- **AI agents:** propose, draft, execute approved scope, run QA, capture evidence,
  and summarize. Agents may not self-approve any human gate, may not grant payment,
  and may not count estimates or merchant value as revenue.
- **Humans (other):** as the company grows, delegated humans operate within the
  same gates; only the Executive may change authority definitions.

---

## Section 12 — Continuous Improvement

Each quarter follows a closed loop:

1. **Review** — what happened vs objectives.
2. **Measure** — against KPIs (captured revenue for financials).
3. **Learn** — extract lessons and root causes.
4. **Improve** — change process, priorities, or capability.
5. **Institutionalize** — encode the lesson into StaffordOS so it persists.

Every lesson becomes StaffordOS knowledge (e.g. memory, rule suggestions,
authority updates), so the operating model compounds over time rather than
relearning the same lessons.

---

## Section 13 — Future Capability Roadmap

The following are FUTURE capabilities. None exist as implemented, governed
features today; they are named so planning can target them without implying they
are operational:

- **Department dashboards** (future)
- **Quarterly planning surface** (future)
- **Executive scorecards** (future)
- **Campaign planning + attribution** (future; attribution is a known gap)
- **Budget forecasting** (future; no budget store today)
- **Operational resilience** (future)
- **Adaptive governance** (future)
- **Operational self-healing** (future)

---

## Section 14 — Related Authorities

References only (no changes to these documents):

- `staffordos/authority/canonical_business_lifecycle_v1.md` — S1–S11 lifecycle,
  human gates, S7 payment gate.
- `staffordos/authority/product_definitions_v1.md` — product/service/system
  identity.
- `staffordos/authority/canonical_money_model_v1.md` — money concepts and
  authority rules.
- `staffordos/authority/payment_lifecycle_registry_v1.md` — payment capture
  authority (Stripe webhook).
- `staffordos/authority/authority_registry_v1.md` — runtime write authorities.
- `staffordos/authority/output/product_routing_authority_v1.md` — routing.
- `staffordos/governance/operator_action_authority/operator_action_authority_v1.md`
  — operator action authority (partial).

---

## Section 15 — Known Gaps (documented, not solved here)

- **Fiscal store greenfield:** no FY/quarter planning artifact exists; this model
  is documentation only.
- **Budget store absent:** budget governance (Section 10) is a target model, not
  implemented.
- **Marketing attribution unimplemented:** leads carry `source` but no
  `campaign_id`/UTM; Campaign ROI cannot be computed end-to-end yet.
- **Referral untracked:** `referral_status` is field-only and not operational.
- **Pipeline Value inflated:** "revenue at stake" (campaignResolver) is a
  synthesized, inflated estimate and must be labeled/de-inflated before fiscal ROI
  consumes it (money model).
- **Department field informal:** runtime `department` only carries `revenue`/
  `unknown`; the canonical 9-department model here is the target, not the current
  data.
- **No single declared money authority enforced in code:** client_registry is the
  source of record by policy; enforcement is future work.

---

## Deliverables (summary)

### Fiscal Operating Model
Calendar FY (FY2027 = Jan–Dec), decomposing annual → quarterly → monthly → weekly
→ daily, with actuals rolling back up on captured Stafford Revenue only.

### Department Matrix
Executive, Marketing, Sales, Client Success, Engineering, Delivery, Finance,
Operations, AI Governance — each with purpose, owner, KPIs, authorities, inputs,
outputs (Section 8).

### Operating Rhythm
Daily governed workday (Open Operator → Profit Queue → Campaigns → Leads →
Relationships → Revenue Command → Delivery → Evidence → Execution Log → Close
Workday); weekly plan/review; monthly review; quarterly planning.

### Planning Cadence
Annual targets → quarterly OKRs/budget/campaigns → monthly review → weekly
priorities → daily Profit Queue.

### Governance Summary
Ross owns human approval gates and targets/budgets; Stripe webhook is the sole
revenue-capture authority; StaffordOS coordinates and projects; agents propose and
execute within gates; estimates and merchant value are never revenue.

### Future Capability Roadmap
Department dashboards, quarterly planning surface, executive scorecards, campaign
planning + attribution, budget forecasting, operational resilience, adaptive
governance, operational self-healing — all future.

---

## Certification

CONDITIONAL GO.

The Fiscal Operating Model is internally consistent with the lifecycle, product,
and money authorities, and provides a complete operating constitution (calendar,
planning cadence, departments, KPIs, budget governance, decision authority, and
continuous improvement). It is sufficient to begin fiscal planning for actuals and
to structure quarterly operation.

Conditions before the model can be fully operated on estimates and attribution:
marketing attribution and Campaign ROI, budget store, and de-inflated Pipeline
Value must be implemented in later, separately-validated missions; the department
and fiscal layers remain documentation until then. These are named as Known Gaps,
not solved here.

This is documentation only. No code, JSON, registries, UI, validators, or other
authority documents were changed.
