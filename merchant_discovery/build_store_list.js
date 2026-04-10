import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORE_LIST_PATH = join(__dirname, "store_list.json");
const REPORT_PATH = join(__dirname, "store_list.report.json");

function printUsage() {
  console.log(`Usage:
  node merchant_discovery/build_store_list.js --input-text "glossier.com, https://summerfridays.com"
  node merchant_discovery/build_store_list.js --input-file merchant_discovery/input_examples/sample_domains.txt
  node merchant_discovery/build_store_list.js --input-csv merchant_discovery/input_examples/sample_domains.csv --column url
  node merchant_discovery/build_store_list.js --input-csv merchant_discovery/input_examples/sample_domains.csv --column domain --replace`);
}

function parseArgs(argv) {
  const options = {
    inputText: "",
    inputFile: "",
    inputCsv: "",
    column: "",
    replace: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--input-text") {
      options.inputText = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--input-file") {
      options.inputFile = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--input-csv") {
      options.inputCsv = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--column") {
      options.column = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (arg === "--replace") {
      options.replace = true;
      continue;
    }

    throw new Error(`unknown_argument:${arg}`);
  }

  const providedModes = [options.inputText, options.inputFile, options.inputCsv].filter(Boolean).length;
  if (providedModes === 0) {
    throw new Error("input_required");
  }

  if (providedModes > 1) {
    throw new Error("multiple_input_modes_not_supported");
  }

  if (options.inputCsv && !options.column) {
    throw new Error("csv_column_required");
  }

  return options;
}

function splitTextInput(raw) {
  return String(raw || "")
    .split(/[\n,\r\t ]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsvRows(raw) {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = cells[index] || "";
      return row;
    }, {});
  });
}

export function normalizeDomain(rawValue) {
  const original = String(rawValue ?? "").trim();
  if (!original) {
    return { ok: false, reason: "blank_input", input: original };
  }

  const candidate = /^(https?:)?\/\//i.test(original) ? original : `https://${original}`;

  let hostname = "";
  try {
    hostname = new URL(candidate).hostname;
  } catch {
    return { ok: false, reason: "invalid_url", input: original };
  }

  const normalized = hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "")
    .trim();

  if (!normalized) {
    return { ok: false, reason: "empty_domain", input: original };
  }

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
    return { ok: false, reason: "invalid_domain", input: original };
  }

  return { ok: true, domain: normalized, input: original };
}

export async function readExistingStoreList() {
  try {
    const raw = await readFile(STORE_LIST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function readInputValues(options) {
  if (options.inputText) {
    return splitTextInput(options.inputText);
  }

  if (options.inputFile) {
    const raw = await readFile(resolve(options.inputFile), "utf8");
    return splitTextInput(raw);
  }

  if (options.inputCsv) {
    const raw = await readFile(resolve(options.inputCsv), "utf8");
    const rows = parseCsvRows(raw);
    return rows.map((row) => row[options.column] || "");
  }

  return [];
}

export function buildFinalStoreList(existingStores, acceptedDomains, replace) {
  const seen = new Set();
  const finalStores = [];
  const sources = replace ? acceptedDomains : [...existingStores, ...acceptedDomains];

  for (const store of sources) {
    if (seen.has(store)) {
      continue;
    }
    seen.add(store);
    finalStores.push(store);
  }

  return finalStores;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const existingStores = await readExistingStoreList();
  const inputValues = await readInputValues(options);
  const acceptedDomains = [];
  const rejectedInputs = [];

  for (const value of inputValues) {
    const normalized = normalizeDomain(value);
    if (!normalized.ok) {
      rejectedInputs.push({
        input: normalized.input,
        reason: normalized.reason,
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
    input_count: inputValues.length,
    valid_count: acceptedDomains.length,
    invalid_count: rejectedInputs.length,
    deduped_count: acceptedDomains.length - uniqueAcceptedDomains.length,
    final_total: finalStores.length,
    accepted_domains: uniqueAcceptedDomains,
    rejected_inputs: rejectedInputs,
  };

  await mkdir(__dirname, { recursive: true });
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
      "csv_column_required",
    ].includes(error.message)) {
      console.error(error.message);
      printUsage();
      process.exitCode = 1;
      return;
    }

    console.error("[build-store-list] failed", error);
    process.exitCode = 1;
  });
}
