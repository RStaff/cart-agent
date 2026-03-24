# Abando Named Tunnel Stable Dev

## Canonical truth

- public app origin: `https://dev.abando.ai`
- local app origin: `http://127.0.0.1:8081`
- embedded dashboard: `/dashboard`
- summary API: `/api/dashboard/summary`

## One-time setup

Run these commands in order:

```bash
cloudflared tunnel login
cloudflared tunnel create abando-dev
cloudflared tunnel route dns abando-dev dev.abando.ai
bash ./scripts/dev_bootstrap_named_tunnel.sh
```

## Expected bring-up order

Run these commands in this order:

```bash
bash ./scripts/dev_bootstrap_named_tunnel.sh
bash ./scripts/dev_zero_touch.sh
```

If you need to inspect truth without changing state:

```bash
bash ./scripts/dev_status.sh
bash ./scripts/dev_cloudflare_doctor.sh
```

## Zero-touch startup

Primary entrypoint:

```bash
bash ./scripts/dev_zero_touch.sh
```

Flags:

```bash
bash ./scripts/dev_zero_touch.sh --no-open
bash ./scripts/dev_zero_touch.sh --status-only
bash ./scripts/dev_zero_touch.sh --repair-only
```

## Steady-state commands

Bring everything up:

```bash
bash ./scripts/dev_up.sh
```

Show current truth:

```bash
bash ./scripts/dev_status.sh
```

Stop everything owned by the workflow:

```bash
bash ./scripts/dev_down.sh
```

## Files used

- `.tmp/named-tunnel.env`
- `.tmp/dev-session.json`
- `.tmp/dev-supervisor.json`
- `.tmp/dev-cloudflare-doctor.json`
- `.tmp/dev-doctor.json`

## Healthy vs degraded

Healthy means:

- `.tmp/dev-session.json` has:
  - `"ok": true`
  - `"tunnelMode": "named"`
  - `"activeTunnelUrl": "https://dev.abando.ai"`
  - `"activeTunnelHost": "dev.abando.ai"`
  - `"tunnelLooksStale": false`
  - `"missingPrerequisites": []`

Degraded means local services may be healthy, but named tunnel truth is not ready. The exact reason is in:

- `.tmp/dev-session.json`
- `missingPrerequisites`
- `.tmp/dev-doctor.json`
- `.tmp/dev-cloudflare-doctor.json`

## Self-healing architecture

- `scripts/dev_supervisor.sh`
  keeps the orchestrated stack running and writes `.tmp/dev-supervisor.json`
- `scripts/dev_watchdog.sh`
  checks local health, public health, tunnel health, config drift, and stale quick-tunnel contamination every 5 seconds
- `scripts/dev_cloudflare_auto_fix.sh`
  repairs named-tunnel env/config drift automatically when Cloudflare login is already present
- `scripts/dev_shopify_stable_preview.sh`
  relaunches Shopify dev against the stable hostname only

## Blocker meanings

- `cloudflare_login_not_completed`
  Cloudflare local login is missing. `~/.cloudflared/cert.pem` does not exist.
- `missing_cloudflare_tunnel_id`
  Tunnel `abando-dev` does not exist yet, or could not be detected.
- `missing_cloudflare_credentials_file`
  The repo does not yet know which named-tunnel credentials JSON to use.
- `cloudflare_credentials_file_not_found`
  A tunnel ID is known, but the matching `~/.cloudflared/<id>.json` file is missing.
- `tunnel_dns_not_resolved`
  `dev.abando.ai` does not resolve yet from this machine.
- `tunnel_origin_unreachable`
  `https://dev.abando.ai` exists, but it is not proxying to `http://127.0.0.1:8081`.
- `config_yml_missing`
  `~/.cloudflared/config.yml` is missing.
- `config_yml_invalid`
  `~/.cloudflared/config.yml` exists, but its tunnel or ingress no longer matches the required stable config.
- `named_tunnel_not_running`
  The named tunnel process is not currently running.
- `shopify_preview_still_points_to_quick_tunnel`
  Shopify dev logs or generated preview config still reference an old `trycloudflare.com` host.

## Expected success JSON

```json
{
  "ok": true,
  "activeTunnelUrl": "https://dev.abando.ai",
  "activeTunnelHost": "dev.abando.ai",
  "localServerUrl": "http://127.0.0.1:8081",
  "dashboardUrl": "https://dev.abando.ai/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host",
  "summaryUrl": "https://dev.abando.ai/api/dashboard/summary?shop=cart-agent-dev.myshopify.com",
  "previewUrl": null,
  "detectedAt": "2026-03-20T00:00:00Z",
  "tunnelLooksStale": false,
  "tunnelMode": "named",
  "missingPrerequisites": []
}
```

## Recovery steps

If `cert.pem` is missing:

```bash
cloudflared tunnel login
```

If the named tunnel does not exist:

```bash
cloudflared tunnel create abando-dev
```

If the DNS route is missing:

```bash
cloudflared tunnel route dns abando-dev dev.abando.ai
```

If the credentials json is missing, re-run:

```bash
bash ./scripts/dev_bootstrap_named_tunnel.sh
```

## Why the Shopify admin can still show a dead trycloudflare URL

Cloudflare activation alone does not fix an already-running Shopify dev session.

If Shopify CLI previously launched against a quick tunnel, the generated preview state can still point at an old `trycloudflare.com` hostname even after the named tunnel is configured. That means the app container can still open a dead quick-tunnel URL until Shopify dev is relaunched against the stable named tunnel.

The stable dev flow is only ready when all of these are true:

1. `https://dev.abando.ai` exists as the named tunnel public URL
2. DNS for `dev.abando.ai` resolves from this machine
3. `bash ./scripts/dev_up.sh` passes
4. `bash ./scripts/dev_doctor.sh` reports no blockers
5. Shopify dev is relaunched against the stable URL
6. You stop reusing old `trycloudflare.com` tabs

## What opens automatically

When zero-touch reaches a healthy state, it opens:

- `https://admin.shopify.com/store/cart-agent-dev/apps/83114672506075ba4866194fe0160cde?dev-console=show`
- `https://dev.abando.ai/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host`

## What healthy looks like

- local `http://127.0.0.1:8081/healthz` returns `200`
- public `https://dev.abando.ai/healthz` returns `200`
- `.tmp/dev-session.json` says `"ok": true`
- `.tmp/dev-supervisor.json` shows running supervisor and watchdog
- doctor reports no blockers

## What degraded looks like

- local services may still be healthy
- public health can still fail
- doctor prints exact blockers
- admin should not be expected to load yet

## Exact recovery commands

```bash
cloudflared tunnel login
bash ./scripts/dev_cloudflare_auto_fix.sh
bash ./scripts/dev_zero_touch.sh --repair-only
bash ./scripts/dev_fix_shopify_preview.sh
```
