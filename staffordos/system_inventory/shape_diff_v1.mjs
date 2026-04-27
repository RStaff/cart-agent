#!/usr/bin/env node

import fs from "fs";
import { execFileSync } from "child_process";

const staticFile = process.argv[2];
const runtimeUrl = process.argv[3];

if (!staticFile || !runtimeUrl) {
  console.error("Usage: node staffordos/system_inventory/shape_diff_v1.mjs <static-file> <runtime-url>");
  process.exit(1);
}

function flatten(obj, prefix = "") {
  const out = [];

  if (Array.isArray(obj)) {
    if (obj.length === 0) return [`${prefix}[]`];
    return flatten(obj[0], `${prefix}[]`);
  }

  if (obj && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      out.push(path);
      out.push(...flatten(value, path));
    }
    return out;
  }

  return [];
}

function extractStaticFields(src) {
  const fields = new Set();
  const fieldRegex = /^\s*([a-zA-Z0-9_]+)\??:/gm;
  let match;

  while ((match = fieldRegex.exec(src))) {
    fields.add(match[1]);
  }

  return [...fields].sort();
}

const staticContent = fs.readFileSync(staticFile, "utf8");
const staticFields = extractStaticFields(staticContent);

const runtimeRaw = execFileSync("node", [
  "staffordos/system_inventory/shape_runtime_v1.mjs",
  runtimeUrl
], { encoding: "utf8" });

const runtime = JSON.parse(runtimeRaw);
const runtimePaths = flatten(runtime.runtime_shape || {});
const runtimeFieldNames = [...new Set(runtimePaths.map(p => p.split(".").pop().replace("[]", "")))].sort();

const missingInStatic = runtimeFieldNames.filter(field => !staticFields.includes(field));
const unusedStatic = staticFields.filter(field => !runtimeFieldNames.includes(field));

const result = {
  ok: missingInStatic.length === 0,
  artifact: "shape_diff_v1",
  static_file: staticFile,
  runtime_url: runtimeUrl,
  missing_in_static_type: missingInStatic,
  static_fields: staticFields,
  runtime_fields: runtimeFieldNames,
  runtime_paths: runtimePaths
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok) process.exit(2);
