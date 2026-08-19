const USAJOBS_SEARCH_URL = "https://data.usajobs.gov/api/search";
const REQUEST_TIMEOUT_MS = 15000;

function presence(value) {
  return String(value || "").trim() ? "PRESENT" : "ABSENT";
}

export async function proveUsajobsRuntime({
  env = process.env,
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS
} = {}) {
  const apiKey = env.USAJOBS_API_KEY;
  const userAgentEmail = env.USAJOBS_USER_AGENT_EMAIL;
  const apiKeyStatus = presence(apiKey);
  const userAgentEmailStatus = presence(userAgentEmail);

  const result = {
    apiKey: apiKeyStatus,
    userAgentEmail: userAgentEmailStatus,
    providerHttpStatus: null,
    providerRecognized: false,
    resultCount: 0,
    authentication: "NOT_ATTEMPTED"
  };

  if (apiKeyStatus !== "PRESENT" || userAgentEmailStatus !== "PRESENT") return result;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = new URL(USAJOBS_SEARCH_URL);
    url.searchParams.set("Keyword", "software");
    url.searchParams.set("ResultsPerPage", "1");
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Host: "data.usajobs.gov",
        "User-Agent": userAgentEmail,
        "Authorization-Key": apiKey
      },
      signal: controller.signal
    });
    result.providerHttpStatus = response.status;
    if (!response.ok) {
      result.authentication = "FAIL";
      return result;
    }
    const body = await response.json();
    const items = body?.SearchResult?.SearchResultItems;
    result.providerRecognized = Boolean(body?.SearchResult && Array.isArray(items));
    result.resultCount = result.providerRecognized ? items.length : 0;
    result.authentication = result.providerRecognized ? "PASS" : "FAIL";
    return result;
  } catch {
    result.authentication = "FAIL";
    return result;
  } finally {
    clearTimeout(timeout);
  }
}
