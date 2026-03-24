# Deploy Abando to Vercel

This deployment is intended to run from the repository root.

## What this deployment serves

- public grader: `/checkout_grader.html`
- public install page: `/install.html`
- same-origin API route: `/api/checkout-score?store=prose.com`

## Deploy steps

Run these commands from the repo root:

```bash
cd /Users/rossstafford/projects/cart-agent
vercel --version
vercel
vercel --prod
```

## Verify after deploy

Open or curl:

```bash
https://abando.ai/checkout_grader.html
https://abando.ai/install.html
https://abando.ai/api/checkout-score?store=prose.com
```

## What to test

1. `/checkout_grader.html`
Use the form and confirm it fetches `/api/checkout-score` on the same origin.

2. `/install.html`
Confirm the public install page loads and links back into the grader.

3. `/api/checkout-score?store=prose.com`
Confirm the route returns JSON with:
- `store`
- `checkout_score`
- `percentile`
- `tier`
- `detected_signals`
- `missing_signals`
- `top_friction`
- `estimated_revenue_opportunity`
- `competitor_comparison`
- `recommendation`
- `benchmark_badge`

## Troubleshooting

### Benchmark module import path issues

If the serverless function fails to import the benchmark module, confirm:

- the route file is at `/api/checkout-score.js`
- the import path is:

```js
import { generateCheckoutBenchmark } from "../checkout_benchmark_intelligence/index.js";
```

- deployment is running from the repo root, not a subdirectory

### Function route returning 500

If `/api/checkout-score` returns `500`:

- inspect the Vercel function logs
- confirm the benchmark helper still parses locally:

```bash
node --check checkout_benchmark_intelligence/index.js
node --check api/checkout-score.js
```

- confirm the target store is passed with `?store=<domain>`

### Root vs subdirectory deployment confusion

This setup assumes Vercel is pointed at the repository root.

Do not set the Vercel project root to:
- `web`
- `web/frontend`
- `abando-frontend`

The intended deployment root is:

```bash
/Users/rossstafford/projects/cart-agent
```

### Domain not yet assigned to production deployment

If `abando.ai` does not yet show the new deployment:

- confirm `vercel --prod` completed successfully
- confirm the project domain is assigned to the production environment in Vercel
- test the generated production deployment URL before switching the domain
