import fs from "node:fs";
import path from "node:path";

const files = [
  "app/demo/playground/page.tsx",
  "app/embedded/page.tsx",
];

const importLine =
  'import { WeeklyImpactPanel } from "@/components/demo/WeeklyImpactPanel";';

function addImport(text) {
  if (text.includes(importLine)) return text;

  // If there's a "use client" directive, keep it at the very top.
  if (
    text.startsWith('"use client"') ||
    text.startsWith("'use client'")
  ) {
    const firstNewline = text.indexOf("\n");
    if (firstNewline === -1) {
      // Edge case: weird file, just append
      return text + "\n" + importLine + "\n";
    }
    return (
      text.slice(0, firstNewline + 1) +
      importLine +
      "\n" +
      text.slice(firstNewline + 1)
    );
  }

  // Otherwise just prepend the import
  return importLine + "\n" + text;
}

function addWeeklyPanel(text) {
  const marker = "7-day recovered orders snapshot";
  const idx = text.indexOf(marker);

  if (idx === -1) {
    console.log(
      `⚠️  Could not find marker "${marker}" in this file. Skipping WeeklyImpactPanel injection.`
    );
    return text;
  }

  // Find end of the line containing the marker
  const lineEnd = text.indexOf("\n", idx);
  const injectionPoint = lineEnd === -1 ? text.length : lineEnd + 1;

  const snippet = '      <WeeklyImpactPanel />\n';

  if (text.includes("<WeeklyImpactPanel")) {
    console.log("ℹ️  WeeklyImpactPanel usage already present. No duplicate insert.");
    return text;
  }

  return (
    text.slice(0, injectionPoint) + snippet + text.slice(injectionPoint)
  );
}

console.log("🔧 Wiring WeeklyImpactPanel into demo + embedded…");

for (const relPath of files) {
  const filePath = path.resolve(process.cwd(), relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${relPath} (file not found).`);
    continue;
  }

  let text = fs.readFileSync(filePath, "utf8");

  // Backup once with a timestamp for safety
  const backupPath = `${filePath}.before_weekly_impact_${Date.now()}.tsx`;
  fs.writeFileSync(backupPath, text, "utf8");
  console.log(`💾 Backup written: ${backupPath}`);

  text = addImport(text);
  text = addWeeklyPanel(text);

  fs.writeFileSync(filePath, text, "utf8");
  console.log(`✅ Updated ${relPath}`);
}

console.log("🎉 WeeklyImpactPanel wiring script complete.");
