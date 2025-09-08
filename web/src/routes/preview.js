// ESM + Express Router for preview/demo endpoints
import { Router } from "express";

const router = Router();

// --- Simple per-IP rate limiter (demo-safe) ---
const BUCKET = new Map();
const WINDOW_MS = 15 * 1000; // 15s window
const MAX_REQ = 20;

router.use((req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();
  const slot = BUCKET.get(ip) || { ts: now, n: 0 };
  if (now - slot.ts > WINDOW_MS) {
    slot.ts = now;
    slot.n = 0;
  }
  slot.n += 1;
  BUCKET.set(ip, slot);
  if (slot.n > MAX_REQ) return res.status(429).json({ error: "Too many requests, slow down." });
  next();
});

// --- Subject “tones” (sync later with aiCompose.js if you like) ---
const tones = {
  friendly: [
    (name, itemLabel) => `We saved your cart${itemLabel} for you`,
    () => `Want to finish checking out?`,
    () => `Forgot something?`,
  ],
  persuasive: [
    (name, itemLabel) => `${name ? name + " — " : ""}unlock your saved items`,
    (name, itemLabel) => `Still available: your cart${itemLabel}`,
    () => `Claim your cart before it’s gone`,
  ],
  playful: [
    (name, itemLabel) => `👀 Still eyeing${itemLabel}?`,
    () => `Psst… your cart misses you`,
    () => `We kept your picks warm`,
  ],
  urgent: [
    () => `Last chance to grab it`,
    () => `Your cart will expire soon`,
    () => `Don’t lose your picks`,
  ],
  kevin_hart: [
    () => `Look, don’t play—finish the checkout`,
    () => `Quit stalling. Your cart is calling 😂`,
    () => `You were THIS close. Tap to wrap it up`,
  ],
};

// --- Helpers ---
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};
const mkItemLabel = (items) => {
  if (!Array.isArray(items) || items.length === 0) return "";
  const first = items[0];
  const firstName = typeof first === "string" ? first : first?.title || "your item";
  if (items.length === 1) return `: ${firstName}`;
  return `: ${firstName} + ${items.length - 1} more`;
};

// --- 1) Health ---
router.get("/preview/health", (_req, res) => {
  res.json({ ok: true });
});

// --- 2) Templates / tones ---
router.get("/preview/templates", (_req, res) => {
  res.json({
    tones: Object.keys(tones),
    templates: [
      { id: "short-n-sweet", name: "Short & Sweet" },
      { id: "story-softsell", name: "Story Soft-Sell" },
      { id: "coupon-bump", name: "Coupon Bump" },
      { id: "last-call", name: "Last Call" },
    ],
  });
});

// --- 3) Subject suggestions ---
/**
 * POST /api/preview/subject
 * Body: { tone, name, items, count }
 */
router.post("/preview/subject", (req, res) => {
  try {
    const { tone = "friendly", name = "", items = [], count = 3 } = req.body || {};
    if (!tones[tone]) return res.status(400).json({ error: `Unknown tone '${tone}'` });
    const n = clamp(Number(count) || 3, 1, 5);
    const label = mkItemLabel(items);
    const fns = tones[tone];
    const picked = pickN(fns, Math.min(n, fns.length));
    const subjects = picked.map((f) => f(String(name || "").trim(), label));
    res.json({ tone, subjects });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate subjects" });
  }
});

// --- 4) Email body preview ---
/**
 * POST /api/preview/email
 * Body: { templateId, tone, name, items, discount, subject }
 */
router.post("/preview/email", (req, res) => {
  try {
    const {
      templateId = "short-n-sweet",
      tone = "friendly",
      name = "",
      items = [],
      discount,
      subject,
    } = req.body || {};

    const itemLabel = mkItemLabel(items);
    const subj =
      subject ||
      (tones[tone] ? tones[tone][0](String(name || "").trim(), itemLabel) : `Your cart${itemLabel} is waiting`);

    // Build item list HTML
    const listHtml =
      Array.isArray(items) && items.length
        ? `<ul>${items
            .slice(0, 5)
            .map((it) => {
              const title = typeof it === "string" ? it : it?.title || "Item";
              const url = typeof it === "object" ? it?.url : undefined;
              return `<li>${url ? `<a href="${url}">${title}</a>` : title}</li>`;
            })
            .join("")}</ul>`
        : "";

    let bodyHtml = "";

    switch (templateId) {
      case "short-n-sweet":
        bodyHtml = `
<p>Hey ${name || "there"},</p>
<p>We noticed you left your cart${itemLabel}. It takes just a sec to finish up.</p>
${discount ? `<p><strong>Use code ${discount.code}</strong> for ${discount.pct}% off.</p>` : ""}
${listHtml}
<p><a href="{{checkout_url}}">Resume checkout</a></p>
<p>— The abando.ai Team</p>`;
        break;

      case "story-softsell":
        bodyHtml = `
<p>Hi ${name || "friend"},</p>
<p>We set aside your picks${itemLabel} so you can come back when it’s convenient. No rush—just right here when you’re ready.</p>
${listHtml}
${discount ? `<p>PS: ${discount.pct}% off with <strong>${discount.code}</strong>—because we like you.</p>` : ""}
<p><a href="{{checkout_url}}">Return to your cart</a></p>
<p>— abando.ai</p>`;
        break;

      case "coupon-bump":
        bodyHtml = `
<p>Hey ${name || "there"},</p>
<p>Let’s sweeten the deal: <strong>${discount?.pct || 10}% off</strong> your saved items.</p>
<p>Use code <strong>${(discount && discount.code) || "SWEET10"}</strong> at checkout.</p>
${listHtml}
<p><a href="{{checkout_url}}">Grab the discount</a></p>`;
        break;

      case "last-call":
        bodyHtml = `
<p>${name || "Hey"},</p>
<p>Last call on your cart${itemLabel}—items may go soon.</p>
${listHtml}
<p><a href="{{checkout_url}}">Complete order</a></p>
<p>— abando.ai</p>`;
        break;

      default:
        return res.status(400).json({ error: `Unknown templateId '${templateId}'` });
    }

    res.json({
      subject: subj,
      html: bodyHtml.trim(),
      meta: { templateId, tone },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compose email" });
  }
});

export default router;
