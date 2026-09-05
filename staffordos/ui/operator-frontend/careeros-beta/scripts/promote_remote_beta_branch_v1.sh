#!/bin/bash
set -euo pipefail

fail() {
  echo "PROMOTION BLOCKED: $1" >&2
  exit 1
}

usage() {
  fail "usage: promote_remote_beta_branch_v1.sh <source-sha> <destination-branch> <expected-remote-sha>"
}

SOURCE_SHA="${1:-}"
DESTINATION_BRANCH="${2:-}"
EXPECTED_REMOTE_SHA="${3:-}"
[ -n "$SOURCE_SHA" ] && [ -n "$DESTINATION_BRANCH" ] && [ -n "$EXPECTED_REMOTE_SHA" ] || usage

is_sha() {
  [[ "$1" =~ ^[0-9a-fA-F]{40}$ ]]
}

is_sha "$SOURCE_SHA" || fail "source SHA is malformed"
is_sha "$EXPECTED_REMOTE_SHA" || fail "expected remote SHA is malformed"
[ "$SOURCE_SHA" != "$EXPECTED_REMOTE_SHA" ] || fail "source SHA must differ from expected remote SHA"
[ "$DESTINATION_BRANCH" = "careeros/private-beta" ] || fail "destination branch is not the governed beta branch"

if [ -n "$(git diff --cached --name-only)" ]; then
  fail "staging area must be empty"
fi
if ! git diff --quiet; then
  fail "tracked worktree must be clean"
fi
if [ -n "$(git ls-files --others --exclude-standard)" ]; then
  fail "worktree must not contain untracked files"
fi

git cat-file -e "${SOURCE_SHA}^{commit}" || fail "source commit was not found"
git cat-file -e "${EXPECTED_REMOTE_SHA}^{commit}" || fail "expected remote commit was not found"
git merge-base --is-ancestor "$EXPECTED_REMOTE_SHA" "$SOURCE_SHA" || fail "source is not a descendant of expected remote"

RANGE="${EXPECTED_REMOTE_SHA}..${SOURCE_SHA}"
COMMIT_COUNT="$(git rev-list --count "$RANGE")" || fail "promotion range could not be enumerated"
[ "$COMMIT_COUNT" -gt 0 ] || fail "promotion range must be non-empty"
if ! git rev-list --parents "$RANGE" | awk 'NF != 2 { exit 1 }'; then
  fail "promotion range contains a merge commit"
fi

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/careeros-promotion-XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

