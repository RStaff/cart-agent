const hits = new Map<string,{n:number; t:number}>();
export function rateLimit(key:string, limit=20, windowMs=60_000) {
  const now = Date.now();
  const rec = hits.get(key) ?? { n:0, t:now };
  if (now - rec.t > windowMs) { rec.n = 0; rec.t = now; }
  rec.n += 1; hits.set(key, rec);
  return rec.n <= limit;
}
