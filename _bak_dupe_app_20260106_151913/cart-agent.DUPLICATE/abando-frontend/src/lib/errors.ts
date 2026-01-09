export function toErrorMessage(
  e: unknown,
  fallback = "Something went wrong.",
): string {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e || fallback;
  try {
    const t = JSON.stringify(e);
    return t && t !== "{}" ? t : fallback;
  } catch {
    return fallback;
  }
}
