# Abando Stable Dev Tunnel

## Strategy

Use one named Cloudflare Tunnel plus one permanent hostname for local Shopify embedded validation.

Recommended stable hostname:

- `https://dev.abando.ai`

The repo is wired to prefer that stable URL when these env vars are present:

- `ABANDO_DEV_PUBLIC_URL`
- `ABANDO_CLOUDFLARE_TUNNEL_ID`
- `ABANDO_CLOUDFLARE_CREDENTIALS_FILE`
- optional `ABANDO_CLOUDFLARE_TUNNEL_NAME`

When configured, `npm run abando:up` keeps:

- `APP_URL=${ABANDO_DEV_PUBLIC_URL}`
- local app on `http://127.0.0.1:8081`
- named Cloudflare tunnel forwarding the stable hostname to local port `8081`

## One-time Cloudflare setup

1. Login:

```bash
cloudflared tunnel login
```

2. Create the named tunnel:

```bash
cloudflared tunnel create abando-dev
```

3. Route DNS for the stable hostname:

```bash
cloudflared tunnel route dns abando-dev dev.abando.ai
```

4. Export the tunnel env vars locally:

```bash
export ABANDO_DEV_PUBLIC_URL=https://dev.abando.ai
export ABANDO_CLOUDFLARE_TUNNEL_NAME=abando-dev
export ABANDO_CLOUDFLARE_TUNNEL_ID=<tunnel-id-from-create>
export ABANDO_CLOUDFLARE_CREDENTIALS_FILE=/Users/rossstafford/.cloudflared/<tunnel-id-from-create>.json
```

## Local commands

Generate the Shopify dev app config for the stable URL:

```bash
ABANDO_DEV_PUBLIC_URL=https://dev.abando.ai node scripts/abando-generate-shopify-dev-config.mjs
```

Start the local stack with stable tunnel preference:

```bash
npm run abando:up
```

Health check:

```bash
npm run abando:health
```

Stop local services and the tunnel:

```bash
npm run abando:down
```

## Shopify settings that must use the stable hostname

Once the tunnel exists, Shopify dev settings must use the generated values from:

- `.abando-dev/shopify.app.dev.toml`

The important values are:

- App URL:
  - `https://dev.abando.ai`
- Allowed redirection URL(s):
  - `https://dev.abando.ai/auth/callback`
  - `https://dev.abando.ai/auth/shopify/callback`
  - `https://dev.abando.ai/api/auth/callback`
- GDPR webhook URL:
  - `https://dev.abando.ai/api/webhooks/gdpr`

## Current blocker

If `cloudflared tunnel list` fails with missing origin cert or there is no `~/.cloudflared/*.json` credentials file, the named tunnel has not been created yet. In that case the repo prep is ready, but the stable tunnel is not live until the one-time Cloudflare setup is completed.
