# Abando Prod Health Baseline – v0.1.0-health-baseline

Tag: `v0.1.0-health-baseline`

## Endpoints

- Backend (custom domain): https://pay.abando.ai/health
- Backend (Render): https://cart-agent-api.onrender.com/health
- Frontend: https://app.abando.ai/api/health

## Health Scripts

- Backend CLI:
  - \`scripts/abando_backend_prod_health_cli.sh\`
- Frontend CLI:
  - \`scripts/abando_frontend_prod_health_cli.sh\`
- Unified sanity:
  - \`scripts/abando_prod_sanity.sh\`

## Usage

From repo root:

\`\`\`bash
scripts/abando_prod_sanity.sh
\`\`\`

Expected output (simplified):

- ✅ Backend via custom domain OK
- ✅ Backend via Render URL OK
- ✅ Frontend via public URL OK
- 🏁 Prod sanity check complete.
