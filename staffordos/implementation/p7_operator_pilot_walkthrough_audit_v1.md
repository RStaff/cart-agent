# P7 Operator Pilot Walkthrough Audit v1

## Executive Summary
The first real operator journey in StaffordOS is mostly usable, but it is not yet a single smooth production path. The system already has a governed morning surface, a workday control panel, a ShopiFixer proof-run workbench, revenue and lead surfaces, and file-backed proof artifacts. The main friction is that the operator still has to move between multiple surfaces with overlapping information, and the final proof artifacts are not surfaced as a coherent end-to-end operator task.

The workflow is safe enough to run for a controlled pilot merchant, but the UX still asks Ross to mentally stitch together the workday, command center, proof-run steps, evidence files, checksum seal, and payment state.

## 1. Start Workday
- Screen: Operator Home
- Button: `Start Workday`
- Information shown: current daemon status, loop count, heartbeat, safe mode, and a short explanation that this is the governed StaffordOS workday loop
- Evidence produced: workday runtime output and daemon state updates via `/api/operator/workday/start`
- Decision made: whether to start the governed workday loop
- Automation: invokes `staffordos/operating_loop/start_workday_v1.sh`
- Still requires a human: operator must choose to start the workday

## 2. Review Today’s Queue
- Screen: Operator Home, Command Center, Leads, Revenue Command
- Button: Home links and section CTAs; no single unified queue button
- Information shown: primary action snapshot, validation status, system health, campaign coverage, lead count, revenue snapshot, open blockers
- Evidence produced: none directly; this is review-only
- Decision made: what to work first
- Automation: repository truth is loaded automatically
- Still requires a human: Ross must choose the next task manually

## 3. Select Merchant
- Screen: Operator Home and Command Center
- Button: no dedicated “select merchant” control; merchant context is inferred from the ShopiFixer command center data
- Information shown: merchant/store, client ID, audit score, offer status, payment status, fulfillment status, readiness, packet linkage
- Evidence produced: none directly
- Decision made: which merchant/work item to operate on
- Automation: current merchant truth is loaded from repository-backed command center state
- Still requires a human: merchant selection is implicit, not explicit

## 4. Review Merchant Context
- Screen: Operator Home, Command Center, Revenue Command, System Map
- Button: links to `Open Executive Command Center`, `Open Revenue Command`, `Open System Map`, plus route chips in the shell
- Information shown: audit blockers, readiness score, next required action, checkout linkage, fulfillment stage, packet ID, reservation ID, revenue queue, system map truth
- Evidence produced: none directly
- Decision made: whether the merchant is ready for scoped work, payment, or completion
- Automation: context is loaded from truth files
- Still requires a human: Ross must interpret the context

## 5. Execute Scoped Fix
- Screen: Command Center
- Button: `Record Scoped Fix`
- Information shown: scoped fix description, in-scope, out-of-scope, approval-needed flag, change made, location changed, implementation notes, success criteria
- Evidence produced: `fix_scope.md`
- Decision made: what the smallest fix is and whether it stays in scope
- Automation: the writer captures the fix scope into the proof-run folder
- Still requires a human: scope definition and approval

## 6. Capture Before Evidence
- Screen: Command Center
- Button: `Capture Before Evidence`
- Information shown: affected page/artifact, issue, why it matters, screenshot reference, notes, merchant/store, proof-run path
- Evidence produced: `before_evidence.md`, manifest append, optional screenshot artifact copy or missing reference record
- Decision made: what proof is needed before the fix
- Automation: evidence manifest append and screenshot artifact capture
- Still requires a human: supply the actual evidence and screenshot reference

## 7. Capture After Evidence
- Screen: Command Center
- Button: `Capture After Evidence`
- Information shown: affected page/artifact, after screenshot, after notes, remaining limitations, observed improvement, merchant-facing summary
- Evidence produced: `after_evidence.md`, manifest append, optional screenshot artifact copy or missing reference record
- Decision made: whether the fix materially improved the merchant state
- Automation: evidence manifest append and screenshot artifact capture
- Still requires a human: verify the before/after story is real

## 8. Generate Proof Package
- Screen: Command Center
- Button: `Generate Proof Package`
- Information shown: proof-run path, merchant/store, stage context, saved state when complete
- Evidence produced: `merchant_proof_package.md`, `merchant_proof_package.seal.json`
- Decision made: whether the evidence chain is complete enough to package
- Automation: proof package reads the manifest and assembles the merchant-facing proof summary
- Still requires a human: confirm the package actually matches the merchant work

## 9. Verify Checksum
- Screen: file-system output, not yet a first-class operator screen
- Button: none in the main UI; checksum validation is external or validator-backed today
- Information shown: seal JSON contains `sha256` and the proof package path
- Evidence produced: checksum seal file
- Decision made: whether the proof package was sealed after generation
- Automation: SHA-256 is computed by the writer
- Still requires a human: independently check the seal if needed

