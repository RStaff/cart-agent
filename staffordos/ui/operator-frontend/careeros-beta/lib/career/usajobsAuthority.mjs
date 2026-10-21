export const USAJOBS_AUTOMATIC_DISCOVERY_AUTHORITY_STATE = "WRITTEN_APPROVAL_REQUIRED";
export const USAJOBS_AUTOMATIC_DISCOVERY_BLOCK_CODE = "USAJOBS_WRITTEN_APPROVAL_REQUIRED";
export const USAJOBS_AUTOMATIC_DISCOVERY_PRODUCT_STATUS = "AUTOMATIC_DISCOVERY_DISABLED_PENDING_AUTHORITY";

function clean(value, limit = 1000) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function authorityError(code, details = {}) {
  return Object.assign(new Error(code), { code, ...details });
}

export function getUsajobsAutomaticDiscoveryAuthority({
  authorityState = USAJOBS_AUTOMATIC_DISCOVERY_AUTHORITY_STATE,
  writtenApprovalEvidenceRef = null,
} = {}) {
  const state = clean(authorityState, 120).toUpperCase() || "UNVERIFIED";
  const evidenceRef = clean(writtenApprovalEvidenceRef, 500) || null;
  const writtenApprovalProven = state === "AUTHORIZED" && Boolean(evidenceRef);
  return {
    provider: "USAJOBS",
    authorityState: state,
    writtenApprovalProven,
    writtenApprovalEvidenceRef: evidenceRef,
    productStatus: writtenApprovalProven ? "AUTHORIZED" : USAJOBS_AUTOMATIC_DISCOVERY_PRODUCT_STATUS,
  };
}

export function authorizeUsajobsAutomaticDiscovery(options = {}) {
  const authority = getUsajobsAutomaticDiscoveryAuthority(options);
  if (!authority.writtenApprovalProven) {
    return {
      authorized: false,
      code: authority.authorityState === "WRITTEN_APPROVAL_REQUIRED" ? USAJOBS_AUTOMATIC_DISCOVERY_BLOCK_CODE : "USAJOBS_AUTHORITY_NOT_PROVEN",
      authority,
    };
  }
  return { authorized: true, code: "AUTHORIZED", authority };
}

export async function searchAuthorizedUsajobsDiscovery({ criteria = {}, adapter, authorityOptions = {} } = {}) {
  const authorization = authorizeUsajobsAutomaticDiscovery(authorityOptions);
  if (!authorization.authorized) throw authorityError(authorization.code, { providerAuthority: authorization.authority });
  if (typeof adapter !== "function") throw authorityError("USAJOBS_ADAPTER_NOT_CONFIGURED", { providerAuthority: authorization.authority });
  return adapter(criteria);
}
