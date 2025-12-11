#!/usr/bin/env node
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TARGET = "Embedded in Shopify admin";

const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  ".vercel",
  "dist",
  "build"
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walk(full);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;

    const src = fs.readFileSync(full, "utf8");
    if (src.includes(TARGET)) {
      console.log("🔍 Found label in:", path.relative(ROOT, full));
    }
  }
}

walk(ROOT);
