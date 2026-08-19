import { CAREEROS_MAX_TEXT_LENGTH } from "./careerP0Intake.mjs";

export const CAREEROS_JOB_PARSER_VERSION = "CAREEROS_JOB_PARSER_V1";

function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }

function classify(text) {
  const value = text.toLowerCase();
  if (/product strategy|pricing and portfolio strategy|portfolio strategy/.test(value)) return { conceptKey: "UNRESOLVED_REQUIREMENT", scope: "unspecified", specialist: false };
  if (/direct reports|people manager|hiring|performance management|board certification|licensed cpa|security clearance|top secret clearance|secret clearance|clearance required/.test(value)) return { conceptKey: /board certification|licensed cpa|security clearance|top secret clearance|secret clearance|clearance required/.test(value) ? "SPECIALIST_REQUIREMENT" : "PEOPLE_MANAGEMENT", scope: /direct reports|people manager|hiring|performance management/.test(value) ? "people" : "specialist", specialist: /board certification|licensed cpa|security clearance|top secret clearance|secret clearance|clearance required/.test(value) };
  if (/teach|train|workshop|instruction|facilitate user adoption|coach|curriculum|enablement|office hours/.test(value)) return { conceptKey: "TEACHING_TRAINING", scope: "training", specialist: false };
  if (/analytics|dashboard|reporting|kpi|data analysis|performance reporting|measurement|insights/.test(value)) return { conceptKey: "ANALYTICS_REPORTING", scope: "reporting", specialist: false };
  if (/digital marketing|campaign|seo|paid media|marketing technology|marketing operations|crm marketing|content strategy/.test(value)) return { conceptKey: "MARKETING_DIGITAL", scope: "digital", specialist: false };
  if (/consult|client|customer|advisory|account engagement|account relationships|implementation for clients|stakeholder-facing delivery/.test(value)) return { conceptKey: "CONSULTING_CLIENT_DELIVERY", scope: "client", specialist: false };
  if (/operations|workflow|process design|process improvement|process improvements|operational improvement|operational process|vendor coordination|business operations|process management|operational system|operating rhythms|intake processes|business ownership|entrepreneur/.test(value)) return { conceptKey: "BUSINESS_PROCESS_OPERATIONS", scope: "process", specialist: false };
  if (/cross-functional|stakeholder|collaborat|coordinate/.test(value)) return { conceptKey: "CROSS_FUNCTIONAL_COORDINATION", scope: "cross-functional", specialist: false };
  if (/program|portfolio|project|delivery|roadmap|launch/.test(value)) return { conceptKey: "PROGRAM_DELIVERY", scope: /portfolio|enterprise|global/.test(value) ? "enterprise" : "program", specialist: false };
  if (/implement|platform|automation|technology|technical|crm|sql|python|javascript|tool/.test(value)) return { conceptKey: "TECHNOLOGY_IMPLEMENTATION", scope: "delivery", specialist: false };
  if (/metric|outcome|increased|reduced|grew|saved|revenue/.test(value)) return { conceptKey: "OUTCOME_DELIVERY", scope: "project", specialist: false };
  return { conceptKey: "UNRESOLVED_REQUIREMENT", scope: "unspecified", specialist: false };
}

export function parseJobDescription({ title, company, location, description, sourceUrl = null, sourceType = "USER_SUPPLIED_SOURCE" }) {
  const text = String(description || "").trim();
  if (!text) throw Object.assign(new Error("JOB_DESCRIPTION_REQUIRED"), { code: "JOB_DESCRIPTION_REQUIRED" });
  if (text.length > CAREEROS_MAX_TEXT_LENGTH) throw Object.assign(new Error("JOB_DESCRIPTION_TOO_LARGE"), { code: "JOB_DESCRIPTION_TOO_LARGE" });
  const segments = text.split(/\n+/).flatMap((line) => line.split(/(?<=[.!?])\s+/)).map(clean).filter((item) => item.length >= 12).slice(0, 200);
  const unique = [...new Set(segments.map((item) => item.slice(0, 500)))];
  const requirements = unique.map((item, index) => ({ sourceOrder: index, text: item, ...classify(item), importance: /required|must|minimum|essential/i.test(item) ? "REQUIRED" : "PREFERRED" }));
  return { sourceType: clean(sourceType).slice(0, 80) || "USER_SUPPLIED_SOURCE", title: clean(title).slice(0, 240) || "Untitled opportunity", company: clean(company).slice(0, 240) || null, location: clean(location).slice(0, 240) || null, description: text, sourceUrl: clean(sourceUrl).slice(0, 1000) || null, parserVersion: CAREEROS_JOB_PARSER_VERSION, requirements };
}
