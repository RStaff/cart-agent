#!/usr/bin/env bash
set -euo pipefail

OUT="staffordos/operating_loop/output/cron_status_latest.txt"

{
  echo "=== CRON STATUS V1 ==="
  date

  echo ""
  echo "=== INSTALLED CRON ==="
  crontab -l 2>/dev/null || true

  echo ""
  echo "=== DISCOVERY SYNC LOG ==="
  tail -40 /tmp/discovery_sync.log 2>/dev/null || true

  echo ""
  echo "=== SEND QUEUE SAFE LOG ==="
  tail -40 /tmp/send_queue_safe.log 2>/dev/null || true

  echo ""
  echo "=== RUNTIME ==="
  curl -s -i http://localhost:8081/health | head -20 || true

} | tee "$OUT"

echo "Wrote: $OUT"
