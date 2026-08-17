export const CAREER_STORY_STATUS = Object.freeze({
  CURRENT_FACTS_REVIEWED: "CURRENT_FACTS_REVIEWED",
  CAREER_STORY_COMPLETE_FOR_NOW: "CAREER_STORY_COMPLETE_FOR_NOW",
});

export const CAREER_STORY_INPUT_MODES = Object.freeze({
  DOCUMENT: "DOCUMENT",
  PASTE_OR_TYPE: "PASTE_OR_TYPE",
  TALK: "TALK",
});

export const CAREER_STORY_TYPES = Object.freeze([
  ["EMPLOYMENT", "Employment"],
  ["CONSULTING", "Consulting engagement"],
  ["PROJECT", "Project"],
  ["ACCOMPLISHMENT", "Accomplishment"],
  ["TECHNICAL_BUILD", "Technical build"],
  ["CERTIFICATION", "Certification"],
  ["EDUCATION", "Education"],
  ["SPEAKING_TEACHING", "Speaking or teaching"],
  ["LEADERSHIP", "Leadership"],
  ["VOLUNTEER_COMMUNITY", "Volunteer or community experience"],
  ["OTHER", "Other professional experience"],
]);

export const CAREER_STORY_LANGUAGE = Object.freeze({
  internal: ["CareerFact", "capability authority", "scope/directness", "requirement concept", "projection", "specialist firewall"],
  customer: ["experience", "career story", "strengths", "what you demonstrated", "what CareerOS understands", "what needs clarification", "not established yet"],
});

export const TALK_OPENING = "Tell me about a role, project, accomplishment, or experience that is not represented in your profile yet.";
export const TALK_FOLLOW_UPS = Object.freeze([
  "What did you personally do?",
  "What did you own, and what did you support?",
  "What responsibilities, stakeholders, or systems were involved?",
  "What was the scope, scale, timing, or context?",
  "What changed or was accomplished?",
  "What evidence or source could help you confirm this later?",
]);

export function documentUploadReadiness() {
  return { enabled: false, status: "BINARY_UPLOAD_DISABLED", reason: "Secure object storage, malware/content inspection, access controls, retention, and deletion proof are not yet authorized." };
}

export function buildConversationDraft(answers = {}) {
  const clean = (key) => String(answers[key] || "").trim().slice(0, 4000);
  const sections = [
    ["What I did", clean("did")], ["What I owned or supported", clean("ownership")],
    ["Responsibilities, stakeholders, or systems", clean("responsibilities")],
    ["Scope and context", clean("scope")], ["Outcome", clean("outcome")],
    ["Evidence or source", clean("evidence")],
  ].filter(([, value]) => value);
  return sections.map(([label, value]) => `${label}: ${value}`).join("\n").slice(0, 50000);
}

export function nextStoryStatus(action) {
  return action === "COMPLETE_FOR_NOW" ? CAREER_STORY_STATUS.CAREER_STORY_COMPLETE_FOR_NOW : CAREER_STORY_STATUS.CURRENT_FACTS_REVIEWED;
}
