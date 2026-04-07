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

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const fixAuditLeadsPath = join(repoRoot, ".tmp", "fix_audit_leads.json");

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

function summarizeFixAuditIssues(issues) {
  if (!Array.isArray(issues)) return [];
  return issues
    .filter((issue) => issue && typeof issue === "object")
    .slice(0, 3)
    .map((issue) => ({
      title: String(issue.title || "Issue").trim(),
      detail: String(issue.detail || "").trim(),
      severity: String(issue.severity || "").trim(),
    }));
}

function formatFixAuditEmailContent({ storeUrl, analysis }) {
  const normalizedStore = normalizeStoreInput(storeUrl);
  const opportunityScore = Number(analysis?.opportunityScore || 0);
  const estimatedLoss = String(analysis?.estimatedLoss?.display || "Not available").trim();
  const topFriction = String(analysis?.benchmark?.topFriction || "Not detected").trim().replace(/_/g, " ");
  const recommendation = String(analysis?.benchmark?.recommendation || "No recommendation available").trim();
  const issueSummary = summarizeFixAuditIssues(analysis?.issues);
  const paymentUrl = "https://buy.stripe.com/28E3cw7G4brNg1Vg0d00000";

  const issueLines = issueSummary.length > 0
    ? issueSummary.map((issue) => {
        const parts = [issue.title];
        if (issue.detail) parts.push(issue.detail);
        if (issue.severity) parts.push(`Severity: ${issue.severity}`);
        return `- ${parts.join(" — ")}`;
      }).join("\n")
    : "- No specific issues were returned.";

  const text = [
    `Your Shopifixer audit for ${normalizedStore}`,
    "",
    `Store: ${normalizedStore}`,
    `Opportunity Score: ${opportunityScore}`,
    `Estimated Revenue Loss: ${estimatedLoss}`,
    `Top Friction: ${topFriction}`,
    "",
    "Top issues:",
    issueLines,
    "",
    `Recommended next fix: ${recommendation}`,
    "",
    "I can fix your highest-impact issue within 48 hours.",
    "",
    "This is not just a report — I implement the fix for you (or provide exact steps if access isn’t available).",
    "",
    "What you get:",
    "- one high-impact conversion fix",
    "- clear before/after explanation",
    "- delivered within 48 hours",
    "",
    `Flat $99: ${paymentUrl}`,
  ].join("\n");

  const issueHtml = issueSummary.length > 0
    ? issueSummary.map((issue) => {
        const detail = issue.detail ? `<div style="color:#475569;margin-top:4px;">${escapeHtml(issue.detail)}</div>` : "";
        const severity = issue.severity ? `<div style="color:#64748b;margin-top:4px;font-size:13px;">Severity: ${escapeHtml(issue.severity)}</div>` : "";
        return `<li style="margin:0 0 12px;"><strong>${escapeHtml(issue.title)}</strong>${detail}${severity}</li>`;
      }).join("")
    : `<li style="margin:0 0 12px;">No specific issues were returned.</li>`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;">Your Shopifixer audit for ${escapeHtml(normalizedStore)}</h1>
      <p style="margin:0 0 8px;"><strong>Store:</strong> ${escapeHtml(normalizedStore)}</p>
      <p style="margin:0 0 8px;"><strong>Opportunity Score:</strong> ${escapeHtml(String(opportunityScore))}</p>
      <p style="margin:0 0 8px;"><strong>Estimated Revenue Loss:</strong> ${escapeHtml(estimatedLoss)}</p>
      <p style="margin:0 0 20px;"><strong>Top Friction:</strong> ${escapeHtml(topFriction)}</p>
      <h2 style="margin:0 0 12px;font-size:18px;">Top issues</h2>
      <ul style="padding-left:20px;margin:0 0 20px;">${issueHtml}</ul>
      <p style="margin:0 0 20px;"><strong>Recommended next fix:</strong> ${escapeHtml(recommendation)}</p>
      <div style="margin-top:24px;padding:20px;border:1px solid #cbd5e1;border-radius:14px;background:#f8fafc;">
        <p style="margin:0 0 12px;color:#0f172a;font-weight:700;">I can fix your highest-impact issue within 48 hours.</p>
        <p style="margin:0 0 12px;color:#334155;">This is not just a report — I implement the fix for you (or provide exact steps if access isn’t available).</p>
        <p style="margin:0 0 8px;color:#0f172a;font-weight:700;">What you get:</p>
        <ul style="padding-left:20px;margin:0 0 16px;color:#334155;">
          <li style="margin:0 0 8px;">one high-impact conversion fix</li>
          <li style="margin:0 0 8px;">clear before/after explanation</li>
          <li style="margin:0;">delivered within 48 hours</li>
        </ul>
        <p style="margin:0 0 8px;color:#0f172a;font-weight:700;">Flat $99</p>
        <p style="margin:0;"><a href="${paymentUrl}" style="color:#0f172a;font-weight:700;">${paymentUrl}</a></p>
      </div>
    </div>
  </body>
</html>`;

  return {
    subject: `Your Shopifixer audit for ${normalizedStore}`,
    text,
    html,
  };
}

const app = express();

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

app.post("/api/fix-audit", async (req, res) => {
  try {
    const storeUrl = normalizeStoreInput(req.body?.storeUrl);
    const email = normalizeEmail(req.body?.email);

    if (!storeUrl || !email) {
      return res.status(400).json({ ok: false, error: "invalid_fix_audit_input" });
    }

    const analysis = await analyzeStore(storeUrl);
    const lead = await createFixAuditLead({ storeUrl, email, analysis });

    const emailContent = formatFixAuditEmailContent({ storeUrl, analysis });
    const emailReadiness = getEmailReadiness();
    console.log("[SHOPIFIXER EMAIL] attempt", {
      storeUrl,
      email,
      smtpReady: emailReadiness.ready,
      smtpEnvPresent: emailReadiness.missing.length === 0,
    });

    const emailResult = await sendRecoveryEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (emailResult?.success) {
      console.log("[SHOPIFIXER EMAIL] sent", {
        messageId: emailResult?.messageId || null,
      });
    } else {
      console.error("[SHOPIFIXER EMAIL ERROR]", {
        error: String(emailResult?.error || "unknown_email_error"),
        stack: emailResult?.stack || null,
      });
    }

    return res.status(200).json({
      ok: true,
      leadId: lead.leadId,
      analysis,
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

app.listen(port, () => {
  console.log(`[server] listening on :${port}`);
});

export default app;
