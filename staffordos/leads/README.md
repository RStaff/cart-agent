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
node staffordos/leads/track_outcome.js seed
node staffordos/leads/track_outcome.js summary
```

Manual outcome updates:

```bash
node staffordos/leads/track_outcome.js mark-audit-opened example-store.myshopify.com
node staffordos/leads/track_outcome.js mark-experience-opened example-store.myshopify.com
node staffordos/leads/track_outcome.js mark-recovery-sent example-store.myshopify.com
node staffordos/leads/track_outcome.js mark-return-tracked example-store.myshopify.com
node staffordos/leads/track_outcome.js note example-store.myshopify.com "Strong brand, likely good fit"
```
