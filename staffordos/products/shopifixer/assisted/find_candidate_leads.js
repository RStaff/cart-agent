function cleanText(value) {
  return String(value || "").trim();
}

function normalizeToken(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toSlug(value) {
  return normalizeToken(value).replace(/\s+/g, "-");
}

function toTitle(value) {
  return normalizeToken(value)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const SEEDED_CANDIDATE_SHAPES = {
  fashion: [
    ["atelier", "collective"],
    ["thread", "studio"],
    ["wardrobe", "label"],
    ["woven", "co"],
    ["tailor", "supply"],
    ["standard", "works"],
    ["edit", "studio"],
    ["wear", "collective"],
    ["loom", "co"],
    ["closet", "supply"],
  ],
  apparel: [
    ["thread", "co"],
    ["wear", "works"],
    ["outfit", "studio"],
    ["loom", "collective"],
    ["tailor", "supply"],
    ["wardrobe", "co"],
    ["label", "works"],
    ["fabric", "studio"],
    ["standard", "collective"],
    ["edit", "co"],
  ],
  beauty: [
    ["glow", "studio"],
    ["ritual", "lab"],
    ["botanica", "co"],
    ["apothecary", "works"],
    ["skin", "studio"],
    ["care", "lab"],
    ["blend", "co"],
    ["wellness", "works"],
    ["essence", "studio"],
    ["formula", "co"],
  ],
  skincare: [
    ["skin", "lab"],
    ["ritual", "studio"],
    ["botanica", "co"],
    ["care", "works"],
    ["blend", "lab"],
    ["glow", "studio"],
    ["apothecary", "co"],
    ["essence", "works"],
    ["barrier", "lab"],
    ["formula", "studio"],
  ],
  home: [
    ["nest", "co"],
    ["hearth", "studio"],
    ["living", "works"],
    ["house", "supply"],
    ["atelier", "co"],
    ["lane", "studio"],
    ["form", "works"],
    ["room", "supply"],
    ["interior", "co"],
    ["table", "studio"],
  ],
  "home decor": [
    ["nest", "co"],
    ["hearth", "studio"],
    ["living", "works"],
    ["atelier", "house"],
    ["room", "supply"],
    ["form", "co"],
    ["interior", "studio"],
    ["table", "works"],
    ["object", "house"],
    ["shelf", "co"],
  ],
  outdoor: [
    ["ridge", "co"],
    ["trail", "works"],
    ["peak", "supply"],
    ["timber", "outfitters"],
    ["summit", "co"],
    ["field", "works"],
    ["camp", "supply"],
    ["range", "outfitters"],
    ["forest", "co"],
    ["ascent", "works"],
  ],
  default: [
    ["studio", "co"],
    ["signal", "works"],
    ["standard", "collective"],
    ["supply", "co"],
    ["field", "studio"],
    ["atlas", "works"],
    ["north", "collective"],
    ["craft", "co"],
    ["market", "studio"],
    ["signal", "supply"],
  ],
};

function getSeedShapesForNiche(niche) {
  const normalized = normalizeToken(niche);
  return {
    nicheKey: normalized,
    label: toTitle(normalized || "shopify"),
    shapes: SEEDED_CANDIDATE_SHAPES[normalized] || SEEDED_CANDIDATE_SHAPES.default,
  };
}

function buildLeadFromShape({ keyword, nicheLabel, nicheValue, index, shape }) {
  const [base, suffix] = shape;
  const keywordTitle = toTitle(keyword || nicheLabel || "Signal");
  const keywordSlug = toSlug(keyword || nicheLabel || "signal");
  const ordinal = index + 1;
  const companyName = `${keywordTitle} ${toTitle(base)} ${toTitle(suffix)} ${ordinal}`;
  const domain = `${keywordSlug}-${base}-${suffix}-${ordinal}.example`;

  return {
    company_name: companyName,
    store_url: `https://${domain}`,
    contact_email: `hello@${domain}`,
    niche: nicheValue || nicheLabel,
    contact_name: "",
  };
}

export function findCandidateLeads(input = {}) {
  const niche = cleanText(input.niche);
  const keyword = cleanText(input.keyword);
  const requestedCount = Number(input.count || 10) || 10;
  const { label, shapes } = getSeedShapesForNiche(niche);
  const count = Math.max(1, Math.min(shapes.length, requestedCount));
  const leads = shapes
    .slice(0, count)
    .map((shape, index) => buildLeadFromShape({
      keyword,
      nicheLabel: label,
      nicheValue: niche,
      index,
      shape,
    }));

  return {
    ok: true,
    mode: "deterministic_local_signal_generation",
    note: "Generated from operator inputs and seeded local candidate shapes only. This is not live web discovery.",
    leads,
  };
}

function main() {
  const payload = JSON.parse(process.argv[2] || "{}");
  console.log(JSON.stringify(findCandidateLeads(payload), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
