#!/bin/bash
set -euo pipefail

mkdir -p .git/hooks

cat > .git/hooks/pre-commit <<'HOOK'
#!/bin/bash
set -euo pipefail
echo "===== PRE-COMMIT GATE ====="
if [ -n "${STAFFORDOS_PATCH_AUTH_FILE:-}" ] && [ -f "${STAFFORDOS_PATCH_AUTH_FILE}" ]; then
node - <<'NODE'
const fs = require('fs');
const crypto = require('crypto');
const {execFileSync} = require('child_process');
const p = process.env.STAFFORDOS_PATCH_AUTH_FILE;
const j = JSON.parse(fs.readFileSync(p, 'utf8'));
const run = a => execFileSync('git', a, {encoding:'utf8'}).trim();
if (j.schema !== 'staffordos.application_patch_authorization.v1' || j.nonce !== process.env.STAFFORDOS_PATCH_AUTH_NONCE) process.exit(1);
if (Date.now() > j.expires_at || j.root !== run(['rev-parse','--show-toplevel']) || j.repository !== run(['config','--get','remote.origin.url']).replace(/\.git$/,'').replace('https://github.com/','') || j.branch !== run(['symbolic-ref','--short','HEAD']) || j.head !== run(['rev-parse','HEAD'])) process.exit(1);
const paths = run(['diff','--cached','--name-only']).split('\n').filter(Boolean).sort();
if (JSON.stringify(paths) !== JSON.stringify([...j.paths].sort())) process.exit(1);
for (const path of paths) if (j.staged_blobs?.[path] !== run(['rev-parse', `:${path}`])) process.exit(1);
const d = crypto.createHash('sha256').update(execFileSync('git',['-c','color.ui=false','diff','--cached','--binary','--full-index','--no-ext-diff','--no-textconv'])).digest('hex');
if (j.digest !== d) process.exit(1);
fs.unlinkSync(p);
NODE
  echo "validated application-patch authorization consumed"
elif [ "${STAFFORDOS_GATED:-}" = "true" ]; then
  echo "legacy governed operational gate"
else
  echo "BLOCKED: no governed authorization"
  exit 1
fi
HOOK

chmod +x .git/hooks/pre-commit
echo "gated hook installed"
