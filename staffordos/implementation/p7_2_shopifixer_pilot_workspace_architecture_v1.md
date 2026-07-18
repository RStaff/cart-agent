# ShopiFixer Pilot Workspace Architecture v1

## Executive Summary
The canonical ShopiFixer Pilot Workspace is a single operator surface for one merchant engagement from context through delivery. It collapses the current scattered surfaces into one governed workflow while preserving the existing evidence chain, proof package, checksum seal, payment gate, and completion authority.

This is the architecture P8 implementation should follow.

## Purpose
The workspace exists to let Ross execute one controlled ShopiFixer engagement end to end without having to stitch together separate screens for:

- merchant context
- scope approval
- before evidence
- execution
- after evidence
- proof package
- checksum seal
- delivery and completion

The workspace is not a dashboard. It is a controlled operator workflow.

## Canonical Workspace

### Phase 1: Merchant Context
**Contains**
- merchant identity
- Shopify store
- packet
- payment status
- campaign
- lead
- previous work

**Operator actions**
- confirm the merchant
- review prior truth
- choose whether the engagement is the correct one to run

**Automated actions**
- load repository-backed merchant, lead, campaign, and payment context
- resolve the current packet and prior work state

**Evidence generated**
- none directly; this is a review phase

**Validators**
- merchant truth present
- packet truth present if available
- payment gate status available
- campaign and lead context loaded from canonical sources

**Rollback**
- abandon the engagement before any evidence is captured
- leave all truth unchanged

**Completion criteria**
- merchant identity is confirmed
- payment position is known
- prior work is visible
- operator is ready to scope the fix

### Phase 2: Scope
**Contains**
- issue
- proposed fix
- estimated impact
- operator approval

**Operator actions**
- define the smallest fix
- mark what is in scope and out of scope
- approve the scope before evidence capture

**Automated actions**
- store the scoped fix in the proof-run path
- surface whether required fields are present

**Evidence generated**
- scoped fix record

**Validators**
- scope present
- approval present
- scope not broader than the pilot allows

**Rollback**
- edit or discard the scope before execution
- do not proceed until scope is approved

**Completion criteria**
- the fix is narrow
- the operator has approved it
- the workspace can move to before evidence

### Phase 3: Evidence Before
**Contains**
- screenshots
- notes
- artifact capture
- manifest append

**Operator actions**
- capture the pre-fix state
- provide screenshot references
- add notes if needed

**Automated actions**
- copy or reference screenshot artifacts
- append the before-evidence artifact to the manifest

**Evidence generated**
- before evidence markdown
- manifest artifact record
- screenshot artifact reference or copied artifact

**Validators**
- before evidence written
- manifest append succeeds
- screenshot artifact recorded or safely marked missing

**Rollback**
- discard the captured artifact only if the operator has not moved to execute
- if already appended, preserve the record and correct only with a new append

**Completion criteria**
- the pre-fix state is durable
- the manifest reflects the evidence

### Phase 4: Execute
**Contains**
- execute approved fix
- execution status
- rollback status

**Operator actions**
- launch the approved fix
- monitor execution status
- stop or rollback if needed

**Automated actions**
- run the governed execution path
- update execution status truth if the implementation supports it

**Evidence generated**
- execution status record
- optional runtime outputs if the workflow already produces them

**Validators**
- scope was approved before execution
- execution route exists
- rollback path is available

**Rollback**
- stop the execution path
- preserve before evidence and scope
- do not rewrite prior evidence

**Completion criteria**
- execution is complete or safely aborted
- the workspace can move to after evidence

### Phase 5: Evidence After
**Contains**
- screenshots
- observations
- improvement summary
- manifest append

**Operator actions**
- capture the post-fix state
- describe what improved
- record remaining limitations

**Automated actions**
- copy or reference screenshot artifacts
- append the after-evidence artifact to the manifest

**Evidence generated**
- after evidence markdown
- manifest artifact record
- screenshot artifact reference or copied artifact

**Validators**
- after evidence written
- manifest append succeeds
- screenshot artifact recorded or safely marked missing

**Rollback**
- if the post-fix evidence is wrong, append a corrected after-evidence record
- do not destroy the original chain

**Completion criteria**
- improvement is visible and documented
- the manifest contains the after artifact

