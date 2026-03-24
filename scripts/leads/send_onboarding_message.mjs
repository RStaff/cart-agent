#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadLeads } from "./pipeline_manager.mjs";

const repoRoot = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
process.chdir(repoRoot);

function parseLeadId(argv) {
  for (let index = 2; index < argv.length; index += 1) {
    if (argv[index] === "--leadId") {
      return String(argv[index + 1] || "").trim();
    }
  }
  return "";
}

export function onboardingMessage() {
  return `Great — I’ve got your request.

To fix this quickly, send:
- your repo or project setup
- exact error message
- what you’ve tried so far

I’ll take it from there.`;
}

async function main() {
  const leadId = parseLeadId(process.argv);
  if (!leadId) {
    throw new Error("Missing required --leadId");
  }

  const leads = await loadLeads();
  const lead = leads.find((item) => item.id === leadId);
  if (!lead) {
    throw new Error(`lead_not_found:${leadId}`);
  }

  console.log(onboardingMessage());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[onboarding] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
