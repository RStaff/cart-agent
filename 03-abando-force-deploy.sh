#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "✖ Failed at line $LINENO"; exit 1' ERR

if [[ -n "${RENDER_DEPLOY_HOOK:-}" ]]; then
  echo "→ Triggering Render deploy via hook"
  curl -fsS -X POST "$RENDER_DEPLOY_HOOK" && echo "Hook triggered."
else
  echo "→ No deploy hook set; creating a no-op PR to force auto-deploy"
  git fetch origin main --quiet
  BR="chore/abando-redeploy-$(date +%Y%m%d%H%M%S)"
  git switch -c "$BR" origin/main >/dev/null 2>&1 || git checkout -B "$BR" origin/main
  mkdir -p web
  date -u +"forced-redeploy @ %Y-%m-%dT%H:%M:%SZ" > web/.redeploy-touch
  git add web/.redeploy-touch
  git commit -m "chore: force render auto-deploy (touch marker)" || true
  git push -u origin "$BR"
  gh pr create --fill --head "$BR" || true
  gh pr merge --squash --admin -d || true
fi

echo "✅ Deploy triggered."
