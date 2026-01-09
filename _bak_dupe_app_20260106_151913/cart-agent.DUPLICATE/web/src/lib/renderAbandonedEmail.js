/**
 * Builds the abandoned-cart email HTML.
 * - If the first item has an image, we reference it via CID (worker attaches it).
 * - We use resumeUrl for the CTA; fallback '#'.
 */
export function renderAbandonedEmail({ items = [], resumeUrl }) {
  const list = (items || [])
    .map(i => `• ${i.sku} x${i.qty}`)
    .join('<br/>');

  const first = items?.[0];
  const thumb = first?.image;
  const alt = first?.sku || "item";
  const link = resumeUrl || '#';

  return `<div style="font-family:system-ui,Segoe UI,Arial">
      <h2>Still thinking it over?</h2>
      <p>You left a few items in your cart:</p>
      ${thumb ? `<p><img src="cid:cart-thumb" alt="${alt}" style="max-width:240px;display:block;border:0"/></p>` : ``}
      <p>${list}</p>
      <p><a href="${link}">Return to your cart</a></p>
      <hr/><small>Our Store</small>
    </div>`;
}
