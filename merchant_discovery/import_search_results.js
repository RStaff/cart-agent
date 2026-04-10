import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";
import {
  buildFinalStoreList,
  normalizeDomain,
  parseCsvRows,
  readExistingStoreList,
} from "./build_store_list.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_LIST_PATH = join(__dirname, "store_list.json");
const REPORT_PATH = join(__dirname, "import_search_results.report.json");

const BLOCKED_DOMAINS = new Set([
  "google.com",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "amazon.com",
  "shopify.com",
  "apps.shopify.com",
  "help.shopify.com",
  "developer.shopify.com",
]);

function printUsage() {
  console.log(`Usage:
  node merchant_discovery/import_search_results.js --input-file merchant_discovery/input_examples/search_results.txt
  node merchant_discovery/import_search_results.js --input-file merchant_discovery/input_examples/search_results.csv --replace
  node merchant_discovery/import_search_results.js --input-text "Glossier — https://www.glossier.com ... Summer Fridays — https://summerfridays.com ..."`);
}

function parseArgs(argv) {
  const options = {
    inputFile: "",
    inputText: "",
    replace: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--input-file") {
      options.inputFile = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--input-text") {
      options.inputText = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--replace") {
      options.replace = true;
      continue;
    }

    throw new Error(`unknown_argument:${arg}`);
  }

  const providedModes = [options.inputFile, options.inputText].filter(Boolean).length;
  if (providedModes === 0) {
    throw new Error("input_required");
  }

  if (providedModes > 1) {
    throw new Error("multiple_input_modes_not_supported");
  }

  return options;
}

function extractCandidates(raw) {
  const text = String(raw || "");
  const urlMatches = text.match(/https?:\/\/[^\s)",]+|www\.[^\s)",]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)",]*)?/gi) || [];
  return urlMatches.map((value) => value.trim()).filter(Boolean);
}

function isBlockedDomain(domain) {
  return BLOCKED_DOMAINS.has(domain);
}

async function readInputRaw(options) {
  if (options.inputText) {
    return options.inputText;
  }

  const raw = await readFile(resolve(options.inputFile), "utf8");
  if (options.inputFile.toLowerCase().endsWith(".csv")) {
    const rows = parseCsvRows(raw);
    return rows.map((row) => Object.values(row).join(" ")).join("\n");
  }

  return raw;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const existingStores = await readExistingStoreList();
  const raw = await readInputRaw(options);
  const extractedCandidates = extractCandidates(raw);
  const acceptedDomains = [];
  const rejectedDomains = [];

  for (const candidate of extractedCandidates) {
    const normalized = normalizeDomain(candidate);
    if (!normalized.ok) {
      rejectedDomains.push({
        input: normalized.input,
        reason: normalized.reason,
      });
      continue;
    }

    if (isBlockedDomain(normalized.domain)) {
      rejectedDomains.push({
        input: normalized.input,
        domain: normalized.domain,
        reason: "blocked_domain",
      });
      continue;
    }

    acceptedDomains.push(normalized.domain);
  }

  const uniqueAcceptedDomains = [];
  const localSeen = new Set();
  for (const domain of acceptedDomains) {
    if (localSeen.has(domain)) {
      continue;
    }
    localSeen.add(domain);
    uniqueAcceptedDomains.push(domain);
  }

  const finalStores = buildFinalStoreList(existingStores, uniqueAcceptedDomains, options.replace);
  const report = {
    mode: options.replace ? "replace" : "merge",
    input_count: extractedCandidates.length,
    valid_count: acceptedDomains.length,
    invalid_count: rejectedDomains.length,
    deduped_count: acceptedDomains.length - uniqueAcceptedDomains.length,
    final_total: finalStores.length,
    accepted_domains: uniqueAcceptedDomains,
    rejected_domains: rejectedDomains,
  };

  await writeFile(STORE_LIST_PATH, JSON.stringify(finalStores, null, 2) + "\n", "utf8");
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(JSON.stringify(report, null, 2));
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    if (error instanceof Error && [
      "input_required",
      "multiple_input_modes_not_supported",
    ].includes(error.message)) {
      console.error(error.message);
      printUsage();
      process.exitCode = 1;
      return;
    }

    console.error("[import-search-results] failed", error);
    process.exitCode = 1;
  });
}
