#!/bin/bash
set -euo pipefail

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[fix] Backing up $TARGET -> $BACKUP"
cp "$TARGET" "$BACKUP"

# macOS BSD sed: use -i '' for in-place
sed -i '' \
  -e 's/import DemoLayout from "@\/components\/demo\/DemoLayout";/import { DemoLayout } from "@\/components\/demo\/DemoLayout";/' \
  -e 's/import PatternCards from "@\/components\/demo\/PatternCards";/import { PatternCards } from "@\/components\/demo\/PatternCards";/' \
  -e 's/import WeeklySnapshot from "@\/components\/demo\/WeeklySnapshot";/import { WeeklySnapshot } from "@\/components\/demo\/WeeklySnapshot";/' \
  -e 's/import RawSignal from "@\/components\/demo\/RawSignal";/import { RawSignal } from "@\/components\/demo\/RawSignal";/' \
  -e 's/import Interpretation from "@\/components\/demo\/Interpretation";/import { Interpretation } from "@\/components\/demo\/Interpretation";/' \
  "$TARGET"

echo "[fix] Updated imports in $TARGET"
