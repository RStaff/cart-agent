# CANONICAL DEPARTMENT ARCHITECTURE V1

## Executive Summary

This document is the canonical Department Architecture for Stafford Media
Consulting. It defines organizational ownership across the company: who owns each
responsibility, who approves each decision, which department owns which business
process, which AI agents support each department, and which authorities each
department governs.

It is not an org chart and not an implementation. It is a constitutional authority
that stays consistent with, and does not contradict:

- `staffordos/authority/canonical_business_lifecycle_v1.md` (S1–S11, human gates,
  S7 payment gate)
- `staffordos/authority/product_definitions_v1.md` (StaffordOS/ShopiFixer/Abando/
  Actinventory identity)
- `staffordos/authority/canonical_money_model_v1.md` (Stafford Revenue vs Merchant
  Value vs estimates; capture via Stripe webhook only)
- `staffordos/authority/fiscal_operating_model_v1.md` (the 9 canonical departments
  and operating cadence)

Repository truth: the runtime `department` field is informal (values like
`revenue`/`unknown`), and several supporting capabilities (attribution, budget,
referral) are not yet implemented. This document defines the target ownership
model and marks unimplemented items as gaps. AI agents referenced here are the
real agents in `staffordos/agents/agent_registry_v1.json`; no agents are invented.

This is documentation only. It changes no code, JSON, registries, UI, validators,
or other authority documents (it references them).

---

## Section 1 — Purpose

Department Architecture exists so that every responsibility has exactly one owner,
every decision has a known authority, and AI agents support — but never replace —
department ownership. It prevents the ownership sprawl and duplicate-authority
drift found in earlier audits.

Relationship:

```
Company (Stafford Media Consulting)
  ↓  sets strategy, targets, and approves gates
Departments (own outcomes)
  ↓  run business processes
Processes (campaign, qualification, audit, fix, evidence, payment, revenue, …)
  ↓  are constrained by
Authorities (lifecycle, money model, payment, product definitions, this doc)
  ↓  are carried out by
Execution (Ross approvals + StaffordOS coordination + AI agents within gates)
```

---

## Section 2 — Department Principles

1. **One owner per responsibility.** Every process and outcome has a single
   accountable department; shared ownership is not allowed.
2. **Departments own outcomes, not software.** A department is accountable for a
   business result, not for a specific screen or script.
3. **AI assists departments.** Agents propose, draft, execute approved scope, run
   QA, and summarize; they do not own a department.
4. **StaffordOS governs execution.** StaffordOS coordinates, ranks, projects truth,
   and enforces gates; it is the operating system, not a department.
5. **Ross remains executive authority where required.** All human approval gates
   and target/budget/authority decisions belong to the Executive.
6. **Money walls hold everywhere.** No department may report Merchant Value or
   estimates as Stafford Revenue, and only the Stripe webhook converts pending
   payment into earned revenue.

---

## Section 3 — Canonical Departments

### Executive
- Purpose: set strategy, targets, and approve gates.
- Primary responsibilities: annual/quarterly targets, budgets, authority changes,
  human approvals of record.
- Business outcomes: a governed, profitable operating year.
- Primary KPIs: annual/quarterly attainment, governance health.
- Primary authorities: this document; all authority docs; fiscal_operating_model.
- Inputs: all department reviews.
- Outputs: targets, approvals, budgets, authority updates.
- Dependencies: every department.
- AI support: `resolve_primary_action_v1` (primary action), operator action
  authority summaries. AI recommends; Executive decides.
- Human approval gates: owns all executive gates (targets, budgets, authority,
  activation of reserved products).
- Non-goals: not day-to-day execution of processes it delegates.

### Marketing
- Purpose: create awareness and generate leads.
- Primary responsibilities: campaign planning, outreach, source tracking,
  (future) attribution.
