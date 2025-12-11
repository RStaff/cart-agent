#!/bin/bash
set -euo pipefail

TARGET="app/demo/playground/page.tsx"
BACKUP="${TARGET}.bak-$(date +%Y%m%d-%H%M%S)"

echo "[abando] Backing up ${TARGET} -> ${BACKUP}"
cp "$TARGET" "$BACKUP"

# 1) Lead-in sentence
sed -i '' \
"s@Instead of showing you raw logs, Abando turns them into simple, human-readable insights like:@Abando doesn’t dump raw logs on your team. It rolls those events up into a few clear insights you can read in seconds, like:@g" \
"$TARGET"

# 2) Bullet lines – sharpen language
sed -i '' \
"s@• 38% of abandons checked returns policy first.@• 38% of abandons happened right after shoppers checked the returns policy.@g" \
"$TARGET"

sed -i '' \
"s@• 24% abandoned after comparing 3+ dress styles.@• 24% abandoned after comparing 3+ outfits side by side.@g" \
"$TARGET"

sed -i '' \
"s@• 18% abandoned while building full outfits.@• 18% abandoned while building full outfits and never quite hitting “Buy.”@g" \
"$TARGET"

# 3) Closing line – make the payoff explicit
sed -i '' \
"s@prompts) so you&apos;re not guessing which message to send.@prompts), so your team isn’t guessing which message to send first.@g" \
"$TARGET"

echo "[abando] Copy clarity pass applied to HOW ABANDO INTERPRETS IT."
echo "[abando] Original saved as ${BACKUP}"
