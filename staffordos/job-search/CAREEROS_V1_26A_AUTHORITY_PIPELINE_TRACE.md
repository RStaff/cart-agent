# CareerOS V1.26A Authority Pipeline Trace

## Pipeline

`private source -> candidate CareerFact -> canonical/private CareerFact -> CareerEvidence -> requirement mapper -> Match Engine diagnostics`

| Boundary | Status | Finding |
| --- | --- | --- |
| Private source to candidate fact | `PRESENT_AND_WORKING` | Existing governed intake extracts private source material with source references and limitations. |
| Candidate fact to canonical/private fact | `PRESENT_BUT_PARTIAL` | Current aggregate contains many proposed/conflicting/unknown-support facts. |
| Fact to CareerEvidence | `PRESENT_BUT_PARTIAL` | 21 evidence records exist, but only a small number of facts carry direct source-evidence links in the loaded fact shape. |
| Evidence to mapper | `PRESENT_AND_WORKING` | Existing mapper accepts both fact source links and evidence reverse links via `supportsFactIds`. |
| Mapper to requirement linkage | `PRESENT_BUT_PARTIAL` | It can produce transferable/partial/unknown classifications, but broad evidence and unresolved conflicts limit discrimination. |
| Diagnostics to Match Engine | `PRESENT_BUT_PARTIAL` | V1.24 diagnostics consume mappings; no projection layer converts eligible private authority into stronger canonical evidence. |

## Exact stop point

Potentially useful authority stops being reliably match-consumable at the transition from private CareerFact/CareerEvidence state to an eligibility-filtered, capability-scoped evidence projection. The current mapper can see records, but it must conservatively retain `UNKNOWN`, `PARTIAL`, or `TRANSFERABLE` for most of the corpus.

CareerFact must not automatically become CareerEvidence. Projection requires source authority, verification state, scope, limitations, and reversibility.
