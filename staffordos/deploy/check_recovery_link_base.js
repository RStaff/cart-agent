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

async function main() {
  const key = String(process.argv[2] || "").trim();
  if (!key) {
    console.error("Usage: node staffordos/deploy/check_recovery_link_base.js <site-key>");
    process.exit(1);
  }

  const site = getSite(key);
  if (!site) {
    console.error(`FAIL site_not_found key=${key}`);
    process.exit(1);
  }

  const envVarName = String(site.public_origin_env_var || "").trim();
  const envVarValue = envVarName ? String(process.env[envVarName] || "").trim() : "";
  const expectedBase = envVarValue || String(site.expected_public_origin || site.public_origin || "").trim();
  const recoveryTest = site.recovery_link_test && typeof site.recovery_link_test === "object" ? site.recovery_link_test : null;
  const expectedPath = String(recoveryTest?.expected_path || "/api/recovery/return").trim();
  const shop = String(recoveryTest?.shop || "").trim();
  const experienceId = String(recoveryTest?.experience_id || "").trim();
  const channel = String(recoveryTest?.channel || "email").trim();
  const params = new URLSearchParams({
    shop,
    eid: experienceId,
    channel,
  });

  const summary = expectedBase ? "OK" : "WARN";
  const expectedRecoveryLink = expectedBase ? `${expectedBase.replace(/\/+$/, "")}${expectedPath}?${params.toString()}` : "unresolved";

  console.log(`[${summary}] ${site.key} recovery link base`);
  console.log(`env_var=${envVarName || "missing"}`);
  console.log(`env_present=${envVarValue ? "yes" : "no"}`);
  console.log(`registry_expected_public_origin=${site.expected_public_origin || "missing"}`);
  console.log(`resolved_recovery_base=${expectedBase || "missing"}`);
  console.log(`expected_recovery_link=${expectedRecoveryLink}`);
}

main().catch((error) => {
  console.error(`FAIL unexpected_error ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
