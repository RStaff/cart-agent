#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

const MEMORY_PATH = ".tmp/reply_memory.json";

const TYPE_RULES = {
  interested: {
    phrases: ["can you help", "need help", "sounds good", "i'm stuck", "im stuck", "this is annoying", "yes"],
    intentSummary: "Lead sounds open to help and is likely ready for a direct next step.",
  },
  info_request: {
    phrases: [
      "what do you need",
      "how does it work",
      "what would you need from me",
      "what's the process",
      "whats the process",
      "what do i send",
      "what do you need from me",
      "process",
    ],
    intentSummary: "Lead wants to understand inputs and workflow before committing.",
  },
  pricing_objection: {
    phrases: ["$250", "too much", "price", "cost", "expensive", "feels high", "a lot"],
    intentSummary: "Lead is reacting to price and needs the fixed-scope value framed clearly.",
  },
  trust_objection: {
    phrases: [
      "how do i know",
      "will this actually work",
      "why should i trust",
      "have you done this before",
      "how do i trust",
      "proof",
    ],
    intentSummary: "Lead needs confidence that this is a real fix path and not generic advice.",
  },
  delay: {
    phrases: ["i'll try", "ill try", "maybe later", "not now", "let me try", "circle back", "later"],
    intentSummary: "Lead is deferring action and wants to keep the option open without committing now.",
  },
  not_interested: {
    phrases: ["no thanks", "i'm good", "im good", "solved it", "fixed already", "all set", "not interested"],
    intentSummary: "Lead is declining for now or believes the issue is already resolved.",
  },
};

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--leadId") {
      args.leadId = String(argv[index + 1] || "").trim();
      index += 1;
    } else if (token === "--text") {
      args.text = String(argv[index + 1] || "").trim();
      index += 1;
    }
  }
  return args;
}

async function readMemory() {
  try {
    const raw = await readFile(MEMORY_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeMemory(records) {
  await mkdir(".tmp", { recursive: true });
  await writeFile(MEMORY_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function detectFromText(text) {
  const lowered = String(text || "").toLowerCase();
  const scored = Object.entries(TYPE_RULES).map(([replyType, config]) => {
    const matchedSignals = config.phrases.filter((phrase) => lowered.includes(phrase));
    const score = matchedSignals.reduce((total, phrase) => total + (phrase.includes(" ") ? 2 : 1), 0);
    return { replyType, matchedSignals, score, intentSummary: config.intentSummary };
  });

  scored.sort((left, right) => right.score - left.score || right.matchedSignals.length - left.matchedSignals.length);
  const best = scored[0];

  if (!best || best.score < 2) {
    return {
      replyType: "unclear",
      confidence: 0.35,
      matchedSignals: [],
      intentSummary: "Lead intent is not clear enough yet; a clarifying response is safest.",
    };
  }

  const confidence = Math.min(0.98, 0.5 + best.score * 0.08 + best.matchedSignals.length * 0.04);
  return {
    replyType: best.replyType,
    confidence: Number(confidence.toFixed(2)),
    matchedSignals: best.matchedSignals,
    intentSummary: best.intentSummary,
  };
}

export async function detectReplyType(leadId, replyText) {
  if (!leadId) {
    throw new Error("missing_lead_id");
  }
  if (!String(replyText || "").trim()) {
    throw new Error("missing_reply_text");
  }

  const detected = detectFromText(replyText);
  const result = {
    ok: true,
    leadId,
    replyText: String(replyText).trim(),
    replyType: detected.replyType,
    confidence: detected.confidence,
    matchedSignals: detected.matchedSignals,
    intentSummary: detected.intentSummary,
  };

  const memory = await readMemory();
  memory.push({
    leadId: result.leadId,
    replyText: result.replyText,
    replyType: result.replyType,
    confidence: result.confidence,
    matchedSignals: result.matchedSignals,
    intentSummary: result.intentSummary,
    detectedAt: new Date().toISOString(),
  });
  await writeMemory(memory);

  console.log(JSON.stringify(result, null, 2));
  return result;
}

async function main() {
  const args = parseArgs(process.argv);
  await detectReplyType(args.leadId, args.text);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      ),
    );
    process.exit(1);
  });
}
