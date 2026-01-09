/**
 * Turn email-safe HTML into a nicer browser preview.
 */
export function tweakPreviewHtml(html, { tone="friendly", items=[], brand="Your Store" } = {}) {
  const first = items?.[0] || {};
  const img = first.image || "/img/tote.jpg";

  const headlineByTone = {
    friendly:   "Still thinking it over?",
    persuasive: "Your picks are waiting",
    playful:    "👀 We’re still eyeing that too",
    urgent:     "Clock’s ticking — don’t miss out",
    kevin_hart: "Look, don’t play—go get your stuff 😅",
  };
  const headline = headlineByTone[tone] || headlineByTone.friendly;

  let out = String(html);
  out = out.replace(/src="cid:cart-thumb"/g, `src="${img}"`);
  out = out.replace(/<h2>.*?<\/h2>/i, `<h2>${headline}</h2>`);
  out = out.replace(/<small>.*?<\/small>/i, `<small>${brand}</small>`);
  return out;
}
