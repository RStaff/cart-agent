#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const CONTACT_TARGETS_PATH = path.join(LEADS_DIR, "contact_targets.json");
const QUEUE_PATH = path.join(LEADS_DIR, "contact_research_queue.json");
const VALID_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

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

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function findByDomain(entries, domain) {
  const normalized = normalizeDomain(domain);
  return entries.find((entry) => normalizeDomain(entry?.domain || "") === normalized) || null;
}

function deriveContactStatus(entry = {}) {
  const contact = entry?.contact || {};
  if (contact.email) return "email_ready";
  if (contact.contact_page_found) return "contact_page_ready";
  if (contact.social_links && (contact.social_links.instagram || contact.social_links.linkedin || contact.social_links.facebook)) {
    return "social_ready";
  }
  return "no_contact_found";
}

function deriveNextContactAction(entry = {}) {
  if (entry.research_status === "researching") return "Continue research";
  if (entry.research_status === "contact_found") return "Mark ready for outreach";
  if (entry.research_status === "ready_for_outreach") return "Queue outreach";
  if (entry.research_status === "no_contact_found") return "Revisit later";
  if (entry.research_status === "closed") return "Complete";
  if (entry.contact_status === "contact_page_ready") return "Review contact page";
  if (entry.contact_status === "social_ready") return "Review social profile";
  return "Review contact surface";
}

function ensureQueueEntryShape(target = {}, existing = null) {
  const socialLinks = target?.social_links || existing?.social_links || {};
  const researchStatus = existing?.research_status || "needs_research";
  const entry = {
    domain: normalizeDomain(existing?.domain || target?.domain || ""),
    score: Number(target?.score ?? existing?.score ?? 0),
    quality: String(target?.quality || existing?.quality || ""),
    audit_link: String(target?.audit_link || existing?.audit_link || ""),
    experience_link: String(target?.experience_link || existing?.experience_link || ""),
    contact_status: String(target?.contact_status || existing?.contact_status || "no_contact_found"),
    next_contact_action: "",
    contact_page_url: String(target?.contact_page_url || existing?.contact_page_url || ""),
    social_links: {
      instagram: String(socialLinks.instagram || ""),
      linkedin: String(socialLinks.linkedin || ""),
      facebook: String(socialLinks.facebook || ""),
    },
    contact_email: normalizeEmail(target?.contact_email || existing?.contact_email || ""),
    contact_name: String(target?.contact_name || existing?.contact_name || ""),
    contact_role: String(target?.contact_role || existing?.contact_role || ""),
    research_status: researchStatus,
    notes: String(existing?.notes || target?.notes || ""),
    updated_at: existing?.updated_at || nowIso(),
  };
  entry.next_contact_action = deriveNextContactAction(entry);
  return entry;
}

function loadState() {
  return {
    contactTargets: readJson(CONTACT_TARGETS_PATH, []),
    queue: readJson(QUEUE_PATH, []),
  };
}

function saveQueue(queue) {
  writeJson(QUEUE_PATH, queue);
}

function commandSeed() {
  const { contactTargets, queue } = loadState();
  const queueByDomain = new Map(queue.map((entry) => [normalizeDomain(entry.domain), entry]));
  let created = 0;
  let updated = 0;

  contactTargets.forEach((target) => {
    const domain = normalizeDomain(target?.domain || "");
    if (!domain) return;
    const contactStatus = deriveContactStatus(target);
    if (contactStatus === "email_ready") return;

    const existing = queueByDomain.get(domain) || null;
    const contact = target?.contact || {};
    const seeded = ensureQueueEntryShape(
      {
        domain,
        score: target?.score,
        quality: target?.quality,
        audit_link: target?.audit_link,
        experience_link: target?.experience_link,
        contact_status: contactStatus,
        contact_page_url: contact.contact_page_found ? `https://${domain}/contact` : "",
        social_links: contact.social_links || {},
      },
      existing,
    );
    seeded.updated_at = nowIso();
    queueByDomain.set(domain, seeded);
    if (existing) updated += 1;
    else created += 1;
  });

  const nextQueue = Array.from(queueByDomain.values()).sort((a, b) => a.domain.localeCompare(b.domain));
  saveQueue(nextQueue);
  console.log(`Contact research queue seeded: created=${created} updated=${updated} total=${nextQueue.length}`);
}

function updateEntry(domain, updater) {
  const { queue } = loadState();
  const entry = findByDomain(queue, domain);
  if (!entry) {
    console.error(`No contact research entry found for ${domain}`);
    process.exit(1);
  }
  updater(entry);
  entry.next_contact_action = deriveNextContactAction(entry);
  entry.updated_at = nowIso();
  saveQueue(queue);
  return entry;
}

