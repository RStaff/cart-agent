#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEADS_PATH = resolve(__dirname, "leads.json");
const OUTPUT_PATH = resolve(__dirname, "outreach_ready.json");

async function readLeads() {
  const raw = await readFile(LEADS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("invalid_leads_json");
  }
  return parsed;
}

function cleanStoreDomain(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function formatMoney(amount) {
  const value = Number(amount || 0);
  return `$${value.toLocaleString("en-US")}`;
}

function formatFriction(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeInsight(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericInsight(value) {
  const normalized = normalizeInsight(value).toLowerCase();

  if (!normalized) {
    return true;
  }

  const genericPhrases = new Set([
    "friction in the buying flow",
    "conversion friction",
    "friction",
    "buying flow friction",
    "checkout friction",
    "not detected",
    "unknown",
  ]);

  return genericPhrases.has(normalized);
}

function bestInsight(lead) {
  const primaryIssue = normalizeInsight(lead?.primaryIssue);
  const topFriction = normalizeInsight(lead?.topFriction);

  if (primaryIssue && !isGenericInsight(primaryIssue)) {
    return primaryIssue;
  }

  if (topFriction && !isGenericInsight(topFriction)) {
    return topFriction;
  }

  if (primaryIssue) {
    return primaryIssue;
  }

  if (topFriction) {
    return topFriction;
  }

  return "friction in the buying flow";
}

function isPriorityLead(lead) {
  const tier = String(lead?.tier || "").trim().toUpperCase();
  const rank = Number(lead?.rank || 0);
  return tier === "A" || (rank > 0 && rank <= 3);
}

function consequenceLine(lead) {
  const topFriction = normalizeInsight(lead?.topFriction);
  const estimatedLossHigh = Number(lead?.estimatedLossHigh || 0);

  if (topFriction && !isGenericInsight(topFriction) && estimatedLossHigh > 0) {
    return `That can create hesitation around ${topFriction} and put roughly ${formatMoney(estimatedLossHigh)} at risk.`;
  }

  if (topFriction && !isGenericInsight(topFriction)) {
    return `That can create hesitation around ${topFriction}, especially late in the path to purchase.`;
  }

  if (estimatedLossHigh > 0) {
    return `That kind of issue can quietly suppress conversion and leave roughly ${formatMoney(estimatedLossHigh)} on the table.`;
  }

  return "That can create hesitation later in the path to purchase.";
}

function practicalLine(lead) {
  const topFriction = normalizeInsight(lead?.topFriction);
  const opportunityScore = Number(lead?.opportunityScore || 0);
  const priorityLead = isPriorityLead(lead);

  if (topFriction && !isGenericInsight(topFriction)) {
    if (priorityLead) {
      return `The clearest issue still looks like ${topFriction}. It came through as one of the stronger issues in the audit.`;
    }

    return `The clearest issue still looks like ${topFriction}.`;
  }

  if (priorityLead) {
    return "This was one of the stronger issues in the audit.";
  }

  if (opportunityScore > 0) {
    return `It still looks worth fixing given the opportunity score on the audit.`;
  }

  return "It still looks worth fixing from a conversion standpoint.";
}

function performanceLeadLine(lead) {
  const score = Number(lead?.pageSpeedScore);
  const fcp = String(lead?.pageSpeedFcp || "").trim();
  const lcp = String(lead?.pageSpeedLcp || "").trim();
  const tbt = String(lead?.pageSpeedTbt || "").trim();

  if (!Number.isFinite(score)) {
    return null;
  }

  const pct = Math.round(score * 100);
  const parts = [`mobile performance came back around ${pct}/100`];

  if (fcp) parts.push(`FCP ${fcp}`);
  if (lcp) parts.push(`LCP ${lcp}`);
  if (tbt) parts.push(`TBT ${tbt}`);

  return parts.join(", ");
}

function generateFirstEmail(lead) {
  const storeUrl = String(lead?.storeUrl || "").trim();
  const cleanDomain = cleanStoreDomain(storeUrl);
  const auditLink = buildAuditLink(cleanDomain);
  const perfLine = performanceLeadLine(lead);

  return {
    firstEmailSubject: `Quick audit result for ${cleanDomain}`,
    firstEmailBody: [
      `Hey — I ran a quick audit on ${cleanDomain} and found the first place I’d look for lost conversions.`,
      perfLine ? "" : null,
      perfLine ? `One real signal: ${perfLine}.` : null,
      "",
      "I put the result here:",
      auditLink,
      "",
      "If I’m off, ignore this.",
      "",
      "If I’m right, you can grab the exact first fix from there.",
      "",
      "– Ross",
    ].filter(Boolean).join("\n"),
  };
}

function generateSecondEmail(lead) {
  const storeUrl = String(lead?.storeUrl || "").trim();
  const insight = bestInsight(lead);

  return {
    secondEmailSubject: `Following up on ${storeUrl}`,
    secondEmailBody: [
      "Following up on this.",
      "",
      `The clearest issue I noticed on ${storeUrl} was ${insight}.`,
      "",
      practicalLine(lead),
      "",
      "If helpful, I can send over the first change I'd test.",
      "",
      "– Ross",
    ].join("\n"),
  };
}

function buildAuditLink(storeUrl) {
  const rawBase =
    process.env.SHOPIFIXER_PUBLIC_BASE ||
    process.env.SHOPIFIXER_AUDIT_BASE_URL ||
    "https://staffordmedia.ai";
  const base = String(rawBase || "https://staffordmedia.ai").replace(/\/$/, "");
  const cleanDomain = cleanStoreDomain(storeUrl);
  return `${base}/audit-result?store=${encodeURIComponent(cleanDomain)}`;
}

function generateThirdEmail(lead) {
  const storeUrl = String(lead?.storeUrl || "").trim();
  const insight = bestInsight(lead);
  const topFriction = normalizeInsight(lead?.topFriction);
  const priorityLead = isPriorityLead(lead);

  const contextLine =
    topFriction && !isGenericInsight(topFriction)
      ? priorityLead
        ? `I still think ${insight} is worth looking at. It came through as one of the stronger issues in the audit, with ${topFriction} showing up clearly.`
        : `I still think ${insight} is worth looking at, especially with ${topFriction} showing up in the audit.`
      : priorityLead
        ? `I still think ${insight} is worth looking at. It came through as one of the stronger issues in the audit.`
        : `I still think ${insight} is worth looking at if conversion is softer than it should be.`;

  return {
    thirdEmailSubject: `Last note on ${storeUrl}`,
    thirdEmailBody: [
      "Last note from me.",
      "",
      contextLine,
      "",
      "If you reply, I can send the first fix I'd test. If not, no problem.",
      "",
      "– Ross",
    ].join("\n"),
  };
}

function buildSequence(lead) {
  return {
    ...lead,
    ...generateFirstEmail(lead),
    ...generateSecondEmail(lead),
    ...generateThirdEmail(lead),
  };
}

async function main() {
  const leads = await readLeads();
  const outreachReady = leads.map((lead) => {
    const withSequence = buildSequence(lead);
    console.log("GENERATED:", withSequence.storeUrl);
    return withSequence;
  });

  await writeFile(OUTPUT_PATH, `${JSON.stringify(outreachReady, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        generated: outreachReady.length,
        output: "outreach_ready.json",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[generate-followup-sequence] fatal:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
