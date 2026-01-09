#!/usr/bin/env bash
set -euo pipefail

# Read secrets from env, fail loudly if missing
: "${OPENAI_API_KEY:?Set OPENAI_API_KEY in your environment (not in git)}"

# Example usage:
# export OPENAI_API_KEY=sk-... && bash scripts/setup_and_test.sh

echo "Setup OK. OPENAI_API_KEY is set (not printed)."
# …rest of your setup/test logic here…
