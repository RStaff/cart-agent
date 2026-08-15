# CareerOS V1.25D Provider Failure Model

This mission did not implement the adapter. The future pilot must fail closed for:

| Failure | Required behavior |
| --- | --- |
| Invalid key / 401 | Stop TheirStack request path; do not alter Greenhouse truth |
| Quota / 402 | Record provider exhaustion; return no partial false-success |
| Rate limit / 429 | Respect provider reset headers; bounded retry only |
| Timeout / network error | Isolate request; preserve prior observations with freshness state |
| Malformed record | Reject record with diagnostic; continue only with valid records |
| Missing description | Preserve record with unknown description quality; do not invent evidence |
| Missing location | Preserve unknown location; preference remains independently unknown |
| Duplicate | Run canonical dedup; preserve source observations |
| Closed/stale job | Preserve source state; do not infer open status |
| Provider outage | Leave existing Greenhouse and user-supplied truth unchanged |

No provider failure may mutate CareerFact, CareerEvidence, J002, J003, J010, shortlist, or workflow state.
