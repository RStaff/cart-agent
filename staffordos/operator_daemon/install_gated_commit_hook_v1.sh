#!/bin/bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
GIT_DIR="$(git rev-parse --git-dir)"
COMMON_DIR="$(git rev-parse --git-common-dir)"
HOOKS_DIR="$(git rev-parse --git-path hooks)"
case "$HOOKS_DIR" in
  /*) ;;
  *) HOOKS_DIR="$ROOT/$HOOKS_DIR" ;;
esac
case "$GIT_DIR" in
  /*) ;;
  *) GIT_DIR="$ROOT/$GIT_DIR" ;;
esac
case "$COMMON_DIR" in
  /*) ;;
  *) COMMON_DIR="$ROOT/$COMMON_DIR" ;;
esac
HOOKS_DIR="$(cd "$HOOKS_DIR" 2>/dev/null && pwd || { mkdir -p "$HOOKS_DIR"; cd "$HOOKS_DIR"; pwd; })"
HOOK="$HOOKS_DIR/pre-commit"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDATOR_PATH="$SCRIPT_DIR/application_patch_hook_validator_v1.mjs"
if [ ! -r "$VALIDATOR_PATH" ]; then
  echo "BLOCKED: reviewed hook validator is unavailable: $VALIDATOR_PATH" >&2
  exit 1
fi
VALIDATOR_DIGEST="$(shasum -a 256 "$VALIDATOR_PATH" | awk '{print $1}')"

SHARED=false
if [ "$GIT_DIR" != "$COMMON_DIR" ] && [[ "$HOOKS_DIR/" == "$COMMON_DIR/"* ]]; then
  SHARED=true
fi
echo "effective_hook=$HOOK"
echo "shared_hook=$SHARED"
if [ "$SHARED" = true ] && [ "${STAFFORDOS_ALLOW_SHARED_HOOK_INSTALL:-}" != true ]; then
  echo "BLOCKED: this linked worktree resolves to a shared hook; review impact and rerun with STAFFORDOS_ALLOW_SHARED_HOOK_INSTALL=true" >&2
  exit 1
fi

mkdir -p "$HOOKS_DIR"
BACKUP=""
if [ -e "$HOOK" ]; then
  BACKUP="$HOOK.staffordos-backup.$(date +%Y%m%d%H%M%S).$$"
  cp -p "$HOOK" "$BACKUP"
fi
TMP="$(mktemp "$HOOKS_DIR/.pre-commit.staffordos.XXXXXX")"
VALIDATOR_Q="$(printf '%q' "$VALIDATOR_PATH")"
{
  printf '%s\n' '#!/bin/bash' 'set -euo pipefail' 'echo "===== PRE-COMMIT GATE ====="'
  printf 'if [ -n "${STAFFORDOS_PATCH_AUTH_FILE:-}" ] && [ -f "${STAFFORDOS_PATCH_AUTH_FILE}" ]; then\n  [ "$(shasum -a 256 %s | awk '\''{print $1}'\'')" = %s ] || { echo "BLOCKED: reviewed hook validator changed" >&2; exit 1; }\n  node %s\n' "$VALIDATOR_Q" "$VALIDATOR_DIGEST" "$VALIDATOR_Q"
  printf '%s\n' '  echo "validated application-patch authorization consumed"' 'elif [ "${STAFFORDOS_GATED:-}" = "true" ]; then' '  echo "legacy governed operational gate"' 'else' '  echo "BLOCKED: no governed authorization"' '  exit 1' 'fi'
} > "$TMP"
chmod 755 "$TMP"
mv -f "$TMP" "$HOOK"
echo "gated hook installed"
if [ -n "$BACKUP" ]; then
  echo "rollback: mv -- $(printf '%q' "$BACKUP") $(printf '%q' "$HOOK")"
else
  echo "rollback: rm -- $(printf '%q' "$HOOK")"
fi
