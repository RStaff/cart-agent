#!/usr/bin/env bash
set -euo pipefail

FILE="shopify.app.toml"
test -f "$FILE" || { echo "❌ $FILE not found in $(pwd)"; exit 1; }

echo "🧾 Scanning $FILE for [[web]] / [[webs]] blocks and roles..."

awk '
BEGIN { web=0; inweb=0; backend=0 }
{
  line=$0
  if (line ~ /^\[\[web/ ) {
    web++
    inweb=1
    hasBackend=0
    print "----"
    print "WEB BLOCK #" web "  (" NR "): " line
    next
  }
  if (inweb==1) {
    if (line ~ /^\[\[/ && line !~ /^\[\[web/ ) {
      # next block begins; close current web block
      if (hasBackend==1) backend++
      inweb=0
    }
  }
  if (inweb==1) {
    if (line ~ /^roles[[:space:]]*=/) {
      print "  (" NR ") " line
      if (tolower(line) ~ /backend/) hasBackend=1
    }
    if (line ~ /^command[[:space:]]*=/) print "  (" NR ") " line
    if (line ~ /^directory[[:space:]]*=/) print "  (" NR ") " line
    if (line ~ /^port[[:space:]]*=/) print "  (" NR ") " line
  }
}
END {
  # If file ended while in a web block, count it
  if (inweb==1 && hasBackend==1) backend++
  print "----"
  print "✅ Total web blocks seen:", web
  print "✅ Web blocks with backend role:", backend
  if (backend > 1) {
    print "❌ INVALID: More than one web block has backend role."
  } else if (backend == 1) {
    print "✅ OK: Exactly one backend web block."
  } else {
    print "⚠️ None of the web blocks declare backend role explicitly."
  }
}' "$FILE"
