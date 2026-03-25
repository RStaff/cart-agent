#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/rossstafford/projects/cart-agent";
const LEADS_DIR = path.join(ROOT, "staffordos", "leads");
const QUALIFIED_TARGETS_PATH = path.join(LEADS_DIR, "qualified_targets.json");
const CONTACT_TARGETS_PATH = path.join(LEADS_DIR, "contact_targets.json");
const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT = "StaffordOS Contact Discovery V1";
const PAGE_PATHS = ["", "/contact", "/pages/contact", "/pages/about", "/pages/about-us"];
const REJECT_EMAIL_PREFIXES = ["no-reply@", "noreply@", "example@", "test@", "demo@"];

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

function isValidEmail(value = "") {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    return false;
  }
  return !REJECT_EMAIL_PREFIXES.some((prefix) => email.startsWith(prefix));
}

function normalizeEmail(value = "") {
  return decodeURIComponent(String(value || "").trim())
    .replace(/^mailto:/i, "")
    .trim()
    .toLowerCase();
}

function extractEmailsFromHtml(html = "") {
  const results = [];
  const seen = new Set();
  const mailtoRegex = /mailto:([^"'?#>\s]+)/gi;
  const visibleRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

  let match = null;
  while ((match = mailtoRegex.exec(html))) {
    const email = normalizeEmail(match[1]);
    if (isValidEmail(email) && !seen.has(email)) {
      seen.add(email);
      results.push({ email, index: match.index, method: "mailto" });
    }
  }

  while ((match = visibleRegex.exec(html))) {
    const email = normalizeEmail(match[0]);
    if (isValidEmail(email) && !seen.has(email)) {
      seen.add(email);
      results.push({ email, index: match.index, method: "visible" });
    }
  }

  return results;
}

function extractSocialLinks(html = "") {
  const links = {
    instagram: "",
    linkedin: "",
    facebook: "",
  };

  const patterns = [
    ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._-]+/i],
    ["linkedin", /https?:\/\/(?:www\.)?linkedin\.com\/company\/[A-Za-z0-9._-]+/i],
    ["facebook", /https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9._-]+/i],
  ];

  patterns.forEach(([key, pattern]) => {
    const match = html.match(pattern);
    if (match) {
      links[key] = match[0];
    }
  });

  return links;
}

function hasAnySocialLinks(socialLinks = {}) {
  return Boolean(socialLinks.instagram || socialLinks.linkedin || socialLinks.facebook);
}

