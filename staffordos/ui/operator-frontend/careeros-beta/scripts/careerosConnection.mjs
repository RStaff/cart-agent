export function normalizePostgresHostname(hostname) {
  const value = String(hostname || "").trim().toLowerCase();
  return value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1) : value;
}

export function isLoopbackPostgresHostname(hostname) {
  return ["127.0.0.1", "localhost", "::1"].includes(normalizePostgresHostname(hostname));
}

export function postgresSslForConnection(connectionString) {
  let hostname = "";
  try { hostname = new URL(connectionString).hostname; } catch {}
  return isLoopbackPostgresHostname(hostname) ? false : { rejectUnauthorized: false };
}