- Business outcomes: qualified lead supply.
- Primary KPIs: campaigns run, lead volume/quality, (future) Campaign ROI.
- Primary authorities: campaign concept in the lifecycle (S1–S2).
- Inputs: channels, marketing budget.
- Outputs: leads with source data.
- Dependencies: Sales (consumes leads), Finance (budget/ROI).
- AI support: `contact_research_agent_v1`, `contact_enrichment_agent_v1`,
  `message_generation_agent_v1`, `message_validation_agent_v1`,
  `send_execution_agent_v1`, `send_ledger_agent_v1`, `lead_registry_sync_agent_v1`.
- Human approval gates: outreach approval (Ross) before send.
- Non-goals: does not qualify or close (Sales); does not count leads as revenue.

### Sales
- Purpose: qualify, route, propose, and close.
- Primary responsibilities: lead qualification (S3), product routing (S4),
  proposal/offer (S5), audit as sales asset.
- Business outcomes: accepted offers → payment intent.
- Primary KPIs: qualified rate, offers out, close rate, pipeline (estimate).
- Primary authorities: lifecycle S3–S5, `product_routing_authority_v1.md`,
  `shopifixer_commercial_definition_v1.md` ($950 Fix Sprint).
- Inputs: leads.
- Outputs: qualified merchants, accepted offers.
- Dependencies: Marketing (leads), Delivery (fulfills), Finance (payment).
- AI support: `approval_decision_agent_v1`, `followup_agent_v1`,
  `reply_detection_agent_v1`, `reply_interpretation_agent_v1`,
  `reply_response_agent_v1`.
- Human approval gates: qualification (S3), routing on non-obvious cases (S4),
  offer/proposal (S5) — all Ross.
- Non-goals: does not deliver the fix (Delivery); does not grant payment (Finance/
  Stripe webhook).

### Client Success
- Purpose: acceptance, satisfaction, retention, referral, upsell readiness.
- Primary responsibilities: customer success (S8), referral (S9), renewals, upsell
  readiness for Abando (S10 hand-off).
- Business outcomes: satisfied, retained, referring, expandable merchants.
- Primary KPIs: CSAT, review completion, referral rate, retention.
- Primary authorities: lifecycle S8–S9.
- Inputs: delivered work + proof.
- Outputs: outcomes, testimonials, referrals, upsell-ready signals.
- Dependencies: Delivery (proof), Sales (upsell offer), Marketing (referral→lead).
- AI support: `reply_*` agents, `followup_agent_v1`.
- Human approval gates: referral request (S9); Ross reviews outcomes.
- Non-goals: does not set prices or grant payment.

### Engineering
- Purpose: build and operate StaffordOS and the product engines.
- Primary responsibilities: StaffordOS capabilities, product-engine code,
  reliability, governance tooling.
- Business outcomes: reliable operating system and products.
- Primary KPIs: capability delivery, reliability, defect/drift rate.
- Primary authorities: `authority_registry_v1.md` (runtime write authorities),
  execution authority.
- Inputs: operational/quarterly priorities.
- Outputs: StaffordOS + product capabilities.
- Dependencies: all departments (it builds their tools); AI Governance.
- AI support: `run_agent_v1` (execution), `dev_task_integrity_agent_v1`
  (shape/QA integrity), `change_pipeline_v1`, `surface_patch_agent_v1`.
- Human approval gates: scope approval for irreversible changes (Ross).
- Non-goals: does not own merchant delivery outcomes (Delivery) or revenue truth
  (Finance).

### Delivery
- Purpose: execute approved ShopiFixer engagements with proof.
- Primary responsibilities: engineering packet, governed execution, QA/validation,
  before/after evidence, merchant proof package (S6).
- Business outcomes: completed, proven ShopiFixer sprints.
- Primary KPIs: delivery time, QA pass rate, proof completion.
- Primary authorities: lifecycle S6, `shopifixer_fulfillment_truth_v1.json`.
- Inputs: paid engagements (post S7 gate).
- Outputs: fixes, QA results, proof packages.
- Dependencies: Finance/payment (must be paid first), Engineering (agents/tools).
- AI support: approved coding agents (Codex, Claude Code — per product
  definitions), `surface_patch_agent_v1`, `dev_task_integrity_agent_v1` (QA),
  `run_agent_v1` (execution).
