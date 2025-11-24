# Abando Frontend – Production Environment

## Current Production URL

- Base URL: https://app.abando.ai
- Health:   https://app.abando.ai/api/health

## Notes

- Vercel Authentication: **Disabled** so the app and /api/health are publicly accessible.
- Build Logs & Source Protection: **Enabled** (Settings → Security) so logs/source remain team-only.
- When you later move to another domain (e.g. https://beta.abando.ai), update this file and:
  - export ABANDO_FRONTEND_URL="https://beta.abando.ai"

