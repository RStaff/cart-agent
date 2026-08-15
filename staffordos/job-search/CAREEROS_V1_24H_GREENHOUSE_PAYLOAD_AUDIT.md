# V1.24H Greenhouse Payload Audit

- Existing provider request: Greenhouse public Job Board API with content=true.
- Provider response model includes job.content HTML.
- Existing normalized records inspected: 253.
- Existing records with retained structured content: 0.
- Existing locked 80-role records with retained structured content: 0.
- Existing normalized records with plain text: 253.

The richer field exists at provider ingestion, but the prior normalizer stripped it and the prior private retrieval writer omitted it. No external request was made for this mission.