- Human approval gates: execution scope and proof package (Ross, S6).
- Non-goals: must not begin before verified payment; does not recognize revenue.

### Finance
- Purpose: revenue truth, reconciliation, and reporting.
- Primary responsibilities: capture recognition (via Stripe webhook only),
  reconciliation to source of record, fiscal actuals.
- Business outcomes: accurate, trustworthy financials.
- Primary KPIs: captured Stafford Revenue, MRR, LTV, reconciliation accuracy.
- Primary authorities: `canonical_money_model_v1.md`,
  `payment_lifecycle_registry_v1.md`, `client_registry_v1.json` (source of record).
- Inputs: Stripe-verified payments.
- Outputs: revenue reporting, fiscal actuals.
- Dependencies: Sales (offers), Delivery (completion), Executive (targets).
- AI support: `revenue_agent_v1` (revenue truth propagation after verified
  payment).
- Human approval gates: none for capture — the Stripe webhook is the sole capture
  authority; operators/agents may not grant payment.
- Non-goals: never reports Merchant Value or estimates as Stafford Revenue.

### Operations
- Purpose: keep the operating rhythm and backlog healthy.
- Primary responsibilities: cadence adherence, backlog refinement, blocker
  resolution, knowledge capture support.
- Business outcomes: smooth daily/weekly/quarterly operation.
- Primary KPIs: throughput, blocker resolution time, cadence adherence.
- Primary authorities: `fiscal_operating_model_v1.md` (rhythm).
- Inputs: cross-department state.
- Outputs: prioritized operating queue, resolved blockers.
- Dependencies: all departments.
- AI support: `send_ledger_agent_v1`, `lead_registry_sync_agent_v1`, the
  persistent operator loop (`operator_daemon`).
- Human approval gates: escalates gate decisions to the owning department/Executive.
- Non-goals: does not own financial or delivery outcomes.

### AI Governance
- Purpose: govern agent behavior, accuracy, and authority adherence.
- Primary responsibilities: agent registry/role governance, accuracy/quality
  review, drift detection, rule capture.
- Business outcomes: trustworthy, governed AI execution.
- Primary KPIs: agent accuracy, gate adherence, drift caught.
- Primary authorities: `staffordos/agents/agent_registry_v1.json`,
  `staffordos/spine_authority/agent_role_alias_map_v1.json`,
  `staffordos/governance/operator_action_authority/operator_action_authority_v1.md`.
- Inputs: agent outputs and execution events.
- Outputs: rules, corrections, governance decisions.
- Dependencies: Engineering (agents), Executive (authority changes).
- AI support: `dev_task_integrity_agent_v1` (integrity); note the role aliases
  `pm_agent`, `architect_agent`, and `loop_d_agent` are intentionally
  unimplemented (`null`) per the alias map.
- Human approval gates: authority changes require the Executive.
- Non-goals: does not set business targets or grant payment.

---

## Section 4 — Cross-Department Flow

Work moves left-to-right, with an explicit owner at each step and a clean
ownership transition on hand-off:

```
Marketing → Sales → (Payment gate) → Delivery → Client Success → Finance → Operations
   leads      qualify/offer            fix+proof   success/referral   revenue    rhythm
```

Ownership transitions:
- Marketing → Sales: when a lead is captured, ownership passes to Sales for
  qualification/routing/offer.
- Sales → Finance/Delivery: an accepted offer creates payment intent; **the S7
  payment gate (Stripe webhook) must clear before Delivery begins**.
- Delivery → Client Success: on completed, proven work, ownership passes to Client
  Success for acceptance/outcome.
- Client Success → Sales (upsell) / Marketing (referral→new lead): expansion loops
  back.
- Finance and Operations run cross-cutting (revenue truth; rhythm) throughout.

No step may skip its owner, and no hand-off may bypass a required human gate or the
payment gate.

---

## Section 5 — Business Process Ownership

