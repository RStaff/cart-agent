import crypto from "node:crypto";

export const AUTOMATION_INQUIRY_SCHEMA = "staffordmedia.automation_inquiry.v1";
export const AUTOMATION_INQUIRY_SOURCE = "staffordmedia_automate";
export const AUTOMATION_INQUIRY_STATUS = "NEEDS_REVIEW";
export const AUTOMATION_INQUIRY_MAX_BODY_BYTES = 32 * 1024;
export const AUTOMATION_INQUIRY_MAX_WORKFLOW_LENGTH = 500;

export const AUTOMATION_IMPROVEMENTS = new Set([
  "Lead response", "Missed-call follow-up", "Customer follow-up", "Appointment reminders",
  "Estimate / quote follow-up", "Scheduling", "Repetitive data entry", "Reporting",
  "Moving information between systems", "E-commerce workflow", "Something else",
]);
export const AUTOMATION_BUSINESS_TYPES = new Set([
  "Home Services", "Professional Services", "Automotive / Field Services", "E-commerce", "Other",
]);
export const AUTOMATION_SYSTEMS = new Set([
  "CRM", "Email", "Phone", "Calendar", "Website", "Forms", "E-commerce platform",
  "Spreadsheets", "Accounting / business software", "Other",
]);

function fail(code) { throw Object.assign(new Error(code), { code }); }
function text(value, max, code, optional = false) {
  const result = String(value ?? "").trim();
  if ((!optional && !result) || result.length > max || /[\u0000-\u001f\u007f]/.test(result)) fail(code);
  return result;
}
function optionalText(value, max, code) { return text(value, max, code, true) || null; }
function email(value) {
  const result = text(value, 254, "INQUIRY_EMAIL_INVALID").toLowerCase();
  const at = result.indexOf("@");
  const domain = at >= 0 ? result.slice(at + 1) : "";
  const local = at > 0 ? result.slice(0, at) : "";
  if (
    at !== result.lastIndexOf("@") ||
    !local ||
    !domain ||
    domain.indexOf(".") <= 0 ||
    domain.endsWith(".") ||
    /[\s\r\n,;]/.test(result)
  ) fail("INQUIRY_EMAIL_INVALID");
  return result;
}
function boundedList(value, allowed, code) {
  if (!Array.isArray(value) || value.length > 20) fail(code);
  const result = [...new Set(value.map((item) => text(item, 120, code)))];
  if (result.some((item) => !allowed.has(item))) fail(code);
  return result;
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
function hash(value) { return crypto.createHash("sha256").update(canonical(value)).digest("hex"); }

export function normalizeAutomationInquiry(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("INQUIRY_PAYLOAD_INVALID");
  const keys = new Set(["schema", "submissionId", "name", "email", "phone", "companyName", "businessType", "improvements", "systems", "currentWorkflow", "desiredWorkflow", "contactAcknowledgement"]);
  if (Object.keys(input).some((key) => !keys.has(key))) fail("INQUIRY_FIELD_NOT_ALLOWED");
  if (input.schema !== AUTOMATION_INQUIRY_SCHEMA) fail("INQUIRY_SCHEMA_INVALID");
  const submissionId = text(input.submissionId, 120, "INQUIRY_SUBMISSION_ID_INVALID");
  if (!/^[A-Za-z0-9_-]+$/.test(submissionId)) fail("INQUIRY_SUBMISSION_ID_INVALID");
  if (input.contactAcknowledgement !== true) fail("INQUIRY_CONTACT_ACKNOWLEDGEMENT_REQUIRED");
  const businessType = input.businessType == null || input.businessType === "" ? null : text(input.businessType, 80, "INQUIRY_BUSINESS_TYPE_INVALID");
  if (businessType && !AUTOMATION_BUSINESS_TYPES.has(businessType)) fail("INQUIRY_BUSINESS_TYPE_INVALID");
  const normalized = {
    schema: AUTOMATION_INQUIRY_SCHEMA,
    submissionId,
    name: optionalText(input.name, 200, "INQUIRY_NAME_INVALID"),
    email: email(input.email),
    phone: optionalText(input.phone, 40, "INQUIRY_PHONE_INVALID"),
    companyName: optionalText(input.companyName, 200, "INQUIRY_COMPANY_INVALID"),
    businessType,
    improvements: boundedList(input.improvements || [], AUTOMATION_IMPROVEMENTS, "INQUIRY_IMPROVEMENTS_INVALID"),
    systems: boundedList(input.systems || [], AUTOMATION_SYSTEMS, "INQUIRY_SYSTEMS_INVALID"),
    currentWorkflow: optionalText(input.currentWorkflow, AUTOMATION_INQUIRY_MAX_WORKFLOW_LENGTH, "INQUIRY_CURRENT_WORKFLOW_INVALID"),
    desiredWorkflow: optionalText(input.desiredWorkflow, AUTOMATION_INQUIRY_MAX_WORKFLOW_LENGTH, "INQUIRY_DESIRED_WORKFLOW_INVALID"),
    contactAcknowledgement: true,
  };
  if (!normalized.improvements.length && !normalized.systems.length && !normalized.currentWorkflow && !normalized.desiredWorkflow) fail("INQUIRY_BRIEF_REQUIRED");
  return normalized;
}

export function inquiryHashes(normalized) {
  const { submissionId, ...payload } = normalized;
  const brief = { improvements: payload.improvements, systems: payload.systems, businessType: payload.businessType, currentWorkflow: payload.currentWorkflow, desiredWorkflow: payload.desiredWorkflow };
  return { payloadHash: hash(payload), briefHash: hash(brief) };
}

export function inquiryPublicRecord(record) {
  return {
    id: record.id,
    status: record.status,
    source: record.source,
    submittedAt: record.createdAt,
    name: record.name,
    email: record.email,
    phone: record.phone,
    companyName: record.companyName,
    businessType: record.businessType,
    improvements: record.improvements,
    systems: record.systems,
    currentWorkflow: record.currentWorkflow,
    desiredWorkflow: record.desiredWorkflow,
    possibleDuplicateOfId: record.possibleDuplicateOfId || null,
    reviewedAt: record.reviewedAt || null,
    reviewedBy: record.reviewedBy || null,
    nextAction: record.nextAction || "Ross reviews this inbound inquiry",
  };
}