## 10. Send Proof
- Screen: no dedicated operator proof-send screen; closest surfaces are the proof package file and send-proof API
- Button: no primary UI button for sending the merchant proof package
- Information shown: send ledger proof counts on the revenue/lead surfaces
- Evidence produced: send ledger entries when send proof is exercised
- Decision made: whether proof delivery should be attempted
- Automation: `/api/operator/send-proof` exposes read-only proof counts from the send ledger
- Still requires a human: decide to send proof, because the workflow is not yet a first-class buttoned action in the shell

## 11. Await Payment
- Screen: Command Center, Revenue Command, ShopiFixer lifecycle docs
- Button: none for payment receipt in StaffordOS UI
- Information shown: offer status, payment status, checkout linkage, readiness, revenue queue, payment lifecycle authority
- Evidence produced: payment truth only after the verified payment authority path writes it
- Decision made: whether payment is actually verified
- Automation: payment authority and lifecycle truth can reflect state when the external payment path succeeds
- Still requires a human: verify the payment is actually real and governed

## 12. Close Workday
- Screen: Operator Home
- Button: `Stop Workday`
- Information shown: workday state, loop count, heartbeat, safe mode, and governed loop explanation
- Evidence produced: workday runtime output and daemon state updates via `/api/operator/workday/stop`
- Decision made: whether the operating day is over
- Automation: invokes `staffordos/operating_loop/stop_workday_v1.sh`
- Still requires a human: choose when to stop the workday

## Unnecessary Clicks
- The operator must move between Home, Command Center, Revenue Command, Leads, and System Map to understand one merchant.
- Proof package generation is not surfaced as a single end-to-end receipt flow; the operator has to know the proof-run stages.
- Checksum verification is still file-based rather than a visible operator action.
- Payment confirmation is not surfaced as one obvious step in the pilot path.

## Duplicated Information
- Merchant/store, client ID, readiness, and payment state appear in multiple surfaces.
- Campaign coverage and revenue truth are shown on both Home and Revenue-oriented surfaces.
- Validation status appears in both the shell and the home surface.
- The operator sees both command-center merchant context and home surface merchant context.

## Missing Navigation
- No explicit “Select merchant” screen.
- No direct navigation to the proof package file or seal file from the shell.
- No first-class “Send proof” operator screen.
- No first-class “Verify checksum” operator screen.
- No dedicated payment verification screen inside StaffordOS.

## Confusing Terminology
- “Proof package” and “proof run” are close but not visually distinguished enough.
- “Workday control” and “governed StaffordOS workday loop” are clear in code, but not yet reinforced everywhere in the UI.
- “Campaign registry” and “campaign attribution” are clear enough, but the operator still has to infer why they matter during a ShopiFixer pilot.
- “Revenue Command” mixes captured Stafford Revenue with merchant-value recovery; the distinction is technically present but still cognitively heavy.

## Opportunities For Automation
- Auto-open the relevant merchant context from the selected work item.
- Surface the proof package and seal as explicit downloadable artifacts.
- Offer a one-click checksum verification display after proof generation.
- Auto-link before/after evidence records into the proof-package view.
- Surface the payment gate as a single status line in the pilot workflow.

## Opportunities For AI Assistance
- Summarize the merchant context into one “what matters next” block.
- Draft the scoped fix from the merchant evidence and operator notes.
- Draft the merchant-facing proof summary from the actual evidence package.
- Highlight the exact missing evidence or missing payment truth before completion.

## Current Operator UX Score
`72/100`

The UX is usable and truth-backed, but the operator is still doing too much manual stitching between surfaces.

## Top 10 Improvements By Impact
1. Add a dedicated ShopiFixer pilot screen that chains merchant context, evidence capture, proof package, seal, and payment gate in one flow.
2. Surface proof package and seal downloads directly in the Command Center after generation.
3. Add a visible checksum verification readout in the UI.
4. Add an explicit merchant selection step for the pilot.
5. Add a single “current pilot status” lane from start workday to close workday.
6. Merge duplicated merchant context from Home and Command Center into one canonical summary component.
7. Surface payment verification as a first-class operator state.
8. Add a first-class “send proof” action rather than only read-only send ledger context.
9. Reduce navigation hops by linking relevant proof-run stages directly from Home.
10. Introduce AI-generated next-step suggestions only after the operator has confirmed the evidence chain inputs.

## Single Highest-Leverage Improvement Before The First Real Merchant
Build a single governed ShopiFixer pilot surface that combines:

- merchant context
- scoped fix
- before evidence
- after evidence
- proof package
- checksum seal
- payment gate

That would remove the most mental overhead and reduce the chance of operator error on the first real merchant.

## Certification
**CONDITIONAL PASS**

The journey is operationally viable for a controlled pilot, but it still depends on the operator manually connecting several adjacent surfaces. The highest value improvement is to collapse the ShopiFixer pilot into one governed workflow surface before using the first real merchant.