### Phase 6: Proof
**Contains**
- proof package preview
- checksum seal
- evidence manifest
- artifact list

**Operator actions**
- review the generated proof package
- verify the checksum seal
- confirm the evidence chain is complete

**Automated actions**
- assemble the proof package from the manifest-backed evidence
- compute the checksum seal

**Evidence generated**
- merchant proof package
- checksum seal

**Validators**
- proof package exists
- seal exists
- checksum matches
- manifest path is canonical

**Rollback**
- regenerate the proof package after correcting evidence
- do not mutate the manifest during packaging

**Completion criteria**
- proof package is complete
- checksum seal matches
- the merchant can receive the evidence bundle

### Phase 7: Merchant Delivery
**Contains**
- send proof
- payment status
- completion gate

**Operator actions**
- send the proof
- confirm payment truth
- decide whether the engagement can be closed

**Automated actions**
- surface send-proof ledger context
- surface payment and completion truth where available

**Evidence generated**
- proof delivery trace if the send path already records one
- completion truth when allowed

**Validators**
- proof package exists before send
- payment gate is satisfied before completion

**Rollback**
- if payment is not verified, stop at delivery and do not complete
- preserve the proof package and manifest

**Completion criteria**
- proof is delivered
- payment is verified
- completion truth can be recorded

## Recommended Page Layout
1. Header with merchant identity, packet, payment status, and current phase
2. Left rail with the seven phases and completion states
3. Main canvas for the active phase
4. Right rail for evidence, validators, and rollback state
5. Bottom bar for primary CTA, secondary CTA, and current blockers

## Card Hierarchy
1. Merchant Context card
2. Current Phase card
3. Evidence card
4. Validator card
5. Rollback card
6. Proof Package card
7. Delivery card

## Primary CTA
The primary CTA should always be the next governed action for the current phase:

- Confirm merchant
- Approve scope
- Capture before evidence
- Execute approved fix
- Capture after evidence
- Generate proof package
- Send proof / confirm payment gate

## Secondary CTA
The secondary CTA should always be the safe alternative:

- review prior truth
- edit scope
- retry evidence capture
- rollback execution
- inspect manifest
- verify checksum
- hold delivery pending payment

## Progress Indicator
Use a seven-step progress indicator tied directly to the phases above.

- not started
- in progress
- complete
- blocked

Do not introduce a second, competing progress model.

## Navigation Behavior
- The workspace should live inside Operator Shell.
- It should be reachable from Operator Home and Command Center.
- It should not require bouncing between unrelated dashboards to complete the engagement.
- Phase transitions should preserve state and keep the operator in the same workspace.

## Top 10 UI Components Required
1. Merchant summary card
2. Phase progress rail
3. Scope editor card
4. Before evidence capture card
5. Execution status card
6. After evidence capture card
7. Proof package preview card
8. Checksum seal card
9. Delivery / payment gate card
10. Validator and rollback card

## Estimated Implementation Order
1. Workspace shell and phase rail
2. Merchant Context phase
3. Scope phase
4. Before evidence phase
5. Execute phase
6. After evidence phase
7. Proof phase
8. Delivery phase
9. Checksum and validator affordances
10. Rollback state wiring

## Complexity
- Workspace shell and phase rail: 5/10
- Merchant Context: 4/10
- Scope: 5/10
- Before evidence: 6/10
- Execute: 7/10
- After evidence: 6/10
- Proof: 6/10
- Delivery: 7/10
- Checksum / validators: 5/10
- Rollback wiring: 6/10

Overall complexity: 6/10

## Expected UX Improvement
This workspace should reduce operator context switching, make the pilot flow legible, and cut the chance of skipping a gate or sending proof before the chain is complete.

Expected UX improvement: high

## Expected Production Readiness Improvement
This workspace should make the first merchant pilot materially safer by aligning the operator surface with the governed evidence chain and payment gate.

Expected production readiness improvement: high

## Rollback Philosophy
Rollback must preserve evidence history. If a phase is wrong, correct it with a later artifact or a later truth update; do not erase the chain.

## Certification
**CONDITIONAL GO**

The architecture is complete enough to build the controlled pilot workspace in P8 without reopening the core evidence or payment design.
