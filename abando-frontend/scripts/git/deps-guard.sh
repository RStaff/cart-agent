#!/usr/bin/env bash
# Fails on: lockfile drift OR high/critical vulnerabilities in prod deps.
set -euo pipefail

echo "→ deps-guard: lockfile integrity (npm ci --dry-run)"
npm ci --dry-run > /dev/null

echo "→ deps-guard: security (npm audit --omit=dev --audit-level=high)"
# If audit is unavailable (older npm), fall back to success.
if npm audit --version >/dev/null 2>&1; then
  npm audit --omit=dev --audit-level=high
else
  echo "↪︎ npm audit not available; skipping."
fi

echo "✓ deps-guard: OK"
