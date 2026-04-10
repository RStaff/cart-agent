function cleanText(value) {
  return String(value || "").trim();
}

function normalizeToken(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeStoreUrl(value) {
  const raw = cleanText(value);
  if (!raw) return { url: "", host: "" };

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return {
      url: `https://${host}`,
      host,
    };
  } catch {
    const host = raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();
    return { url: raw, host };
  }
}

function isRecognizedNiche(niche) {
  return [
    "fashion",
    "apparel",
    "beauty",
    "skincare",
    "home",
    "home decor",
    "outdoor",
  ].includes(normalizeToken(niche));
}

function hasCommercialStorePattern(host) {
  if (!host) return false;
  return /\.(com|co|shop|store|boutique|goods|example)$/.test(host)
    || host.includes("shop")
    || host.includes("store");
}

function hasShopifyStylePattern(host) {
  if (!host) return false;
  return host.includes("myshopify")
    || host.includes("shop")
    || host.endsWith(".store");
}

function hasKeywordAlignment(candidate, keyword) {
  const normalizedKeyword = normalizeToken(keyword);
  if (!normalizedKeyword) return false;

  const haystack = [
    candidate.company_name,
    candidate.store_url,
    candidate.contact_email,
    candidate.niche,
  ].map(normalizeToken).join(" ");

  return haystack.includes(normalizedKeyword);
}

function mapPriority(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

export function scoreCandidateLead(candidate = {}, options = {}) {
  const { host } = normalizeStoreUrl(candidate.store_url);
  const reasons = [];
  let score = 0;

  if (isRecognizedNiche(candidate.niche)) {
    score += 30;
    reasons.push("niche_fit");
  }

  if (cleanText(candidate.contact_email)) {
    score += 25;
    reasons.push("has_contact_email");
  }

  if (hasCommercialStorePattern(host)) {
    score += 20;
    reasons.push("commercial_store_pattern");
  }

  if (hasShopifyStylePattern(host)) {
    score += 15;
    reasons.push("likely_shopify_style");
  }

  if (hasKeywordAlignment(candidate, options.keyword)) {
    score += 10;
    reasons.push("keyword_alignment");
  }

  const queuePriority = mapPriority(score);

  return {
    icp_score: score,
    icp_reasons: reasons,
    queue_priority: queuePriority,
    should_queue: queuePriority === "high" || queuePriority === "medium",
  };
}

function main() {
  const payload = JSON.parse(process.argv[2] || "{}");
  console.log(JSON.stringify(scoreCandidateLead(payload.candidate || {}, payload.options || {}), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
