#!/usr/bin/env bash
set -euo pipefail

SCHEMA="web/prisma/schema.prisma"

if [ ! -f "$SCHEMA" ]; then
  echo "❌ Schema file not found at $SCHEMA"
  exit 1
fi

BACKUP="web/prisma/schema.prisma.bak_$(date +%s)"
cp "$SCHEMA" "$BACKUP"
echo "📦 Backup created at: $BACKUP"

python3 - << 'PY'
import re
from pathlib import Path

path = Path("web/prisma/schema.prisma")
text = path.read_text()

pattern = re.compile(r"model\s+DailyAggregate\s*{[^}]*}", re.DOTALL)
matches = list(pattern.finditer(text))

if len(matches) < 2:
    print("⚠️ Expected at least 2 DailyAggregate models, found", len(matches))
else:
    # Remove the FIRST one, keep the last (newest)
    first = matches[0]
    new_text = text[:first.start()] + text[first.end():]
    path.write_text(new_text)
    print("✅ Removed first DailyAggregate model; newest definition kept.")
PY
