#!/usr/bin/env node

import { answerAskAbando } from "./askAbandoEngine.js";

function fail(message, context = {}) {
  console.error(JSON.stringify({ ok: false, message, context }, null, 2));
  process.exit(1);
}

const slug = "northstar-outdoors";
const questions = [
  "How did you calculate this?",
  "What is the biggest issue?",
  "Is this real revenue?",
  "What happens if I install Abando?",
  "Can you explain this page?",
];

const outputs = questions.map((question) => ({
  question,
  response: answerAskAbando({ slug, question }),
}));

for (const item of outputs) {
  if (!item.response?.ok || !item.response?.answer || !item.response?.intent) {
    fail("Ask Abando response missing required fields", item);
  }
}

if (!outputs[2].response.answer.toLowerCase().includes("estimated revenue opportunity")) {
  fail("IS_THIS_REAL answer did not preserve the estimate vs real-tracking boundary", outputs[2]);
}

console.log(JSON.stringify({
  ok: true,
  slug,
  outputs: outputs.map((item) => ({
    question: item.question,
    intent: item.response.intent,
    answer: item.response.answer,
  })),
}, null, 2));
