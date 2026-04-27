#!/usr/bin/env node

const url = process.argv[2];

if (!url) {
  console.error("Usage: node staffordos/system_inventory/shape_runtime_v1.mjs <url>");
  process.exit(1);
}

function shapeOf(value) {
  if (Array.isArray(value)) {
    return value.length === 0 ? [] : [shapeOf(value[0])];
  }

  if (value && typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = shapeOf(child);
    }
    return out;
  }

  return typeof value;
}

try {
  const response = await fetch(url, { cache: "no-store" });
  const json = await response.json();

  console.log(JSON.stringify({
    ok: true,
    url,
    status: response.status,
    runtime_shape: shapeOf(json),
    sample: json
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    url,
    error: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
}
