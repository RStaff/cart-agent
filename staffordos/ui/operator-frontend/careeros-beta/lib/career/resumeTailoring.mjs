const MAX_DRAFT_LENGTH = 50000;

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function evidenceKey(value) {
  return cleanText(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function resumeBullet(value) {
  const text = cleanText(value).replace(/^(confirmed|transferable) experience\s*:\s*/i, "");
  if (!text) return "";
  return /^[A-Z]/.test(text) ? `${text}${/[.!?]$/.test(text) ? "" : "."}` : `${text.charAt(0).toUpperCase()}${text.slice(1)}${/[.!?]$/.test(text) ? "" : "."}`;
}

function uniqueEvidence(packet) {
  const items = [...(packet.sections.direct || []), ...(packet.sections.transferable || [])];
  const seen = new Set();
  return items.flatMap((item) => (item.evidence || []).map((evidence) => ({ ...evidence, requirement: item.requirement, relationship: item.relationship }))).filter((item) => {
    const key = evidenceKey(item.statement);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function evidenceGroups(evidence) {
  const groups = new Map();
  for (const item of evidence) {
    const employer = cleanText(item.employer || item.employerName);
    const role = cleanText(item.title || item.role || item.jobTitle);
    const startDate = cleanText(item.startDate);
    const endDate = cleanText(item.endDate);
    if (!employer && !role && !startDate && !endDate) continue;
    const key = [employer, role, startDate, endDate].join("|");
    if (!groups.has(key)) groups.set(key, { employer, role, startDate, endDate, bullets: [] });
    groups.get(key).bullets.push(resumeBullet(item.statement));
  }
  return [...groups.values()].filter((group) => group.bullets.length);
}

function capabilityLabels(packet) {
  const seen = new Set();
  return [...(packet.sections.direct || []), ...(packet.sections.transferable || [])]
    .map((item) => cleanText(item.capability))
    .filter((label) => label && !seen.has(evidenceKey(label)) && seen.add(evidenceKey(label)));
}

function reviewNeeded(packet) {
  return [...new Set([...(packet.sections.partial || []), ...(packet.sections.unknown || []), ...(packet.sections.specialist || []), ...(packet.sections.scope || [])].map((item) => cleanText(item.requirement)).filter(Boolean))];
}

export function buildResumeDraft({ profile, packet }) {
  if (packet.status !== "CURRENT") return { status: packet.status, message: packet.message };
  const evidence = uniqueEvidence(packet);
  const title = packet.opportunity.title;
  const header = [profile.displayName, profile.headline, profile.location].filter(Boolean);
  const groups = evidenceGroups(evidence);
  const capabilities = capabilityLabels(packet);
  const reviewItems = reviewNeeded(packet);
  const bullets = evidence.map((item) => resumeBullet(item.statement)).filter(Boolean);
  const lines = [header.join("\n"), `Target role: ${title}`, "", "Professional Summary", profile.headline || `Target role: ${title}`];
  if (capabilities.length) lines.push("", "Core Capabilities", ...capabilities.map((item) => `- ${resumeBullet(item)}`));
  if (groups.length) {
    lines.push("", "Professional Experience");
    for (const group of groups) {
      const heading = [group.role, group.employer].filter(Boolean).join(" | ") || "Experience";
      lines.push(heading, ...group.bullets.map((item) => `- ${item}`));
    }
  } else {
    lines.push("", "Experience Highlights");
    if (bullets.length) lines.push(...bullets.map((item) => `- ${item}`));
    else lines.push("- No confirmed experience was available for this draft.");
  }
  return {
    status: "CURRENT",
    content: {
      materialType: "RESUME",
      text: lines.join("\n"),
      targetRole: title,
      blocks: evidence.map((item) => ({ text: resumeBullet(item.statement), relationship: item.relationship, requirement: item.requirement, grounding: "SUPPORTED" })),
      sections: { capabilities, experience: groups.length ? groups : bullets },
      reviewNeeded: reviewItems,
      structuralGaps: [groups.length ? null : "employer/title/date chronology not available in authorized evidence", "education and credentials where not confirmed", "measurable outcomes where not confirmed"].filter(Boolean),
      editedByUser: false,
    },
  };
}

export function normalizeDraftText(value) {
  const text = String(value || "").trim();
  if (!text) throw Object.assign(new Error("DRAFT_TEXT_REQUIRED"), { code: "DRAFT_TEXT_REQUIRED" });
  if (text.length > MAX_DRAFT_LENGTH) throw Object.assign(new Error("DRAFT_TOO_LARGE"), { code: "DRAFT_TOO_LARGE" });
  return text;
}

export { MAX_DRAFT_LENGTH };