| Process | Owner | Human gate | Authority |
| --- | --- | --- | --- |
| Campaign Planning | Marketing | Ross (budget/approval) | lifecycle S1; fiscal model |
| Lead Qualification | Sales | Ross (qualify) | lifecycle S3 |
| Proposal | Sales | Ross (offer) | lifecycle S5; commercial definition |
| Audit | Sales (sales asset; agent-run) | — | lifecycle S5; commercial definition |
| Fix Sprint | Delivery | Ross (scope) | lifecycle S6 |
| QA | Delivery | — | lifecycle S6; fulfillment truth |
| Evidence | Delivery | Ross (proof package) | lifecycle S6 |
| Payment | Finance | none — Stripe webhook only | payment authority; money model |
| Revenue | Finance | — | money model; client_registry |
| Abando Upsell | Sales (offer) / Client Success (readiness) | Ross (upsell) | lifecycle S10; product definitions |
| Renewals | Client Success | — | lifecycle S8 |
| Customer Success | Client Success | Ross (outcome review) | lifecycle S8 |
| Reporting | Finance | — | money model; fiscal model |
| Quarterly Planning | Executive | Ross | fiscal model |
| Knowledge Capture | AI Governance (+ Operations) | — | continuous improvement (fiscal model) |
| Continuous Improvement | Executive (+ Operations) | Ross | fiscal model |

---

## Section 6 — AI Agent Ownership

AI agents **support** departments; a department is always owned by a human/executive
accountability, never by an agent. Real agents (from `agent_registry_v1.json`) map
to departments as follows:

- Marketing: `contact_research_agent_v1`, `contact_enrichment_agent_v1`,
  `message_generation_agent_v1`, `message_validation_agent_v1`,
  `send_execution_agent_v1`, `send_ledger_agent_v1`, `lead_registry_sync_agent_v1`.
- Sales: `approval_decision_agent_v1`, `followup_agent_v1`, `reply_detection_agent_v1`,
  `reply_interpretation_agent_v1`, `reply_response_agent_v1`.
- Client Success: `reply_*` agents, `followup_agent_v1`.
- Engineering: `run_agent_v1`, `dev_task_integrity_agent_v1`, `change_pipeline_v1`,
  `surface_patch_agent_v1`.
- Delivery: approved coding agents (Codex, Claude Code — per product definitions),
  `surface_patch_agent_v1`, `dev_task_integrity_agent_v1`, `run_agent_v1`.
- Finance: `revenue_agent_v1`.
- Operations: `send_ledger_agent_v1`, `lead_registry_sync_agent_v1`, the persistent
  operator loop.
- AI Governance: governs all of the above via `agent_registry_v1.json`,
  `agent_role_alias_map_v1.json`, and `operator_action_authority_v1.md`.

Governance note: some role aliases (`pm_agent`, `architect_agent`, `loop_d_agent`)
are intentionally unimplemented (`null`) in the alias map; task-to-agent mappings
reference role aliases that resolve through that map (e.g. `execution_agent` →
`run_agent_v1`; `shape_checker`/`qa_validator` → `dev_task_integrity_agent_v1`). No
agents are invented here.

---

## Section 7 — Decision Authority Matrix

| Decision | Executive | Department | AI | Human approval required | Authority |
| --- | --- | --- | --- | --- | --- |
| Qualify lead | approves | Sales proposes | recommends | Yes (Ross) | lifecycle S3 |
| Route product/service | approves | Sales proposes | recommends | Yes on non-obvious | routing authority (S4) |
| Approve offer/proposal | approves | Sales prepares | drafts | Yes (Ross) | lifecycle S5 |
| Grant payment received | **no** | **no** | **no** | **no** | **Stripe webhook only** (payment authority) |
| Approve execution scope | approves | Delivery prepares | executes on approval | Yes (Ross) | lifecycle S6 |
| Approve proof package | approves | Delivery prepares | assembles | Yes (Ross) | lifecycle S6 |
| Request referral | approves | Client Success prepares | drafts | Yes (Ross) | lifecycle S9 |
| Approve Abando upsell | approves | Sales/Client Success prepare | prepares | Yes (Ross) | lifecycle S10 |
| Set targets/budgets | decides | departments input | summarizes | Yes (Ross) | fiscal model |
| Activate reserved product | decides | — | — | Yes (Ross) | product definitions |
| Change an authority | decides | — | — | Yes (Ross) | this doc + affected authority |

