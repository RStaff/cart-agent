# ShopiFixer Pilot Workspace Certification v1

## Executive Summary
The ShopiFixer Pilot Workspace is now a coherent, truth-backed operator surface that presents the full merchant engagement path from context through delivery. It is structurally strong and governed by repository truth, but it is still a read-only control surface. The workspace does not yet let Ross approve scope, capture evidence, execute the fix, send proof, collect payment, or complete the engagement from inside this single view.

Certification: **CONDITIONAL PASS**

Updated capability score: **89/100**

Updated operator UX score: **77/100**

Updated production readiness score: **80/100**

## Audit Scope
Entry point audited: `/operator/shopifixer-pilot`

Implemented phases audited:
1. Merchant Context
2. Scope Context
3. Before Evidence
4. Execute Readiness
5. After Evidence
6. Proof & Seal
7. Delivery & Payment Gate

## Phase Audit

### 1. Merchant Context
**Truth sources**
- `staffordos/clients/client_registry_v1.json`
- `staffordos/leads/lead_registry_v1.json`
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
- `staffordos/qa/output/campaign_attribution_report_v1.json`
- `staffordos/proof_runs/output/evidence_manifest_v1.json`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json`
- `staffordos/qa/output/command_center_primary_action_qa_v1.json`

**Information displayed**
- Merchant
- Store
- Lead Status
- Client Status
- Campaign
- Campaign Attribution
- Packet ID
- Current Offer
- Current Next Action
- Current Revenue Opportunity
- Latest Proof Run
- Latest Validation Status

**Missing information**
- No direct merchant approval action
- No editable intake or correction path
- No explicit packet ownership or merchant contact edit path

**Duplicated information**
- Merchant/store appears in both the header chips and the merchant context cards
- Current next action appears in merchant context and again in the right rail

**Workflow correctness**
- Correct as a read-only truth surface
- Not sufficient to initiate the engagement from within this phase alone

**Operator usability**
- Good for orientation
- Good at showing who the engagement is about
- Slightly repetitive

**Production readiness**
- High for display
- Low for execution

**Unnecessary complexity**
- Repetition of merchant identity across multiple panels

**Governance compliance**
- Strong
- No invented data
- No mutation path

### 2. Scope Context
**Truth sources**
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`

**Information displayed**
- Issue / problem summary
- Proposed scoped fix
- In scope
- Out of scope
- Merchant approval needed
- Current offer
- Current price
- Success criteria
- Scope status / source state

**Missing information**
- No scope approval button
- No scope edit path
- No operator signoff timestamp
- No explicit scope version or diff view

**Duplicated information**
- Current offer/price overlaps with Merchant Context
- Some scope summary fields are also echoed in the source file itself

**Workflow correctness**
- Correct as a governed review phase
- Not sufficient to move scope to approved state from within the workspace

**Operator usability**
- Clear and readable
- Good at communicating what the fix is

**Production readiness**
- Medium-high
- Missing approval actions prevent end-to-end use

**Unnecessary complexity**
- Some overlap with Merchant Context

**Governance compliance**
- Strong
- Scope remains read-only

### 3. Before Evidence
**Truth sources**
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`
- `staffordos/proof_runs/output/evidence_manifest_v1.json`

**Information displayed**
- Before evidence status
- before_evidence.md path
- Issue
- Why it matters
- Screenshot reference
- Manifest artifact IDs
- Screenshot artifact status
- Last captured timestamp

**Missing information**
- No capture button
- No manifest append action from the workspace
- No way to remediate missing screenshot artifacts

**Duplicated information**
- Issue/why it matters partially repeat scope context

**Workflow correctness**
- Correct for review
- Not correct as a submission surface because it cannot capture anything

**Operator usability**
- Good for audit and verification

**Production readiness**
- Good for inspection
- Not yet a usable operator action surface

**Unnecessary complexity**
- Some screenshot artifact detail is verbose for a read-only surface

**Governance compliance**
- Strong
- Manifest and markdown are read-only here

### 4. Execute Readiness
**Truth sources**
- `staffordos/execution/output/agent_loop_latest.json`
- `staffordos/execution/execution_log_v1.json`
- `staffordos/events/outcome_event_log_v1.json`
- `staffordos/snapshots/primary_action_snapshot_v1.json`
- `staffordos/qa/output/command_center_primary_action_qa_v1.json`
- `staffordos/preflight/output/preflight_report_v1.json`
- `staffordos/execution/output/required_agent_validation_v1.json`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`

**Information displayed**
- Execution readiness status
- Primary action
- Preflight status
- QA status
- Latest execution status
- Latest execution event
- Outcome event status
- Rollback availability
- Fix scope readiness

**Missing information**
- No Execute button
- No runtime invocation
- No direct rollback control

**Duplicated information**
- Primary action also appears in the Command Center and merchant context

**Workflow correctness**
- Correct as readiness inspection
- Not enough to actually execute the fix

