#!/usr/bin/env bash
set -euo pipefail

FILE="scripts/375_send_signed_webhook_via_server_signer.sh"
test -f "$FILE" || { echo "❌ Missing $FILE"; exit 1; }
cp "$FILE" "$FILE.bak_$(date +%s)"

perl -0777 -i -pe '
s/HMAC_B64="\$\(\n\s*curl -sS "\$TUNNEL\/__abando\/sign"[\s\S]*?\n\s*\| node -e [\s\S]*?\n\)"/HMAC_RESP="\$(curl -sS -i \"\$TUNNEL\/__abando\/sign\" \\\n    -H \"Content-Type: application\/json\" \\\n    -H \"X-Abando-Dev-Token: \$TOKEN\" \\\n    -d \"\$(node -e \\x27console.log(JSON.stringify({payload: process.argv[1]}))\\x27 \"\$PAYLOAD\")\")\"\n\n# Split headers/body\nHMAC_BODY=\"\$(printf \"%s\" \"\$HMAC_RESP\" | perl -0777 -ne \\x27s\/.*?\\r?\\n\\r?\\n\/\/s; print\\x27)\"\nHMAC_B64=\"\$(printf \"%s\" \"\$HMAC_BODY\" | node -e \\x27let d=\"\";process.stdin.on(\"data\",c=>d+=c).on(\"end\",()=>{try{const j=JSON.parse(d);process.stdout.write(String(j.hmac_b64||\"\"))}catch(e){process.stdout.write(\"\")}})\\x27)\"\n\nif [[ -z \"\$HMAC_B64\" ]]; then\n  echo \"ERR: /__abando/sign did not return JSON {hmac_b64}. Raw response:\" >&2\n  echo \"---\" >&2\n  printf \"%s\\n\" \"\$HMAC_RESP\" | sed -n \\x271,120p\\x27 >&2\n  echo \"---\" >&2\n  exit 5\nfi/sm;
' "$FILE"

echo "✅ Patched $FILE to fail gracefully (prints raw /__abando/sign response)."
