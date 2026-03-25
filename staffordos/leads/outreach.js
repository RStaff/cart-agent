#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const TOP_TARGETS_PATH = path.join(LEADS_DIR, "top_targets.json");
const QUALIFIED_TARGETS_PATH = path.join(LEADS_DIR, "qualified_targets.json");
const CONTACT_TARGETS_PATH = path.join(LEADS_DIR, "contact_targets.json");
const CONTACT_RESEARCH_QUEUE_PATH = path.join(LEADS_DIR, "contact_research_queue.json");
const OUTCOMES_PATH = path.join(LEADS_DIR, "outcomes.json");
const QUEUE_PATH = path.join(LEADS_DIR, "outreach_queue.json");
const TEMPLATES_PATH = path.join(LEADS_DIR, "outreach_templates.json");

const VALID_STATUSES = ["queued", "sent", "replied", "closed"];

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeDomain(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .split("?")[0]
    .split("#")[0];
}

function nowIso() {
  return new Date().toISOString();
}

function findByDomain(entries, domain) {
  const normalized = normalizeDomain(domain);
  return entries.find((entry) => normalizeDomain(entry?.domain || "") === normalized) || null;
}

function ensureQueueEntryShape(target = {}, existing = null) {
  return {
    domain: normalizeDomain(existing?.domain || target?.domain || ""),
    email: String(target?.email || existing?.email || "").trim().toLowerCase(),
    status: existing?.status || "routed",
    channel: existing?.channel || "email",
    message_type: existing?.message_type || "abando_audit_invite",
    audit_link: target?.audit_link || existing?.audit_link || "",
    experience_link: target?.experience_link || existing?.experience_link || "",
    subject: existing?.subject || "",
    body: existing?.body || "",
    approved: Boolean(existing?.approved || target?.approved),
    sent: Boolean(existing?.sent),
    replied: Boolean(existing?.replied),
    closed: Boolean(existing?.closed),
    notes: existing?.notes || target?.notes || "",
    updated_at: existing?.updated_at || nowIso(),
  };
}

function loadState() {
  const qualifiedTargets = readJson(QUALIFIED_TARGETS_PATH, []);
  const topTargets = readJson(TOP_TARGETS_PATH, []);
  return {
    qualifiedTargets,
    topTargets,
    contacts: readJson(CONTACT_TARGETS_PATH, []),
    contactResearchQueue: readJson(CONTACT_RESEARCH_QUEUE_PATH, []),
    outcomes: readJson(OUTCOMES_PATH, []),
    queue: readJson(QUEUE_PATH, []),
    templates: readJson(TEMPLATES_PATH, {}),
  };
}

function saveQueue(queue) {
  writeJson(QUEUE_PATH, queue);
}

function resolveTarget(domain, topTargets, outcomes) {
  return findByDomain(outcomes, domain) || findByDomain(topTargets, domain);
}

function renderTemplate(template, entry) {
  return {
    subject: String(template?.subject || "").replace(/\{\{audit_link\}\}/g, entry.audit_link).replace(/\{\{experience_link\}\}/g, entry.experience_link),
    body: String(template?.body || "").replace(/\{\{audit_link\}\}/g, entry.audit_link).replace(/\{\{experience_link\}\}/g, entry.experience_link),
  };
}

function nextAction(entry) {
  if (!entry?.email) return "Find contact";
  if (!entry?.approved) return "Approve";
  if (entry?.approved && entry?.status === "routed") return "Queue";
  if (entry?.status === "queued" && !entry?.sent) return "Send";
  if (entry?.sent && !entry?.replied) return "Wait / follow up";
  if (entry?.replied && !entry?.closed) return "Review / close";
  if (entry?.closed) return "Complete";
  return "Review";
}

function printUsageAndExit() {
  console.error("Usage:");
  console.error("  node staffordos/leads/outreach.js seed");
  console.error("  node staffordos/leads/outreach.js approve <domain>");
  console.error("  node staffordos/leads/outreach.js queue <domain>");
  console.error("  node staffordos/leads/outreach.js mark-sent <domain>");
  console.error("  node staffordos/leads/outreach.js mark-replied <domain>");
  console.error("  node staffordos/leads/outreach.js close <domain>");
  console.error("  node staffordos/leads/outreach.js note <domain> \"note text\"");
  console.error("  node staffordos/leads/outreach.js render <domain>");
  console.error("  node staffordos/leads/outreach.js summary");
  process.exit(1);
}

