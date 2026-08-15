# CareerOS V1.26C Review Cluster Contract

A review cluster is an append-only operator convenience projection over existing candidates. It is not a CareerFact, CareerEvidence record, merge, or canonical capability.

Each cluster preserves the underlying candidate references, question template, capability family, direct/transferable bucket, provenance states, conflict states, propagation-eligible references, allowed answers, priority reason, and latest operator decision.

Clusters are never formed across specialist and generic families, incompatible direct/transferable semantics, or explicit inference/temporal/other conflicts. `UNRESOLVED_VERIFICATION` may be propagated only after an explicit operator answer. `DIRECT` cannot be selected for a transferable cluster; `TRANSFERABLE` cannot be propagated as direct. `UNKNOWN` is never converted to `NO` by code without an explicit operator answer.

Cluster decisions are private append-only events. A later decision supersedes the earlier decision by cluster identity, providing reversal without rewriting source facts.
