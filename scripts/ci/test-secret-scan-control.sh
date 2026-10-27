#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
preflight="$repo_root/scripts/ci/verify-secret-scan-history.sh"
fixture_commit="3f6c11721b42111db6b66609e2101f1d05737789"

command -v gitleaks >/dev/null 2>&1 || {
  echo "gitleaks is required for this regression" >&2
  exit 1
}

tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

git init -q "$tmp_root/source"
git -C "$tmp_root/source" config user.name "Secret Scan Regression"
git -C "$tmp_root/source" config user.email "secret-scan-regression@example.invalid"
printf '%s\n' "baseline" > "$tmp_root/source/probe.txt"
git -C "$tmp_root/source" add probe.txt
git -C "$tmp_root/source" commit -qm "baseline"
base_sha="$(git -C "$tmp_root/source" rev-parse HEAD)"
printf 'api_key = "%s%s"\n' 'a9F3kL7mN2pQ8rT4' 'vW6xY1zB5cD0eG9h' > "$tmp_root/source/probe.txt"
git -C "$tmp_root/source" add probe.txt
git -C "$tmp_root/source" commit -qm "synthetic secret probe"
head_sha="$(git -C "$tmp_root/source" rev-parse HEAD)"

(
  cd "$tmp_root/source"
  SECRET_SCAN_EVENT_NAME=pull_request \
  SECRET_SCAN_BASE_SHA="$base_sha" \
  SECRET_SCAN_HEAD_SHA="$head_sha" \
    bash "$preflight" >/dev/null
)

if gitleaks git --redact --log-opts="${base_sha}..${head_sha}" "$tmp_root/source" >/dev/null 2>&1; then
  echo "synthetic secret probe was not detected" >&2
  exit 1
fi

git clone -q --depth 1 "file://$tmp_root/source" "$tmp_root/shallow"
if (
  cd "$tmp_root/shallow"
  SECRET_SCAN_EVENT_NAME=pull_request \
  SECRET_SCAN_BASE_SHA="$base_sha" \
  SECRET_SCAN_HEAD_SHA="$head_sha" \
    bash "$preflight" >/dev/null 2>&1
); then
  echo "shallow history probe was not rejected" >&2
  exit 1
fi

if ! gitleaks git --redact \
  --gitleaks-ignore-path "$repo_root/.gitleaksignore" \
  --log-opts="${fixture_commit}^..${fixture_commit}" \
  "$repo_root" >/dev/null 2>&1; then
  echo "documented synthetic fixture fingerprints were not handled" >&2
  exit 1
fi

echo "secret-scan control regressions passed"
