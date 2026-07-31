export type StaffordOsSectionKey =
  | "home"
  | "command"
  | "work"
  | "pipeline"
  | "knowledge"
  | "governance"
  | "system";

export type StaffordOsSection = {
  key: StaffordOsSectionKey;
  label: string;
  href: string;
  purpose: string;
  operatingQuestion: string;
  frame: string;
};

export const STAFFORDOS_SECTIONS: StaffordOsSection[] = [
  {
    key: "home",
    label: "Home",
    href: "/os",
    purpose: "Global operating surface",
    operatingQuestion: "What should I do next?",
    frame: "Current priority, context, and decision focus.",
  },
  {
    key: "command",
    label: "Command",
    href: "/os/command",
    purpose: "Decision queue",
    operatingQuestion: "Which decision matters most?",
    frame: "Cross-company priorities, risks, and tradeoffs.",
  },
  {
    key: "work",
    label: "Work",
    href: "/os/work",
    purpose: "Execution control",
    operatingQuestion: "What is moving, blocked, or waiting?",
    frame: "Active work, handoffs, and completion proof.",
  },
  {
    key: "pipeline",
    label: "Pipeline",
    href: "/os/pipeline",
    purpose: "Business lifecycle",
    operatingQuestion: "Where is value flowing or stuck?",
    frame: "Awareness through referral as one operating flow.",
  },
  {
    key: "knowledge",
    label: "Knowledge",
    href: "/os/knowledge",
    purpose: "Institutional memory",
    operatingQuestion: "What evidence should guide this choice?",
    frame: "Evidence, lessons, playbooks, and durable context.",
  },
  {
    key: "governance",
    label: "Governance",
    href: "/os/governance",
    purpose: "Authority and audit",
    operatingQuestion: "What authority is required before action?",
    frame: "Permissions, approvals, policy, and auditability.",
  },
  {
    key: "system",
    label: "System",
    href: "/os/system",
    purpose: "Platform operations",
    operatingQuestion: "Is the operating system healthy?",
    frame: "Agents, automation, integrations, validators, and health.",
  },
];

export function sectionByKey(key: StaffordOsSectionKey) {
  return STAFFORDOS_SECTIONS.find((section) => section.key === key) || STAFFORDOS_SECTIONS[0];
}
