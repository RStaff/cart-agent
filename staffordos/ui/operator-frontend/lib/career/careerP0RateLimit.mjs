const buckets = new Map();

export function rateLimitStatus() {
  return { backend: process.env.CAREEROS_RATE_LIMIT_BACKEND || "postgresql", developmentOnlyMemory: true };
}

export function allowDevelopmentRequest(key, { limit = 10, windowMs = 60_000 } = {}) {
  if (process.env.NODE_ENV === "production") return Boolean(process.env.CAREEROS_RATE_LIMIT_BACKEND);
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.expiresAt <= now) { buckets.set(key, { count: 1, expiresAt: now + windowMs }); return true; }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
