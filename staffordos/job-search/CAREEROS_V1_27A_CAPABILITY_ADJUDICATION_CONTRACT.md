# Capability Adjudication Contract

`CapabilityAdjudicationDecision` is an owner-private append-only overlay. It contains a decision ID, question ID, exact capability IDs, question-specific answer, operator authority, timestamp, graph version, supersession metadata, and optional note. It never mutates CareerFact or CareerEvidence. Only active decisions affect derived capability state; superseded records remain history. Unknown, unresolved, and needs-evidence answers remain neutral.
