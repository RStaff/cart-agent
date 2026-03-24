#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const REGISTRY_PATH = path.join(ROOT, "staffordos", "deploy", "registry", "sites.json");
const SITE_KEY = "abando";

function loadRegistryDocument() {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

function loadRegistrySites() {
  const parsed = loadRegistryDocument();
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed.sites) ? parsed.sites : [];
}

function getSite(key, sites = loadRegistrySites()) {
  return sites.find((site) => String(site.key || "").trim() === key) || null;
}

async function checkUrl(url) {
  if (!url) {
    return { ok: false, status: null, detail: "missing", url };
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
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : String(error),
      url,
    };
  }
}

function line(status, label, detail) {
  return `- ${status} ${label}: ${detail}`;
}

function isValidHttpsUrl(value = "") {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function writeRegistryDocument(document) {
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(document, null, 2)}\n`, "utf8");
}

function rebaseUrlToOrigin(value, newOrigin) {
  const raw = String(value || "").trim();
  if (!raw) {
    return raw;
  }

  try {
    const parsed = new URL(raw);
    const nextBase = new URL(newOrigin);
    return `${nextBase.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return raw;
  }
}

async function main() {
  const registryDocument = loadRegistryDocument();
  const sites = Array.isArray(registryDocument) ? registryDocument : Array.isArray(registryDocument.sites) ? registryDocument.sites : [];
  const site = getSite(SITE_KEY, sites);
  if (!site) {
    console.error("FINAL VERDICT: LOCAL_BROKEN");
    console.error("reason=abando_site_missing_from_registry");
    process.exit(1);
  }

  const localOrigin = String(site.local_origin || "").replace(/\/+$/, "");
  const localEmailReadinessUrl = `${localOrigin}/api/recovery-actions/email-readiness`;
  const localExperienceUrl = `${localOrigin}/experience?shop=mvp-demo-proof.myshopify.com&eid=proof-loop-check`;

  const envVarName = String(site.public_origin_env_var || "").trim();
  const envVarValue = envVarName ? String(process.env[envVarName] || "").trim() : "";
  let registryExpectedPublicOrigin = String(site.expected_public_origin || "").trim();
  let registryPublicOrigin = String(site.public_origin || "").trim();
  let driftDetected = false;
  let registryUpdated = false;

  if (envVarValue && isValidHttpsUrl(envVarValue)) {
    const expectedDiffers = registryExpectedPublicOrigin !== envVarValue;
    const publicDiffers = registryPublicOrigin !== envVarValue;
    if (expectedDiffers || publicDiffers) {
      driftDetected = true;
      console.log("[WARN] registry drift detected");

      site.expected_public_origin = envVarValue;
      site.public_origin = envVarValue;
      if (site.healthcheck_url) {
        site.healthcheck_url = rebaseUrlToOrigin(site.healthcheck_url, envVarValue);
      }
      if (Array.isArray(site.smoke_urls_public)) {
        site.smoke_urls_public = site.smoke_urls_public.map((url) => rebaseUrlToOrigin(url, envVarValue));
      }
      writeRegistryDocument(Array.isArray(registryDocument) ? sites : { ...registryDocument, sites });
      registryUpdated = true;
      registryExpectedPublicOrigin = envVarValue;
      registryPublicOrigin = envVarValue;
      console.log("[OK] registry updated to match runtime");
    }
  }

  const expectedPublicOrigin = registryExpectedPublicOrigin || registryPublicOrigin;
  const resolvedRecoveryBase = envVarValue || expectedPublicOrigin || "missing";

  const publicEmailReadinessUrl = Array.isArray(site.smoke_urls_public)
    ? site.smoke_urls_public.find((url) => String(url).includes("/api/recovery-actions/email-readiness")) || ""
    : "";
  const publicExperienceUrl = Array.isArray(site.smoke_urls_public)
    ? site.smoke_urls_public.find((url) => String(url).includes("/experience?")) || ""
    : "";

  const localHealth = await checkUrl(localOrigin);
  const localEmailReadiness = await checkUrl(localEmailReadinessUrl);
  const localExperience = await checkUrl(localExperienceUrl);
  const publicEmailReadiness = publicEmailReadinessUrl ? await checkUrl(publicEmailReadinessUrl) : { ok: false, status: null, detail: "missing", url: "" };
  const publicExperience = publicExperienceUrl ? await checkUrl(publicExperienceUrl) : { ok: false, status: null, detail: "missing", url: "" };

  const localReady = localHealth.ok && localEmailReadiness.ok && localExperience.ok;
  const publicEnvReady = Boolean(envVarName && envVarValue);
  const publicReady = publicEnvReady && publicEmailReadiness.ok && publicExperience.ok;
  const recoveryBaseReady = resolvedRecoveryBase !== "missing" && resolvedRecoveryBase === (envVarValue || expectedPublicOrigin);
  const publicOriginMismatch = Boolean(publicEnvReady && expectedPublicOrigin && envVarValue !== expectedPublicOrigin);

  let verdict = "LOCAL_BROKEN";
  if (localReady && publicEnvReady && publicReady) {
    verdict = "READY_FOR_PUBLIC_PROOF";
  } else if (localReady && !publicEnvReady) {
    verdict = "READY_FOR_LOCAL_PROOF";
  } else if (localReady && publicEnvReady && !publicReady) {
    verdict = "PUBLIC_BROKEN";
  }

  let nextAction = "NEXT: verify Abando manually";
  if (verdict === "LOCAL_BROKEN") {
    if (!localHealth.ok) {
      nextAction = "NEXT: run run_abando.sh";
    } else if (!localEmailReadiness.ok) {
      nextAction = "NEXT: check SMTP env vars";
    } else if (!localExperience.ok) {
      nextAction = "NEXT: verify /experience route";
    }
  } else if (verdict === "PUBLIC_BROKEN") {
    if (!publicEnvReady) {
      nextAction = "NEXT: export ABANDO_PUBLIC_APP_ORIGIN";
    } else if (publicOriginMismatch) {
      nextAction = "NEXT: update registry expected_public_origin";
    } else if (!publicEmailReadiness.ok || !publicExperience.ok) {
      nextAction = "NEXT: restart tunnel or verify deploy";
    }
  } else if (verdict === "READY_FOR_LOCAL_PROOF") {
    nextAction = "NEXT: test recovery loop locally";
  } else if (verdict === "READY_FOR_PUBLIC_PROOF") {
    nextAction = "NEXT: run real recovery test via email";
  }

  console.log("1. LOCAL");
  console.log(line(localHealth.ok ? "OK" : "FAIL", "listener_or_local_origin", localHealth.ok ? `${localHealth.status} ${localOrigin}` : `${localHealth.detail} ${localOrigin}`));
  console.log(line(localEmailReadiness.ok ? "OK" : "FAIL", "email_readiness", localEmailReadiness.ok ? `${localEmailReadiness.status} ${localEmailReadinessUrl}` : `${localEmailReadiness.detail} ${localEmailReadinessUrl}`));
  console.log(line(localExperience.ok ? "OK" : "FAIL", "local_experience_route", localExperience.ok ? `${localExperience.status} ${localExperienceUrl}` : `${localExperience.detail} ${localExperienceUrl}`));

  console.log("");
  console.log("2. PUBLIC ORIGIN");
  console.log(line(expectedPublicOrigin ? "OK" : "WARN", "expected_public_origin", expectedPublicOrigin || "missing"));
  console.log(line(envVarName ? "OK" : "WARN", "env_var_name", envVarName || "missing"));
  console.log(line(publicEnvReady ? "OK" : "WARN", "env_present", publicEnvReady ? "yes" : "no"));

  console.log("");
  console.log("3. RECOVERY LINK BASE");
  console.log(line(recoveryBaseReady ? "OK" : "WARN", "expected_recovery_base", resolvedRecoveryBase));
  console.log(line(recoveryBaseReady ? "OK" : "WARN", "matches_public_origin_expectation", recoveryBaseReady ? "yes" : "no"));

  console.log("");
  console.log("4. PUBLIC SMOKE");
  console.log(line(publicEmailReadiness.ok ? "OK" : "WARN", "public_email_readiness", publicEmailReadiness.ok ? `${publicEmailReadiness.status} ${publicEmailReadinessUrl}` : `${publicEmailReadiness.detail} ${publicEmailReadinessUrl || "missing"}`));
  console.log(line(publicExperience.ok ? "OK" : "WARN", "public_experience_route", publicExperience.ok ? `${publicExperience.status} ${publicExperienceUrl}` : `${publicExperience.detail} ${publicExperienceUrl || "missing"}`));

  console.log("");
  console.log("5. FINAL VERDICT");
  console.log(verdict);

  console.log("");
  console.log("6. NEXT ACTION");
  console.log(nextAction);
}

main().catch((error) => {
  console.error("5. FINAL VERDICT");
  console.error("LOCAL_BROKEN");
  console.error(`error=${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
