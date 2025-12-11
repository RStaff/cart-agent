#!/usr/bin/env bash
set -e

echo "[logo-find] Searching Downloads + projects for Abando PNG logos…"
echo

find "$HOME/Downloads" "$HOME/projects" \
  -type f -iname "abando*logo*png*" 2>/dev/null | while read -r f; do
  dims=$(sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | \
         awk '/pixelWidth|pixelHeight/ {print $2}' | paste -sd'x' -)
  echo "$dims  $f"
done | sort -n