The payment row is the hard invariant: no department, executive action, or agent
may convert pending payment to earned revenue — only the Stripe webhook.

---

## Section 8 — Future Departments (future only)

Named for planning; none exist today:

- **HR** (future) — hiring/roles as employees grow.
- **Legal** (future) — contracts, compliance.
- **Partnerships** (future) — channel/referral partners.
- **Education** (future) — training/content.
- **Personal StaffordOS** (future) — the founder's personal-life operating layer
  (explicitly out of the current business scope).

---

## Section 9 — Related Authorities

References only (no changes):

- `staffordos/authority/canonical_business_lifecycle_v1.md`
- `staffordos/authority/product_definitions_v1.md`
- `staffordos/authority/canonical_money_model_v1.md`
- `staffordos/authority/fiscal_operating_model_v1.md`
- `staffordos/authority/payment_lifecycle_registry_v1.md`
- `staffordos/authority/authority_registry_v1.md`
- `staffordos/authority/output/product_routing_authority_v1.md`
- `staffordos/governance/operator_action_authority/operator_action_authority_v1.md`
- `staffordos/agents/agent_registry_v1.json`,
  `staffordos/spine_authority/agent_role_alias_map_v1.json`

---

## Section 10 — Known Gaps (documented, not solved)

1. `department` is an informal runtime field (`revenue`/`unknown`); the canonical
   9-department model here is the target, not the current data.
2. No department dashboards, scorecards, or department-scoped surfaces exist
   (future per fiscal model).
3. Marketing attribution and Campaign ROI are unimplemented (no `campaign_id`),
   so Marketing/Finance ROI ownership cannot be fully measured yet.
4. Referral (Client Success S9) is field-only and not operationally tracked.
5. Several agent role aliases (`pm_agent`, `architect_agent`, `loop_d_agent`) are
   intentionally unimplemented; AI Governance ownership of those roles is nominal
   until they exist.
6. No single money authority is code-enforced yet (policy only) — Finance
   ownership relies on the money model as documentation.
7. Ownership of processes spanning two departments (e.g. Abando Upsell across
   Sales and Client Success) is defined here but not yet reflected in runtime data.

---

## Deliverables (summary)

### Department Matrix
Executive, Marketing, Sales, Client Success, Engineering, Delivery, Finance,
Operations, AI Governance — each with purpose, responsibilities, outcomes, KPIs,
authorities, inputs, outputs, dependencies, AI support, human gates, non-goals
(Section 3).

### Ownership Matrix
One accountable department per process; ownership transitions on hand-off
(Sections 4–5).

### Authority Matrix
Decision → Executive/Department/AI/human-gate/authority-doc (Section 7); payment
capture is Stripe-webhook-only.

### Business Process Matrix
16 processes mapped to owners, gates, and authorities (Section 5).

### AI Support Matrix
Real agents from `agent_registry_v1.json` mapped to departments; agents support,
never own (Section 6).

### Known Gaps
Informal department field, missing dashboards, attribution/referral gaps, nominal
agent roles, unenforced money authority (Section 10).

---

## Certification

CONDITIONAL GO.

The Department Architecture is internally consistent with the lifecycle, product,
money, and fiscal authorities, assigns exactly one owner per responsibility and
process, and preserves every human gate and the Stripe-webhook-only payment
invariant. It references only real agents. It is sufficient to structure
organizational ownership and to guide Phase-2 planning.

Conditions before it can be fully operated: the informal `department` field must be
formalized, department dashboards/scorecards built, attribution/referral
implemented, and the money authority code-enforced — all future, separately-
validated missions named in Known Gaps, not solved here.

This is documentation only. No code, JSON, registries, UI, validators, or other
authority documents were changed.
