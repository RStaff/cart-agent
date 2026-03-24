#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const INPUT_PATH = ".tmp/shopify_dev_leads.json";
const OUTPUT_PATH = ".tmp/shopify_outreach.json";
const FOLLOW_UP_OUTPUT_PATH = ".tmp/shopify_followups.json";

function normalizeName(name) {
  const value = String(name || "").trim();
  return value || "there";
}

function normalizeProblem(problem) {
  return String(problem || "a Shopify app dev issue").trim() || "a Shopify app dev issue";
}

function problemPhrase(problem) {
  const value = normalizeProblem(problem);
  return /\bissue\b/i.test(value) ? value : `${value} issue`;
}

const outreachVariations = [
  (name, problem) => [
    `Hey ${normalizeName(name)} — saw your issue about ${normalizeProblem(problem)}.`,
    "I’ve been fixing a lot of Shopify app dev problems like this lately, especially around tunnels, preview URLs, and embedded apps not loading.",
    "If you want, I can take a quick look and help you get it stable.",
  ].join("\n\n"),
  (name, problem) => [
    `Hey ${normalizeName(name)} — your post about ${normalizeProblem(problem)} stood out.`,
    "I just worked through a very similar Shopify app dev problem and ended up with a stable fix path for it.",
    "Happy to take a quick look if you want another set of eyes on it.",
  ].join("\n\n"),
  (name, problem) => [
    `Hey ${normalizeName(name)} — saw the issue you hit with ${normalizeProblem(problem)}.`,
    "This is very close to a Shopify dev setup problem I recently cleaned up around preview, tunnel, and embedded loading behavior.",
    "If it helps, I can take a quick look and point you at the fastest stable path.",
  ].join("\n\n"),
];

const followUpVariations = [
  (name, problem) => [
    `Hey ${normalizeName(name)} — following up on your ${problemPhrase(problem)}.`,
    "I’m still pretty sure I could help you get it stable quickly if it’s still blocking you.",
    "If you want, send over the setup details and I’ll take a look.",
  ].join("\n\n"),
  (name, problem) => [
    `Hey ${normalizeName(name)} — circling back on the ${problemPhrase(problem)} you mentioned.`,
    "I’ve been deep in these Shopify app dev issues lately, and this still looks like something I could help untangle fast.",
    "Happy to take a quick look if it would be useful.",
  ].join("\n\n"),
];

export function buildMessage(name, detectedProblem, index = 0) {
  const variant = outreachVariations[index % outreachVariations.length];
  return variant(name, detectedProblem);
}

export function buildFollowUpMessage(name, detectedProblem, index = 0) {
  const variant = followUpVariations[index % followUpVariations.length];
  return variant(name, detectedProblem);
}

export async function main() {
  const raw = await readFile(INPUT_PATH, "utf8");
  const leads = JSON.parse(raw);

  if (!Array.isArray(leads)) {
    throw new Error("Expected an array in .tmp/shopify_dev_leads.json");
  }

  const messages = leads.map((lead, index) => ({
    name: normalizeName(lead?.name),
    url: String(lead?.url || "").trim(),
    message: buildMessage(lead?.name, lead?.detectedProblem, index),
    followUpMessage: buildFollowUpMessage(lead?.name, lead?.detectedProblem, index),
  }));

  await mkdir(".tmp", { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(messages, null, 2)}\n`, "utf8");
  await writeFile(
    FOLLOW_UP_OUTPUT_PATH,
    `${JSON.stringify(messages.map(({ name, url, followUpMessage }) => ({ name, url, message: followUpMessage })), null, 2)}\n`,
    "utf8",
  );

  console.table(
    messages.map((item) => ({
      name: item.name,
      url: item.url,
      message: item.message.replace(/\n+/g, " "),
    })),
  );

  console.log(`\nSaved ${messages.length} messages to ${OUTPUT_PATH}`);
  console.log(`Saved ${messages.length} follow-ups to ${FOLLOW_UP_OUTPUT_PATH}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[outreach] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
