#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const DEFAULT_INPUT = ".tmp/runtime_before.json";
const DEFAULT_OUTPUT = ".tmp/runtime_diagnosis.json";

function parseArgs(argv) {
  let input = DEFAULT_INPUT;
  let output = DEFAULT_OUTPUT;
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") {
      input = String(argv[index + 1] || "").trim() || DEFAULT_INPUT;
    }
    if (argv[index] === "--output") {
      output = String(argv[index + 1] || "").trim() || DEFAULT_OUTPUT;
    }
  }
  return { input, output };
}

function hostFromUrl(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function detect(snapshot) {
  const appHost = hostFromUrl(snapshot?.shopify?.appUrl || "");
  const publicHost = hostFromUrl(snapshot?.app?.publicUrl || "");
  const iframeBlocked = Boolean(snapshot?.shopify?.iframeBlocked);
  const tunnelResolves = Boolean(snapshot?.tunnel?.resolves);
  const symptoms = Array.isArray(snapshot?.symptoms) ? snapshot.symptoms : [];
  const lowerSymptoms = symptoms.join(" ").toLowerCase();

  if (appHost && publicHost && appHost !== publicHost) {
    return {
      caseType: "wrong_app_url",
      confidence: 0.95,
      rootCause: `The Shopify app config still points at ${snapshot.shopify.appUrl} while the live embedded runtime is using ${snapshot.app.publicUrl}.`,
      fixPlan: [
        "Align shopify.app.toml application_url with the stable named tunnel.",
        "Align the Shopify auth callback URLs with the same stable hostname.",
        "Regenerate the local Shopify dev config and relaunch preview against the stable URL.",
      ],
    };
  }

  if (iframeBlocked || snapshot?.shopify?.embeddedLoad === "blank" || lowerSymptoms.includes("framing")) {
    return {
      caseType: "embedded_app_loading",
      confidence: 0.86,
      rootCause: "The embedded app render path is healthy enough to serve HTML, but the admin iframe path is blocked or misaligned by headers or embed routing.",
      fixPlan: [
        "Remove any blocking X-Frame-Options header.",
        "Set frame-ancestors CSP for admin.shopify.com and *.myshopify.com.",
        "Verify the embedded dashboard route returns HTML 200 through the public hostname.",
      ],
    };
  }

  if (!tunnelResolves || snapshot?.app?.health === "fail" || lowerSymptoms.includes("tunnel")) {
    return {
      caseType: "tunnel_instability",
      confidence: 0.82,
      rootCause: "The public dev hostname is unstable or not aligned with the local runtime, so Shopify keeps losing a reliable preview target.",
      fixPlan: [
        "Repair the named Cloudflare tunnel and DNS route for dev.abando.ai.",
        "Verify the public hostname proxies cleanly to http://127.0.0.1:8081.",
        "Refresh Shopify preview against the stable hostname only.",
      ],
    };
  }

  if (lowerSymptoms.includes("auth") || lowerSymptoms.includes("redirect")) {
    return {
      caseType: "auth_loop",
      confidence: 0.74,
      rootCause: "The runtime still looks like an auth or redirect mismatch between Shopify callbacks and the public app URL.",
      fixPlan: [
        "Align Shopify callback URLs with the active public app URL.",
        "Verify the embedded route and auth callbacks share the same stable hostname.",
        "Relaunch Shopify dev after the config is corrected.",
      ],
    };
  }

  return {
    caseType: "embedded_app_loading",
    confidence: 0.58,
    rootCause: "The setup still looks like a Shopify embedded dev path issue, even though the local app and public tunnel are partially healthy.",
    fixPlan: [
      "Verify the stable public hostname is the only URL Shopify dev is using.",
      "Align app URL and callback config with that hostname.",
      "Recheck embedded dashboard rendering through the public route.",
    ],
  };
}

export async function detectRuntimeIssue(inputPath = DEFAULT_INPUT, outputPath = DEFAULT_OUTPUT) {
  const snapshot = JSON.parse(await readFile(resolve(repoRoot, inputPath), "utf8"));
  const result = detect(snapshot);
  await writeFile(resolve(repoRoot, outputPath), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { input, output } = parseArgs(process.argv);
  detectRuntimeIssue(input, output).catch((error) => {
    console.error("[runtime-detect] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
