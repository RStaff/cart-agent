# StaffordOS Abando Dev Scripts

These scripts are a tiny local operator layer for running the Abando backend repeatably without getting stuck on stale port `8081` listeners.

## Files

- `run_abando.sh`
  - stops any existing listener on port `8081`
  - optionally loads `staffordos/dev/.env.abando.local`
  - starts `node web/src/index.js`
  - prints the chosen port, PID, and whether `ABANDO_PUBLIC_APP_ORIGIN` is set
- `stop_abando.sh`
  - stops whatever is listening on port `8081`
  - confirms the port is clear
- `status_abando.sh`
  - shows whether Abando is listening on `8081`
  - prints PID if present
  - shows whether `ABANDO_PUBLIC_APP_ORIGIN` and required SMTP vars are present
  - if Abando is running, calls `/api/recovery-actions/email-readiness`
- `sync_abando_public_origin.sh`
  - detects the current `https://*.trycloudflare.com` quick tunnel URL from the active `cloudflared` metrics endpoint
  - updates only `ABANDO_PUBLIC_APP_ORIGIN` in `staffordos/dev/.env.abando.local`
  - preserves other env lines
- `proof_abando.sh`
  - runs the operator proof workflow in order: stop, sync, start, check
  - prints the proof-loop verdict and next action
- `set_abando_env.sh`
  - safely sets or replaces one key in `staffordos/dev/.env.abando.local`
  - preserves unrelated env lines
  - can list existing keys without printing values

## Commands

Start Abando:

```bash
bash staffordos/dev/run_abando.sh
```

Stop Abando:

```bash
bash staffordos/dev/stop_abando.sh
```

Check Abando status:

```bash
bash staffordos/dev/status_abando.sh
```

Sync the current Cloudflare quick tunnel URL into the local env file:

```bash
bash staffordos/dev/sync_abando_public_origin.sh
```

Run the full Abando proof workflow:

```bash
bash staffordos/dev/proof_abando.sh
```

Set one local Abando env value safely:

```bash
bash staffordos/dev/set_abando_env.sh SMTP_PASS "new-app-password"
```

Show keys currently present without printing values:

```bash
bash staffordos/dev/set_abando_env.sh --show-keys
```

## Optional local env file

If you want the start script to load a local operator env file automatically, create:

```bash
staffordos/dev/.env.abando.local
```

Example format:

```bash
ABANDO_PUBLIC_APP_ORIGIN="https://example.trycloudflare.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="you@example.com"
SMTP_PASS="app-password"
FROM_EMAIL="you@example.com"
```

This file is optional. Your current shell env still works.

## Quick tunnel sync workflow

Operator flow:

1. start a Cloudflare quick tunnel that points at `http://127.0.0.1:8081`
2. run `bash staffordos/dev/sync_abando_public_origin.sh`
3. run `bash staffordos/dev/run_abando.sh`

Expected sync output:

```text
[abando] detected public origin: https://example.trycloudflare.com
[abando] updated .env.abando.local
```

If no active quick tunnel URL can be detected, the script fails clearly:

```text
[abando] no active trycloudflare URL detected
```

## Why this helps

These scripts prevent the most common local-runtime problems:

- stale `EADDRINUSE` listeners on port `8081`
- forgetting whether the public origin is loaded
- drifting between the current quick tunnel URL and `ABANDO_PUBLIC_APP_ORIGIN`
- forgetting whether SMTP vars are available in the current runtime

They do not change Abando behavior. They only make local operator startup, shutdown, and status checks repeatable.
