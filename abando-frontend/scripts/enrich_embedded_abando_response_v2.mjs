import fs from "fs";
import path from "path";

const filePath = path.join("app", "embedded", "page.tsx");

if (!fs.existsSync(filePath)) {
  console.error("❌ Could not find app/embedded/page.tsx. Are you in abando-frontend?");
  process.exit(1);
}

let text = fs.readFileSync(filePath, "utf8");

// We support either "FOLLOW-UPS SENT" or "Follow-ups sent"
const headingRegex = new RegExp(
  String.raw`(<p className="text-$begin:math:display$0\\\.65rem$end:math:display$ font-semibold uppercase tracking-$begin:math:display$0\\\.22em$end:math:display$ text-slate-400">\s*(FOLLOW-UPS SENT|Follow-ups sent)\s*<\/p>)`
);

if (!headingRegex.test(text)) {
  console.error("⚠️ Could not find the FOLLOW-UPS SENT / Follow-ups sent heading block in app/embedded/page.tsx.");
  process.exit(1);
}

const replacement =
  `$1
              <p className="mt-2 text-sm text-slate-300">
                Abando response &amp; why
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Abando's AI recognizes this hesitation pattern and chooses the lightest push that can recover the order—so you win the sale without over-discounting or shouting at everyone.
              </p>`;

const updated = text.replace(headingRegex, replacement);

if (updated === text) {
  console.error("⚠️ Pattern matched but no replacement happened. Aborting to be safe.");
  process.exit(1);
}

// Backup then write
const backupPath = filePath + ".before_abando_response_v2_" + Date.now() + ".tsx";
fs.writeFileSync(backupPath, text, "utf8");
fs.writeFileSync(filePath, updated, "utf8");

console.log("💾 Backup written to:", backupPath);
console.log("✅ 'Abando response & why' block injected under FOLLOW-UPS SENT heading.");
