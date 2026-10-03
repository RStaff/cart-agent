export const INBOUND_REVIEW_PERMISSION = "staffordos.revenue_operations.write";

function text(value) {
  return String(value ?? "").trim();
}

export function createInboundReviewRequest({ baseUrl, serviceKey, operatorSubject, permission, inquiryId, nextAction }) {
  const base = text(baseUrl).replace(/\/$/, "");
  const key = text(serviceKey);
  const subject = text(operatorSubject);
  const action = text(nextAction);
  if (!base || !key) throw Object.assign(new Error("INQUIRY_REVIEW_SOURCE_UNCONFIGURED"), { code: "INQUIRY_REVIEW_SOURCE_UNCONFIGURED" });
  if (!subject) throw Object.assign(new Error("OPERATOR_IDENTITY_MISSING"), { code: "OPERATOR_IDENTITY_MISSING" });
  if (permission !== INBOUND_REVIEW_PERMISSION) throw Object.assign(new Error("OPERATOR_PERMISSION_MISSING"), { code: "OPERATOR_PERMISSION_MISSING" });
  if (typeof nextAction !== "string" || !text(inquiryId) || text(inquiryId).length > 120 || !action || action.length > 500 || /[\u0000-\u001f\u007f]/.test(action)) {
    throw Object.assign(new Error("INQUIRY_REVIEW_INPUT_INVALID"), { code: "INQUIRY_REVIEW_INPUT_INVALID" });
  }
  return {
    url: `${base}/api/staffordos/automation-inquiries/review`,
    headers: {
      "x-internal-api-key": key,
      "x-staffordos-operator-permission": INBOUND_REVIEW_PERMISSION,
      "x-staffordos-operator-subject": subject,
      "content-type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ inquiryId: text(inquiryId), nextAction: action, reviewed: true }),
  };
}
