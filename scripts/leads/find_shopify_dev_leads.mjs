#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { upsertPipelineLeads } from "./pipeline_manager.mjs";

const queries = [
  'Shopify app dev not working',
  'Shopify embedded app not loading',
  'Shopify CLI tunnel issue',
  'cloudflared tunnel Shopify',
  'Shopify app preview not loading',
];

const MAX_RESULTS = 15;
const MIN_SCORE = 5;
const OUTPUT_PATH = ".tmp/shopify_dev_leads.json";

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncate(value, max = 280) {
  const text = normalizeText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function detectProblem(text) {
  const lower = text.toLowerCase();
  if (/(embedded app|embedded)/.test(lower) && /(not loading|load|iframe)/.test(lower)) {
    return 'Embedded Shopify app not loading';
  }
  if (/(tunnel|cloudflared|trycloudflare)/.test(lower)) {
    return 'Tunnel or Cloudflare issue during Shopify app development';
  }
  if (/(preview|admin url|preview url)/.test(lower)) {
    return 'Shopify preview/admin URL issue';
  }
  if (/(cli|shopify app dev)/.test(lower)) {
    return 'Shopify CLI dev workflow issue';
  }
  return 'General Shopify app development issue';
}

function scoreLead(text, recent = false) {
  const lower = text.toLowerCase();
  let score = 0;
  if (/(not working|stuck|broken|failing|fails|error|issue|problem|cannot|can't|won't|refused|timeout|crash|unreachable)/.test(lower)) {
    score += 3;
  }
  if (/(shopify app|embedded app|shopify embedded|myshopify|shopify)/.test(lower)) {
    score += 2;
  }
  if (/(tunnel|preview|cloudflared|trycloudflare|cli|shopify app dev)/.test(lower)) {
    score += 2;
  }
  if (recent) {
    score += 1;
  }
  return Math.min(score, 10);
}

function suggestedMessage() {
  return 'Hey — saw you\'re dealing with a Shopify app dev issue (tunnel/preview/etc). I\'ve been fixing these exact problems recently. If you want, I can take a quick look and help you get it stable.';
}

function isoIsRecent(iso) {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  const ageDays = (Date.now() - then) / (1000 * 60 * 60 * 24);
  return ageDays <= 30;
}

async function githubSearch(query) {
  const url = new URL('https://api.github.com/search/issues');
  url.searchParams.set('q', `${query} in:title,body is:issue language:JavaScript language:TypeScript`);
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', '10');

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'abando-shopify-dev-lead-finder',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub search failed for "${query}" with ${response.status}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  return items.map((item) => {
    const title = normalizeText(item.title);
    const body = truncate(item.body || '');
    const combined = `${title} ${body}`;
    const recent = isoIsRecent(item.updated_at || item.created_at);
    return {
      name: item.user?.login || item.repository_url?.split('/').slice(-1)[0] || 'unknown',
      platform: 'github',
      url: item.html_url,
      text: truncate(`${title}${body ? ` — ${body}` : ''}`),
      detectedProblem: detectProblem(combined),
      urgencyScore: scoreLead(combined, recent),
      suggestedMessage: suggestedMessage(),
      _recent: recent,
      _sourceQuery: query,
    };
  });
}

async function twitterSearch() {
  return [];
}

async function indieHackersSearch() {
  return [];
}

function dedupe(leads) {
  const seen = new Set();
  const out = [];
  for (const lead of leads) {
    const key = lead.url || `${lead.platform}:${lead.name}:${lead.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(lead);
  }
  return out;
}

function finalize(leads) {
  return dedupe(leads)
    .filter((lead) => lead.urgencyScore >= MIN_SCORE)
    .sort((a, b) => b.urgencyScore - a.urgencyScore || a.platform.localeCompare(b.platform))
    .slice(0, MAX_RESULTS)
    .map(({ _recent, _sourceQuery, ...lead }) => lead);
}

async function loadDoctorSummary() {
  try {
    const raw = await readFile(".tmp/dev-doctor.json", "utf8");
    const doctor = JSON.parse(raw);
    const blockers = Array.isArray(doctor?.blockers) ? doctor.blockers : [];
    if (blockers.length > 0) {
      return `recent Abando fix context: ${blockers.join(", ")}`;
    }
    if (doctor?.ok === true) {
      return "recent Abando fix context: stable named tunnel, stable preview, healthy embedded dashboard";
    }
    return "";
  } catch {
    return "";
  }
}

export async function main() {
  const githubResults = await Promise.allSettled(queries.map((query) => githubSearch(query)));
  const twitterResults = await twitterSearch();
  const indieHackersResults = await indieHackersSearch();

  const githubLeads = githubResults.flatMap((result) => {
    if (result.status === 'fulfilled') return result.value;
    console.warn(`[leads] github search skipped: ${result.reason?.message || result.reason}`);
    return [];
  });

  const leads = finalize([...githubLeads, ...twitterResults, ...indieHackersResults]);
  const issueSummary = await loadDoctorSummary();

  await mkdir(".tmp", { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
  await upsertPipelineLeads(leads, issueSummary);

  console.table(leads.map((lead) => ({
    name: lead.name,
    platform: lead.platform,
    detectedProblem: lead.detectedProblem,
    urgencyScore: lead.urgencyScore,
    url: lead.url,
  })));

  console.log(`\nSaved ${leads.length} leads to ${OUTPUT_PATH}`);
  console.log("Synced leads into .tmp/leads_pipeline.json");

  if (leads.length < 5) {
    console.warn('[leads] fewer than 5 high-signal leads found with current public sources.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("[leads] fatal:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
