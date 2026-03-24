#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const secretsPath = resolve(repoRoot, ".secrets.json");

async function loadSecrets() {
  let raw;
  try {
    raw = await readFile(secretsPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      console.error("[secrets] missing .secrets.json");
      process.exit(1);
    }
    throw error;
  }

  const parsed = JSON.parse(raw);
  const stripeSecretKey = String(parsed?.STRIPE_SECRET_KEY || "").trim();
  const stripeWebhookSecret = String(parsed?.STRIPE_WEBHOOK_SECRET || "").trim();

  process.env.STRIPE_SECRET_KEY = stripeSecretKey;
  process.env.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;

  console.log("[secrets] loaded Stripe keys");
}

await loadSecrets();
