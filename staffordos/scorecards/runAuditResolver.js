import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCORECARD_PATH = path.resolve(__dirname, "scorecards_output.json");

function readScorecards() {
  try {
    const parsed = JSON.parse(fs.readFileSync(SCORECARD_PATH, "utf8"));
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed?.scorecards)) {
      return parsed.scorecards;
    }
    if (parsed && typeof parsed === "object" && typeof parsed.store === "string") {
      return [parsed];
    }
  } catch {}

  return [];
}

export function normalizeAuditInput(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

export function slugifyAuditInput(value) {
  return normalizeAuditInput(value)
    .replace(/\.myshopify\.com$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeMyShopifyDomain(value) {
  let normalized = normalizeAuditInput(value);
  if (normalized && !normalized.includes(".")) {
    normalized = `${normalized}.myshopify.com`;
  }
  if (!normalized.endsWith(".myshopify.com")) {
    return "";
  }
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
    return "";
  }
  return normalized;
}

function matchScorecard(input) {
  const normalizedInput = normalizeAuditInput(input);
  const inputSlug = slugifyAuditInput(input);

  for (const scorecard of readScorecards()) {
    const domain = normalizeAuditInput(scorecard.domain || scorecard.store);
    const slug = String(scorecard.slug || slugifyAuditInput(domain));
    const publicUrlSlug = slugifyAuditInput(scorecard.publicUrl || "");

    if (
      normalizedInput === domain ||
      normalizedInput === slug ||
      inputSlug === slug ||
      inputSlug === publicUrlSlug
    ) {
      return {
        scorecard,
        slug,
        shopDomain: domain,
      };
    }
  }

  return null;
}

export function resolveRunAuditTarget(input) {
  const normalizedInput = normalizeAuditInput(input);
  const match = matchScorecard(normalizedInput);

  if (match) {
    return {
      ok: true,
      input,
      normalizedInput,
      matched: true,
      slug: match.slug,
      shopDomain: match.shopDomain,
      redirectPath: `/scorecard/${encodeURIComponent(match.slug)}`,
      mode: "scorecard",
    };
  }

  const normalizedMyShopify = normalizeMyShopifyDomain(normalizedInput);
  const shopDomain = normalizedMyShopify || normalizedInput;

  return {
    ok: true,
    input,
    normalizedInput,
    matched: false,
    slug: null,
    shopDomain,
    redirectPath: shopDomain ? `/install/shopify?shop=${encodeURIComponent(shopDomain)}` : "/install/shopify",
    mode: "install_fallback",
  };
}

export function getRunAuditStats() {
  return {
    scorecardCount: readScorecards().length,
  };
}
