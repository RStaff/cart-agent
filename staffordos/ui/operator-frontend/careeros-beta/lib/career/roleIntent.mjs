import { inferRoleFamiliesFromText, roleFamilyForKey } from "./discoveryRoleFamilies.mjs";

const SENIORITY = ["chief", "vice president", "vp", "director", "head", "principal", "staff", "senior", "sr", "lead", "junior", "jr", "associate", "entry level", "entry-level", "intern"];
const SPECIALIZATION_TERMS = ["ai", "artificial intelligence", "generative ai", "marketing technology", "martech", "automation", "digital", "technical", "platform"];
const STOP_WORDS = new Set(["a", "an", "the", "of", "and", "or", "for", "in", "to"]);

function clean(value, limit = 240) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit); }
function canonicalText(value) { return clean(value).toLowerCase().replace(/[\/,_-]+/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function terms(value) { return canonicalText(value).split(" ").filter((item) => item && !STOP_WORDS.has(item)); }

export function seniorityForTitle(value) {
  const text = canonicalText(value);
  const match = SENIORITY.find((item) => new RegExp(`\\b${item.replace(/ /g, "\\s+")}\\b`, "i").test(text));
  return match ? (match === "sr" ? "SENIOR" : match === "jr" ? "JUNIOR" : match.toUpperCase().replace(/[- ]/g, "_")) : "UNSPECIFIED";
}

export function specializationForTitle(value) {
  const text = canonicalText(value);
  const found = SPECIALIZATION_TERMS.filter((item) => text.includes(item)).map((item) => item.toUpperCase().replace(/[- ]/g, "_"));
  return [...new Set(found)].slice(0, 4);
}

function primaryFamily(value) {
  const families = inferRoleFamiliesFromText(value);
  if (!families.length) return { key: "CUSTOM_TARGET", label: "Customer target", query: clean(value) };
  const normalized = canonicalText(value);
  const exact = families.find((family) => family.patterns.some((pattern) => pattern.test(normalized) && /manager|engineer|scientist|director|lead|analyst|coordinator|specialist/.test(normalized)));
  return exact || families[0];
}

export function normalizeRoleIntent({ requestedTitle = "", keywords = "", location = "", remotePreference = "any", excludedTitles = [] } = {}) {
  const requested = clean(requestedTitle) || clean(keywords);
  const family = primaryFamily(requested);
  const normalizedTitle = canonicalText(requested);
  return {
    requestedTitle: requested,
    normalizedTitle,
    roleFamily: family.key,
    roleFamilyLabel: family.label,
    specialization: specializationForTitle(requested),
    seniority: seniorityForTitle(requested),
    location: clean(location),
    workMode: remotePreference || "any",
    excludedTitles: Array.isArray(excludedTitles) ? [...new Set(excludedTitles.map(canonicalText).filter(Boolean))].slice(0, 20) : [],
    legacyDerived: !clean(requestedTitle) && Boolean(clean(keywords)),
  };
}

function coreTerms(value) { return terms(value).filter((item) => !SENIORITY.includes(item)); }
function familyForJob(value) { return primaryFamily(value); }

export function classifyRoleCompatibility(intent = {}, jobTitle = "") {
  const target = normalizeRoleIntent(intent);
  const title = clean(jobTitle);
  if (!target.normalizedTitle) return { classification: "COMPATIBLE_ADJACENT", targetRole: "", normalizedTitle: canonicalText(title), roleFamily: familyForJob(title).key, specializationMatch: true, seniorityMatch: true, titleOverlap: [] };
  const jobFamily = familyForJob(title);
  const targetTerms = coreTerms(target.normalizedTitle);
  const jobTerms = coreTerms(title);
  const overlap = targetTerms.filter((item) => jobTerms.includes(item));
  const sameFamily = target.roleFamily === "CUSTOM_TARGET" ? overlap.length > 0 : jobFamily.key === target.roleFamily;
  const specializationMismatch = target.specialization.length > 0 && target.specialization.some((item) => !specializationForTitle(title).includes(item));
  const seniorityMismatch = target.seniority !== "UNSPECIFIED" && seniorityForTitle(title) !== "UNSPECIFIED" && target.seniority !== seniorityForTitle(title);
  let classification = "INCOMPATIBLE";
  if (sameFamily && overlap.length >= Math.max(1, Math.min(2, targetTerms.length))) classification = specializationMismatch || seniorityMismatch ? "COMPATIBLE_ADJACENT" : "EXACT_OR_NEAR_TITLE";
  else if (sameFamily && overlap.length > 0) classification = "COMPATIBLE_ADJACENT";
  else if (sameFamily) classification = "ROLE_FAMILY_ONLY";
  return {
    classification,
    targetRole: target.requestedTitle,
    normalizedTitle: canonicalText(title),
    roleFamily: jobFamily.key,
    specializationMatch: !specializationMismatch,
    seniorityMatch: !seniorityMismatch,
    titleOverlap: overlap,
  };
}

export function publicRoleIntent(intent = {}) {
  const normalized = normalizeRoleIntent(intent);
  return { requestedTitle: normalized.requestedTitle, normalizedTitle: normalized.normalizedTitle, roleFamily: normalized.roleFamily, roleFamilyLabel: normalized.roleFamilyLabel, specialization: normalized.specialization, seniority: normalized.seniority, location: normalized.location, workMode: normalized.workMode, excludedTitles: normalized.excludedTitles, legacyDerived: normalized.legacyDerived };
}

export function roleFamilyLabel(key) { return roleFamilyForKey(key)?.label || key || "Unknown"; }
