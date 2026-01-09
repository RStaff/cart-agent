type Bucket = { tokens: number; ts: number };
const buckets = new Map<string, Bucket>();

/** Simple token-bucket per key. capacity tokens, refillPerSec rate. */
export function rateLimit(
  key: string,
  opts = { capacity: 12, refillPerSec: 3 },
): boolean {
  const now = Date.now();
  const b = buckets.get(key) || { tokens: opts.capacity, ts: now };
  const elapsed = (now - b.ts) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec);
  if (b.tokens < 1) {
    buckets.set(key, { ...b, ts: now });
    return false;
  }
  b.tokens -= 1;
  b.ts = now;
  buckets.set(key, b);
  return true;
}