validate_path() {
  local path="$1"
  case "$path" in
    *.prisma|*/prisma/migrations/*|*/migrations/*|*.sql|*.env|*.env.*|*.pem|*.key|*.crt|*.cer|*.p12|*.pfx|*.dump|*.tar|*.log|.next/*|*/.next/*|node_modules/*|*/node_modules/*|staffordos/execution/output/*|staffordos/operator_daemon/output/*|staffordos/shopifixer/*|staffordos/abando/*|web/*|.github/*)
      fail "forbidden path in promotion scope"
      ;;
  esac
  case "$path" in
    staffordos/ui/operator-frontend/careeros-beta/*|staffordos/ui/operator-frontend/app/api/operator/*|staffordos/ui/operator-frontend/app/operator/*|staffordos/ui/operator-frontend/app/os/*|staffordos/ui/operator-frontend/lib/operator/*|staffordos/ui/operator-frontend/components/operator/*|staffordos/ui/operator-frontend/app/globals.css|staffordos/operator-issuer/*|staffordos/reconciliation/*|staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md|staffordos/governance/STAFFORDOS_CANONICAL_UI_AUTHORITY_CONTRACT_V1.md|staffordos/governance/STAFFORDOS_CANONICAL_UI_CAPABILITY_MAP_V1.md|staffordos/governance/STAFFORDOS_V1_CAREEROS_PROMOTION_DIFFERENTIAL_BASELINE_AUTHORITY_V1.json|staffordos/ui/operator-frontend/CAREEROS_V1_PRIVATE_BETA_DEFINITION_OF_DONE.md)
      ;;
    *)
      fail "unexpected path in promotion scope"
      ;;
  esac
}

validate_paths() {
  local file="$1"
  local require_careeros_scope="$2"
  local path
  local approved_scope=0
  while IFS= read -r -d '' path; do
    validate_path "$path"
    case "$path" in
      staffordos/ui/operator-frontend/careeros-beta/*|staffordos/ui/operator-frontend/app/api/operator/*|staffordos/ui/operator-frontend/app/operator/*|staffordos/ui/operator-frontend/app/os/*|staffordos/ui/operator-frontend/lib/operator/*|staffordos/operator-issuer/*|staffordos/reconciliation/*)
        approved_scope=1
        ;;
    esac
  done < "$file"
  [ "$require_careeros_scope" = "0" ] || [ "$approved_scope" -eq 1 ] || fail "CareerOS/StaffordOS operating scope is absent"
}

if ! git diff --name-only -z "$RANGE" > "$TMP_DIR/cumulative-paths"; then
  fail "cumulative changed files could not be enumerated"
fi
validate_paths "$TMP_DIR/cumulative-paths" 1

TIP_PARENT="$(git rev-parse "${SOURCE_SHA}^")" || fail "source parent could not be resolved"
if ! git diff --name-only -z "$TIP_PARENT" "$SOURCE_SHA" > "$TMP_DIR/tip-paths"; then
  fail "tip changed files could not be enumerated"
fi
validate_paths "$TMP_DIR/tip-paths" 0

ORIGIN_MAIN_BEFORE="$(git ls-remote origin refs/heads/main 2>/dev/null)" || fail "origin/main could not be queried"
REMOTE_BETA_BEFORE="$(git ls-remote origin "refs/heads/${DESTINATION_BRANCH}" 2>/dev/null)" || fail "destination branch could not be queried"
ORIGIN_MAIN_BEFORE_SHA="$(printf '%s\n' "$ORIGIN_MAIN_BEFORE" | awk 'NF == 2 { print $1 }')"
REMOTE_BETA_BEFORE_SHA="$(printf '%s\n' "$REMOTE_BETA_BEFORE" | awk 'NF == 2 { print $1 }')"
is_sha "$ORIGIN_MAIN_BEFORE_SHA" || fail "origin/main response was malformed"
is_sha "$REMOTE_BETA_BEFORE_SHA" || fail "destination response was malformed"
[ "$REMOTE_BETA_BEFORE_SHA" = "$EXPECTED_REMOTE_SHA" ] || fail "destination changed from expected remote SHA"
git merge-base --is-ancestor "$REMOTE_BETA_BEFORE_SHA" "$SOURCE_SHA" || fail "destination is not a fast-forward ancestor"

SOURCE_TREE="$(git rev-parse "${SOURCE_SHA}^{tree}")" || fail "source tree could not be resolved"
git push origin "${SOURCE_SHA}:refs/heads/${DESTINATION_BRANCH}"

REMOTE_BETA_AFTER="$(git ls-remote origin "refs/heads/${DESTINATION_BRANCH}" 2>/dev/null)" || fail "post-push destination query failed"
ORIGIN_MAIN_AFTER="$(git ls-remote origin refs/heads/main 2>/dev/null)" || fail "post-push origin/main query failed"
REMOTE_BETA_AFTER_SHA="$(printf '%s\n' "$REMOTE_BETA_AFTER" | awk 'NF == 2 { print $1 }')"
ORIGIN_MAIN_AFTER_SHA="$(printf '%s\n' "$ORIGIN_MAIN_AFTER" | awk 'NF == 2 { print $1 }')"
[ "$REMOTE_BETA_AFTER_SHA" = "$SOURCE_SHA" ] || fail "remote beta SHA verification failed"
[ "$ORIGIN_MAIN_AFTER_SHA" = "$ORIGIN_MAIN_BEFORE_SHA" ] || fail "origin/main changed"

printf 'REMOTE_BETA_SHA=%s\nSOURCE_TREE=%s\nORIGIN_MAIN_SHA=%s\nDESTINATION=%s\n' \
  "$REMOTE_BETA_AFTER_SHA" "$SOURCE_TREE" "$ORIGIN_MAIN_AFTER_SHA" "$DESTINATION_BRANCH"
