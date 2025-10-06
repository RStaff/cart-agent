export const cfg = {
  demo: {
    // when true, never call OpenAI; routes should return mock immediately
    forceMock: process.env.DEMO_FORCE_MOCK === "1",
  },
  billing: {
    // real key if present
    stripeKey: process.env.STRIPE_SECRET_KEY ?? "",
    // mock billing if no key or STRIPE_MODE=MOCK
    forceMock:
      !process.env.STRIPE_SECRET_KEY ||
      (process.env.STRIPE_MODE || "").toUpperCase() === "MOCK",
  },
  tours: {
    demoKey: "abando:firstVisit:demo",
    dashKey: "abando:firstVisit:dash",
    query: "tour", // ?tour=1 forces the modal open
  },
} as const;
