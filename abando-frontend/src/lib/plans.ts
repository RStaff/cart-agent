export type PlanId = "basic" | "growth" | "pro";
export const PLANS: Record<PlanId, { name: string; monthly: number; trialDays: number; }> = {
  basic:  { name: "Basic",  monthly: 29.99,  trialDays: 14 },
  growth: { name: "Growth", monthly: 59.99,  trialDays: 14 },
  pro:    { name: "Pro",    monthly:149.99,  trialDays: 14 },
};
export function isPlanId(x: unknown): x is PlanId { return x==="basic"||x==="growth"||x==="pro"; }
