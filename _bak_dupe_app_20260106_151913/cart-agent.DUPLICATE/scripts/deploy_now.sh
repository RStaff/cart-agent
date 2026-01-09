#!/usr/bin/env bash
set -euo pipefail
python3 scripts/fix_auth_redirects.py
python3 scripts/verify_auth.py
/opt/homebrew/bin/shopify app deploy
