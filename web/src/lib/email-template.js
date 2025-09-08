/**
 * Minimal email template used by queue-email/send-worker and preview.
 * Keep <img src="cid:cart-thumb"> so the real sender can inline images.
 */
export function renderAbandonedEmail({ items = [], resumeUrl = "#" }) {
  const first = items?.[0] || {};
  const sku = first.sku || "your item";
  const qty = first.qty || 1;

  return `
<div style="font-family:system-ui,Segoe UI,Arial">
  <h2>Still thinking it over?</h2>
  <p>You left a few items in your cart:</p>
  <p><img src="cid:cart-thumb" alt="${escapeHtml(sku)}" style="max-width:240px;display:block;border:0"/></p>
  <p>• ${escapeHtml(sku)} x${qty}</p>
  <p><a href="${escapeAttr(resumeUrl)}">Return to your cart</a></p>
  <hr/><small>Our Store</small>
</div>`.trim();
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(s = "") {
  return String(s).replace(/"/g, "&quot;");
}