function commandStart(domain) {
  const entry = updateEntry(domain, (item) => {
    item.research_status = "researching";
  });
  console.log(`Research started: ${entry.domain}`);
}

function commandAddContact(domain, email, name, role) {
  const normalizedEmail = normalizeEmail(email);
  if (!VALID_EMAIL.test(normalizedEmail)) {
    console.error("Invalid contact email");
    process.exit(1);
  }
  const entry = updateEntry(domain, (item) => {
    item.contact_email = normalizedEmail;
    item.contact_name = String(name || "");
    item.contact_role = String(role || "");
    item.research_status = "contact_found";
  });
  console.log(`Contact added: ${entry.domain}`);
}

function commandReady(domain) {
  const entry = updateEntry(domain, (item) => {
    if (!item.contact_email) {
      console.error(`No contact email found for ${item.domain}`);
      process.exit(1);
    }
    item.research_status = "ready_for_outreach";
  });
  console.log(`Ready for outreach: ${entry.domain}`);
}

function commandNoContact(domain) {
  const entry = updateEntry(domain, (item) => {
    item.research_status = "no_contact_found";
  });
  console.log(`Marked no contact found: ${entry.domain}`);
}

function commandNote(domain, noteText) {
  const entry = updateEntry(domain, (item) => {
    item.notes = String(noteText || "");
  });
  console.log(`Noted: ${entry.domain}`);
}

function commandSummary() {
  const { queue } = loadState();
  const counts = {
    needs_research: 0,
    researching: 0,
    contact_found: 0,
    ready_for_outreach: 0,
    no_contact_found: 0,
  };

  queue.forEach((entry) => {
    const key = String(entry?.research_status || "");
    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      counts[key] += 1;
    }
  });

  console.log("Contact Research Summary:");
  console.log(`- needs_research: ${counts.needs_research}`);
  console.log(`- researching: ${counts.researching}`);
  console.log(`- contact_found: ${counts.contact_found}`);
  console.log(`- ready_for_outreach: ${counts.ready_for_outreach}`);
  console.log(`- no_contact_found: ${counts.no_contact_found}`);
}

function commandRender(domain) {
  const { queue } = loadState();
  const entry = findByDomain(queue, domain);
  if (!entry) {
    console.error(`No contact research entry found for ${domain}`);
    process.exit(1);
  }

  console.log(`Domain: ${entry.domain}`);
  console.log(`Contact status: ${entry.contact_status}`);
  console.log(`Research status: ${entry.research_status}`);
  console.log(`Next action: ${entry.next_contact_action}`);
  console.log(`Contact page: ${entry.contact_page_url || "not found"}`);
  console.log(`Instagram: ${entry.social_links.instagram || "not found"}`);
  console.log(`LinkedIn: ${entry.social_links.linkedin || "not found"}`);
  console.log(`Facebook: ${entry.social_links.facebook || "not found"}`);
  console.log(`Contact email: ${entry.contact_email || "not found"}`);
  console.log(`Contact name: ${entry.contact_name || "not set"}`);
  console.log(`Contact role: ${entry.contact_role || "not set"}`);
  console.log(`Notes: ${entry.notes || "none"}`);
}

function printUsageAndExit() {
  console.error("Usage:");
  console.error("  node staffordos/leads/contact_research.js seed");
  console.error("  node staffordos/leads/contact_research.js start <domain>");
  console.error("  node staffordos/leads/contact_research.js add-contact <domain> <email> \"Name\" \"Role\"");
  console.error("  node staffordos/leads/contact_research.js ready <domain>");
  console.error("  node staffordos/leads/contact_research.js no-contact <domain>");
  console.error("  node staffordos/leads/contact_research.js note <domain> \"note text\"");
  console.error("  node staffordos/leads/contact_research.js summary");
  console.error("  node staffordos/leads/contact_research.js render <domain>");
  process.exit(1);
}

function main() {
  const [, , command, ...args] = process.argv;

  if (command === "seed") {
    commandSeed();
    return;
  }
  if (command === "start") {
    commandStart(args[0]);
    return;
  }
  if (command === "add-contact") {
    commandAddContact(args[0], args[1], args[2], args[3]);
    return;
  }
  if (command === "ready") {
    commandReady(args[0]);
    return;
  }
  if (command === "no-contact") {
    commandNoContact(args[0]);
    return;
  }
  if (command === "note") {
    commandNote(args[0], args.slice(1).join(" "));
    return;
  }
  if (command === "summary") {
    commandSummary();
    return;
  }
  if (command === "render") {
    commandRender(args[0]);
    return;
  }

  printUsageAndExit();
}

main();
