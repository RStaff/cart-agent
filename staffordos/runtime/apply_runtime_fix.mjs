#!/usr/bin/env node

import dns from "node:dns/promises";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const DEFAULT_DIAGNOSIS = ".tmp/runtime_diagnosis.json";
const ACTION_LOG = ".tmp/runtime_fix_actions.json";
const CANONICAL_PUBLIC_URL = "https://dev.abando.ai";
const SHOPIFY_CONFIG_PATH = resolve(repoRoot, "shopify.app.toml");
const RUNTIME_INDEX_PATH = resolve(repoRoot, "web/src/index.js");

function parseArgs(argv) {
  let input = DEFAULT_DIAGNOSIS;
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--input") {
      input = String(argv[index + 1] || "").trim() || DEFAULT_DIAGNOSIS;
    }
  }
  return { input };
}

function logAction(actions, type, status, detail) {
  const record = {
    time: new Date().toISOString(),
    type,
    status,
    detail,
  };
  actions.push(record);
  console.log(`[runtime-fix] ${type}: ${status}${detail ? ` — ${detail}` : ""}`);
}

async function runCommand(actions, command, args) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: repoRoot,
      env: process.env,
      maxBuffer: 1024 * 1024 * 4,
    });
    const detail = [stdout, stderr].filter(Boolean).join("\n").trim();
    logAction(actions, `${command} ${args.join(" ")}`, "ok", detail.split("\n").slice(-2).join(" ").trim());
    return { ok: true, stdout: String(stdout || ""), stderr: String(stderr || "") };
  } catch (error) {
    const detail = String(error instanceof Error ? error.message : error);
    logAction(actions, `${command} ${args.join(" ")}`, "failed", detail);
    return { ok: false, stdout: "", stderr: detail };
  }
}

async function alignShopifyConfig(actions) {
  const source = await readFile(SHOPIFY_CONFIG_PATH, "utf8");
  const targetApplicationUrl = `application_url = "${CANONICAL_PUBLIC_URL}"`;
  const targetRedirectBlock = `[auth]
redirect_urls = [
  "${CANONICAL_PUBLIC_URL}/auth/callback",
  "${CANONICAL_PUBLIC_URL}/auth/shopify/callback",
  "${CANONICAL_PUBLIC_URL}/api/auth/callback"
]`;

  let next = source.replace(/^application_url\s*=\s*".*"$/m, targetApplicationUrl);
  if (/\[auth\][\s\S]*?redirect_urls\s*=\s*\[[\s\S]*?\]/m.test(next)) {
    next = next.replace(/\[auth\][\s\S]*?redirect_urls\s*=\s*\[[\s\S]*?\]/m, targetRedirectBlock);
  }

  if (next !== source) {
    await writeFile(SHOPIFY_CONFIG_PATH, next, "utf8");
    logAction(actions, "align_shopify_app_toml", "updated", "application_url and redirect_urls now target https://dev.abando.ai");
  } else {
    logAction(actions, "align_shopify_app_toml", "noop", "shopify.app.toml already matched the stable runtime URL");
  }
}

async function verifyTunnel(actions) {
  try {
    await dns.lookup("dev.abando.ai");
    logAction(actions, "verify_dns", "ok", "dev.abando.ai resolves");
  } catch {
    logAction(actions, "verify_dns", "failed", "dev.abando.ai does not resolve");
  }
}

async function verifyIframeHeaders(actions) {
  const source = await readFile(RUNTIME_INDEX_PATH, "utf8");
  const removesXfo = source.includes('res.removeHeader("X-Frame-Options")');
  const hasFrameAncestors =
    source.includes("frame-ancestors https://admin.shopify.com https://*.myshopify.com;");

  if (removesXfo && hasFrameAncestors) {
    logAction(actions, "verify_iframe_headers", "ok", "runtime already removes X-Frame-Options and allows Shopify frame ancestors");
  } else {
    logAction(actions, "verify_iframe_headers", "failed", "runtime source is missing the expected Shopify iframe header guards");
  }
}

async function verifyEmbeddedRoute(actions) {
  try {
    const response = await fetch(`${CANONICAL_PUBLIC_URL}/dashboard?embedded=1&shop=cart-agent-dev.myshopify.com&host=test-host`);
    const body = await response.text();
    const isHtml = String(response.headers.get("content-type") || "").includes("text/html");
    if (response.ok && isHtml && body.length > 500) {
      logAction(actions, "verify_embedded_route", "ok", "public embedded dashboard returns HTML 200");
    } else {
      logAction(actions, "verify_embedded_route", "failed", `status=${response.status} html=${isHtml} body=${body.length}`);
    }
  } catch (error) {
    logAction(actions, "verify_embedded_route", "failed", String(error instanceof Error ? error.message : error));
  }
}

export async function applyRuntimeFix(inputPath = DEFAULT_DIAGNOSIS) {
  const actions = [];
  const diagnosis = JSON.parse(await readFile(resolve(repoRoot, inputPath), "utf8"));
  logAction(actions, "diagnosis_case", "info", `${diagnosis.caseType} (${diagnosis.confidence})`);

  await runCommand(actions, "/bin/bash", ["./scripts/dev_cloudflare_auto_fix.sh"]);
  await alignShopifyConfig(actions);
  await runCommand(actions, "/bin/zsh", ["-lc", "ABANDO_DEV_PUBLIC_URL=https://dev.abando.ai node ./scripts/abando-generate-shopify-dev-config.mjs"]);
  await runCommand(actions, "/bin/bash", ["./scripts/dev_fix_shopify_preview.sh"]);
  await verifyTunnel(actions);
  await verifyIframeHeaders(actions);
  await verifyEmbeddedRoute(actions);

  await writeFile(resolve(repoRoot, ACTION_LOG), `${JSON.stringify(actions, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(actions, null, 2));
  return actions;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { input } = parseArgs(process.argv);
  applyRuntimeFix(input).catch((error) => {
    console.error("[runtime-fix] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
