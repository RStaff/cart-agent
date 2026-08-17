#!/bin/bash
set -euo pipefail

SOURCE_SHA="${1:?usage: promote_remote_beta_branch_v1.sh <source-sha> [destination-branch]}"
DESTINATION_BRANCH="${2:-careeros/private-beta}"

case "$DESTINATION_BRANCH" in
  main|origin/main|refs/heads/main|refs/remotes/origin/main)
    echo "PROMOTION BLOCKED: origin/main is never a beta destination" >&2
    exit 1
    ;;
esac

if [ -n "$(git diff --cached --name-only)" ]; then
  echo "PROMOTION BLOCKED: staging area must be empty" >&2
  exit 1
fi

git cat-file -e "${SOURCE_SHA}^{commit}"
git show --format= --name-only "$SOURCE_SHA" | grep -q '^staffordos/ui/operator-frontend/careeros-beta/'

ORIGIN_MAIN_BEFORE="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
REMOTE_BETA_BEFORE="$(git ls-remote origin "refs/heads/${DESTINATION_BRANCH}" | awk '{print $1}')"
if [ -n "$REMOTE_BETA_BEFORE" ] && [ "$REMOTE_BETA_BEFORE" != "$SOURCE_SHA" ]; then
  echo "PROMOTION BLOCKED: destination branch already points elsewhere" >&2
  exit 1
fi

git push origin "${SOURCE_SHA}:refs/heads/${DESTINATION_BRANCH}"

REMOTE_BETA_AFTER="$(git ls-remote origin "refs/heads/${DESTINATION_BRANCH}" | awk '{print $1}')"
ORIGIN_MAIN_AFTER="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
if [ "$REMOTE_BETA_AFTER" != "$SOURCE_SHA" ]; then
  echo "PROMOTION BLOCKED: remote beta SHA verification failed" >&2
  exit 1
fi
if [ "$ORIGIN_MAIN_AFTER" != "$ORIGIN_MAIN_BEFORE" ]; then
  echo "PROMOTION BLOCKED: origin/main changed" >&2
  exit 1
fi

printf 'REMOTE_BETA_SHA=%s\nORIGIN_MAIN_SHA=%s\nDESTINATION=%s\n' \
  "$REMOTE_BETA_AFTER" "$ORIGIN_MAIN_AFTER" "$DESTINATION_BRANCH"
