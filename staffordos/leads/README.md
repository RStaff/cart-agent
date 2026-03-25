# StaffordOS Leads Outcome Loop

This folder keeps the Abando routing loop small and file-based:

- `candidate_stores.json`
- `scored_stores.json`
- `top_targets.json`
- `outcomes.json`
- `router.js`
- `track_outcome.js`

Core commands:

```bash
node staffordos/leads/router.js
node staffordos/leads/quality_filter.js
node staffordos/leads/contact_discovery.js
node staffordos/leads/contact_research.js seed
node staffordos/leads/contact_research.js summary
node staffordos/leads/real_store_intake.js add realbrand.myshopify.com
node staffordos/leads/real_store_intake.js sync
node staffordos/leads/track_outcome.js seed
node staffordos/leads/track_outcome.js summary
node staffordos/leads/outreach.js seed
node staffordos/leads/outreach.js summary
```

Authoritative routing handoff:

- `router.js` writes scored and pre-filter top targets
- `quality_filter.js` writes `qualified_targets.json`
- `contact_discovery.js` writes `contact_targets.json` from public merchant-facing pages only
- `contact_research.js` writes `contact_research_queue.json` for manual contact research on fallback targets
- `real_store_intake.js` keeps `real_store_candidates.json` as a clean manual source for actual Shopify/custom storefront domains
- `outreach.js seed` prefers `qualified_targets.json` and removes stale queue entries that no longer qualify
- `run_lead_engine.js` syncs `real_store_candidates.json` first, then prunes stale `auto_discovered` candidates so discovery does not keep compounding old junk

Manual outcome updates:

```bash
node staffordos/leads/track_outcome.js mark-audit-opened example-store.myshopify.com
node staffordos/leads/track_outcome.js mark-experience-opened example-store.myshopify.com
node staffordos/leads/track_outcome.js mark-recovery-sent example-store.myshopify.com
node staffordos/leads/track_outcome.js mark-return-tracked example-store.myshopify.com
node staffordos/leads/track_outcome.js note example-store.myshopify.com "Strong brand, likely good fit"
```

Manual outreach workflow:

```bash
node staffordos/leads/outreach.js approve example-store.myshopify.com
node staffordos/leads/outreach.js queue example-store.myshopify.com
node staffordos/leads/outreach.js render example-store.myshopify.com
node staffordos/leads/outreach.js mark-sent example-store.myshopify.com
node staffordos/leads/outreach.js mark-replied example-store.myshopify.com
node staffordos/leads/outreach.js close example-store.myshopify.com
```

Discovery cleanup rules:

- no repeated adjacent tokens like `co-co` or `goods-goods`
- no suffix reuse inside one generated name
- no generated names deeper than base plus two suffixes
- no expansion from filler bases like `example`, `test`, `demo`, or `sample`
- clean bases generate only a small capped set of variants
