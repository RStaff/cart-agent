import { generateApplicationWriting } from "./applicationWritingProvider.mjs";

export const APPLICATION_WRITING_STYLES = ["CONCISE", "PROFESSIONAL", "CONVERSATIONAL"];
const MAX_DRAFT = 20000;
const MAX_EVIDENCE = 30;
const MAX_QUESTION = 2000;
const MAX_INTENT = 4000;

function clean(value, limit) { return String(value || "").trim().slice(0, limit); }

export function writingEvidence(packet) {
  const sections = ["direct", "transferable", "partial", "unknown", "specialist", "scope"];
  const seen = new Set();
  return sections.flatMap((section) => packet?.sections?.[section] || []).flatMap((item) => (item.evidence || []).map((entry) => ({
    statement: clean(entry.statement, 1200), relationship: item.relationship, requirement: clean(item.requirement, 500),
  }))).filter((item) => item.statement && !seen.has(item.statement) && seen.add(item.statement)).slice(0, MAX_EVIDENCE);
}

export function validateWritingClaims({ claims, evidence }) {
  if (!Array.isArray(claims) || !claims.length) throw Object.assign(new Error("APPLICATION_WRITING_UNGROUNDED"), { code: "APPLICATION_WRITING_UNGROUNDED" });
  const checked = claims.map((claim) => {
    if (!claim || typeof claim.text !== "string" || !claim.text.trim() || !Array.isArray(claim.supportRefs)) throw Object.assign(new Error("APPLICATION_WRITING_UNGROUNDED"), { code: "APPLICATION_WRITING_UNGROUNDED" });
    const refs = claim.supportRefs.map((ref) => Number(ref));
    if (!refs.length || refs.some((ref) => !Number.isInteger(ref) || ref < 0 || ref >= evidence.length)) throw Object.assign(new Error("APPLICATION_WRITING_FORGED_SUPPORT"), { code: "APPLICATION_WRITING_FORGED_SUPPORT" });
    const referencedText = refs.map((ref) => evidence[ref].statement.toLowerCase()).join(" ");
    const claimTerms = new Set(claim.text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 3));
    const evidenceTerms = new Set(referencedText.split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 3));
    const overlap = [...claimTerms].filter((term) => evidenceTerms.has(term)).length / Math.max(claimTerms.size, 1);
    if (claim.classification === "UNSUPPORTED") throw Object.assign(new Error("APPLICATION_WRITING_UNSUPPORTED_CLAIM"), { code: "APPLICATION_WRITING_UNSUPPORTED_CLAIM" });
    const classification = claim.classification === "NEEDS_REVIEW" || overlap < 0.2 ? "NEEDS_REVIEW" : claim.classification === "SUPPORTED" ? "SUPPORTED" : "UNSUPPORTED";
    if (classification === "UNSUPPORTED") throw Object.assign(new Error("APPLICATION_WRITING_UNSUPPORTED_CLAIM"), { code: "APPLICATION_WRITING_UNSUPPORTED_CLAIM" });
    return { text: clean(claim.text, 2000), supportRefs: refs, classification };
  });
  return checked;
}

export async function improveApplicationMaterial({ materialType, target, deterministicDraft, evidence, question = "", userIntent = "", style = "PROFESSIONAL", provider = generateApplicationWriting }) {
  const selectedStyle = APPLICATION_WRITING_STYLES.includes(style) ? style : "PROFESSIONAL";
  const cleanDraft = clean(deterministicDraft, MAX_DRAFT);
  const seen = new Set();
  const cleanEvidence = (evidence || []).map((item) => ({ statement: clean(item.statement, 1200), relationship: String(item.relationship || "UNKNOWN"), requirement: clean(item.requirement, 500) })).filter((item) => item.statement && !seen.has(item.statement) && seen.add(item.statement)).slice(0, MAX_EVIDENCE);
  if (!cleanDraft || !cleanEvidence.length) return { status: "APPLICATION_WRITING_GROUNDED_INPUT_REQUIRED", message: "CareerOS needs a grounded draft and confirmed evidence before improving wording." };
  const result = await provider({ materialType, target, deterministicDraft: cleanDraft, evidence: cleanEvidence, question: clean(question, MAX_QUESTION), userIntent: clean(userIntent, MAX_INTENT), style: selectedStyle });
  const claims = validateWritingClaims({ claims: result.claims, evidence: cleanEvidence });
  return { status: "AI_ASSISTED", text: result.draft, claims, provider: result.provider, model: result.model, style: selectedStyle, groundingStatus: claims.some((claim) => claim.classification === "NEEDS_REVIEW") ? "REVIEW_REQUIRED" : "SUPPORTED" };
}
