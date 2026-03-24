export function getStaffordosUrl() {
  const configured = String(process.env.STAFFORDOS_URL || "").trim();
  const isProduction = String(process.env.NODE_ENV || "").trim().toLowerCase() === "production";

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (isProduction) {
    throw new Error("STAFFORDOS_URL is required in production");
  }

  return "http://127.0.0.1:4000";
}
