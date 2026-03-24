# Deploy The Abando Grader Surface

This deployment surface is intentionally isolated from the existing Next.js app so the public grader can be deployed as its own Vercel project.

## Deploy From

Deploy from this directory:

`/Users/rossstafford/projects/cart-agent/grader-deploy`

## Commands

Run these commands from the deployment directory:

```bash
cd /Users/rossstafford/projects/cart-agent/grader-deploy
vercel --version
vercel
vercel --prod
```

## What This Surface Contains

- `public/checkout_grader.html`
- `public/install.html`
- `api/checkout-score.js`
- `vercel.json`

The grader page uses same-origin fetch to call:

- `/api/checkout-score?store=<domain>`

The benchmark API is self-contained inside `grader-deploy` and does not depend on runtime imports from files outside this deployment surface.

## URLs To Verify

After deployment, verify these exact routes:

- `/checkout_grader.html`
- `/install.html`
- `/api/checkout-score?store=prose.com`

Example production URLs:

- `https://<your-vercel-domain>/checkout_grader.html`
- `https://<your-vercel-domain>/install.html`
- `https://<your-vercel-domain>/api/checkout-score?store=prose.com`

## Troubleshooting

### Benchmark module import path issues

If `/api/checkout-score` returns `500`, first check the Vercel function logs and confirm the self-contained benchmark helpers in:

- `grader-deploy/lib/benchmark.js`
- `grader-deploy/lib/signal-extractor.js`

are present in the deployed build output.

### Function route returning 500

Inspect the Vercel function logs and confirm:

- `store` query param is present
- the benchmark import resolved
- the upstream storefront fetch did not fail unexpectedly

### Root vs subdirectory deployment confusion

Do not point this project at:

- `/Users/rossstafford/projects/cart-agent/abando-frontend`
- `/Users/rossstafford/projects/cart-agent/web`

This Vercel project should deploy only the dedicated grader surface in:

- `/Users/rossstafford/projects/cart-agent/grader-deploy`

### Domain not yet assigned to production deployment

If the production domain still serves the wrong app, confirm the domain is attached to the correct Vercel project and that the latest production deployment belongs to this dedicated grader project.
