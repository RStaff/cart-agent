import { NextResponse } from "next/server";

const placeholderLeads = [
  {
    id: "placeholder-lead-alpha",
    leadName: "Placeholder Lead Alpha",
    productSource: "Abando",
    status: "Needs routing",
    lastActivity: "Placeholder intake packet created",
    nextAction: "Assign operator owner",
  },
  {
    id: "placeholder-lead-beta",
    leadName: "Placeholder Lead Beta",
    productSource: "Shopifixer",
    status: "Awaiting follow-up",
    lastActivity: "Placeholder qualification note added",
    nextAction: "Send cross-product follow-up",
  },
  {
    id: "placeholder-lead-gamma",
    leadName: "Placeholder Lead Gamma",
    productSource: "Actinventory",
    status: "Ready for review",
    lastActivity: "Placeholder review request logged",
    nextAction: "Review routing fit",
  },
] as const;

export async function GET() {
  return NextResponse.json({
    ok: true,
    placeholder: true,
    source: "staffordos-operator-frontend-stub",
    leads: placeholderLeads,
  });
}
