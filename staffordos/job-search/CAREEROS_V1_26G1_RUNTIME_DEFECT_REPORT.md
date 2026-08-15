# CareerOS V1.26G1 Runtime Defect Report

The conflict view was using the historical `cluster-decisions.ndjson` answer attached to each review cluster. That authority represents V1.26C high-value review completion, not V1.26G conflict resolution. Consequently, the view could show `Question 1 of 16` while displaying `Operator decisions 16 / 16` even when no V1.26G conflict decision existed.

The repair introduces a separate private `conflict-decisions.ndjson` authority. Conflict completion is derived only from the latest valid decision for each stable conflict question ID. Historical high-value answers remain context and never count toward conflict completion.

No CareerFact or CareerEvidence authority was changed. No real Ross conflict answer was written.
