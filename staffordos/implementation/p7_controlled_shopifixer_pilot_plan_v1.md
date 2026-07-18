# Controlled ShopiFixer Production Pilot Plan v1

## Executive Summary
The safest first ShopiFixer production pilot is a single, tightly controlled merchant engagement that already has verified payment truth and a bounded fix scope, with the Operator Command Center used only for governed evidence capture, proof package generation, and completion tracking. The current StaffordOS evidence chain can support that pilot, but only if payment is enforced through the verified Stripe webhook authority and the operator does not bypass the lifecycle gates.

This plan deliberately excludes broad rollout. It treats the first pilot as a production validation of the current evidence chain, not as a full automation launch.

## 1. Safest First Real-World Pilot
The safest first real-world pilot is:

- one merchant
- one authorized ShopiFixer engagement
- one scoped fix
- one verified payment event
- one proof package
- one completion record

The merchant should already be represented in payment or fulfillment truth, and the engagement should be small enough that the operator can verify every step manually if needed.

The pilot should use the existing Command Center flow only for:

- before evidence
- scoped fix
- after evidence
- proof package generation
- checksum seal creation
- completion after verified payment truth exists

## 2. Preconditions Before a Real Merchant Is Used
Before a real merchant is used, all of the following must be true:

1. The merchant is explicitly approved for a controlled pilot.
2. The fix scope is written and reviewed.
3. The payment gate is understood and enforced.
4. The merchant has verified payment truth, not a return-page claim.
5. The proof package can be generated from actual evidence files.
6. The checksum seal is produced successfully.
7. The operator can inspect the generated evidence chain end to end.
8. The pilot can be rolled back without affecting unrelated truth.

## 3. Human-Only Actions
These actions should remain human-only for the pilot:

- merchant approval for the pilot
- scope approval
- payment verification review
- final go/no-go to start the pilot
- any exception handling if the merchant or evidence is ambiguous
- final signoff on completion if the evidence is incomplete

## 4. What StaffordOS Can Safely Automate Today
StaffordOS can safely automate these parts today:

- capture before evidence
- capture after evidence
- append evidence records to the manifest
- copy or reference screenshot artifacts
- generate the merchant proof package
- write the checksum seal
- validate evidence manifest integrity
- surface operator workflow status in the Command Center

StaffordOS should not automate payment acceptance, scope approval, or final pilot authorization.

## 5. Merchant Proof Package to Provide
The merchant should receive a proof package that includes:

- proof package version
- generated timestamp
- proof run ID
- manifest path
- merchant identity
- before evidence artifact IDs
- after evidence artifact IDs
- screenshot artifact references
- evidence source paths
- missing screenshot notes, if any
- checksum seal reference

The proof package should stay readable and evidence-backed. It should not invent metrics or summarize beyond what the evidence chain already proves.

## 6. Payment Gate
The payment gate must be:

- verified Stripe payment truth only
- no operator manual override
- no payment-return shortcut
- no unverified webhook payload
- no completion until payment truth is present in the governed lifecycle

The current payment lifecycle authority states that payment_received may only be marked by the verified Stripe webhook authority. That remains the gate for this pilot.

## 7. Rollback If the Pilot Fails
Rollback should be limited to the pilot engagement only:

1. Stop the pilot workflow.
2. Preserve the evidence manifest and proof package as written.
3. Mark the pilot as blocked or incomplete in operator truth.
4. Do not reuse the merchant for automation until the failure is reviewed.
5. Revert only the pilot-specific operational state, not the broader StaffordOS architecture.

If the issue is payment-related, the rollback should preserve proof artifacts and halt completion rather than trying to repair truth in place.

## 8. What Must Never Be Faked
These must never be faked:

- merchant identity
- payment status
- before evidence
- after evidence
- screenshot references
- proof package content
- checksum seal
- completion timestamp
- fulfillment truth

If any of these are not real, the pilot is not valid.

## 9. Exact Pilot Checklist

1. Select one approved merchant.
2. Confirm the merchant is within the controlled pilot boundary.
3. Confirm scope and success criteria.
4. Confirm the payment gate is satisfied through verified truth.
5. Capture before evidence.
6. Record the scoped fix.
7. Capture after evidence.
8. Generate the merchant proof package.
9. Generate the checksum seal.
10. Review the proof package for completeness.
11. Confirm the manifest and seal are consistent.
12. Only then mark completion.
13. Archive the pilot outcome for future comparison.

## 10. Current Risk Posture
The current evidence chain is good enough for a controlled pilot, but not for broad unattended rollout.

Remaining risks:

- payment truth is still the strongest external dependency
- completion must not outpace verified payment truth
- proof artifacts remain workspace files, so the pilot should be treated as controlled rather than fully autonomous

## 11. Recommended Operating Constraint
Run the pilot only when the operator can verify the entire chain manually:

- merchant approval
- payment verification
- evidence capture
- manifest append
- proof package
- checksum seal
- completion

That is the narrowest safe production path.

## 12. Certification
**CONDITIONAL GO**

The pilot is ready as a controlled production validation, provided the merchant is already payment-verified and the operator keeps the payment and completion gates human-reviewed.
