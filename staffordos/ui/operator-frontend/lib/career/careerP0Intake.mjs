import crypto from "node:crypto";

export const CAREEROS_INTAKE_EXTRACTOR_VERSION = "P0_TEXT_EXTRACTOR_V1";

function digest(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function factTypeFor(statement) {
  if (/\b(certif|credential|licensed|pmp|scrum master)\b/i.test(statement)) return "CERTIFICATION";
  if (/\b(bachelor|master|mba|degree|university|college|graduated)\b/i.test(statement)) return "EDUCATION";
  if (/\b(led|managed|directed|owned|coordinated|mentored|team)\b/i.test(statement)) return "LEADERSHIP";
  if (/\b(launched|implemented|built|delivered|project|program|transformed)\b/i.test(statement)) return "PROJECT";
  if (/\b(salesforce|hubspot|marketo|sql|python|javascript|crm|automation|platform|technology|tool)\b/i.test(statement)) return "TECHNOLOGY";
  if (/\b(increased|reduced|grew|saved|achieved|improved|%|million|revenue)\b/i.test(statement)) return "ACHIEVEMENT";
  if (/\b(worked|joined|served|employment|role|company|employer)\b/i.test(statement)) return "EMPLOYMENT";
  return "OTHER";
}

function scopeStatement(statement) {
  const match = statement.match(/\b(across|within|for|with)\s+[^,.!?;]{2,80}/i);
  return match ? clean(match[0]) : null;
}

export function parseCareerText({ sourceId, sourceType, text, extractorVersion = CAREEROS_INTAKE_EXTRACTOR_VERSION }) {
  const sourceText = String(text || "").trim();
  if (!sourceText) throw Object.assign(new Error("source_text_required"), { code: "SOURCE_TEXT_REQUIRED" });
  const segments = sourceText
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?])\s+/))
    .map(clean)
    .filter((segment) => segment.length >= 20)
    .slice(0, 200);
  const seen = new Set();
  const candidates = [];
  for (let index = 0; index < segments.length; index += 1) {
    const statement = segments[index].slice(0, 500);
    const normalized = statement.toLowerCase().replace(/[^a-z0-9+#% ]/g, " ").replace(/\s+/g, " ").trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    const candidateId = `candidate_${digest(`${sourceId}|${extractorVersion}|${index}|${normalized}`).slice(0, 24)}`;
    candidates.push({
      candidateFactId: candidateId,
      sourceId,
      sourceType,
      factType: factTypeFor(statement),
      statement,
      sourceExcerpt: statement,
      sourceOrder: index,
      scopeStatement: scopeStatement(statement),
      extractionMethod: "deterministic_text_segmentation",
      extractionVersion: extractorVersion,
      confidence: "CANDIDATE_ONLY",
      ambiguity: [],
      status: "PROPOSED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return { sourceDigest: digest(sourceText), extractorVersion, candidates };
}

export function sourceIdentity({ sourceType, text }) {
  return digest(`${sourceType}|${String(text || "").trim()}`);
}
