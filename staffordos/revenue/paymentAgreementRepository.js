import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, "paymentAgreements.json");

function now() {
  return new Date().toISOString();
}

function ensureRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    writeFileSync(REGISTRY_PATH, "[]\n", "utf8");
  }
}

function readRegistry() {
  ensureRegistry();
  try {
    return JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
  } catch {
    return [];
  }
}

function writeRegistry(records) {
  writeFileSync(REGISTRY_PATH, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

function normalizeAgreement(opportunityId, agreementData = {}, existing = null) {
  const timestamp = now();
  return {
    id: agreementData.id || existing?.id || `payment_agreement__${opportunityId}`,
    opportunityId,
    paymentModel: String(agreementData.paymentModel || existing?.paymentModel || "").trim().toUpperCase(),
    estimatedClientValue: Number(
      agreementData.estimatedClientValue
        ?? agreementData.estimatedRevenueImpact
        ?? existing?.estimatedClientValue
        ?? 0,
    ) || 0,
    agreed: agreementData.agreed === true,
    agreementSource: agreementData.agreementSource || existing?.agreementSource || "MANUAL_INTERNAL",
    notes: agreementData.notes ?? existing?.notes ?? "",
    createdAt: existing?.createdAt || agreementData.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

export function createPaymentAgreement(agreement = {}) {
  if (!agreement?.opportunityId) {
    throw new Error("createPaymentAgreement requires opportunityId");
  }

  const records = readRegistry();
  const existing = records.find((record) => record.opportunityId === agreement.opportunityId);
  if (existing) {
    return existing;
  }

  const normalized = normalizeAgreement(agreement.opportunityId, agreement);
  records.push(normalized);
  writeRegistry(records);
  return normalized;
}

export function getPaymentAgreementByOpportunityId(opportunityId) {
  return readRegistry().find((record) => record.opportunityId === opportunityId) || null;
}

export function upsertPaymentAgreement(opportunityId, agreementData = {}) {
  if (!opportunityId) {
    throw new Error("upsertPaymentAgreement requires opportunityId");
  }

  const records = readRegistry();
  const index = records.findIndex((record) => record.opportunityId === opportunityId);
  const existing = index >= 0 ? records[index] : null;
  const normalized = normalizeAgreement(opportunityId, agreementData, existing);

  if (index >= 0) {
    records[index] = normalized;
  } else {
    records.push(normalized);
  }

  writeRegistry(records);
  return normalized;
}

export function listPaymentAgreements(filters = {}) {
  return readRegistry().filter((record) => {
    if (filters.agreed !== undefined && record.agreed !== filters.agreed) return false;
    if (filters.paymentModel && record.paymentModel !== filters.paymentModel) return false;
    if (filters.agreementSource && record.agreementSource !== filters.agreementSource) return false;
    return true;
  });
}

export function markAgreementAccepted(opportunityId, metadata = {}) {
  return upsertPaymentAgreement(opportunityId, {
    ...metadata,
    agreed: true,
    agreementSource: metadata.agreementSource || "MANUAL_INTERNAL",
  });
}

export function markAgreementNotAccepted(opportunityId, metadata = {}) {
  return upsertPaymentAgreement(opportunityId, {
    ...metadata,
    agreed: false,
    agreementSource: metadata.agreementSource || "MANUAL_INTERNAL",
  });
}
