import fs from "fs";

const file = new URL("./app/demo/playground/page.tsx", import.meta.url);

// 1) Read file
let text = fs.readFileSync(file, "utf8");

// 2) Backup once per run
const backupPath = new URL(
  "./app/demo/playground/page.tsx.before_simplify_v2_" +
    Date.now() +
    ".tsx",
  import.meta.url
);
fs.writeFileSync(backupPath, text, "utf8");
console.log("💾 Backup written to:", backupPath.pathname);

// --- Remove the big 'Weekly recovered impact' explainer block ---

// We’ll search case-insensitively by normalizing to lower-case.
const lower = text.toLowerCase();

const weeklyHeading = "weekly recovered impact";
const weeklyNextSection = "7-day recovered orders snapshot";

const weeklyStart = lower.indexOf(weeklyHeading);
if (weeklyStart !== -1) {
  const weeklyEnd = lower.indexOf(weeklyNextSection, weeklyStart);
  if (weeklyEnd !== -1) {
    console.log("🔧 Removing 'Weekly recovered impact' explainer block…");
    text = text.slice(0, weeklyStart) + text.slice(weeklyEnd);
  } else {
    console.log(
      "⚠️ Found 'Weekly recovered impact' heading but not the '7-day recovered orders snapshot' marker; leaving explainer block unchanged."
    );
  }
} else {
  console.log("ℹ️ No 'Weekly recovered impact' heading found (maybe already removed).");
}

// Recompute lower-case view after possible edits
let lower2 = text.toLowerCase();

// --- Remove the 'This week at a glance' card ---

const glanceHeading = "this week at a glance";
const afterGlanceMarker = "across the full week, this demo recovers";

const glanceStart = lower2.indexOf(glanceHeading);
if (glanceStart !== -1) {
  const glanceEnd = lower2.indexOf(afterGlanceMarker, glanceStart);
  if (glanceEnd !== -1) {
    console.log("🔧 Removing 'This week at a glance' card…");
    text = text.slice(0, glanceStart) + text.slice(glanceEnd);
  } else {
    console.log(
      "⚠️ Found 'This week at a glance' heading but not the roll-up paragraph; leaving card unchanged."
    );
  }
} else {
  console.log("ℹ️ No 'This week at a glance' heading found (maybe already removed).");
}

// 3) Write back
fs.writeFileSync(file, text, "utf8");
console.log("✅ Simplified weekly section: single Weekly Impact card + pills + highlight only (assuming markers were found).");
