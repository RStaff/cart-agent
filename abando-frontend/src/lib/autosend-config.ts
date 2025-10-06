export type AutoSendMode = "auto" | "manual";
export function getAutoSendMode(): AutoSendMode {
  const m = (process.env.AUTOSEND_MODE || "manual").toLowerCase();
  return m === "auto" ? "auto" : "manual";
}
export function getAutoSendThresholdMin(): number {
  const n = Number(process.env.AUTOSEND_THRESHOLD_MIN || 30);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}
export function requireCronSecret(req: Request): boolean {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) return true; // dev: open for speed
  const want = (process.env.CRON_SECRET || "").trim();
  if (!want) return false;
  const got =
    req.headers.get("x-cron-secret") || req.headers.get("X-Cron-Secret") || "";
  return got === want;
}
