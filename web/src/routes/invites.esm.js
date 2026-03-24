import express from "express";
import { prisma } from "../clients/prisma.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeStoreInput(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  try {
    const parsed = new URL(raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`);
    return parsed.hostname
      .replace(/^www\./, "")
      .replace(/\/+$/, "")
      .trim();
  } catch {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .trim();
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isLikelyStoreDomain(value) {
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(value);
}

function toSlug(domain) {
  return normalizeStoreInput(domain).replace(/\.myshopify\.com$/, "");
}

function normalizeInviteId(value) {
  const raw = String(value || "").trim();
  return /^[a-z0-9]+$/i.test(raw) ? raw : "";
}

function inviteTrackingSummary(invite) {
  return {
    inviteId: invite.id,
    createdAt: invite.createdAt,
    openedAt: invite.clickedAt,
    installStartedAt: invite.installStartedAt,
    installCompletedAt: invite.installCompletedAt,
    sessionReachedAt: invite.sessionReachedAt,
    installedShopDomain: invite.installedShopDomain,
    installPath: invite.installPath,
    sessionSurface: invite.sessionSurface,
  };
}

function inviteInspectionSummary(invite) {
  if (!invite) return null;
  return {
    inviteId: invite.id,
    inviterShopDomain: invite.inviterShopDomain,
    targetEmail: invite.targetEmail,
    targetStoreDomain: invite.targetStoreDomain,
    sourceSurface: invite.sourceSurface,
    createdAt: invite.createdAt,
    clickedAt: invite.clickedAt,
    installStartedAt: invite.installStartedAt,
    installCompletedAt: invite.installCompletedAt,
    sessionReachedAt: invite.sessionReachedAt,
    installedShopDomain: invite.installedShopDomain,
    installPath: invite.installPath,
    sessionSurface: invite.sessionSurface,
    createdInValidation: invite.createdInValidation,
  };
}

function buildInviteShareState(invite, origin) {
  const shareLink = `${origin.replace(/\/+$/, "")}/invite/${invite.id}`;
  const installParams = new URLSearchParams();
  installParams.set("invite", invite.id);
  if (invite.targetStoreDomain) {
    installParams.set("shop", invite.targetStoreDomain);
  }
  const installTarget = `/install/shopify?${installParams.toString()}`;

  let scorecardTarget = null;
  if (invite.targetStoreDomain) {
    const scorecardParams = new URLSearchParams();
    scorecardParams.set("invite", invite.id);
    scorecardTarget = `/scorecard/${encodeURIComponent(toSlug(invite.targetStoreDomain))}?${scorecardParams.toString()}`;
  }

  const shareText = invite.targetStoreDomain
    ? `Abando is a checkout decision engine for Shopify. I thought this might be useful for ${invite.targetStoreDomain}: ${shareLink}`
    : `Abando is a checkout decision engine for Shopify. I thought this invite path might be useful: ${shareLink}`;

  return {
    shareLink,
    shareText,
    installTarget,
    scorecardTarget,
  };
}

function renderPage({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e2e8f0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .shell { max-width: 880px; margin: 0 auto; padding: 48px 20px 72px; }
    .brand {
      display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px;
      border-radius: 999px; border: 1px solid #1e293b; background: rgba(15, 23, 42, 0.85);
      color: #7dd3fc; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;
    }
    .panel {
      margin-top: 18px; border: 1px solid #1e293b; border-radius: 24px;
      background: rgba(15, 23, 42, 0.88); box-shadow: 0 24px 90px rgba(2, 6, 23, 0.42); padding: 28px;
    }
    h1 { margin: 12px 0 10px; font-size: clamp(32px, 5vw, 48px); letter-spacing: -0.04em; }
    .lead { margin: 0; color: #94a3b8; font-size: 18px; line-height: 1.6; }
    .grid { margin-top: 22px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .card { border: 1px solid #1e293b; border-radius: 18px; background: rgba(2, 6, 23, 0.56); padding: 18px; }
    .label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
    .value { margin-top: 10px; color: #f8fafc; font-size: 24px; font-weight: 800; line-height: 1.25; word-break: break-word; }
    .subvalue { margin-top: 8px; color: #cbd5e1; font-size: 15px; line-height: 1.5; }
    .actions { margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap; }
    .cta, .ghost {
      display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 18px;
      border-radius: 999px; text-decoration: none; font-weight: 800;
    }
    .cta { background: #38bdf8; color: #082f49; }
    .ghost { background: rgba(15, 23, 42, 0.6); color: #e2e8f0; border: 1px solid rgba(125, 211, 252, 0.24); }
    .foot { margin-top: 18px; color: #94a3b8; font-size: 14px; line-height: 1.5; }
    @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main class="shell">${body}</main>
</body>
</html>`;
}

