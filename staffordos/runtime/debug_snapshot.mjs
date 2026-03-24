#!/usr/bin/env node

import dns from "node:dns/promises";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const DEFAULT_OUTPUT = ".tmp/runtime_before.json";
const CANONICAL_PUBLIC_URL = "https://dev.abando.ai";
const LOCAL_URL = "http://127.0.0.1:8081";
const LOCAL_HEALTH_URL = `${LOCAL_URL}/healthz`;
const LOCAL_DASHBOARD_URL = `${LOCAL_URL}/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host`;
const PUBLIC_DASHBOARD_URL = `${CANONICAL_PUBLIC_URL}/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host`;
const DEV_SESSION_PATH = ".tmp/dev-session.json";
const SHOPIFY_CONFIG_PATH = "shopify.app.toml";

function parseArgs(argv) {
  let output = DEFAULT_OUTPUT;
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--output") {
      output = String(argv[index + 1] || "").trim() || DEFAULT_OUTPUT;
    }
  }
  return { output };
}

async function readJson(path, fallback = null) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function commandOutput(command, args) {
  try {
    const { stdout } = await execFileAsync(command, args, {
      cwd: repoRoot,
      env: process.env,
    });
    return String(stdout || "").trim();
  } catch {
    return "";
  }
}

async function fetchText(url) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      headers: new Headers(),
      body: String(error instanceof Error ? error.message : error),
    };
  }
}

async function readShopifyConfig() {
  const source = await readFile(resolve(repoRoot, SHOPIFY_CONFIG_PATH), "utf8");
  const appUrlMatch = source.match(/^application_url\s*=\s*"(.*)"$/m);
  return {
    appUrl: String(appUrlMatch?.[1] || "").trim(),
  };
}

function detectTunnelType(session) {
  const tunnelMode = String(session?.tunnelMode || "").trim().toLowerCase();
  const activeUrl = String(session?.activeTunnelUrl || "").trim();
  if (tunnelMode === "named" || activeUrl.includes("dev.abando.ai")) {
    return "cloudflare";
  }
  if (activeUrl.includes("ngrok")) {
    return "ngrok";
  }
  return "unknown";
}

function iframeBlockedFromHeaders(headers) {
  const xfo = String(headers.get("x-frame-options") || "").trim();
  const csp = String(headers.get("content-security-policy") || "").trim();
  if (xfo) {
    return true;
  }
  return !(csp.includes("frame-ancestors") && csp.includes("admin.shopify.com") && csp.includes("*.myshopify.com"));
}

function hostFromUrl(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

async function buildSnapshot() {
  const [session, shopifyConfig, shopifyCliVersion, localHealth, publicHealth, localDashboard, publicDashboard] = await Promise.all([
    readJson(resolve(repoRoot, DEV_SESSION_PATH), {}),
    readShopifyConfig(),
    commandOutput("/bin/zsh", ["-lc", "shopify version | head -n 1"]),
    fetchText(LOCAL_HEALTH_URL),
    fetchText(`${CANONICAL_PUBLIC_URL}/healthz`),
    fetchText(LOCAL_DASHBOARD_URL),
    fetchText(PUBLIC_DASHBOARD_URL),
  ]);

  const publicUrl = String(session?.activeTunnelUrl || CANONICAL_PUBLIC_URL).trim() || CANONICAL_PUBLIC_URL;
  const tunnelHost = hostFromUrl(publicUrl);
  let resolves = false;
  try {
    await dns.lookup(tunnelHost || "dev.abando.ai");
    resolves = true;
  } catch {
    resolves = false;
  }

  const iframeBlocked = iframeBlockedFromHeaders(publicDashboard.headers);
  const appUrl = shopifyConfig.appUrl || publicUrl;
  const wrongAppUrl = hostFromUrl(appUrl) !== hostFromUrl(publicUrl);
  let embeddedLoad = "ok";
  if (!publicDashboard.ok || !localDashboard.ok || wrongAppUrl || iframeBlocked) {
    embeddedLoad = "error";
  } else if (publicDashboard.body.trim().length < 400) {
    embeddedLoad = "blank";
  }

  const symptoms = [];
  if (wrongAppUrl) {
    symptoms.push(`Shopify app config points at ${appUrl} while the active public runtime is ${publicUrl}.`);
  }
  if (!resolves) {
    symptoms.push(`Public tunnel host ${tunnelHost || "dev.abando.ai"} does not resolve cleanly.`);
  }
  if (!publicHealth.ok) {
    symptoms.push(`Public health check failed on ${CANONICAL_PUBLIC_URL}/healthz.`);
  }
  if (iframeBlocked) {
    symptoms.push("Embedded response headers would block Shopify admin framing.");
  }
  if (embeddedLoad !== "ok") {
    symptoms.push("Embedded dashboard path is inconsistent across tunnel, app URL, and Shopify config.");
  }
  if (publicDashboard.ok && publicDashboard.body.includes("still depends on the currently live CLI-managed tunnel")) {
    symptoms.push("Embedded dashboard explicitly reports it still depends on the live CLI-managed tunnel.");
  }

  return {
    timestamp: new Date().toISOString(),
    env: {
      nodeVersion: process.version,
      shopifyCliVersion: shopifyCliVersion || "unknown",
      port: 8081,
    },
    app: {
      localUrl: LOCAL_URL,
      publicUrl,
      health: localHealth.ok && publicHealth.ok ? "ok" : "fail",
    },
    tunnel: {
      type: detectTunnelType(session),
      url: publicUrl,
      resolves,
    },
    shopify: {
      appUrl,
      embeddedLoad,
      iframeBlocked,
    },
    symptoms,
  };
}

export async function debugSnapshot(outputPath = DEFAULT_OUTPUT) {
  const snapshot = await buildSnapshot();
  await writeFile(resolve(repoRoot, outputPath), `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(snapshot, null, 2));
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { output } = parseArgs(process.argv);
  debugSnapshot(output).catch((error) => {
    console.error("[runtime-snapshot] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
