export const CAREEROS_DISCOVERY_ROLE_FAMILY_VERSION = "CAREEROS_DISCOVERY_ROLE_FAMILY_V1";

export const DISCOVERY_ROLE_FAMILIES = Object.freeze({
  PROJECT_MANAGEMENT: {
    label: "Project Management",
    query: "project manager project management",
    patterns: [/project manager/i, /project management/i, /\bpm\b/i],
  },
  PROGRAM_MANAGEMENT: {
    label: "Program Management",
    query: "program manager program delivery",
    patterns: [/program manager/i, /program management/i, /program delivery/i],
  },
  TECHNICAL_PROJECT_PROGRAM_MANAGEMENT: {
    label: "Technical Project / Program Management",
    query: "technical program manager technical project manager",
    patterns: [/technical program manager/i, /\btpm\b/i, /technical project manager/i],
  },
  PRODUCT_TECHNICAL_PRODUCT: {
    label: "Product / Technical Product",
    query: "product manager technical product manager",
    patterns: [/product manager/i, /technical product/i, /product operations/i],
  },
  BUSINESS_TECHNOLOGY: {
    label: "Business Technology",
    query: "business technology business systems",
    patterns: [/business technolog/i, /business systems/i, /technology implementation/i, /systems analyst/i],
  },
  AI_AUTOMATION: {
    label: "AI / Automation",
    query: "AI automation program manager",
    patterns: [/\bAI\b/i, /artificial intelligence/i, /automation/i, /workflow automation/i],
  },
  DIGITAL_TRANSFORMATION: {
    label: "Digital Transformation",
    query: "digital transformation program manager",
    patterns: [/digital transformation/i, /transformation program/i, /process transformation/i],
  },
  MARKETING_TECHNOLOGY: {
    label: "Marketing Technology",
    query: "marketing technology marketing operations",
    patterns: [/marketing technolog/i, /marketing operations/i, /\bmartech\b/i, /crm marketing/i],
  },
});

const CAPABILITY_ROLE_FAMILIES = Object.freeze({
  PROGRAM_DELIVERY: ["PROGRAM_MANAGEMENT", "PROJECT_MANAGEMENT"],
  CROSS_FUNCTIONAL_COORDINATION: ["PROGRAM_MANAGEMENT", "PROJECT_MANAGEMENT"],
  TECHNOLOGY_IMPLEMENTATION: ["TECHNICAL_PROJECT_PROGRAM_MANAGEMENT", "BUSINESS_TECHNOLOGY", "AI_AUTOMATION"],
  BUSINESS_PROCESS_OPERATIONS: ["BUSINESS_TECHNOLOGY", "DIGITAL_TRANSFORMATION"],
  CONSULTING_CLIENT_DELIVERY: ["DIGITAL_TRANSFORMATION", "BUSINESS_TECHNOLOGY"],
  ANALYTICS_REPORTING: ["BUSINESS_TECHNOLOGY"],
  MARKETING_DIGITAL: ["MARKETING_TECHNOLOGY"],
  TEACHING_TRAINING: ["PROGRAM_MANAGEMENT"],
});

function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function capabilityKey(capability = {}) { return String(capability.capabilityKey || capability.key || "").trim().toUpperCase(); }

export function roleFamilyForKey(key) {
  const family = DISCOVERY_ROLE_FAMILIES[key];
  return family ? { key, ...family, patterns: [...family.patterns] } : null;
}

export function roleFamiliesForCapability(capability = {}) {
  return (CAPABILITY_ROLE_FAMILIES[capabilityKey(capability)] || []).map(roleFamilyForKey).filter(Boolean);
}

export function inferRoleFamiliesFromText(value) {
  const text = clean(value);
  if (!text) return [];
  return Object.entries(DISCOVERY_ROLE_FAMILIES)
    .filter(([, family]) => family.patterns.some((pattern) => pattern.test(text)))
    .map(([key]) => roleFamilyForKey(key));
}

export function inferRoleFamiliesFromRequirementConcept(conceptKey) {
  return (CAPABILITY_ROLE_FAMILIES[String(conceptKey || "").toUpperCase()] || []).map(roleFamilyForKey).filter(Boolean);
}
