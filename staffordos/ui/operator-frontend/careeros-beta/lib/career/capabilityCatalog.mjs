export const CAREEROS_CAPABILITY_TAXONOMY_VERSION = "CAREEROS_CAPABILITY_TAXONOMY_V1";

const CATALOG = [
  {
    key: "PROGRAM_DELIVERY",
    label: "Program delivery",
    domain: "delivery",
    scope: "program",
    question: {
      key: "PROGRAM_DELIVERY_SCOPE",
      prompt: "Have you personally owned cross-functional programs from planning through delivery, including sequencing, stakeholders, and outcomes?",
      uncertainty: "program-level ownership and delivery scope",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "CROSS_FUNCTIONAL_COORDINATION",
    label: "Cross-functional coordination",
    domain: "delivery",
    scope: "cross-functional",
    question: {
      key: "CROSS_FUNCTIONAL_SCOPE",
      prompt: "Have you coordinated work across different teams or stakeholder groups to deliver a shared outcome?",
      uncertainty: "cross-functional coordination and stakeholder scope",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "TECHNOLOGY_IMPLEMENTATION",
    label: "Technology implementation",
    domain: "technology",
    scope: "delivery",
    question: {
      key: "TECHNOLOGY_IMPLEMENTATION_AUTHORITY",
      prompt: "Have you personally implemented or improved a technology, platform, automation, or technical workflow in a real operating environment?",
      uncertainty: "hands-on implementation authority and operating context",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "OUTCOME_DELIVERY",
    label: "Outcome delivery",
    domain: "outcomes",
    scope: "project",
    question: {
      key: "OUTCOME_DELIVERY_EVIDENCE",
      prompt: "Have you delivered a measurable improvement, launch, saving, growth result, or other outcome that you can describe?",
      uncertainty: "measurable outcome ownership",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "PEOPLE_MANAGEMENT",
    label: "People management",
    domain: "leadership",
    scope: "people",
    question: {
      key: "PEOPLE_MANAGEMENT_AUTHORITY",
      prompt: "Have you directly managed people, including responsibility for hiring, performance, coaching, or team development?",
      uncertainty: "formal people-management authority",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "TEACHING_TRAINING",
    label: "Teaching and training",
    domain: "enablement",
    scope: "training",
    question: {
      key: "TEACHING_TRAINING_AUTHORITY",
      prompt: "Have you personally taught, trained, coached, facilitated, or enabled people to use a skill, process, or system?",
      uncertainty: "teaching, training, and enablement scope",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "ANALYTICS_REPORTING",
    label: "Analytics and reporting",
    domain: "analytics",
    scope: "reporting",
    question: {
      key: "ANALYTICS_REPORTING_AUTHORITY",
      prompt: "Have you created analysis, dashboards, reporting, or measurements that helped people understand performance or make decisions?",
      uncertainty: "analytics, reporting, and measurement scope",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "CONSULTING_CLIENT_DELIVERY",
    label: "Consulting and client delivery",
    domain: "client_delivery",
    scope: "client",
    question: {
      key: "CONSULTING_CLIENT_DELIVERY_AUTHORITY",
      prompt: "Have you advised clients or customers and delivered work, implementations, or outcomes for them?",
      uncertainty: "consulting, advisory, and client-delivery scope",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "BUSINESS_PROCESS_OPERATIONS",
    label: "Business and process operations",
    domain: "operations",
    scope: "process",
    question: {
      key: "BUSINESS_PROCESS_OPERATIONS_AUTHORITY",
      prompt: "Have you managed or improved business operations, workflows, processes, vendors, or operational systems?",
      uncertainty: "business and process operations scope",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
  {
    key: "MARKETING_DIGITAL",
    label: "Marketing and digital work",
    domain: "marketing",
    scope: "digital",
    question: {
      key: "MARKETING_DIGITAL_AUTHORITY",
      prompt: "Have you led or delivered digital marketing, campaigns, marketing technology, CRM marketing, content, SEO, or paid media work?",
      uncertainty: "marketing and digital-work scope",
      choices: ["DIRECT", "TRANSFERABLE", "PARTIAL", "KEEP_UNRESOLVED"],
    },
  },
];

export function listCapabilities() {
  return CATALOG.map((item) => ({ ...item, question: { ...item.question, choices: [...item.question.choices] } }));
}

export function capabilityForKey(key) {
  return CATALOG.find((item) => item.key === key) || null;
}

function statementText(fact) {
  return String(fact.statement || "").trim();
}

function hasPeopleAuthority(statement) {
  return /direct reports|people manager|managed people|hiring|performance review|performance management|team development/i.test(statement);
}

export function deriveCapabilityCandidates(facts) {
  const byKey = new Map();
  for (const fact of facts || []) {
    const statement = statementText(fact);
    const type = String(fact.factType || "").toUpperCase();
    const candidates = [];
    if (type === "PROJECT" || type === "LEADERSHIP" || /program|project|delivery|launched|implemented|owned/i.test(statement)) {
      candidates.push("PROGRAM_DELIVERY", "CROSS_FUNCTIONAL_COORDINATION");
    }
    if (type === "TECHNOLOGY" || /implemented|platform|automation|technology|crm|sql|python|javascript|tool/i.test(statement)) {
      candidates.push("TECHNOLOGY_IMPLEMENTATION");
    }
    if (type === "ACHIEVEMENT" || /increased|reduced|grew|saved|achieved|improved|outcome|revenue/i.test(statement)) {
      candidates.push("OUTCOME_DELIVERY");
    }
    if ((type === "LEADERSHIP" || /managed|led|directed/i.test(statement)) && hasPeopleAuthority(statement)) {
      candidates.push("PEOPLE_MANAGEMENT");
    }
    if (/teach|train|workshop|instruction|facilitat|coach|curriculum|enablement|demonstrat/i.test(statement)) {
      candidates.push("TEACHING_TRAINING");
    }
    if (/analytics|dashboard|reporting|kpi|data analysis|performance reporting|measurement|insights/i.test(statement)) {
      candidates.push("ANALYTICS_REPORTING");
    }
    if (/consult|client|customer delivery|advisory|advised clients|account engagement|implementation for clients|stakeholder-facing delivery/i.test(statement)) {
      candidates.push("CONSULTING_CLIENT_DELIVERY");
    }
    if (/operations|workflow|process design|operational improvement|operational process|vendor coordination|business operations|process management|operational system|operated a business|operate a business|small business/i.test(statement)) {
      candidates.push("BUSINESS_PROCESS_OPERATIONS");
    }
    if (/digital marketing|campaign|seo|paid media|marketing technology|marketing operations|crm marketing|content strategy/i.test(statement)) {
      candidates.push("MARKETING_DIGITAL");
    }
    for (const capabilityKey of [...new Set(candidates)]) {
      const item = capabilityForKey(capabilityKey);
      if (!item) continue;
      const existing = byKey.get(capabilityKey) || { capabilityKey, label: item.label, domain: item.domain, scope: item.scope, factIds: [], sourceIds: [], statements: [] };
      if (fact.id && !existing.factIds.includes(fact.id)) existing.factIds.push(fact.id);
      if (fact.sourceId && !existing.sourceIds.includes(fact.sourceId)) existing.sourceIds.push(fact.sourceId);
      if (statement && !existing.statements.includes(statement)) existing.statements.push(statement.slice(0, 240));
      byKey.set(capabilityKey, existing);
    }
  }
  return [...byKey.values()].map((candidate) => ({
    ...candidate,
    authorityState: "NEEDS_MORE_EVIDENCE",
    taxonomyVersion: CAREEROS_CAPABILITY_TAXONOMY_VERSION,
    provenance: { kind: "CONFIRMED_CAREER_FACTS", factIds: candidate.factIds, sourceIds: candidate.sourceIds, statements: candidate.statements },
  }));
}

export function decisionStateForAnswer(answer) {
  return ({ DIRECT: "VERIFIED_DIRECT", TRANSFERABLE: "VERIFIED_TRANSFERABLE", PARTIAL: "PARTIALLY_SUPPORTED", KEEP_UNRESOLVED: "KEEP_UNRESOLVED" })[answer] || null;
}

export function choiceLabel(answer) {
  return ({ DIRECT: "Yes, this is directly demonstrated", TRANSFERABLE: "I have closely related experience", PARTIAL: "I have experience with part of this", KEEP_UNRESOLVED: "Keep this unresolved for now" })[answer] || answer;
}
