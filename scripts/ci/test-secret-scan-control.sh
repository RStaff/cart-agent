#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
preflight="$repo_root/scripts/ci/verify-secret-scan-history.sh"
scanner="$repo_root/scripts/ci/run-secret-scan.sh"
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

if (
  cd "$tmp_root/source"
  SECRET_SCAN_EVENT_NAME=pull_request \
  SECRET_SCAN_BASE_SHA="$base_sha" \
  SECRET_SCAN_HEAD_SHA="$head_sha" \
    bash "$scanner" >/dev/null 2>&1
); then
  echo "synthetic secret probe was not detected" >&2
  exit 1
fi

git init -q "$tmp_root/long-pr"
git -C "$tmp_root/long-pr" config user.name "Secret Scan Regression"
git -C "$tmp_root/long-pr" config user.email "secret-scan-regression@example.invalid"
printf '%s\n' "baseline" > "$tmp_root/long-pr/probe.txt"
git -C "$tmp_root/long-pr" add probe.txt
git -C "$tmp_root/long-pr" commit -qm "baseline"
long_base="$(git -C "$tmp_root/long-pr" rev-parse HEAD)"
for index in $(seq 1 31); do
  printf '%s\n' "$index" > "$tmp_root/long-pr/probe.txt"
  git -C "$tmp_root/long-pr" commit -qam "harmless commit $index"
done
printf 'api_key = "%s%s"\n' 'r7T2vK9mP4xQ8bN6' 'cD3fG5hJ1sW0yZ2a' > "$tmp_root/long-pr/probe.txt"
git -C "$tmp_root/long-pr" commit -qam "synthetic secret after page one"
long_head="$(git -C "$tmp_root/long-pr" rev-parse HEAD)"
if (
  cd "$tmp_root/long-pr"
  SECRET_SCAN_EVENT_NAME=pull_request \
  SECRET_SCAN_BASE_SHA="$long_base" \
  SECRET_SCAN_HEAD_SHA="$long_head" \
    bash "$scanner" >/dev/null 2>&1
); then
  echo "secret after the first 30 PR commits was not detected" >&2
  exit 1
fi

git init -q "$tmp_root/merge-pr"
git -C "$tmp_root/merge-pr" config user.name "Secret Scan Regression"
git -C "$tmp_root/merge-pr" config user.email "secret-scan-regression@example.invalid"
printf '%s\n' "baseline" > "$tmp_root/merge-pr/probe.txt"
git -C "$tmp_root/merge-pr" add probe.txt
git -C "$tmp_root/merge-pr" commit -qm "baseline"
merge_base="$(git -C "$tmp_root/merge-pr" rev-parse HEAD)"
merge_main_branch="$(git -C "$tmp_root/merge-pr" symbolic-ref --short HEAD)"
git -C "$tmp_root/merge-pr" switch -qc synthetic-side
printf 'api_key = "%s%s"\n' 'm8Q4rT1vW7xY3zA9' 'bC6dE2fG5hJ0kL4n' > "$tmp_root/merge-pr/side.txt"
git -C "$tmp_root/merge-pr" add side.txt
git -C "$tmp_root/merge-pr" commit -qm "synthetic secret on second parent"
git -C "$tmp_root/merge-pr" switch -q "$merge_main_branch"
printf '%s\n' "mainline" > "$tmp_root/merge-pr/probe.txt"
git -C "$tmp_root/merge-pr" commit -qam "mainline change"
git -C "$tmp_root/merge-pr" merge -q --no-ff synthetic-side -m "merge synthetic side"
merge_head="$(git -C "$tmp_root/merge-pr" rev-parse HEAD)"
if (
  cd "$tmp_root/merge-pr"
  SECRET_SCAN_EVENT_NAME=pull_request \
  SECRET_SCAN_BASE_SHA="$merge_base" \
  SECRET_SCAN_HEAD_SHA="$merge_head" \
    bash "$scanner" >/dev/null 2>&1
); then
  echo "secret on a merge second parent was not detected" >&2
  exit 1
fi

git init -q "$tmp_root/merge-resolution"
git -C "$tmp_root/merge-resolution" config user.name "Secret Scan Regression"
git -C "$tmp_root/merge-resolution" config user.email "secret-scan-regression@example.invalid"
printf '%s\n' "baseline" > "$tmp_root/merge-resolution/probe.txt"
git -C "$tmp_root/merge-resolution" add probe.txt
git -C "$tmp_root/merge-resolution" commit -qm "baseline"
resolution_base="$(git -C "$tmp_root/merge-resolution" rev-parse HEAD)"
resolution_main_branch="$(git -C "$tmp_root/merge-resolution" symbolic-ref --short HEAD)"
git -C "$tmp_root/merge-resolution" switch -qc resolution-side
printf '%s\n' "side" > "$tmp_root/merge-resolution/probe.txt"
git -C "$tmp_root/merge-resolution" commit -qam "side change"
git -C "$tmp_root/merge-resolution" switch -q "$resolution_main_branch"
printf '%s\n' "main" > "$tmp_root/merge-resolution/probe.txt"
git -C "$tmp_root/merge-resolution" commit -qam "main change"
if git -C "$tmp_root/merge-resolution" merge -q --no-ff resolution-side -m "conflicting merge" >/dev/null 2>&1; then
  echo "merge-resolution regression did not create the expected conflict" >&2
  exit 1
fi
printf 'api_key = "%s%s"\n' 'q5W8eR2tY9uI3oP7' 'aS4dF6gH1jK0lZ2x' > "$tmp_root/merge-resolution/probe.txt"
git -C "$tmp_root/merge-resolution" add probe.txt
git -C "$tmp_root/merge-resolution" commit -qm "synthetic secret in merge resolution"
resolution_head="$(git -C "$tmp_root/merge-resolution" rev-parse HEAD)"
if (
  cd "$tmp_root/merge-resolution"
  SECRET_SCAN_EVENT_NAME=pull_request \
  SECRET_SCAN_BASE_SHA="$resolution_base" \
  SECRET_SCAN_HEAD_SHA="$resolution_head" \
    bash "$scanner" >/dev/null 2>&1
); then
  echo "secret introduced only by merge resolution was not detected" >&2
  exit 1
fi

empty_branch="$(git -C "$tmp_root/source" symbolic-ref --short HEAD)"
if ! (
  cd "$tmp_root/source"
  SECRET_SCAN_EVENT_NAME=push \
  SECRET_SCAN_BASE_SHA=0000000000000000000000000000000000000000 \
  SECRET_SCAN_HEAD_SHA="$head_sha" \
  SECRET_SCAN_DEFAULT_BRANCH_REF="$empty_branch" \
  SECRET_SCAN_DEFAULT_BRANCH_NAME="$empty_branch" \
  SECRET_SCAN_REF_NAME=empty-feature \
    bash "$scanner" >/dev/null 2>&1
); then
  echo "unchanged new branch was not accepted as an empty scan" >&2
  exit 1
fi

if (
  cd "$tmp_root/source"
  SECRET_SCAN_EVENT_NAME=push \
  SECRET_SCAN_BASE_SHA=0000000000000000000000000000000000000000 \
  SECRET_SCAN_HEAD_SHA="$head_sha" \
  SECRET_SCAN_DEFAULT_BRANCH_REF="$empty_branch" \
  SECRET_SCAN_DEFAULT_BRANCH_NAME="$empty_branch" \
  SECRET_SCAN_REF_NAME="$empty_branch" \
    bash "$scanner" >/dev/null 2>&1
); then
  echo "synthetic secret on an initial default-branch push was not detected" >&2
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
