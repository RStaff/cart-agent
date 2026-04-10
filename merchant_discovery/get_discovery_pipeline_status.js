import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DISCOVERY_PATH = join(__dirname, "low_score_leads.json");
const CANONICAL_PATH = join(__dirname, "..", "staffordos", "data", "leads_store.json");

function fail(message) {
  throw new Error(message);
}

async function readJsonArray(path, missingLabel, invalidLabel, notArrayLabel) {
  let raw;

  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      fail(`${missingLabel}:${path}`);
    }
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail(`${invalidLabel}:${path}`);
  }

  if (!Array.isArray(parsed)) {
    fail(`${notArrayLabel}:${path}`);
  }

  return parsed;
}

function normalizeDomain(input) {
  const original = String(input ?? "").trim();
  if (!original) {
    return "";
  }

  const candidate = /^(https?:)?\/\//i.test(original) ? original : `https://${original}`;

  try {
    const hostname = new URL(candidate).hostname;
    return hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "").trim();
  } catch {
    return "";
  }
}

function derivePipelineStatus(totalCandidates, validCandidates, backlogCount, activeCount, unimportedCandidates) {
  if (totalCandidates === 0) {
    return "empty";
  }

  if (totalCandidates > 0 && validCandidates === 0) {
    return "blocked";
  }

  if (unimportedCandidates > 0) {
    return "stale";
  }

  if (unimportedCandidates === 0 && backlogCount > 0) {
    return "healthy";
  }

  if (unimportedCandidates === 0 && backlogCount === 0 && activeCount === 0) {
    return "drained";
  }

  return "healthy";
}

async function main() {
  const discoveryLeads = await readJsonArray(
    DISCOVERY_PATH,
    "discovery_file_missing",
    "discovery_invalid_json",
    "discovery_not_array",
  );
  const canonicalLeads = await readJsonArray(
    CANONICAL_PATH,
    "canonical_file_missing",
    "canonical_invalid_json",
    "canonical_not_array",
  );

  const discoveryDomains = discoveryLeads.map((lead) => normalizeDomain(lead?.store));
  const validDiscoveryDomains = discoveryDomains.filter(Boolean);
  const uniqueValidDiscoveryDomains = new Set(validDiscoveryDomains);

  const canonicalDomains = new Set(
    canonicalLeads
      .map((lead) => normalizeDomain(lead?.url || lead?.store))
      .filter(Boolean),
  );

  let duplicateCandidates = 0;
  let unimportedCandidates = 0;

  for (const domain of uniqueValidDiscoveryDomains) {
    if (canonicalDomains.has(domain)) {
      duplicateCandidates += 1;
    } else {
      unimportedCandidates += 1;
    }
  }

  const backlog = canonicalLeads.filter((lead) => lead?.status === "backlog").length;
  const active = canonicalLeads.filter((lead) => lead?.status === "active").length;
  const sent = canonicalLeads.filter((lead) => lead?.status === "sent").length;

  const result = {
    discovery: {
      total_candidates: discoveryLeads.length,
      valid_candidates: validDiscoveryDomains.length,
    },
    canonical: {
      total_leads: canonicalLeads.length,
      backlog,
      active,
      sent,
    },
    pipeline: {
      unimported_candidates: unimportedCandidates,
      duplicate_candidates: duplicateCandidates,
      last_import_detected: duplicateCandidates > 0,
      status: derivePipelineStatus(
        discoveryLeads.length,
        validDiscoveryDomains.length,
        backlog,
        active,
        unimportedCandidates,
      ),
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
