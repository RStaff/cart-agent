#!/usr/bin/env node

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { exportSendConsoleData } from "./export_send_console_data.mjs";
import { main as updateSendConsoleStatus } from "./update_send_console_status.mjs";
import { runAction } from "../../staffordos/actions/run_action.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const PORT = Number(process.env.SEND_CONSOLE_PORT || 4319);
const UI_ROOT = resolve(repoRoot, "staffordos/ui/send-console");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function serveFile(res, path) {
  const body = await readFile(path);
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[extname(path)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");

    if (req.method === "GET" && url.pathname === "/api/send-console-data") {
      await exportSendConsoleData();
      const raw = await readFile(".tmp/send_console_data.json", "utf8");
      sendJson(res, 200, JSON.parse(raw));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/update-status") {
      const rawBody = await readRequestBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      await updateSendConsoleStatus([
        "node",
        "update_send_console_status.mjs",
        "--id",
        String(payload?.id || ""),
        "--status",
        String(payload?.status || ""),
        ...(String(payload?.note || "").trim() ? ["--note", String(payload.note)] : []),
      ]);
      const refreshed = JSON.parse(await readFile(".tmp/send_console_data.json", "utf8"));
      sendJson(res, 200, { ok: true, records: refreshed });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/run-action") {
      const rawBody = await readRequestBody(req);
      const payload = rawBody ? JSON.parse(rawBody) : {};
      const result = await runAction({
        action: String(payload?.action || "").trim(),
        leadId: String(payload?.leadId || "").trim(),
        caseType: String(payload?.caseType || "").trim(),
      });
      await exportSendConsoleData();
      const refreshed = JSON.parse(await readFile(".tmp/send_console_data.json", "utf8"));
      sendJson(res, 200, { ok: true, result, records: refreshed });
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/.tmp/")) {
      const path = resolve(repoRoot, `.${url.pathname}`);
      await serveFile(res, path);
      return;
    }

    let filePath = join(UI_ROOT, url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, ""));
    if (!filePath.startsWith(UI_ROOT)) {
      sendJson(res, 403, { ok: false, error: "forbidden" });
      return;
    }

    await serveFile(res, filePath);
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

async function main() {
  await exportSendConsoleData();
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[send-console] running at http://127.0.0.1:${PORT}`);
    console.log(`[send-console] UI: http://127.0.0.1:${PORT}/`);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[send-console] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
