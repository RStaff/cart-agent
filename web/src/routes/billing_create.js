import express from "express";

const router = express.Router();

// Dev-only billing stub for Abando embedded billing.
// Always responds with ok: true and a fake confirmationUrl,
// so you can exercise the embedded billing UI safely in dev.
router.post("/create", (req, res) => {
  const { planKey } = req.body || {};
  const effectivePlan = planKey || "starter";

  const confirmationUrl =
    `https://abando.dev/billing/confirm-stub?plan=${encodeURIComponent(effectivePlan)}`;

  return res.json({
    ok: true,
    stub: true,
    planKey: effectivePlan,
    confirmationUrl,
    debug: {
      received: planKey ?? null,
    },
  });
});

export default router;
