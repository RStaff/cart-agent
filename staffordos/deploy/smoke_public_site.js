#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const REGISTRY_PATH = path.join(ROOT, "staffordos", "deploy", "registry", "sites.json");

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed.sites) ? parsed.sites : [];
}

function getSite(key) {
  const sites = loadRegistry();
  return sites.find((site) => String(site.key || "").trim() === key) || null;
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });
    return {
      pass: response.ok,
      status: response.status,
      url,
    };
  } catch (error) {
    return {
      pass: false,
      status: null,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const key = String(process.argv[2] || "").trim();
  if (!key) {
    console.error("Usage: node staffordos/deploy/smoke_public_site.js <site-key>");
    process.exit(1);
  }

  const site = getSite(key);
  if (!site) {
    console.error(`FAIL site_not_found key=${key}`);
    process.exit(1);
  }

  const urls = Array.isArray(site.smoke_urls_public) ? site.smoke_urls_public.filter(Boolean) : [];
  if (urls.length === 0) {
    console.log(`[WARN] ${site.key}`);
    console.log("No public smoke URLs defined.");
    return;
  }

  const results = [];
  for (const url of urls) {
    results.push(await checkUrl(url));
  }

  const passed = results.filter((item) => item.pass).length;
  const failed = results.length - passed;
  const summary = failed > 0 ? "WARN" : "OK";

  console.log(`[${summary}] ${site.key} public smoke`);
  for (const item of results) {
    const line = item.pass
      ? `- PASS ${item.status} ${item.url}`
      : `- FAIL ${item.status ?? "ERR"} ${item.url}${item.error ? ` (${item.error})` : ""}`;
    console.log(line);
  }
  console.log(`total=${results.length}`);
  console.log(`passed=${passed}`);
  console.log(`failed=${failed}`);
}

main().catch((error) => {
  console.error(`FAIL unexpected_error ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
