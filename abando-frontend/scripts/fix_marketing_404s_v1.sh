#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[fix] scanning app/ and src/ for old marketing links..."

node << 'NODE'
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SEARCH_DIRS = ['app', 'src'];

const replacements = [
  ['/marketing/verticals/women-boutique', '/verticals/women-boutique'],
  ['/marketing/verticals/supplements', '/verticals/supplements'],
  ['/marketing/demo/playground', '/demo/playground'],
];

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(full, acc);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      acc.push(full);
    }
  }
}

const files = [];
for (const d of SEARCH_DIRS) {
  walk(path.join(ROOT, d), files);
}

let touched = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  let original = src;
  for (const [from, to] of replacements) {
    if (src.includes(from)) {
      src = src.split(from).join(to);
    }
  }
  if (src !== original) {
    fs.writeFileSync(file, src, 'utf8');
    console.log(`[fix] updated ${file}`);
    touched++;
  }
}

console.log(`[fix] done. files changed: ${touched}`);
NODE

echo "[fix] complete."
