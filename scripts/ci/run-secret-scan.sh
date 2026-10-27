#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
event_name="${SECRET_SCAN_EVENT_NAME:?SECRET_SCAN_EVENT_NAME is required}"
head_sha="${SECRET_SCAN_HEAD_SHA:?SECRET_SCAN_HEAD_SHA is required}"
base_sha="${SECRET_SCAN_BASE_SHA:-}"
zero_sha="0000000000000000000000000000000000000000"

command -v gitleaks >/dev/null 2>&1 || {
  echo "secret scan failed: gitleaks is unavailable" >&2
  exit 1
}

bash "$script_dir/verify-secret-scan-history.sh"

case "$event_name" in
  pull_request|pull_request_target)
    range_base="$(git merge-base "$base_sha" "$head_sha")"
    ;;
  push)
    if [[ -n "$base_sha" && "$base_sha" != "$zero_sha" ]]; then
      range_base="$base_sha"
    else
      default_ref="${SECRET_SCAN_DEFAULT_BRANCH_REF:?SECRET_SCAN_DEFAULT_BRANCH_REF is required for a new branch}"
      git rev-parse --verify "${default_ref}^{commit}" >/dev/null 2>&1 || {
        echo "secret scan failed: default branch history is unavailable" >&2
        exit 1
      }
      range_base="$(git merge-base "$default_ref" "$head_sha")"
    fi
    ;;
  *)
    echo "secret scan failed: unsupported event '$event_name'" >&2
    exit 1
    ;;
esac

range="${range_base}..${head_sha}"
commit_count="$(git rev-list --count "$range")"
[[ "$commit_count" -gt 0 ]] || {
  echo "secret scan failed: verified range contains no commits" >&2
  exit 1
}

echo "secret scan range verified: ${commit_count} commit(s)"
gitleaks git --redact --log-opts="$range" .
