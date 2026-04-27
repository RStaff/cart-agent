import { existsSync, readFileSync, writeFileSync } from "node:fs";

const OUTREACH = "staffordos/leads/outreach_queue.json";
const RESEARCH = "staffordos/leads/contact_research_queue.json";
const LOG = "staffordos/leads/contact_enrichment_log_v1.json";

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function normalizeDomain(v="") {
  return String(v).toLowerCase().trim();
}

const outreach = readJson(OUTREACH, []);
const research = readJson(RESEARCH, []);
const log = readJson(LOG, []);

const existingDomains = new Set(research.map(x => normalizeDomain(x.domain)));

let routed = 0;

for (const item of outreach) {
  const domain = normalizeDomain(item.domain);
  if (!domain) continue;

  if (item.email && item.email !== "") continue;

  if (existingDomains.has(domain)) continue;

  research.push({
    domain,
    source: "outreach_queue",
    research_status: "needs_research",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  existingDomains.add(domain);
  routed++;
}

writeJson(RESEARCH, research);

log.push({
  agent: "contact_enrichment_agent_v1",
  routed,
  at: new Date().toISOString()
});

writeJson(LOG, log);

console.log(JSON.stringify({
  ok: true,
  agent: "contact_enrichment_agent_v1",
  routed
}, null, 2));
