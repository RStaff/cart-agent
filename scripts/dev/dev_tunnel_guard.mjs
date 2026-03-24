#!/usr/bin/env node
/*
 * Dev tunnel guard for `shopify app dev --verbose`.
 * Usage:
 *   shopify app dev --verbose 2>&1 | node ./scripts/dev/dev_tunnel_guard.mjs
 *
 * It preserves CLI output, captures the active quick tunnel/preview URLs,
 * verifies the tunnel host resolves, and writes `.tmp/dev-session.json`.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import dns from "node:dns/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const stateFile = resolve(repoRoot, ".tmp", "dev-session.json");
const localServerUrl = process.env.ABANDO_LOCAL_SERVER_URL || "http://127.0.0.1:8081";
const defaultShop = process.env.ABANDO_DEV_SHOP || "cart-agent-dev.myshopify.com";
const configuredTunnelUrl = String(process.env.ABANDO_CANONICAL_TUNNEL_URL || "").trim().replace(/\/+$/, "");
const tunnelMode = process.env.ABANDO_TUNNEL_MODE === "named" ? "named" : "quick";

const tunnelRe = /(https:\/\/[a-z0-9-]+\.trycloudflare\.com)/i;
const previewUrlRe = /(https:\/\/(?:admin\.shopify\.com\/[^\s)]+|[a-z0-9-]+\.myshopify\.com\/admin\/[^\s)]+))/i;
const previewLabelRe = /\b(?:preview url|admin url)\b/i;
const localListenRe = /listening on :([0-9]+)/i;

let state = {
  ok: false,
  activeTunnelUrl: null,
  activeTunnelHost: null,
  localServerUrl,
  dashboardUrl: null,
  summaryUrl: null,
  previewUrl: null,
  detectedAt: null,
  tunnelLooksStale: true,
  tunnelMode,
};

async function loadExistingState() {
  try {
    const raw = await readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state = { ...state, ...parsed };
    }
  } catch {
    // no existing state yet
  }
}

async function persistState() {
  await mkdir(resolve(repoRoot, ".tmp"), { recursive: true });
  await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/[)\].,]+$/, "").replace(/\/+$/, "");
}

async function sleep(ms) {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function verifyHostResolves(host, attempts = 8, waitMs = 1500) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      await dns.lookup(host);
      return false;
    } catch {
      if (index < attempts - 1) {
        await sleep(waitMs);
      }
    }
  }

  return true;
}

async function markTunnel(url) {
  const normalizedUrl = normalizeUrl(url);
  const host = new URL(normalizedUrl).host;
  const previousHost = state.activeTunnelHost;
  const tunnelLooksStale = await verifyHostResolves(host);

  state = {
    ...state,
    ok: !tunnelLooksStale,
    activeTunnelUrl: normalizedUrl,
    activeTunnelHost: host,
    dashboardUrl: `${normalizedUrl}/dashboard?embedded=1&shop=${encodeURIComponent(defaultShop)}&host=test-host`,
    summaryUrl: `${normalizedUrl}/api/dashboard/summary?shop=${encodeURIComponent(defaultShop)}`,
    detectedAt: new Date().toISOString(),
    tunnelLooksStale,
  };

  await persistState();

  if (previousHost && previousHost !== host) {
    process.stdout.write(`[dev-tunnel] tunnel changed: ${previousHost} -> ${host}\n`);
  }
  process.stdout.write(
    `[dev-tunnel] current tunnel: ${normalizedUrl} (${tunnelLooksStale ? "stale-or-unresolved" : "resolves"})\n`,
  );
  process.stdout.write(`[dev-tunnel] canonical dashboard: ${state.dashboardUrl}\n`);
  if (tunnelLooksStale) {
    process.stdout.write(
      `[dev-tunnel] WARNING: ${host} is not resolving yet. Do not reuse old tabs; restart the launcher if this does not clear.\n`,
    );
  }
}

async function markConfiguredTunnel() {
  if (!configuredTunnelUrl) return;
  await markTunnel(configuredTunnelUrl);
}

async function markPreview(url) {
  const normalizedUrl = normalizeUrl(url);
  if (!normalizedUrl) return;

  const previousPreview = normalizeUrl(state.previewUrl || "");
  const previewDetectedAt = new Date().toISOString();

  if (previousPreview === normalizedUrl && state.previewDetectedAt) {
    return;
  }

  state = {
    ...state,
    previewUrl: normalizedUrl,
    previewDetectedAt,
  };
  await persistState();

  process.stdout.write(`[dev-preview] detected: ${normalizedUrl}\n`);
  if (previousPreview && previousPreview !== normalizedUrl) {
    process.stdout.write(`[dev-preview] updated preview URL\n`);
  }
}

async function main() {
  await loadExistingState();
  state = {
    ...state,
    tunnelMode,
  };
  if (configuredTunnelUrl) {
    await markConfiguredTunnel();
  }
  await persistState();

  const rl = readline.createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    process.stdout.write(`${line}\n`);

    const localMatch = line.match(localListenRe);
    if (localMatch?.[1]) {
      state = {
        ...state,
        localServerUrl: `http://127.0.0.1:${localMatch[1]}`,
      };
      await persistState();
    }

    const previewMatch = line.match(previewUrlRe);
    if (previewMatch?.[1] && (previewLabelRe.test(line) || /shopify\.com\/|myshopify\.com\/admin\//i.test(previewMatch[1]))) {
      await markPreview(previewMatch[1]);
    }

    const tunnelMatch = line.match(tunnelRe);
    if (tunnelMode !== "named" && tunnelMatch?.[1]) {
      await markTunnel(tunnelMatch[1]);
    }
  }
}

main().catch(async (error) => {
  process.stderr.write(`[dev-tunnel] guard failed: ${error instanceof Error ? error.message : String(error)}\n`);
  state = {
    ...state,
    ok: false,
    detectedAt: new Date().toISOString(),
    tunnelLooksStale: true,
  };
  await persistState();
  process.exit(1);
});
