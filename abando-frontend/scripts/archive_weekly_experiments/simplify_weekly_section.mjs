#!/usr/bin/env node
import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "app/demo/playground/page.tsx");

if (!fs.existsSync(file)) {
  console.error("❌ Could not find app/demo/playground/page.tsx. Are you in abando-frontend?");
  process.exit(1);
}

// 1) Backup
const backup = file + ".before_simplify_weekly_" + Date.now() + ".tsx";
fs.copyFileSync(file, backup);
console.log("💾 Backup written to:", backup);

// 2) Load file
let text = fs.readFileSync(file, "utf8");

// --- Remove 'WEEKLY RECOVERED IMPACT' block (top banner) ---
const weeklyRecoveredStart = text.indexOf("WEEKLY RECOVERED IMPACT");
const weeklyRecoveredEndMarker = "3 · WHAT THIS MEANS OVER A WEEK";

if (weeklyRecoveredStart !== -1) {
  const weeklyRecoveredEnd = text.indexOf(weeklyRecoveredEndMarker, weeklyRecoveredStart);
  if (weeklyRecoveredEnd !== -1) {
    console.log("🔧 Removing 'WEEKLY RECOVERED IMPACT' explainer block…");
    text = text.slice(0, weeklyRecoveredStart) + text.slice(weeklyRecoveredEnd);
  } else {
    console.log("⚠️ Found 'WEEKLY RECOVERED IMPACT' but not the following section marker; leaving it unchanged.");
  }
} else {
  console.log("ℹ️ No 'WEEKLY RECOVERED IMPACT' block found (maybe already removed).");
}

// --- Remove 'THIS WEEK AT A GLANCE' card ---
const glanceStart = text.indexOf("THIS WEEK AT A GLANCE");
const afterGlanceMarker = "Across the full week, this demo recovers just over";

if (glanceStart !== -1) {
  const glanceEnd = text.indexOf(afterGlanceMarker, glanceStart);
  if (glanceEnd !== -1) {
    console.log("🔧 Removing 'THIS WEEK AT A GLANCE' card…");
    text = text.slice(0, glanceStart) + text.slice(glanceEnd);
  } else {
    console.log("⚠️ Found 'THIS WEEK AT A GLANCE' but not the roll-up paragraph; leaving it unchanged.");
  }
} else {
  console.log("ℹ️ No 'THIS WEEK AT A GLANCE' card found (maybe already removed).");
}

// 3) Write back
fs.writeFileSync(file, text, "utf8");
console.log("✅ Simplified weekly section: kept one Weekly Impact card + pills + highlight.");
