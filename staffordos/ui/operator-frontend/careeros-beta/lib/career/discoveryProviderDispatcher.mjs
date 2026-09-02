import {
  DEFAULT_SOURCE_AUTHORITY_REGISTRY,
  authorizeSourceForAutomaticRetrieval,
} from "./sourceAuthorityRegistry.mjs";
import { searchGreenhouseSource } from "./greenhouseDiscovery.mjs";
import { searchLeverSource } from "./leverDiscovery.mjs";

export const DEFAULT_DISCOVERY_ADAPTERS = Object.freeze({
  GREENHOUSE: searchGreenhouseSource,
  LEVER: searchLeverSource,
});

function clean(value, limit = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function providerError(code, details = {}) {
  return Object.assign(new Error(code), { code, ...details });
}

function uniqueSourceIds(sourceIds) {
  return [...new Set((sourceIds || []).map((sourceId) => clean(sourceId, 160)).filter(Boolean))];
}

function providerOutcome(code, recordCount = null) {
  if (code) {
    if (code === "SOURCE_DISABLED") return "DISABLED";
    if (code === "PRODUCTION_NETWORK_NOT_ALLOWED") return "NETWORK_NOT_ALLOWED";
    if (["SOURCE_UNVERIFIED", "SOURCE_WRITTEN_APPROVAL_REQUIRED", "SOURCE_PERMISSION_INCOMPLETE", "SOURCE_NOT_FOUND", "SOURCE_PROVIDER_UNKNOWN", "SOURCE_INTERFACE_MISMATCH", "SOURCE_SITE_IDENTIFIER_INVALID", "SOURCE_BOARD_IDENTIFIER_INVALID"].includes(code)) return "AUTHORITY_DENIED";
    return "BOUNDED_ERROR";
  }
  return recordCount === 0 ? "ZERO" : "SUCCESS";
}

function sourceTelemetryFor(authorization) {
  return {
    sourceId: authorization.source?.sourceId || authorization.sourceId,
    provider: authorization.source?.provider || null,
    authorityResult: authorization.code || (authorization.authorized ? "AUTHORIZED" : "NOT_AUTHORIZED"),
    enabled: authorization.source?.enabled === true,
    productionNetworkAllowed: authorization.source?.productionNetworkAllowed === true,
    dispatchAttempted: false,
    dispatchCompleted: false,
    providerOutcome: providerOutcome(authorization.authorized ? null : authorization.code),
    providerRecordCount: 0,
    normalizedRecordCount: 0,
    errorClass: authorization.authorized ? null : authorization.code || "SOURCE_AUTHORITY_BLOCKED",
  };
}

export async function searchAuthorizedDiscoverySources({
  sourceIds = [],
  criteria = {},
  registry = DEFAULT_SOURCE_AUTHORITY_REGISTRY,
  adapters = DEFAULT_DISCOVERY_ADAPTERS,
  now = new Date(),
} = {}) {
  const ids = uniqueSourceIds(sourceIds);
  if (!ids.length) throw providerError("SOURCE_ID_REQUIRED");

  const authorizations = ids.map((sourceId) => authorizeSourceForAutomaticRetrieval(sourceId, { registry }));
  const sourceTelemetry = authorizations.map(sourceTelemetryFor);
  const blocked = authorizations.find((authorization) => !authorization.authorized);
  if (blocked) {
    const error = providerError(blocked.code || "SOURCE_AUTHORITY_BLOCKED", {
      sourceAuthority: blocked.authority,
    });
    error.discoveryTelemetry = { sourceTelemetry };
    throw error;
  }

  const missingAdapter = authorizations.find((authorization) => typeof adapters[authorization.source.provider] !== "function");
  if (missingAdapter) {
    const error = providerError("DISCOVERY_PROVIDER_NOT_AVAILABLE", {
      sourceAuthority: missingAdapter.authority,
    });
    error.discoveryTelemetry = { sourceTelemetry };
    throw error;
  }

  const retrievedAt = now.toISOString();
  const providerSet = new Set();
  const results = [];
  for (const [index, authorization] of authorizations.entries()) {
    const adapter = adapters[authorization.source.provider];
    const telemetry = sourceTelemetry[index];
    telemetry.dispatchAttempted = true;
    try {
      const response = await adapter({ source: authorization.source, criteria, now, retrievedAt });
      const responseResults = Array.isArray(response.results) ? response.results : [];
      telemetry.dispatchCompleted = true;
      telemetry.providerRecordCount = responseResults.length;
      telemetry.normalizedRecordCount = responseResults.length;
      telemetry.providerOutcome = providerOutcome(null, responseResults.length);
      telemetry.errorClass = null;
      providerSet.add(response.provider || authorization.source.provider);
      for (const item of responseResults) results.push(item);
    } catch (error) {
      telemetry.providerOutcome = "BOUNDED_ERROR";
      telemetry.errorClass = error instanceof Error ? error.message.slice(0, 100) : "PROVIDER_ERROR";
      const wrapped = providerError(telemetry.errorClass, { discoveryTelemetry: { sourceTelemetry } });
      throw wrapped;
    }
  }

  return {
    provider: providerSet.size === 1 ? [...providerSet][0] : "SOURCE_REGISTRY",
    providers: [...providerSet],
    sourceIds: ids,
    retrievedAt,
    results,
    criteria,
    sourceTelemetry,
  };
}
