#!/usr/bin/env bash
set -euo pipefail

# --- Colors ---
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

# --- Helpers ---
log()      { echo -e "${CYAN}ℹ${RESET} $1"; }
success()  { echo -e "${GREEN}✅${RESET} $1"; }
warn()     { echo -e "${YELLOW}⚠${RESET} $1"; }
error()    { echo -e "${RED}❌${RESET} $1"; }

# --- Kill processes on port 3000 ---
log "Checking for processes on :3000..."
pids=$(lsof -ti :3000 || true)

if [ -n "${pids}" ]; then
  warn "Process detected on :3000 -> ${pids}"
  if kill -9 ${pids} 2>/dev/null; then
    success "Killed process(es) on :3000"
  else
    error "Failed to kill process(es) on :3000"
  fi
else
  success "No process listening on :3000"
fi

