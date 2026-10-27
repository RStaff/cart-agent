#!/usr/bin/env bash

set -euo pipefail

event_name="${SECRET_SCAN_EVENT_NAME:?SECRET_SCAN_EVENT_NAME is required}"
head_sha="${SECRET_SCAN_HEAD_SHA:?SECRET_SCAN_HEAD_SHA is required}"
base_sha="${SECRET_SCAN_BASE_SHA:-}"
zero_sha="0000000000000000000000000000000000000000"

fail() {
  echo "secret-scan history preflight failed: $*" >&2
  exit 1
}

require_commit() {
  local sha="$1"
  local label="$2"

  [[ "$sha" =~ ^[0-9a-fA-F]{40}$ ]] || fail "$label is not a full commit SHA"
  git cat-file -e "${sha}^{commit}" 2>/dev/null || fail "$label commit is unavailable; refusing a partial scan"
}

[[ "$(git rev-parse --is-shallow-repository)" == "false" ]] ||
  fail "checkout is shallow; fetch complete history before scanning"

require_commit "$head_sha" "head"

case "$event_name" in
  pull_request|pull_request_target)
    [[ -n "$base_sha" && "$base_sha" != "$zero_sha" ]] || fail "pull request base SHA is missing"
    require_commit "$base_sha" "pull request base"
    git merge-base "$base_sha" "$head_sha" >/dev/null 2>&1 ||
      fail "pull request base and head have no available merge base"
    ;;
  push)
    if [[ -n "$base_sha" && "$base_sha" != "$zero_sha" ]]; then
      require_commit "$base_sha" "push before"
    elif git rev-parse --verify "${head_sha}^" >/dev/null 2>&1; then
      require_commit "$(git rev-parse "${head_sha}^")" "head parent"
    else
      [[ "$(git rev-list --count "$head_sha")" == "1" ]] ||
        fail "new-branch push lacks the head parent required for a complete scan"
    fi
    ;;
  *)
    fail "unsupported event '$event_name'"
    ;;
esac

echo "secret-scan history preflight passed for $event_name"
