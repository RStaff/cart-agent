# CareerOS V1.25C Source Architecture Options

| Option | Value | Cost/complexity | Risk | Decision |
|---|---|---|---|---|
| A. ATS network | Highest source fidelity and provenance | High partner/integration effort | Provider fragmentation | Long-term enrichment lane |
| B. Licensed aggregator | Fastest broad discovery | Contract/data cost | Aggregator freshness and source ambiguity | Strong candidate for pilot |
| C. Hybrid | Broad discovery plus authoritative enrichment | Highest orchestration effort | Dedup/source conflicts | Best long-term architecture |
| D. User-directed | Immediate value, minimal access risk | Lower automated discovery | User must supply opportunity | Best safe MVP fallback |
| E. Multi-mode | Combines licensed, direct, and user sources | Product complexity | Requires explicit source authority states | Recommended product shape |

CareerOS should model `DISCOVERY_SOURCE`, `AUTHORITATIVE_JOB_SOURCE`, `ENRICHMENT_SOURCE`, and `USER_SUPPLIED_SOURCE` independently. A discovery source must not be treated as authoritative merely because it has a job ID.
