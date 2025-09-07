// ESM + Express Router
import { Router } from "express";

const router = Router();

// Health check
router.get("/preview/health", (req, res) => {
  res.json({ ok: true });
});

// Add more preview endpoints here…

export default router;
