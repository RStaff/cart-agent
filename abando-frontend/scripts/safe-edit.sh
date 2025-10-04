#!/usr/bin/env bash
set -euo pipefail

unset HISTTIMEFORMAT 2>/dev/null || true
FAIL_ON_DIRTY=${FAIL_ON_DIRTY:-1}

echo "→ repo: $(pwd)"

echo "──────────────────────────────────────────────────────────────"
echo "1) Run codemods (if present)"
echo "──────────────────────────────────────────────────────────────"
if [[ -f scripts/codemod.ts ]]; then
  echo "→ ts codemod: scripts/codemod.ts"
  npx ts-node --compiler-options '{"module":"commonjs"}' scripts/codemod.ts
elif [[ -f scripts/codemod.js ]]; then
  echo "→ js codemod: scripts/codemod.js"
  node scripts/codemod.js
else
  echo "↪︎ no codemod file detected (scripts/codemod.ts|js). Skipping."
fi

# Discover tracked files (repo-agnostic)
readarray -t FILES_ALL < <(git ls-files \
  '*.ts' '*.tsx' '*.js' '*.jsx' '*.json' '*.css' '*.md' 2>/dev/null || true)

[[ ${#FILES_ALL[@]} -eq 0 ]] && echo "↪︎ No matching tracked files in repo."

echo
echo "──────────────────────────────────────────────────────────────"
echo "2) Prettier format"
echo "──────────────────────────────────────────────────────────────"
if [[ ${#FILES_ALL[@]} -gt 0 ]]; then
  npx prettier -w "${FILES_ALL[@]}"
else
  echo "↪︎ Skipping Prettier (no files)."
fi

echo
echo "──────────────────────────────────────────────────────────────"
echo "3) Syntax tripwires (cheap heuristics, fail fast)"
echo "──────────────────────────────────────────────────────────────"
readarray -t TS_FILES < <(git ls-files '*.ts' '*.tsx' 2>/dev/null || true)

BAD_FUNCS=$(printf '%s\n' "${FILES_ALL[@]}" | xargs -r grep -n -E 'function\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\{' || true)
if [[ -n "$BAD_FUNCS" ]]; then
  echo "❌ Suspicious function headers (missing parentheses):"
  echo "$BAD_FUNCS"
  exit 1
fi

BAD_IMPORTS=$(printf '%s\n' "${TS_FILES[@]}" | xargs -r grep -n -E '^\s+import\s+' || true)
if [[ -n "$BAD_IMPORTS" ]]; then
  echo "❌ Import statements with leading indentation (likely inside a block):"
  echo "$BAD_IMPORTS"
  exit 1
fi

BAD_HOOKS=$(printf '%s\n' "${TS_FILES[@]}" | xargs -r grep -n -E 'if\s*\([^)]*\)\s*\{[^}]*React\.use(State|Effect|Memo|Callback|Ref|Context)' || true)
if [[ -n "$BAD_HOOKS" ]]; then
  echo "❌ Possible conditional React hook usage detected:"
  echo "$BAD_HOOKS"
  echo "   (Heuristic—inspect and refactor to hoist hooks to top-level.)"
  exit 1
fi

echo "✓ Tripwires clean"

echo
echo "──────────────────────────────────────────────────────────────"
echo "4) Fast AST parse of every file via esbuild (parse-only)"
echo "──────────────────────────────────────────────────────────────"

# Only code files; drop backups, tmp, and *.d.ts
readarray -t CODE_FILES < <(
  printf '%s\n' "${FILES_ALL[@]}" \
    | grep -E '\.(ts|tsx|js|jsx)$' \
    | grep -vE '(^|/)(backup|backup-v2|__bak__|__backup__)/' \
    | grep -vE '\.bak(\.|$)|\.tmp$' \
    | grep -vE '\.d\.ts$' || true
)

ESBUILD_FAIL=0
SHOWN=0
ES_ARGS='--log-level=error --bundle=false --platform=neutral --format=esm --loader:.ts=ts --loader:.tsx=tsx --loader:.js=js --loader:.jsx=jsx --jsx=automatic'
[[ -f tsconfig.json ]] && ES_ARGS="$ES_ARGS --tsconfig=tsconfig.json"

if [[ ${#CODE_FILES[@]} -eq 0 ]]; then
  echo "↪︎ No code files to parse."
else
  for file in "${CODE_FILES[@]}"; do
    if ! npx esbuild "$file" $ES_ARGS >/dev/null 2>&1; then
      ESBUILD_FAIL=1
      if [[ $SHOWN -lt 10 ]]; then
        echo "┄┄ esbuild error: $file"
        npx esbuild "$file" $ES_ARGS 2>&1 | sed -n '1,20p'
        echo
        SHOWN=$((SHOWN+1))
      fi
    fi
  done
fi

if [[ $ESBUILD_FAIL -ne 0 ]]; then
  echo "✗ esbuild parse failed"
  exit 1
fi
echo "✓ esbuild parse clean"

echo
echo "──────────────────────────────────────────────────────────────"
echo "5) Typecheck"
echo "──────────────────────────────────────────────────────────────"
if npm run -s typecheck; then
  echo "✓ typecheck OK"
else
  echo "❌ typecheck failed"
  exit 1
fi

echo
echo "──────────────────────────────────────────────────────────────"
echo "6) Lint (blocking: --max-warnings=0)"
echo "──────────────────────────────────────────────────────────────"
if npm run -s lint -- --max-warnings=0; then
  echo "✓ lint OK"
else
  echo "❌ lint failed"
  exit 1
fi

echo
echo "──────────────────────────────────────────────────────────────"
echo "7) Optional smoke tests"
echo "──────────────────────────────────────────────────────────────"
if npm run | grep -qE 'test:smoke'; then
  if npm run -s test:smoke; then
    echo "✓ smoke tests OK"
  else
    echo "❌ smoke tests failed"
    exit 1
  fi
else
  echo "↪︎ no test:smoke script found (skipping)"
fi

echo
if [[ $FAIL_ON_DIRTY -eq 1 ]]; then
  echo "──────────────────────────────────────────────────────────────"
  echo "8) Git cleanliness check"
  echo "──────────────────────────────────────────────────────────────"
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "❌ Working tree dirty after safe-edit run. Review or commit intentional changes."
    git status --short
    exit 1
  fi
  echo "✓ git clean"
fi

echo
echo "🎉 Safe-edit pipeline finished successfully."
