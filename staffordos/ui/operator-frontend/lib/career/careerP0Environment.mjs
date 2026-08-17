const REQUIRED_PRODUCTION_KEYS = ["DATABASE_URL", "CAREEROS_APP_ORIGIN", "CAREEROS_SESSION_PEPPER"];

export function validateCareerP0Environment({ env = process.env } = {}) {
  const production = env.NODE_ENV === "production" || env.CAREEROS_PERSISTENCE === "postgres";
  if (!production) return { production: false, valid: true, missing: [], inviteOnly: false };
  const missing = REQUIRED_PRODUCTION_KEYS.filter((key) => !String(env[key] || "").trim());
  const inviteOnly = String(env.CAREEROS_INVITE_ONLY || "").toLowerCase() === "true";
  if (!inviteOnly) missing.push("CAREEROS_INVITE_ONLY=true");
  return { production: true, valid: missing.length === 0, missing, inviteOnly };
}

export function assertCareerP0Environment(options = {}) {
  const status = validateCareerP0Environment(options);
  if (!status.valid) throw Object.assign(new Error("CAREEROS_PRODUCTION_ENV_INVALID"), { code: "CAREEROS_PRODUCTION_ENV_INVALID", missing: status.missing });
  return status;
}