function commandSeed() {
  const { qualifiedTargets, topTargets, contacts, contactResearchQueue, outcomes, queue } = loadState();
  const sourceTargets = Array.isArray(qualifiedTargets) && qualifiedTargets.length > 0 ? qualifiedTargets : topTargets;
  const allowedDomains = new Set(
    sourceTargets.map((entry) => normalizeDomain(entry?.domain || "")).filter(Boolean),
  );
  const contactByDomain = new Map(
    contacts.map((entry) => [normalizeDomain(entry?.domain || ""), entry]),
  );
  const researchByDomain = new Map(
    contactResearchQueue.map((entry) => [normalizeDomain(entry?.domain || ""), entry]),
  );
  const queueByDomain = new Map();
  let created = 0;
  let updated = 0;
  let removed = 0;

  queue.forEach((entry) => {
    const domain = normalizeDomain(entry?.domain || "");
    if (!domain || !allowedDomains.has(domain)) {
      removed += 1;
      return;
    }
    queueByDomain.set(domain, entry);
  });

  sourceTargets.forEach((target) => {
    const domain = normalizeDomain(target?.domain || "");
    if (!domain) return;
    const existing = queueByDomain.get(domain) || null;
    const outcome = findByDomain(outcomes, domain);
    const contact = contactByDomain.get(domain) || null;
    const research = researchByDomain.get(domain) || null;
    const merged = ensureQueueEntryShape(
      {
        ...target,
        email: research?.contact_email || contact?.contact?.email || contact?.email || "",
        approved: outcome?.approved || target?.approved || false,
        notes: research?.notes || outcome?.notes || target?.notes || "",
      },
      existing,
    );
    merged.updated_at = nowIso();
    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
    queueByDomain.set(domain, merged);
  });

  const nextQueue = Array.from(queueByDomain.values()).sort((a, b) => a.domain.localeCompare(b.domain));
  saveQueue(nextQueue);
  console.log(`Seeded outreach queue: created=${created} updated=${updated} removed=${removed} total=${nextQueue.length}`);
  console.log(`Outreach source of truth: ${Array.isArray(qualifiedTargets) && qualifiedTargets.length > 0 ? "qualified_targets.json" : "top_targets.json"}`);
}

function requireEntry(queue, domain) {
  const entry = findByDomain(queue, domain);
  if (!entry) {
    console.error(`No outreach entry found for ${domain}`);
    process.exit(1);
  }
  return entry;
}

function updateEntry(domain, updater) {
  const { queue } = loadState();
  const entry = requireEntry(queue, domain);
  updater(entry);
  entry.updated_at = nowIso();
  saveQueue(queue);
  return entry;
}

function commandApprove(domain) {
  const entry = updateEntry(domain, (item) => {
    item.approved = true;
  });
  console.log(`Approved: ${entry.domain}`);
}

function commandQueue(domain) {
  const { queue, templates } = loadState();
  const entry = requireEntry(queue, domain);
  if (!entry.approved) {
    console.error(`Target is not approved: ${entry.domain}`);
    process.exit(1);
  }
  if (!entry.email) {
    console.error(`No contact email found for ${entry.domain}`);
    process.exit(1);
  }
  const template = templates[entry.message_type] || templates.abando_audit_invite;
  const rendered = renderTemplate(template, entry);
  entry.subject = rendered.subject;
  entry.body = rendered.body;
  entry.status = "queued";
  entry.updated_at = nowIso();
  saveQueue(queue);
  console.log(`Queued: ${entry.domain}`);
}

function commandMark(domain, nextStatus) {
  if (!VALID_STATUSES.includes(nextStatus)) {
    console.error(`Invalid status: ${nextStatus}`);
    process.exit(1);
  }
  const entry = updateEntry(domain, (item) => {
    if (nextStatus === "sent") {
      item.sent = true;
      item.status = "sent";
    }
    if (nextStatus === "replied") {
      item.replied = true;
      item.status = "replied";
    }
    if (nextStatus === "closed") {
      item.closed = true;
      item.status = "closed";
    }
  });
  console.log(`Updated: ${entry.domain} -> ${entry.status}`);
}

function commandNote(domain, noteText) {
  const entry = updateEntry(domain, (item) => {
    item.notes = String(noteText || "");
  });
  console.log(`Noted: ${entry.domain}`);
}

function commandRender(domain) {
  const { queue, templates } = loadState();
  const entry = requireEntry(queue, domain);
  const template = templates[entry.message_type] || templates.abando_audit_invite;
  const rendered = renderTemplate(template, entry);
  console.log(`Domain: ${entry.domain}`);
  console.log(`Email: ${entry.email || "not found"}`);
  console.log(`Status: ${entry.status}`);
  console.log(`Approved: ${entry.approved ? "yes" : "no"}`);
  console.log("");
  console.log(`Subject: ${rendered.subject}`);
  console.log("");
  console.log(rendered.body);
}

function commandSummary() {
  const { queue } = loadState();
  const counts = {
    queued: 0,
    sent: 0,
    replied: 0,
    closed: 0,
  };

  queue.forEach((entry) => {
    if (counts[entry.status] !== undefined) {
      counts[entry.status] += 1;
    }
  });

  console.log("Outreach Summary:");
  console.log(`- queued: ${counts.queued}`);
  console.log(`- sent: ${counts.sent}`);
  console.log(`- replied: ${counts.replied}`);
  console.log(`- closed: ${counts.closed}`);
  console.log("");
  console.log("Next Actions:");
  queue.slice(0, 5).forEach((entry) => {
    console.log(`- ${entry.domain}: ${nextAction(entry)}`);
  });
}

function main() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    printUsageAndExit();
  }

  if (command === "seed") {
    commandSeed();
    return;
  }

  if (command === "summary") {
    commandSummary();
    return;
  }

  if (command === "approve") {
    commandApprove(args[0]);
    return;
  }

  if (command === "queue") {
    commandQueue(args[0]);
    return;
  }

  if (command === "mark-sent") {
    commandMark(args[0], "sent");
    return;
  }

  if (command === "mark-replied") {
    commandMark(args[0], "replied");
    return;
  }

  if (command === "close") {
    commandMark(args[0], "closed");
    return;
  }

  if (command === "note") {
    commandNote(args[0], args.slice(1).join(" "));
    return;
  }

  if (command === "render") {
    commandRender(args[0]);
    return;
  }

  printUsageAndExit();
}

main();