async function updateInviteStage(inviteId, data) {
  const normalizedInviteId = normalizeInviteId(inviteId);
  if (!normalizedInviteId) {
    return null;
  }

  try {
    return await prisma.invite.update({
      where: { id: normalizedInviteId },
      data,
    });
  } catch {
    return null;
  }
}

async function markInviteOpened(inviteId) {
  return updateInviteStage(inviteId, {
    clickedAt: new Date(),
  });
}

async function markInviteInstallStarted(inviteId, { shopDomain, installPath } = {}) {
  return updateInviteStage(inviteId, {
    installStartedAt: new Date(),
    installedShopDomain: shopDomain ? normalizeStoreInput(shopDomain) : undefined,
    installPath: installPath ? String(installPath) : undefined,
  });
}

async function markInviteInstallCompleted(inviteId, { shopDomain, installPath } = {}) {
  return updateInviteStage(inviteId, {
    installCompletedAt: new Date(),
    installedShopDomain: shopDomain ? normalizeStoreInput(shopDomain) : undefined,
    installPath: installPath ? String(installPath) : undefined,
  });
}

async function markInviteSessionReached(inviteId, { shopDomain, sessionSurface } = {}) {
  return updateInviteStage(inviteId, {
    sessionReachedAt: new Date(),
    installedShopDomain: shopDomain ? normalizeStoreInput(shopDomain) : undefined,
    sessionSurface: sessionSurface ? String(sessionSurface) : undefined,
  });
}

async function getInviteById(inviteId) {
  const normalizedInviteId = normalizeInviteId(inviteId);
  if (!normalizedInviteId) {
    return null;
  }

  return prisma.invite.findUnique({
    where: { id: normalizedInviteId },
  });
}

