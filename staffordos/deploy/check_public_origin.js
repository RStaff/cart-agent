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
  if (!url) {
    return { ok: false, status: null, detail: "missing" };
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
    });
    return {
      ok: response.ok,
      status: response.status,
      detail: response.ok ? "ok" : "http_error",
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

function deriveLocalHealthUrl(site) {
  if (!site.local_origin) return "";
  return `${String(site.local_origin).replace(/\/+$/, "")}/healthz`;
}

function summaryStatus(results) {
  if (results.some((item) => item.level === "FAIL")) return "FAIL";
  if (results.some((item) => item.level === "WARN")) return "WARN";
  return "OK";
}

async function main() {
  const key = String(process.argv[2] || "").trim();
  if (!key) {
    console.error("Usage: node staffordos/deploy/check_public_origin.js <site-key>");
    process.exit(1);
  }

  const site = getSite(key);
  if (!site) {
    console.error(`FAIL site_not_found key=${key}`);
    process.exit(1);
  }

  const results = [];
  const envVarName = String(site.public_origin_env_var || "").trim();
  const envVarValue = envVarName ? String(process.env[envVarName] || "").trim() : "";
  const localHealthUrl = deriveLocalHealthUrl(site);

  if (site.expected_public_origin) {
    results.push({ level: "OK", label: "expected_public_origin", detail: site.expected_public_origin });
  } else {
    results.push({ level: "WARN", label: "expected_public_origin", detail: "missing" });
  }

  if (envVarName) {
    results.push({ level: "OK", label: "public_origin_env_var", detail: envVarName });
  } else {
    results.push({ level: "WARN", label: "public_origin_env_var", detail: "missing" });
  }

  if (envVarName && envVarValue) {
    results.push({ level: "OK", label: "env_present", detail: `${envVarName} set` });
  } else if (envVarName) {
    results.push({ level: "WARN", label: "env_present", detail: `${envVarName} missing in current shell` });
  }

  if (localHealthUrl) {
    const localHealth = await checkUrl(localHealthUrl);
    results.push({
      level: localHealth.ok ? "OK" : "FAIL",
      label: "local_health",
      detail: localHealth.ok ? `${localHealth.status} ${localHealthUrl}` : `${localHealth.detail} ${localHealthUrl}`,
    });
  } else {
    results.push({ level: "WARN", label: "local_health", detail: "missing" });
  }

  if (site.healthcheck_url) {
    const publicHealth = await checkUrl(site.healthcheck_url);
    results.push({
      level: publicHealth.ok ? "OK" : "WARN",
      label: "public_health",
      detail: publicHealth.ok ? `${publicHealth.status} ${site.healthcheck_url}` : `${publicHealth.detail} ${site.healthcheck_url}`,
    });
  } else {
    results.push({ level: "WARN", label: "public_health", detail: "missing" });
  }

  const summary = summaryStatus(results);
  console.log(`[${summary}] ${site.key}`);
  console.log(`product=${site.product}`);
  console.log(`environment=${site.environment}`);
  console.log(`local_origin=${site.local_origin || "missing"}`);
  console.log(`expected_public_origin=${site.expected_public_origin || "missing"}`);
  for (const item of results) {
    console.log(`- ${item.level} ${item.label}: ${item.detail}`);
  }
}

main().catch((error) => {
  console.error(`FAIL unexpected_error ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