function classifyEmailSource(pagePath = "", html = "", matchIndex = 0) {
  const lowerPath = String(pagePath || "").toLowerCase();
  if (lowerPath === "/contact" || lowerPath === "/pages/contact") {
    return { confidence: "high", source: "contact_page" };
  }

  const start = Math.max(0, matchIndex - 500);
  const end = Math.min(html.length, matchIndex + 500);
  const context = html.slice(start, end).toLowerCase();

  if (context.includes("<footer") || context.includes("footer")) {
    return { confidence: "medium", source: "footer" };
  }

  if (lowerPath === "/pages/about" || lowerPath === "/pages/about-us") {
    return { confidence: "medium", source: "about_page" };
  }

  return { confidence: "medium", source: "homepage" };
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html")) return null;

    return {
      url: response.url || url,
      html: await response.text(),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildEmptyContact() {
  return {
    email: "",
    source: "",
    confidence: "none",
    contact_page_found: false,
    social_links: {
      instagram: "",
      linkedin: "",
      facebook: "",
    },
  };
}

function pickBestCandidate(candidates = []) {
  const confidenceRank = { high: 3, medium: 2, low: 1, none: 0 };
  return [...candidates].sort((a, b) => {
    const confidenceDelta = confidenceRank[b.confidence] - confidenceRank[a.confidence];
    if (confidenceDelta !== 0) return confidenceDelta;
    return a.email.localeCompare(b.email);
  })[0] || null;
}

async function discoverContactForTarget(target) {
  const domain = normalizeDomain(target?.domain || "");
  const contact = buildEmptyContact();
  const emailCandidates = [];

  for (const pagePath of PAGE_PATHS) {
    const page = await fetchHtml(`https://${domain}${pagePath}`);
    if (!page) continue;

    if (pagePath === "/contact" || pagePath === "/pages/contact") {
      contact.contact_page_found = true;
    }

    const pageSocials = extractSocialLinks(page.html);
    if (!contact.social_links.instagram && pageSocials.instagram) contact.social_links.instagram = pageSocials.instagram;
    if (!contact.social_links.linkedin && pageSocials.linkedin) contact.social_links.linkedin = pageSocials.linkedin;
    if (!contact.social_links.facebook && pageSocials.facebook) contact.social_links.facebook = pageSocials.facebook;

    const emails = extractEmailsFromHtml(page.html);
    emails.forEach((match) => {
      const classification = classifyEmailSource(pagePath, page.html, match.index);
      emailCandidates.push({
        email: match.email,
        confidence: classification.confidence,
        source: classification.source,
      });
    });
  }

  const dedupedCandidates = [];
  const seenEmails = new Set();
  emailCandidates.forEach((candidate) => {
    if (seenEmails.has(candidate.email)) return;
    seenEmails.add(candidate.email);
    dedupedCandidates.push(candidate);
  });

  const bestCandidate = pickBestCandidate(dedupedCandidates);
  if (bestCandidate) {
    contact.email = bestCandidate.email;
    contact.source = bestCandidate.source;
    contact.confidence = bestCandidate.confidence;
  } else if (contact.contact_page_found) {
    contact.source = "contact_page_only";
    contact.confidence = "low";
  } else if (hasAnySocialLinks(contact.social_links)) {
    contact.source = "social_link";
    contact.confidence = "medium";
  }

  return {
    domain,
    score: Number(target?.score || 0),
    quality: String(target?.quality || ""),
    audit_link: String(target?.audit_link || ""),
    experience_link: String(target?.experience_link || ""),
    contact,
    notes: "",
    updated_at: new Date().toISOString(),
  };
}

function summarize(entries = []) {
  const counts = {
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };

  entries.forEach((entry) => {
    const confidence = String(entry?.contact?.confidence || "none");
    if (Object.prototype.hasOwnProperty.call(counts, confidence)) {
      counts[confidence] += 1;
    } else {
      counts.none += 1;
    }
  });

  console.log("Contact Discovery Summary:");
  console.log(`- targets processed: ${entries.length}`);
  console.log(`- high confidence contacts: ${counts.high}`);
  console.log(`- medium confidence contacts: ${counts.medium}`);
  console.log(`- low confidence contacts: ${counts.low}`);
  console.log(`- no contact found: ${counts.none}`);
  console.log("");
  console.log("Examples:");

  const sample = entries.slice(0, 5);
  if (sample.length === 0) {
    console.log("- none");
    return;
  }

  sample.forEach((entry) => {
    if (entry.contact.email) {
      console.log(`- ${entry.domain} -> ${entry.contact.email} (${entry.contact.confidence})`);
      return;
    }

    if (entry.contact.contact_page_found) {
      console.log(`- ${entry.domain} -> contact page found, no email (${entry.contact.confidence})`);
      return;
    }

    if (hasAnySocialLinks(entry.contact.social_links)) {
      console.log(`- ${entry.domain} -> social links found (${entry.contact.confidence})`);
      return;
    }

    console.log(`- ${entry.domain} -> no contact found`);
  });
}

async function main() {
  const qualifiedTargets = readJson(QUALIFIED_TARGETS_PATH, []);
  const domainArg = normalizeDomain(process.argv[2] || "");
  const targets = domainArg
    ? qualifiedTargets.filter((entry) => normalizeDomain(entry?.domain || "") === domainArg)
    : qualifiedTargets;

  const results = [];
  for (const target of targets) {
    const domain = normalizeDomain(target?.domain || "");
    if (!domain) continue;
    const result = await discoverContactForTarget(target);
    results.push(result);
  }

  writeJson(CONTACT_TARGETS_PATH, results);
  summarize(results);
}

main();
