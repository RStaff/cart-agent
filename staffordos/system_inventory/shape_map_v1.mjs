#!/usr/bin/env node

import fs from "fs";
import path from "path";

const file = process.argv[2];

if (!file) {
  console.error("❌ Usage: node shape_map_v1.mjs <file>");
  process.exit(1);
}

const fullPath = path.resolve(file);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`);
  process.exit(1);
}

const content = fs.readFileSync(fullPath, "utf8");

// ---------- HELPERS ----------

function extractTypes(src) {
  const typeRegex = /type\s+(\w+)\s*=\s*{([\s\S]*?)}/g;
  const results = [];

  let match;
  while ((match = typeRegex.exec(src))) {
    const [, name, body] = match;

    const fields = body
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("//"))
      .map((line) => line.replace(/[:?].*/, "").trim())
      .filter(Boolean);

    results.push({ name, fields });
  }

  return results;
}

function extractFunctions(src) {
  const fnRegex = /function\s+(\w+)\s*\(/g;
  const fns = [];
  let match;

  while ((match = fnRegex.exec(src))) {
    fns.push(match[1]);
  }

  return fns;
}

function extractTopLevelConsts(src) {
  const constRegex = /const\s+(\w+)\s*=/g;
  const vars = [];
  let match;

  while ((match = constRegex.exec(src))) {
    vars.push(match[1]);
  }

  return vars;
}

// ---------- EXEC ----------

const types = extractTypes(content);
const functions = extractFunctions(content);
const vars = extractTopLevelConsts(content);

// ---------- OUTPUT ----------

console.log("\n=== SHAPE MAP ===\n");

console.log("📦 FILE:");
console.log(fullPath);

console.log("\n🧩 TYPES:");
types.forEach((t) => {
  console.log(`\n- ${t.name}`);
  t.fields.forEach((f) => console.log(`  • ${f}`));
});

console.log("\n⚙️ FUNCTIONS:");
functions.forEach((f) => console.log(`- ${f}`));

console.log("\n📊 TOP-LEVEL VARIABLES:");
vars.forEach((v) => console.log(`- ${v}`));

console.log("\n=== END SHAPE MAP ===\n");
