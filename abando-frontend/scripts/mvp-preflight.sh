#!/usr/bin/env bash
set -euo pipefail
echo "── Preflight: typecheck"
npm run -s typecheck
echo "── Preflight: lint (blocking)"
npm run -s lint -- --max-warnings=0
echo "── Preflight: CTA wiring (dry-run)"
npm run -s cta:check || true
echo "✓ Preflight OK"
