# CareerOS V1.25C Source Authority Model

Each canonical opportunity should retain source observations with:

- provider and provider job ID;
- source URL and employer URL;
- source role (`DISCOVERY`, `AUTHORITATIVE`, `ENRICHMENT`, `USER_SUPPLIED`);
- access/license basis;
- raw/normalized content digests;
- published/updated/retrieved/last-observed timestamps;
- removal state;
- display and derived-analysis rights;
- dedup confidence.

Authority rules:

1. Direct employer ATS outranks an aggregator when identity matches.
2. A licensed aggregator may discover but does not automatically override direct source text.
3. User-supplied source is authoritative for the supplied job snapshot, not proof of current availability.
4. Derived CareerOS analysis is separate from provider content and retains its own provenance.
5. A provider's contract can revoke access; deletion and suppression events must be enforceable.
