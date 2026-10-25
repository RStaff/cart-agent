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

export async function assertPublicSchema(client) {
  const result = await client.query("SELECT current_schema() AS schema_name, current_setting('search_path') AS search_path, unnest(current_schemas(true)) AS effective_schema");
  const schemaName = result.rows[0]?.schema_name;
  const effectiveSchemas = result.rows.map(({ effective_schema: name }) => name);
  const allowed = (name) => name === "public" || name === "pg_catalog" || name === "pg_toast" || /^pg_temp_\d+$/.test(name) || /^pg_toast_temp_\d+$/.test(name);
  if (schemaName !== "public" || effectiveSchemas.some((name) => !allowed(name))) {
    throw new Error(`CAREEROS_PUBLIC_SCHEMA_REQUIRED:${schemaName || "none"}:${effectiveSchemas.join(",")}`);
  }
  return true;
}
