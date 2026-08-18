const MAX_DRAFT_LENGTH = 50000;

function uniqueEvidence(packet) {
  const items = [...(packet.sections.direct || []), ...(packet.sections.transferable || [])];
  const seen = new Set();
  return items.flatMap((item) => item.evidence.map((evidence) => ({ ...evidence, requirement: item.requirement, relationship: item.relationship }))).filter((item) => {
    const key = item.statement.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildResumeDraft({ profile, packet }) {
  if (packet.status !== "CURRENT") return { status: packet.status, message: packet.message };
  const evidence = uniqueEvidence(packet);
  const title = packet.opportunity.title;
  const header = [profile.displayName, profile.headline, profile.location].filter(Boolean);
  const lines = [header.join("\n"), `Target role: ${title}`, "", "Professional summary", profile.headline || "Review needed: CareerOS does not have enough confirmed information for a professional summary.", "", "Relevant confirmed experience"];
  if (evidence.length) lines.push(...evidence.map((item) => `- ${item.statement}`));
  else lines.push("- Review needed: no confirmed experience was available for this draft.");
  lines.push("", "Review before using", "- CareerOS does not currently have complete structured information for employer, title, dates, chronology, education, credentials, or measurable outcomes. Do not add details unless you can verify them.");
  const reviewNeeded = [...new Set([...(packet.sections.partial || []).map((item) => item.requirement), ...(packet.sections.unknown || []).map((item) => item.requirement), ...(packet.sections.specialist || []).map((item) => item.requirement), ...(packet.sections.scope || []).map((item) => item.requirement)])];
  return {
    status: "CURRENT",
    content: {
      text: lines.join("\n"),
      targetRole: title,
      blocks: evidence.map((item) => ({ text: item.statement, relationship: item.relationship, requirement: item.requirement, grounding: "SUPPORTED" })),
      reviewNeeded,
      structuralGaps: ["employer/title/date chronology", "education and credentials where not confirmed", "measurable outcomes where not confirmed"],
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
