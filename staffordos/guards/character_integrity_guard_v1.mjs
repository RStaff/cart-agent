import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";

const outDir = "staffordos/operator_daemon/output";
mkdirSync(outDir, { recursive: true });

const mode = process.argv[2] || "check";
const taskRaw = process.argv[3] || "";

function normalizeText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .trim();
}

function hasHiddenChars(value) {
  return /[\u00a0\u200b\u200c\u200d\ufeff]/.test(String(value || ""));
}

const taskNormalized = normalizeText(taskRaw);

const result = {
  schema: "staffordos.character_integrity_guard.v1",
  generated_at: new Date().toISOString(),
  mode,
  status: hasHiddenChars(taskRaw) ? "normalized_hidden_characters" : "passed",
  input: {
    task_raw_length: taskRaw.length,
    task_normalized: taskNormalized,
    hidden_characters_detected: hasHiddenChars(taskRaw)
  },
  proof: {
    character_integrity_checked: true,
    real_send: false,
    sent_messages: false,
    revenue_action: false
  }
};

writeFileSync(`${outDir}/character_integrity_guard_v1.json`, JSON.stringify(result, null, 2));

if (mode === "normalize-task") {
  console.log(taskNormalized);
} else {
  console.log(JSON.stringify(result, null, 2));
}
