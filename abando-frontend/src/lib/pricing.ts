export type PlanKey = "basic" | "growth" | "pro";

const upper = (s: string) => s.toUpperCase();

function fromEnvVar(plan: PlanKey): string | undefined {
  return process.env[`STRIPE_PRICE_${upper(plan)}`];
}

function fromJsonMap(plan: PlanKey): string | undefined {
  try {
    const raw = process.env.STRIPE_PRICE_MAP;
    if (!raw) return undefined;
    const map = JSON.parse(raw);
    const id = map?.[plan];
    return typeof id === "string" ? id : undefined;
  } catch {
    return undefined;
  }
}

export function getPriceId(plan?: string | null): string | undefined {
  if (!plan) return undefined;
  const key = plan.toLowerCase() as PlanKey;
  if (!["basic", "growth", "pro"].includes(key)) return undefined;
  return fromEnvVar(key) ?? fromJsonMap(key);
}
