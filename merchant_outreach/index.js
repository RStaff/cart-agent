#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = dirname(__dirname);
const LEADS_PATH = join(ROOT_DIR, "merchant_discovery", "low_score_leads.json");
const OUTPUT_PATH = join(__dirname, "outreach_messages.json");
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "http://localhost:3000";

async function readLowScoreLeads() {
  try {
    const raw = await readFile(LEADS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function normalizeRevenueOpportunity(lead) {
  const value =
    lead?.estimated_revenue_opportunity ??
    lead?.estimated_monthly_revenue_opportunity ??
    0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.round(numeric)) : 0;
}

function normalizeTopFriction(lead) {
  return String(lead?.top_friction || "checkout friction").replace(/_/g, " ");
}

function buildOutreachRecord(lead) {
  const store = String(lead?.store || "").trim();
  const checkoutScore = Number(lead?.checkout_score ?? lead?.score ?? 0);
  const estimatedRevenueOpportunity = normalizeRevenueOpportunity(lead);
  const topFriction = normalizeTopFriction(lead);
  const generatedAt = new Date().toISOString();

  return {
    store,
    subject: `Quick checkout insight for ${store}`,
    short_message: `Your checkout scored ${checkoutScore} and may be losing about $${estimatedRevenueOpportunity}/month due to ${topFriction}.`,
    full_message: `Hey — quick heads up.

I ran your Shopify checkout through a benchmark tool I built.

Your checkout scored ${checkoutScore} and appears to be losing about $${estimatedRevenueOpportunity}/month due to ${topFriction}.

You can review the benchmark here:
${PUBLIC_BASE_URL}/checkout_grader.html?store=${store}

If useful, Abando can help fix this automatically:
${PUBLIC_BASE_URL}/install.html

Happy to share the full analysis.`,
    generated_at: generatedAt,
  };
}

async function main() {
  const leads = await readLowScoreLeads();
  await mkdir(__dirname, { recursive: true });
  console.log(`Using PUBLIC_BASE_URL: ${PUBLIC_BASE_URL}`);

  if (leads.length === 0) {
    await writeFile(OUTPUT_PATH, "[]\n", "utf8");
    console.log("No low-score leads found. Wrote empty outreach_messages.json.");
    return;
  }

  const outreachMessages = leads.map(buildOutreachRecord);
  await writeFile(OUTPUT_PATH, JSON.stringify(outreachMessages, null, 2) + "\n", "utf8");
  console.log(`Generated ${outreachMessages.length} outreach message(s).`);
}

main().catch((error) => {
  console.error("Failed to generate outreach messages:", error);
  process.exit(1);
});
