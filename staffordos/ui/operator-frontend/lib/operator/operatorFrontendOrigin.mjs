function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function canonicalOperatorFrontendOrigin(env = process.env) {
  const raw = text(env.STAFFORDOS_OPERATOR_FRONTEND_ORIGIN);
  if (!raw) throw new Error("STAFFORDOS_OPERATOR_FRONTEND_ORIGIN_MISSING");
  let origin;
  try {
    origin = new URL(raw);
  } catch {
    throw new Error("STAFFORDOS_OPERATOR_FRONTEND_ORIGIN_INVALID");
  }
  if (origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
    throw new Error("STAFFORDOS_OPERATOR_FRONTEND_ORIGIN_INVALID");
  }
  if (origin.hostname === "localhost" || origin.hostname === "::1") {
    throw new Error("STAFFORDOS_OPERATOR_FRONTEND_ORIGIN_INVALID");
  }
  if (origin.protocol === "http:" && origin.hostname !== "127.0.0.1") {
    throw new Error("STAFFORDOS_OPERATOR_FRONTEND_ORIGIN_INVALID");
  }
  return origin.origin;
}

export function canonicalOperatorReturnLocation(returnTo, canonicalOrigin) {
  if (typeof returnTo !== "string" || !returnTo.startsWith("/") || returnTo.startsWith("//")) return "";
  const target = new URL(returnTo, canonicalOrigin);
  if (target.origin !== canonicalOrigin) return "";
  return target.toString();
}
