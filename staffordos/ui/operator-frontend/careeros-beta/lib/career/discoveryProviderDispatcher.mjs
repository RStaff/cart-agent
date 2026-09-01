import {
  DEFAULT_SOURCE_AUTHORITY_REGISTRY,
  authorizeSourceForAutomaticRetrieval,
} from "./sourceAuthorityRegistry.mjs";
import { searchGreenhouseSource } from "./greenhouseDiscovery.mjs";

export const DEFAULT_DISCOVERY_ADAPTERS = Object.freeze({
  GREENHOUSE: searchGreenhouseSource,
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
  const blocked = authorizations.find((authorization) => !authorization.authorized);
  if (blocked) {
    throw providerError(blocked.code || "SOURCE_AUTHORITY_BLOCKED", {
      sourceAuthority: blocked.authority,
    });
  }

  const missingAdapter = authorizations.find((authorization) => typeof adapters[authorization.source.provider] !== "function");
  if (missingAdapter) {
    throw providerError("DISCOVERY_PROVIDER_NOT_AVAILABLE", {
      sourceAuthority: missingAdapter.authority,
    });
  }

  const retrievedAt = now.toISOString();
  const providerSet = new Set();
  const results = [];
  for (const authorization of authorizations) {
    const adapter = adapters[authorization.source.provider];
    const response = await adapter({ source: authorization.source, criteria, now, retrievedAt });
    providerSet.add(response.provider || authorization.source.provider);
    for (const item of response.results || []) results.push(item);
  }

  return {
    provider: providerSet.size === 1 ? [...providerSet][0] : "SOURCE_REGISTRY",
    providers: [...providerSet],
    sourceIds: ids,
    retrievedAt,
    results,
    criteria,
  };
}
