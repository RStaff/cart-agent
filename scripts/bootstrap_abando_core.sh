#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "🔧 Bootstrapping Abando core (DB models + folders)"
echo "Repo: $REPO_ROOT"
echo

# 1) Target the real Prisma schema for the web app
SCHEMA_FILE="$REPO_ROOT/web/prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "❌ Expected schema at: $SCHEMA_FILE"
  echo "   It does not exist. Aborting without changes."
  exit 1
fi

echo "✅ Using Prisma schema:"
echo "   $SCHEMA_FILE"
echo

# 2) Append Abando models to the schema (guarded by a marker)
MARKER="// --- ABANDO CORE MODELS ---"

if grep -q "$MARKER" "$SCHEMA_FILE"; then
  echo "ℹ️ Abando models already appended (marker found). Skipping append."
else
  echo "✍️ Appending Abando models to schema.prisma ..."
  cat << 'PRISMA' >> "$SCHEMA_FILE"

$MARKER

// DailyAggregates + related fields for Abando v1
model DailyAggregate {
  id                     Int      @id @default(autoincrement())
  storeId                Int
  date                   DateTime

  cartsCreated           Int      @default(0)
  cartsAbandoned         Int      @default(0)
  cartsRecovered         Int      @default(0)

  recoveryAttemptsSent   Int      @default(0)
  recoveryClicks         Int      @default(0)
  recoveriesCount        Int      @default(0)

  potentialRevenue       Decimal  @default(0)
  revenueRecovered       Decimal  @default(0)

  abandonmentRate        Decimal?
  recoveryRate           Decimal?
  clickThroughRate       Decimal?
  conversionRate         Decimal?

  avgCartValue           Decimal?
  avgTimeToRecoveryHours Decimal?

  createdAt              DateTime @default(now())

  @@unique([storeId, date])
  @@index([storeId, date])
}

PRISMA

  echo "✅ Prisma models appended."
fi

echo
echo "Next steps (SAFE — nothing else done yet):"
echo "  1) Run: git diff web/prisma/schema.prisma    # review the change"
echo "  2) WHEN you're ready, run migration in your dev env only, e.g.:"
echo "       cd web"
echo "       npx prisma migrate dev --name abando_core_v1"
echo "  3) Then wire webhooks → DB using these models."
