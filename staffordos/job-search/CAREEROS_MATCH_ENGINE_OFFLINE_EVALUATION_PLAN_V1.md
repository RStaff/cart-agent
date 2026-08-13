# CareerOS Match Engine V1 Offline Evaluation Plan

Status: proposal for the next mission. No evaluator or scorer is implemented by this audit.

## Dataset

Assemble 30-50 real opportunities from the current private CareerOS universe, stratified across:

- plausible/transferable target roles
- weak or insufficient-evidence roles
- hard mismatches
- preferred, acceptable, outside, and unknown geography/work arrangement
- fresh, stale, duplicate-review, and already-decided records
- at least one submitted application and one record with incomplete linkage

Freeze the exact source run IDs, normalized opportunity facts, extracted requirements, CareerFact/CareerEvidence snapshot references, qualification result, preference snapshot, and workflow/application state. Do not copy private text or IDs into a public report.

## Human Review Form

For each opportunity, Ross or an approved reviewer records:

- human fit judgment: strong target, transferable, weak, hard mismatch, or unknown
- eligibility correctness
- top strengths
- top legitimate gaps
- geography/work-arrangement correctness
- requirement extraction correctness
- evidence classification correctness: exact, transferable, weak, unsupported
- acceptable ranking position or ranking band
- false positive and false negative flags
- explanation quality
- confidence quality

The reviewer must judge from the same source facts and evidence available to the proposed engine. Disagreements and unresolved cases remain recorded, not forced into a label.

## Determinism and Safety Checks

Run identical inputs twice and compare canonicalized outputs. Require no hidden timestamp, object-order, provider-call, or random variation. Verify hard qualification blockers cannot be rescued by preference match. Verify unknown inputs remain unknown. Verify canonical opportunities and historical workflow decisions are unchanged.

## Proposed Acceptance Targets

These are proposed thresholds requiring Ross/operator approval before they become release gates:

- zero hard-mismatch roles in the top actionable result set
- zero outside-preference roles in current actionable results when explicit preferences are active
- zero unsupported claims promoted to exact evidence
- deterministic identical-input reruns
- every calculated score decomposable into inspectable components and source references
- top-ranked results materially agree with Ross's reviewed judgment
- no regression in application, resume, submission, follow-up, or workflow decision state

No numeric accuracy target is asserted here because the current repository has no labeled benchmark and no canonical score. The next mission should approve measurable thresholds after the initial 30-50 record review.

## Evaluation Outputs

Produce a private evaluation result containing per-record labels, disagreements, confusion categories, score components if approved, confidence missing inputs, ranking deltas, and a release recommendation. Public/operator read models should expose only safe explanations and categorical states.
