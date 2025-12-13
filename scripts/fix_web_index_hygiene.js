import fs from "node:fs";

const file = "web/src/index.js";
const orig = fs.readFileSync(file, "utf8");
const backup = `${file}.bak_hygiene_${Date.now()}`;
fs.writeFileSync(backup, orig);

// 1) Remove junk token lines like: 484; or ;484; or repeated blocks
let s = orig
  .split("\n")
  .filter(line => {
    const t = line.trim();
    // kill lines that are just junk tokens
    if (t === "484;" || t === ";484;" || t === "484" || t === ";") return false;
    // also kill lines that are ONLY repeated junk patterns
    if (/^;?\s*484;\s*$/.test(t)) return false;
    return true;
  })
  .join("\n");

// 2) Deduplicate app.use("/billing", ...) mounts: keep the first, remove the rest
const lines = s.split("\n");
let seenBillingUse = false;

const out = [];
for (const line of lines) {
  const trimmed = line.trim();

  const isBillingUse =
    trimmed.startsWith('app.use("/billing"') ||
    trimmed.startsWith("app.use('/billing'");

  if (isBillingUse) {
    if (!seenBillingUse) {
      seenBillingUse = true;
      out.push(line);
    } else {
      // drop duplicates
    }
    continue;
  }

  out.push(line);
}
s = out.join("\n");

// 3) (Optional but recommended) Ensure middleware order is sane:
// cookieParser -> cors -> json, each at most once.
// We'll remove duplicates but keep first occurrences.
function dedupeCall(callRegex) {
  const lns = s.split("\n");
  let seen = false;
  const out2 = [];
  for (const ln of lns) {
    if (callRegex.test(ln)) {
      if (seen) continue;
      seen = true;
    }
    out2.push(ln);
  }
  s = out2.join("\n");
}
dedupeCall(/\bcookieParser\(\)/);
dedupeCall(/\bcors\(\)/);
dedupeCall(/express\.json\(\)/);

// write back
fs.writeFileSync(file, s);

console.log("✅ Fixed web/src/index.js hygiene");
console.log("   Backup:", backup);

// Quick assertions:
const fixed = fs.readFileSync(file, "utf8");
const billingUses = (fixed.match(/app\.use\("\/billing"/g) || []).length;
const has484 = fixed.includes("\n484;") || fixed.includes(";484;");
if (has484) {
  console.error("❌ Still found junk token '484;'. Inspect manually:", file);
  process.exit(1);
}
if (billingUses !== 1) {
  console.error(`❌ Expected exactly 1 app.use("/billing"...), found: ${billingUses}`);
  process.exit(1);
}
console.log("✅ Assertions passed (no 484; and /billing mounted once)");
