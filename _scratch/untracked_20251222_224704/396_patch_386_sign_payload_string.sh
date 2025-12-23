#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/386_send_signed_webhook_clean.sh"
test -f "$FILE" || { echo "❌ $FILE not found"; exit 1; }

cp "$FILE" "$FILE.bak_$(date +%s)"

perl -0777 -i -pe '
  my $s = $_;

  # Insert json_escape helper if missing
  if ($s !~ /json_escape\(\)/s) {
    $s =~ s/(sanitize\(\)\s*\{[\s\S]*?\n\}\n)/$1\njson_escape() {\n  python3 - <<'"'"'PY'"'"'\nimport json,sys\nprint(json.dumps(sys.stdin.read())[1:-1])\nPY\n}\n\n/s;
  }

  # Replace sign payload construction with ALWAYS-a-string version.
  # Remove any existing sign_resp curl block and reinsert canonical block.
  $s =~ s/sign_resp="\$\(\s*curl[\s\S]*?\)\s*"\n\nHMAC_B64=/sign_resp="$(curl -sS "$TUNNEL\/__abando\/sign" \\\n  -H "Content-Type: application\/json" \\\n  -H "X-Abando-Dev-Token: $TOKEN" \\\n  -d "{\\"payload\\":\\"$(printf \\"%s\\" \\"$PAYLOAD\\" | json_escape)\\"}" \\\n  || true\n)"\n\nHMAC_B64=/s;

  $_ = $s;
' "$FILE"

chmod +x "$FILE"
echo "✅ Patched 386: /__abando/sign now receives payload as a JSON string matching POST body bytes."
echo "   Backup: $FILE.bak_*"
