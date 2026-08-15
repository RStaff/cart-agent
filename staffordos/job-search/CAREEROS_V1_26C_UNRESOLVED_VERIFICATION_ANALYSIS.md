# CareerOS V1.26C Unresolved Verification Analysis

The private loader currently returns 898 CareerFacts, 21 CareerEvidence records, and 890 reviewable candidates. The 705 `UNRESOLVED_VERIFICATION` cases are not treated as automatically resolvable facts.

Aggregate conflict categories remain:

| Category | Count |
| --- | ---: |
| `UNRESOLVED_VERIFICATION` | 705 |
| `INFERENCE_VS_SOURCE_CONFLICT` | 96 |
| `TEMPORAL_VERSION_CONFLICT` | 42 |
| `OTHER` | 55 |

The compression layer asks bounded questions only where candidate statements share a controlled capability-family template and direct/transferable semantic bucket. It does not merge facts, erase source context, or resolve substantive disagreements. `UNRESOLVED_VERIFICATION` is the only conflict class eligible for bounded propagation; inference/source, temporal, and other conflicts remain blocked.

Result: 16 review clusters cover 306 underlying candidates. 246 of those candidates have an operator-resolvable verification state. The remaining 584 reviewable candidates stay outside the compressed propagation boundary, including 574 conflict cases and 68 insufficient-provenance cases.
