# StaffordOS Deploy / DNS Tool

This is a lightweight internal operator tool for tracking public origins, deployment targets, and smoke-test expectations for product surfaces like Abando.

## What v2 adds

v2 extends the registry/check pattern with:

- explicit public-origin fields for each site
- local and public smoke-test URL lists
- a public-origin verification script
- a recovery-link base verification script for Abando

## Registry

Source of truth:

```bash
staffordos/deploy/registry/sites.json
```

Each site entry can track:

- local origin and port
- expected public origin
- public origin env var
- deployment and DNS target notes
- local smoke URLs
- public smoke URLs
- recovery-link expectations

## Commands

Check Abando public-origin setup:

```bash
node staffordos/deploy/check_public_origin.js abando
```

Smoke test Abando public routes:

```bash
node staffordos/deploy/smoke_public_site.js abando
```

Inspect Abando recovery-link base expectation:

```bash
node staffordos/deploy/check_recovery_link_base.js abando
```

## How to tell if Abando is ready for an external proof loop

You want all of these to be true:

- local health is reachable
- expected public origin exists in the registry
- `ABANDO_PUBLIC_APP_ORIGIN` is present in the current shell
- public smoke URLs return healthy responses
- recovery-link base resolves to the public origin instead of localhost

## Why this exists

This gives StaffordOS, Codex, and Claude one inspectable source of truth for:

- what public URL Abando should use
- what local and public routes should smoke test cleanly
- whether Abando is publicly usable for a real proof/demo loop

It does not mutate DNS, deploy infrastructure, or send messages. It only verifies operator reality.
