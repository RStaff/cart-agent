const mode = process.argv[2] || "check";
const taskRaw = process.argv[3] || "";

const MAX_INPUT_LENGTH = 4096;

if (mode !== "check" && mode !== "normalize-task") {
  console.error("character integrity guard rejected input");
  process.exit(2);
}

if (taskRaw.length > MAX_INPUT_LENGTH || /\u0000/.test(taskRaw)) {
  console.error("character integrity guard rejected input");
  process.exit(2);
}

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

if (mode === "normalize-task") {
  console.log(taskNormalized);
} else {
  console.log(JSON.stringify(result, null, 2));
}
