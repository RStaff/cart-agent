import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_LIST_PATH = join(__dirname, "store_list.json");
const REPORT_PATH = join(__dirname, "ingest_fresh_shopify_supply.report.json");
const LEADS_STORE_PATH = join(__dirname, "..", "staffordos", "data", "leads_store.json");

function fail(message) {
  throw new Error(message);
}

function normalizeDomain(rawValue) {
  const original = String(rawValue ?? "").trim();
  if (!original) {
    return "";
  }

  const candidate = /^(https?:)?\/\//i.test(original) ? original : `https://${original}`;

  try {
    const hostname = new URL(candidate).hostname;
    const normalized = hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/\.$/, "")
      .trim();

    if (!normalized) {
      return "";
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
      return "";
    }

    return normalized;
  } catch {
    return "";
  }
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value);
      value = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function splitTextInput(text) {
  return String(text ?? "")
    .split(/[\n,\r]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function readInputCandidates(args) {
  const modes = [
    args.inputText ? "text" : "",
    args.inputFile ? "file" : "",
    args.inputCsv ? "csv" : "",
  ].filter(Boolean);

  if (modes.length !== 1) {
    fail("exactly_one_input_mode_required");
  }

  if (args.inputText) {
    return splitTextInput(args.inputText);
  }

  if (args.inputFile) {
    let raw;
    try {
      raw = await readFile(resolve(args.inputFile), "utf8");
    } catch (error) {
      if (error && error.code === "ENOENT") {
        fail(`input_file_missing:${resolve(args.inputFile)}`);
      }
      throw error;
    }
    return splitTextInput(raw);
  }

  if (!args.column) {
    fail("csv_column_required");
  }

  const normalizedColumn = String(args.column).trim().toLowerCase();
  if (normalizedColumn !== "domain" && normalizedColumn !== "url") {
    fail("csv_column_invalid");
  }

  let raw;
  try {
    raw = await readFile(resolve(args.inputCsv), "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      fail(`input_csv_missing:${resolve(args.inputCsv)}`);
    }
    throw error;
  }

  const rows = parseCsv(raw);
  if (rows.length === 0) {
    return [];
  }

  const header = rows[0].map((cell) => String(cell).trim().toLowerCase());
  const columnIndex = header.indexOf(normalizedColumn);
  if (columnIndex === -1) {
    fail(`csv_column_not_found:${normalizedColumn}`);
  }

  return rows.slice(1).map((row) => row[columnIndex] ?? "").map((value) => String(value).trim());
}

function parseArgs(argv) {
  const args = {
    inputText: "",
    inputFile: "",
    inputCsv: "",
    column: "",
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--input-text") {
      args.inputText = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--input-file") {
      args.inputFile = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--input-csv") {
      args.inputCsv = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--column") {
      args.column = argv[index + 1] || "";
      index += 1;
      continue;
    }

    fail(`unknown_argument:${arg}`);
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const inputCandidates = await readInputCandidates(args);
  const existingStoreList = await readJsonArray(
    STORE_LIST_PATH,
    "store_list_missing",
    "store_list_invalid_json",
    "store_list_not_array",
  );
  const canonicalLeads = await readJsonArray(
    LEADS_STORE_PATH,
    "canonical_store_missing",
    "canonical_store_invalid_json",
    "canonical_store_not_array",
  );

  const canonicalDomains = new Set(
    canonicalLeads
      .map((lead) => normalizeDomain(lead?.url || lead?.store))
      .filter(Boolean),
  );
  const storeListDomains = existingStoreList.map((entry) => normalizeDomain(entry)).filter(Boolean);
  const existingStoreSet = new Set(storeListDomains);

  const acceptedDomains = [];
  const acceptedSet = new Set();
  const rejected = [];

  let validCount = 0;
  let duplicateInCanonicalCount = 0;
  let duplicateInStoreListCount = 0;

  for (const input of inputCandidates) {
    const domain = normalizeDomain(input);

    if (!domain) {
      rejected.push({
        input,
        domain: "",
        reason: "invalid_domain",
      });
      continue;
    }

    validCount += 1;

    if (canonicalDomains.has(domain)) {
      duplicateInCanonicalCount += 1;
      rejected.push({
        input,
        domain,
        reason: "duplicate_in_canonical",
      });
      continue;
    }

    if (existingStoreSet.has(domain) || acceptedSet.has(domain)) {
      duplicateInStoreListCount += 1;
      rejected.push({
        input,
        domain,
        reason: "duplicate_in_store_list",
      });
      continue;
    }

    acceptedSet.add(domain);
    acceptedDomains.push(domain);
  }

  const nextStoreList = [...storeListDomains, ...acceptedDomains];
  await writeFile(STORE_LIST_PATH, JSON.stringify(nextStoreList, null, 2) + "\n", "utf8");

  const report = {
    input_count: inputCandidates.length,
    valid_count: validCount,
    duplicate_in_canonical_count: duplicateInCanonicalCount,
    duplicate_in_store_list_count: duplicateInStoreListCount,
    accepted_count: acceptedDomains.length,
    accepted_domains: acceptedDomains,
    rejected,
  };

  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
