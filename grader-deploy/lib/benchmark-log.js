import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(dirname(__dirname), "data");
const BENCHMARK_LOG_PATH = join(DATA_DIR, "checkout_benchmarks.json");
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

async function ensureDataFile() {
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await readFile(BENCHMARK_LOG_PATH, "utf8");
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      try {
        await writeFile(BENCHMARK_LOG_PATH, "[]\n", "utf8");
        return true;
      } catch (writeError) {
        console.warn("[benchmark-log] benchmark logging skipped", writeError);
        return false;
      }
    }
    console.warn("[benchmark-log] benchmark logging skipped", error);
    return false;
  }
}

async function readBenchmarkLog() {
  try {
    const ready = await ensureDataFile();
    if (!ready) {
      return [];
    }
    const raw = await readFile(BENCHMARK_LOG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[benchmark-log] benchmark logging skipped", error);
    return [];
  }
}

async function writeBenchmarkLog(records) {
  try {
    const ready = await ensureDataFile();
    if (!ready) {
      return false;
    }
    await writeFile(BENCHMARK_LOG_PATH, JSON.stringify(records, null, 2) + "\n", "utf8");
    return true;
  } catch (error) {
    console.warn("[benchmark-log] benchmark logging skipped", error);
    return false;
  }
}

function normalizeTimestamp(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function mostCommonFriction(records) {
  const counts = new Map();
  for (const record of records) {
    const friction = String(record?.top_friction || "").trim();
    if (!friction) continue;
    counts.set(friction, (counts.get(friction) || 0) + 1);
  }

  let best = null;
  let bestCount = -1;
  for (const [friction, count] of counts.entries()) {
    if (count > bestCount) {
      best = friction;
      bestCount = count;
    }
  }
  return best;
}

export async function appendBenchmarkRecord(benchmark) {
  try {
    const records = await readBenchmarkLog();
    const timestamp = new Date().toISOString();
    const nowMs = Date.parse(timestamp);
    const store = String(benchmark?.store || "").trim().toLowerCase();

    const duplicateExists = records.some((record) => {
      if (String(record?.store || "").trim().toLowerCase() !== store) {
        return false;
      }
      return nowMs - normalizeTimestamp(record.timestamp) < DUPLICATE_WINDOW_MS;
    });

    if (duplicateExists) {
      return { appended: false, reason: "duplicate_within_24h" };
    }

    const nextRecord = {
      store: benchmark.store,
      score: benchmark.checkout_score,
      top_friction: benchmark.top_friction,
      missing_signals: Array.isArray(benchmark.missing_signals) ? benchmark.missing_signals : [],
      detected_signals: Array.isArray(benchmark.detected_signals) ? benchmark.detected_signals : [],
      estimated_revenue_opportunity: Number(benchmark.estimated_revenue_opportunity || 0),
      timestamp,
    };

    records.push(nextRecord);
    const written = await writeBenchmarkLog(records);
    if (!written) {
      return { appended: false, reason: "logging_skipped" };
    }
    return { appended: true, record: nextRecord };
  } catch (error) {
    console.warn("[benchmark-log] benchmark logging skipped", error);
    return { appended: false, reason: "logging_skipped" };
  }
}

export async function getBenchmarkSummary() {
  try {
    const records = await readBenchmarkLog();
    const totalStoresAnalyzed = records.length;

    if (records.length === 0) {
      return {
        total_stores_analyzed: 0,
        average_score: 0,
        most_common_friction: null,
        average_revenue_opportunity: 0,
      };
    }

    const averageScore =
      records.reduce((sum, record) => sum + (Number(record?.score) || 0), 0) / records.length;
    const averageRevenueOpportunity =
      records.reduce(
        (sum, record) => sum + (Number(record?.estimated_revenue_opportunity) || 0),
        0,
      ) / records.length;

    return {
      total_stores_analyzed: totalStoresAnalyzed,
      average_score: Number(averageScore.toFixed(2)),
      most_common_friction: mostCommonFriction(records),
      average_revenue_opportunity: Number(averageRevenueOpportunity.toFixed(2)),
    };
  } catch (error) {
    console.warn("[benchmark-log] benchmark logging skipped", error);
    return {
      total_stores_analyzed: 0,
      average_score: 0,
      most_common_friction: null,
      average_revenue_opportunity: 0,
    };
  }
}
