import express from "express";
import cors from "cors";
import fs from "node:fs";
import dotenv from "dotenv";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

import { analyzeStore } from "./lib/storeAnalyzer.js";
import {
  getEmailReadiness,
  sendRecoveryEmail,
} from "./lib/emailSender.js";
import { installGuidedAuditRoute } from "./routes/guidedAudit.esm.js";
import { installSmcAlign } from "./smc-align.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const fixAuditLeadsPath = join(repoRoot, ".tmp", "fix_audit_leads.json");
const fixAuditPayloadsPath = join(repoRoot, ".tmp", "fix_audit_payloads.json");

for (const envPath of [
  resolve(repoRoot, ".env"),
  resolve(repoRoot, "web", ".env"),
  resolve(repoRoot, "staffordos", "dev", ".env.abando.local"),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

function normalizeStoreInput(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0]
    .trim()
    .toLowerCase();
}

function normalizeEmail(value = "") {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function readFixAuditLeads() {
  try {
    const raw = await readFile(fixAuditLeadsPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function saveFixAuditLeads(records) {
  await mkdir(join(repoRoot, ".tmp"), { recursive: true });
  await writeFile(fixAuditLeadsPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

async function createFixAuditLead({ storeUrl, email, analysis }) {
  const records = await readFixAuditLeads();
  const record = {
    leadId: `fix_lead_${Date.now()}`,
    storeUrl: normalizeStoreInput(storeUrl),
    email: normalizeEmail(email),
    source: "fix_page",
    analysis,
    createdAt: new Date().toISOString(),
  };
  records.push(record);
  await saveFixAuditLeads(records);
  return record;
}

async function readFixAuditPayloads() {
  try {
    const raw = await readFile(fixAuditPayloadsPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { byStore: {}, lastPayload: null };
    }
    return {
      byStore: parsed.byStore && typeof parsed.byStore === "object" ? parsed.byStore : {},
      lastPayload: parsed.lastPayload || null,
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return { byStore: {}, lastPayload: null };
    }
    throw error;
  }
}

async function saveFixAuditPayloads(registry) {
  await mkdir(join(repoRoot, ".tmp"), { recursive: true });
  await writeFile(fixAuditPayloadsPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function saveCanonicalPayload(payload) {
  const registry = await readFixAuditPayloads();
  registry.byStore[payload.store_domain] = payload;
  registry.lastPayload = payload;
  await saveFixAuditPayloads(registry);
}

function summarizeFixAuditIssues(issues) {
  if (!Array.isArray(issues)) return [];
  return issues
    .filter((issue) => issue && typeof issue === "object")
    .slice(0, 3)
    .map((issue) => ({
      title: String(issue.title || "").trim(),
      detail: String(issue.detail || "").trim(),
      severity: String(issue.severity || "").trim(),
    }))
    .filter((issue) => issue.title);
}

function buildCanonicalPayload({ storeUrl, analysis }) {
  const normalizedStore = normalizeStoreInput(storeUrl);
  const issues = summarizeFixAuditIssues(analysis?.issues);
  const payload = {
    store_domain: normalizedStore,
    audit_score: Number(analysis?.opportunityScore),
    estimated_revenue_loss: String(analysis?.estimatedLoss?.display || "").trim(),
    top_issue: String(issues[0]?.title || "").trim(),
    recommended_action: String(analysis?.benchmark?.recommendation || "").trim(),
    issues: issues.map((issue) => issue.title),
    generated_at: new Date().toISOString(),
  };

  assertCanonicalPayload(payload);
  return payload;
}

function assertCanonicalPayload(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.store_domain !== "string" || payload.store_domain.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.audit_score !== "number" || Number.isNaN(payload.audit_score)) {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.estimated_revenue_loss !== "string" || payload.estimated_revenue_loss.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.top_issue !== "string" || payload.top_issue.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.recommended_action !== "string" || payload.recommended_action.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (!Array.isArray(payload.issues) || payload.issues.some((issue) => typeof issue !== "string" || issue.trim() === "")) {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  if (typeof payload.generated_at !== "string" || payload.generated_at.trim() === "") {
    throw new Error("INVALID_AUDIT_PAYLOAD");
  }

  return payload;
}

const app = express();
installSmcAlign(app);

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, service: "cart-agent-api", route: "/" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "cart-agent-api" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "cart-agent-api" });
});

app.get("/api/runtime-proof", (_req, res) => {
  const emailReadiness = getEmailReadiness();
  res.status(200).json({
    ok: true,
    service: "cart-agent-api",
    email: {
      ready: emailReadiness.ready,
      missing: emailReadiness.missing,
      sender: emailReadiness.sender || null,
    },
  });
});

app.get("/api/debug-last-payload", async (req, res) => {
  try {
    const registry = await readFixAuditPayloads();
    const store = normalizeStoreInput(req.query?.store || "");
    const payload = store ? registry.byStore[store] || null : registry.lastPayload;

    if (!payload) {
      return res.status(404).json({ ok: false, error: "payload_not_found" });
    }

    return res.status(200).json({ ok: true, payload });
  } catch (error) {
    console.error("[debug-last-payload] error:", error);
    return res.status(500).json({ ok: false, error: "debug_payload_failed" });
  }
});

app.get("/api/fix-audit", async (req, res) => {
  try {
    const storeUrl = normalizeStoreInput(req.query?.store || "");
    if (!storeUrl) {
      return res.status(400).json({ ok: false, error: "invalid_fix_audit_store" });
    }

    const registry = await readFixAuditPayloads();
    const payload = registry.byStore[storeUrl] || null;

    if (!payload) {
      return res.status(404).json({ ok: false, error: "audit_payload_not_found" });
    }

    return res.status(200).json({ ok: true, payload });
  } catch (error) {
    console.error("[fix-audit:get] error:", error);
    return res.status(500).json({ ok: false, error: "fix_audit_failed" });
  }
});

app.post("/api/fix-audit", async (req, res) => {
  try {
    const storeUrl = normalizeStoreInput(req.body?.storeUrl);
    const email = normalizeEmail(req.body?.email);

    if (!storeUrl || !email) {
      return res.status(400).json({ ok: false, error: "invalid_fix_audit_input" });
    }

    const analysis = await analyzeStore(storeUrl);
    const lead = await createFixAuditLead({ storeUrl, email, analysis });
    const payload = buildCanonicalPayload({ storeUrl, analysis });
    await saveCanonicalPayload(payload);

    const emailReadiness = getEmailReadiness();
    console.log("[SHOPIFIXER EMAIL] attempt", {
      storeUrl,
      email,
      smtpReady: emailReadiness.ready,
      smtpEnvPresent: emailReadiness.missing.length === 0,
    });

    const emailResult = await sendRecoveryEmail({
      to: email,
      payload,
    });

    if (emailResult?.success) {
      console.log("[SHOPIFIXER EMAIL] sent", {
        messageId: emailResult?.messageId || null,
      });
    } else {
      console.error("[SHOPIFIXER EMAIL ERROR]", {
        error: String(emailResult?.error || "unknown_email_error"),
      });
    }

    return res.status(200).json({
      ok: true,
      leadId: lead.leadId,
      analysis,
      payload,
      emailAttempted: true,
      emailSent: Boolean(emailResult?.success),
      emailError: emailResult?.success ? "" : String(emailResult?.error || ""),
    });
  } catch (error) {
    console.error("[fix-audit] error:", error);
    return res.status(500).json({ ok: false, error: "fix_audit_failed" });
  }
});

const port = Number(process.env.PORT || 8081);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`invalid_port:${process.env.PORT || ""}`);
}
installGuidedAuditRoute(app);

app.listen(port, () => {
  console.log(`[server] listening on :${port}`);
});

export default app;

app.get('/__build-check', (req, res) => {
  res.json({
    status: 'ok',
    marker: 'build-check-v1',
    time: new Date().toISOString()
  });
});