**Operator usability**
- Good for deciding if execution is safe
- Good at showing why it is blocked

**Production readiness**
- Medium-high
- The logic is sound, but it is non-operative

**Unnecessary complexity**
- Multiple signals for a single readiness question

**Governance compliance**
- Strong
- No mutation path

### 5. After Evidence
**Truth sources**
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`
- `staffordos/proof_runs/output/evidence_manifest_v1.json`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json`

**Information displayed**
- After Evidence Status
- after_evidence.md path
- Observed Improvement
- Merchant-facing Summary
- Remaining Limitations
- Screenshot Reference
- Manifest Artifact IDs
- Screenshot Artifact Status
- Last Captured Timestamp

**Missing information**
- No capture/update action
- No ability to append a corrected after artifact

**Duplicated information**
- Merchant-facing summary overlaps with proof package narrative

**Workflow correctness**
- Correct for evidence review
- Not enough to produce evidence from inside the workspace

**Operator usability**
- Clear and readable

**Production readiness**
- Medium

**Unnecessary complexity**
- Some repeated evidence data across the workspace and proof package

**Governance compliance**
- Strong

### 6. Proof & Seal
**Truth sources**
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json`
- `staffordos/proof_runs/output/evidence_manifest_v1.json`
- `staffordos/qa/validate_evidence_manifest_v1.mjs`

**Information displayed**
- Proof package status
- Proof package path
- Proof package version
- Proof run ID
- Generated At
- Manifest path
- Manifest artifact count
- Evidence source paths
- Seal status
- SHA-256 hash
- SHA-256 match status
- Missing screenshot artifact count

**Missing information**
- No regenerate button
- No seal repair path
- No explicit proof export/download action

**Duplicated information**
- Proof run ID and manifest path also appear in the seal and manifest outputs

**Workflow correctness**
- Correct as a proof integrity view
- Not sufficient for merchant delivery

**Operator usability**
- Strong
- Good at answering "is the package trustworthy?"

**Production readiness**
- High for inspection
- Lower for operator action

**Unnecessary complexity**
- The evidence source listing is verbose but justified

**Governance compliance**
- Strong

### 7. Delivery & Payment Gate
**Truth sources**
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/clients/client_registry_v1.json`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json`
- `staffordos/snapshots/primary_action_snapshot_v1.json`

**Information displayed**
- Merchant Delivery Status
- Proof Package Ready
- Checksum Seal Status
- Offer Status
- Payment Status
- Current Next Action
- Recommended Operator Action
- Revenue Opportunity
- Completion Readiness

**Missing information**
- No send action
- No payment collection action
- No completion action
- No gateway to complete the engagement inside this workspace

**Duplicated information**
- Payment and next action are already implied by the execute and command-center surfaces

**Workflow correctness**
- Correct as a final gate display
- Incorrect as a closing surface because it cannot actually close

**Operator usability**
- Clear about the gate state
- Good at signaling that the engagement is not complete

**Production readiness**
- Medium-high for awareness
- Low for completion

**Unnecessary complexity**
- Some overlap with proof/seal and execute readiness

**Governance compliance**
- Strong

## Workspace-Wide Evaluation

### Scores
- Architecture: **90/100**
- UX: **77/100**
- Workflow: **71/100**
- Governance: **91/100**
- Evidence integrity: **94/100**
- Production readiness: **80/100**

### Critical blockers
1. The workspace is read-only. It does not let Ross approve scope, capture evidence, run execution, send proof, collect payment, or complete the engagement.
2. There are no phase transition actions or governed mutation buttons.
3. The workspace cannot complete a full ShopiFixer engagement on its own.

### High priority improvements
1. Add governed phase-transition actions for scope approval, evidence capture, and delivery gate progression.
2. Connect the workspace to the existing send-proof and completion routes with explicit operator approval.
3. Reduce duplicate truth presentation between Merchant Context and the right rail.

### Medium improvements
1. Add compact proof/download affordances for the proof package and seal.
2. Collapse repeated next-action data into a single authoritative card.
3. Add clearer phase progress indicators for the currently active step.

### Low improvements
1. Tighten copy to reduce repeated phrasing around merchant context and next action.
2. Simplify some screenshot artifact detail for faster scanning.

## Can a real merchant complete one engagement here today?
**No.**

Why not:
- The workspace is read-only.
- It has no action buttons that mutate scope, evidence, execution, proof, payment, or completion state.
- It does not invoke the governed send-proof or completion routes.
- It does not capture merchant approval or payment.
- It can show the state of the engagement, but not carry it through to closure.

## Single Highest-Leverage Implementation for P9
Implement a governed action rail that turns the ShopiFixer Pilot Workspace from a read-only truth surface into a controlled workflow surface, starting with scope approval and delivery gate actions that safely connect to the existing proof, send, and completion routes.

## Certification
**CONDITIONAL PASS**

The workspace is now a strong controlled operating surface for inspection and decision-making, but it is not yet a complete execution surface for one full ShopiFixer engagement.
