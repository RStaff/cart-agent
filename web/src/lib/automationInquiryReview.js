export const AUTOMATION_INQUIRY_REVIEW_PERMISSION = "staffordos.revenue_operations.write";

export function requireOperatorReviewContext(req) {
  const permission = String(req.get("x-staffordos-operator-permission") || "").trim();
  const subject = String(req.get("x-staffordos-operator-subject") || "").trim();
  if (!subject) throw Object.assign(new Error("OPERATOR_IDENTITY_MISSING"), { code: "OPERATOR_IDENTITY_MISSING" });
  if (permission !== AUTOMATION_INQUIRY_REVIEW_PERMISSION) throw Object.assign(new Error("OPERATOR_PERMISSION_MISSING"), { code: "OPERATOR_PERMISSION_MISSING" });
  return { subject, permission };
}
