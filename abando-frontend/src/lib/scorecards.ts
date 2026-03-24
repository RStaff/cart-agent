import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { PublicScorecard } from "@/lib/scorecardTypes";

type ScorecardPayload = {
  scorecards?: PublicScorecard[];
};

function findCanonicalRoot() {
  const candidates = [process.cwd(), resolve(process.cwd(), ".."), resolve(process.cwd(), "../..")];

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "staffordos", "scorecards", "scorecards_output.json"))) {
      return candidate;
    }
  }

  return process.cwd();
}

function readPayload(): ScorecardPayload {
  const rootDir = findCanonicalRoot();
  const filePath = join(rootDir, "staffordos", "scorecards", "scorecards_output.json");

  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as ScorecardPayload;
  } catch {
    return { scorecards: [] };
  }
}

export function normalizeStoreInput(value: string) {
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

export function slugifyStoreInput(value: string) {
  return normalizeStoreInput(value)
    .replace(/\.myshopify\.com$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function listPublicScorecards() {
  return Array.isArray(readPayload().scorecards) ? readPayload().scorecards || [] : [];
}

export function findPublicScorecard(matchValue: string) {
  const normalized = normalizeStoreInput(matchValue);
  const slug = slugifyStoreInput(matchValue);

  return listPublicScorecards().find((scorecard) => {
    const scorecardDomain = normalizeStoreInput(scorecard.domain);
    const scorecardSlug = String(scorecard.slug || slugifyStoreInput(scorecard.domain));
    return normalized === scorecardDomain || normalized === scorecardSlug || slug === scorecardSlug;
  }) || null;
}

export function isDemoScorecardStore(shop: string) {
  return Boolean(findPublicScorecard(shop));
}

export function resolveRunAuditTarget(input: string) {
  const normalizedInput = normalizeStoreInput(input);
  const matched = findPublicScorecard(normalizedInput);

  if (matched) {
    return {
      matched: true,
      redirectPath: `/scorecard/${matched.slug}`,
      slug: matched.slug,
      shopDomain: matched.domain,
    };
  }

  return {
    matched: false,
    redirectPath: `/install/shopify?shop=${encodeURIComponent(normalizedInput)}`,
    slug: null,
    shopDomain: normalizedInput,
  };
}