export function installInviteRoutes(app) {
  const router = express.Router();

  router.post("/api/invites", express.json({ limit: "32kb" }), async (req, res) => {
    const inviterShopDomain = normalizeStoreInput(req.body?.inviterShopDomain);
    const input = String(req.body?.target || "").trim();
    const validationMode = req.body?.validationMode === true || String(req.body?.validationMode || "").toLowerCase() === "true";

    if (!inviterShopDomain) {
      return res.status(400).json({ ok: false, error: "inviterShopDomain is required" });
    }
    if (!input) {
      return res.status(400).json({ ok: false, error: "invite target is required" });
    }

    const normalizedEmail = normalizeEmail(input);
    const normalizedStore = normalizeStoreInput(input);
    const targetEmail = isValidEmail(normalizedEmail) ? normalizedEmail : null;
    const targetStoreDomain = !targetEmail && isLikelyStoreDomain(normalizedStore) ? normalizedStore : null;

    if (!targetEmail && !targetStoreDomain) {
      return res.status(400).json({ ok: false, error: "enter a valid invite email or store domain" });
    }

    const invite = await prisma.invite.create({
      data: {
        inviterShopDomain,
        targetEmail,
        targetStoreDomain,
        sourceSurface: "merchant_workspace",
        createdInValidation: validationMode,
      },
    });

    const origin = `${req.protocol}://${req.get("host")}`;
    const shareState = buildInviteShareState(invite, origin);

    return res.status(201).json({
      ok: true,
      inviteId: invite.id,
      targetEmail: invite.targetEmail,
      targetStoreDomain: invite.targetStoreDomain,
      createdAt: invite.createdAt,
      sourceSurface: invite.sourceSurface,
      shareLink: shareState.shareLink,
      shareText: shareState.shareText,
      installTarget: shareState.installTarget,
      scorecardTarget: shareState.scorecardTarget,
      tracking: inviteTrackingSummary(invite),
    });
  });

  router.get("/invite/:inviteId", async (req, res) => {
    const invite = await getInviteById(req.params.inviteId);

    if (!invite) {
      return res.status(404).type("html").send(renderPage({
        title: "Invite unavailable",
        body: `
          <div class="brand">Abando Invite</div>
          <section class="panel">
            <h1>Invite unavailable</h1>
            <p class="lead">This invite link is no longer available. You can still explore Abando through the standard install path.</p>
            <div class="actions"><a class="cta" href="/install/shopify">Open Abando install path</a></div>
          </section>
        `,
      }));
    }

    if (!invite.clickedAt) {
      const updated = await markInviteOpened(invite.id);
      if (updated) {
        invite.clickedAt = updated.clickedAt;
      }
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const shareState = buildInviteShareState(invite, origin);
    const primaryHref = shareState.scorecardTarget || shareState.installTarget;
    const primaryLabel = shareState.scorecardTarget
      ? "Open Abando scorecard path"
      : "Open Abando install path";

    return res.status(200).type("html").send(renderPage({
      title: "Abando Invite",
      body: `
        <div class="brand">Abando Invite</div>
        <section class="panel">
          <h1>Another Shopify merchant shared Abando with you</h1>
          <p class="lead">Abando is a checkout decision engine for Shopify. This invite opens the same scorecard and install funnel merchants use to start storefront decision tracking and reach the merchant workspace.</p>
          <div class="grid">
            <div class="card">
              <div class="label">Invited by</div>
              <div class="value">${escapeHtml(invite.inviterShopDomain)}</div>
              <div class="subvalue">Merchant workspace invite</div>
            </div>
            <div class="card">
              <div class="label">Invite target</div>
              <div class="value">${escapeHtml(invite.targetStoreDomain || invite.targetEmail || "Shopify merchant")}</div>
              <div class="subvalue">Opened at: ${escapeHtml(invite.clickedAt ? invite.clickedAt.toISOString() : "pending")}</div>
            </div>
            <div class="card">
              <div class="label">Install attribution</div>
              <div class="value">${escapeHtml(invite.installedShopDomain || "Pending install start")}</div>
              <div class="subvalue">Install started: ${escapeHtml(invite.installStartedAt ? invite.installStartedAt.toISOString() : "pending")} · Completed: ${escapeHtml(invite.installCompletedAt ? invite.installCompletedAt.toISOString() : "pending")}</div>
            </div>
            <div class="card">
              <div class="label">Merchant session</div>
              <div class="value">${escapeHtml(invite.sessionSurface || "Pending session")}</div>
              <div class="subvalue">Session reached: ${escapeHtml(invite.sessionReachedAt ? invite.sessionReachedAt.toISOString() : "pending")}</div>
            </div>
          </div>
          <div class="actions">
            <a class="cta" href="${escapeHtml(primaryHref)}">${primaryLabel}</a>
            <a class="ghost" href="${escapeHtml(shareState.installTarget)}">Go straight to install</a>
          </div>
          <div class="foot">V1 note: this tracks invite creation, first open, install start, install completion, and merchant/admin session reach. It does not yet track invite-driven revenue.</div>
        </section>
      `,
    }));
  });

  app.use(router);
}

export {
  buildInviteShareState,
  getInviteById,
  inviteInspectionSummary,
  markInviteInstallCompleted,
  markInviteInstallStarted,
  markInviteOpened,
  markInviteSessionReached,
  normalizeInviteId,
};
