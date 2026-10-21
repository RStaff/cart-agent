const FACT_TYPE_LABELS = Object.freeze({
  EMPLOYMENT: "Experience",
  CONSULTING: "Experience",
  PROJECT: "Projects and accomplishments",
  ACCOMPLISHMENT: "Projects and accomplishments",
  LEADERSHIP: "Leadership",
  TECHNOLOGY: "Technologies and skills",
  EDUCATION: "Education and credentials",
  CERTIFICATION: "Education and credentials",
  SPEAKING_TEACHING: "Speaking and teaching",
  VOLUNTEER_COMMUNITY: "Community experience",
});

const STRUCTURAL_HEADINGS = /^(professional experience|work experience|employment history|core skills(?:\s*\/\s*technologies)?|skills(?:\s*\/\s*technologies)?|education|certifications?|projects?|leadership|summary|professional summary|objective|references?)$/i;

export function humanFactType(factType) {
  return FACT_TYPE_LABELS[String(factType || "").toUpperCase()] || "Other experience";
}

export function humanSourceType(sourceType) {
  return String(sourceType || "Other source")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function isPrimaryProfileStatement(statement) {
  const value = String(statement || "").trim();
  if (!value || STRUCTURAL_HEADINGS.test(value)) return false;
  if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(value)) return false;
  return true;
}

function evidenceFor(fact) {
  return {
    sourceType: humanSourceType(fact.sourceType),
    sourceExcerpt: fact.sourceExcerpt || "",
    scopeStatement: fact.scopeStatement || null,
    confirmation: "Confirmed by you",
  };
}

export function buildCareerProfileView({ profile, facts = [], candidates = [] }) {
  const confirmed = facts
    .filter((fact) => fact?.authorityState === "CUSTOMER_CONFIRMED_SOURCE_BACKED" || fact?.status === "CUSTOMER_CONFIRMED")
    .map((fact) => ({
      id: fact.id,
      label: humanFactType(fact.factType),
      statement: String(fact.statement || "").trim(),
      primary: isPrimaryProfileStatement(fact.statement),
      evidence: evidenceFor(fact),
    }));
  const sections = [];
  for (const label of [...new Set(confirmed.filter((fact) => fact.primary).map((fact) => fact.label))]) {
    sections.push({ label, facts: confirmed.filter((fact) => fact.primary && fact.label === label) });
  }
  return {
    profile: profile ? { displayName: profile.displayName, headline: profile.headline, location: profile.location, careerStage: profile.careerStage } : null,
    sections,
    evidenceOnly: confirmed.filter((fact) => !fact.primary),
    reviewCandidates: candidates
      .filter((candidate) => ["PROPOSED", "NEEDS_REVIEW"].includes(candidate?.status))
      .map((candidate) => ({
        id: candidate.candidateFactId,
        statement: candidate.statement,
        sourceType: humanSourceType(candidate.sourceType),
        status: candidate.status,
      })),
  };
}
