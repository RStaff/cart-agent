function evidenceItems(packet, states) {
  return states.flatMap((section) => packet.sections[section] || []).flatMap((item) => item.evidence.map((evidence) => ({ statement: evidence.statement, relationship: item.relationship, requirement: item.requirement })));
}

function unique(items) { const seen = new Set(); return items.filter((item) => { const key = item.statement.trim(); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }

export function classifyApplicationQuestion(question) {
  const value = String(question || "").trim().toLowerCase();
  if (!value) return "UNKNOWN";
  if (/why (are you|do you want|interested)|why this (company|role)|motivat|looking for next/.test(value)) return "MOTIVATION";
  if (/project|initiative|program|accomplishment|achievement|led|leadership|managed/.test(value)) return /lead|managed|people|team/.test(value) ? "LEADERSHIP" : "PROJECT_EXAMPLE";
  if (/technical|technology|tool|platform|software|system|sql|python|javascript|engineering/.test(value)) return "TECHNICAL_EXPERIENCE";
  if (/relevant experience|experience do you have|background|worked with|describe your experience/.test(value)) return "RELEVANT_EXPERIENCE";
  if (/fit|qualified|strength|contribute|good candidate/.test(value)) return "GENERAL_FIT";
  return "UNKNOWN";
}

export function buildCoverLetterDraft({ profile, packet }) {
  if (packet.status !== "CURRENT") return { status: packet.status, message: packet.message };
  const direct = unique(evidenceItems(packet, ["direct"]));
  const transferable = unique(evidenceItems(packet, ["transferable"]));
  const role = packet.opportunity.title;
  const company = packet.opportunity.company ? ` at ${packet.opportunity.company}` : "";
  const lines = [`Dear Hiring Team,`, "", `I am writing to apply for the ${role} role${company}. My confirmed experience includes work relevant to this opportunity.`, ""];
  if (direct[0]) lines.push(`My experience includes ${direct[0].statement}`);
  if (direct[1]) lines.push(`I have also confirmed experience with ${direct[1].statement}`);
  if (transferable[0]) lines.push(`Related experience may transfer to this role: ${transferable[0].statement}`);
  lines.push("", "I would welcome the opportunity to discuss how this confirmed experience could contribute to the role.", "", "Sincerely,", profile.displayName);
  return { status: "CURRENT", content: { materialType: "COVER_LETTER", text: lines.join("\n"), blocks: [...direct.slice(0, 2), ...transferable.slice(0, 1)].map((item) => ({ ...item, grounding: "SUPPORTED" })), reviewNeeded: [...(packet.sections.partial || []), ...(packet.sections.unknown || []), ...(packet.sections.specialist || []), ...(packet.sections.scope || [])].map((item) => item.requirement), editedByUser: false } };
}

export function buildApplicationAnswerDraft({ profile, packet, question, userIntent = "" }) {
  const questionType = classifyApplicationQuestion(question);
  if (packet.status !== "CURRENT") return { status: packet.status, message: packet.message };
  if (questionType === "MOTIVATION" && !String(userIntent).trim()) return { status: "NEEDS_USER_INPUT", questionType, question, message: "Tell CareerOS what interests you about this role or company. CareerOS will keep that as application-specific input, not career authority." };
  if (questionType === "UNKNOWN") return { status: "NEEDS_CLARIFICATION", questionType, question, message: "CareerOS could not classify this question yet. Add a little more context before drafting an answer." };
  const states = questionType === "TECHNICAL_EXPERIENCE" ? ["direct", "transferable"] : questionType === "LEADERSHIP" ? ["direct", "transferable"] : ["direct", "transferable"];
  const evidence = unique(evidenceItems(packet, states));
  const lines = [];
  if (userIntent.trim()) lines.push(userIntent.trim(), "");
  if (evidence.length) lines.push(evidence.slice(0, 3).map((item) => item.statement).join(" "));
  else lines.push("Review needed: CareerOS does not have enough confirmed experience to draft a supported answer for this question.");
  return { status: "CURRENT", content: { materialType: "APPLICATION_ANSWER", question, questionType, userIntent: userIntent.trim() || null, text: lines.join("\n"), blocks: evidence.slice(0, 3).map((item) => ({ ...item, grounding: "SUPPORTED" })), reviewNeeded: [...(packet.sections.partial || []), ...(packet.sections.unknown || []), ...(packet.sections.specialist || []), ...(packet.sections.scope || [])].map((item) => item.requirement), editedByUser: false } };
}
