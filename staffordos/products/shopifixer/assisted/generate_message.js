import { buildGmailDraftUrl } from "./open_gmail_draft.js";
import { getShopifixerFixBaseUrl } from "./fix_link.js";

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeStoreUrl(value) {
  const raw = cleanText(value);
  if (!raw) return { url: "", host: "" };

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./i, "");
    return {
      url: `https://${host}`,
      host,
    };
  } catch {
    return {
      url: raw,
      host: raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0],
    };
  }
}

function inferIssueHypothesis(niche, host) {
  const normalized = cleanText(niche).toLowerCase();

  if (/(fashion|apparel|clothing|streetwear|jewelry)/.test(normalized)) {
    return "the product pages likely make sizing, trust, and the next checkout step harder to read than they need to be on mobile";
  }
  if (/(beauty|skincare|cosmetic|wellness)/.test(normalized)) {
    return "the storefront likely loses intent because the product value and the next action are not clear enough on the first product view";
  }
  if (/(home|decor|furniture|kitchen)/.test(normalized)) {
    return "the storefront likely has friction between product discovery and checkout, especially on mobile product pages";
  }
  if (/(pet|supplement|health|fitness)/.test(normalized)) {
    return "the storefront likely needs clearer trust and offer framing before shoppers feel ready to continue to checkout";
  }

  return `${host || "the storefront"} likely has a simple product-page-to-checkout friction point that is costing qualified clicks`;
}

function normalizeSentence(value, fallback = "") {
  const text = cleanText(value) || fallback;
  if (!text) return "";
  return text.replace(/\s+/g, " ").replace(/[.!\s]+$/g, "");
}

function buildCompanyLabel(companyName, host) {
  return cleanText(companyName) || cleanText(host) || "your store";
}

function buildSubject(companyLabel) {
  return `Quick note on ${companyLabel} checkout`;
}

function buildBody({
  contactName,
  companyLabel,
  issueHypothesis,
  whyItMatters,
}) {
  const greeting = contactName ? `Hi ${contactName},` : "Hi,";
  return [
    greeting,
    `I was looking at ${companyLabel} and noticed ${issueHypothesis}.`,
    `That likely matters because ${whyItMatters}.`,
    "I spend a lot of time finding small checkout blockers like this on Shopify stores.",
    "If useful, I can send the first fix I'd test.",
    "Ross",
  ].join("\n\n");
}

export function generateShopifixerMessage(input = {}) {
  const { url, host } = normalizeStoreUrl(input.store_url);
  const companyName = cleanText(input.company_name);
  const contactEmail = cleanText(input.contact_email);
  const niche = cleanText(input.niche);
  const contactName = cleanText(input.contact_name);
  const selectedTemplate = cleanText(input.selected_template) || "observation";
  const auditLink = cleanText(input.prefilled_audit_url) || cleanText(input.audit_url) || getShopifixerFixBaseUrl();
  const companyLabel = buildCompanyLabel(companyName, host);
  const issueHypothesis = normalizeSentence(cleanText(input.issue_hypothesis) || inferIssueHypothesis(niche, host));
  const whyItMatters = normalizeSentence(
    cleanText(input.notes)
      || cleanText(input.why_it_matters)
      || "this issue is likely reducing conversion rate and causing drop-off during checkout, impacting revenue"
  );
  const subject = cleanText(input.subject) || buildSubject(companyLabel);
  const body = cleanText(input.body) || buildBody({
    contactName,
    companyLabel,
    issueHypothesis,
    whyItMatters,
  });

  return {
    company_name: companyName,
    store_url: url || cleanText(input.store_url),
    contact_email: contactEmail,
    niche,
    contact_name: contactName,
    issue_hypothesis: issueHypothesis,
    selected_template: selectedTemplate,
    audit_url: cleanText(input.audit_url) || getShopifixerFixBaseUrl(),
    prefilled_audit_url: auditLink,
    subject,
    body,
    gmail_draft_url: buildGmailDraftUrl({
      to: contactEmail,
      subject,
      body,
    }),
  };
}

function main() {
  const [storeUrl, contactEmail, niche, contactName, companyName, selectedTemplate, auditUrl] = process.argv.slice(2);
  console.log(JSON.stringify(generateShopifixerMessage({
    store_url: storeUrl,
    contact_email: contactEmail,
    niche,
    contact_name: contactName,
    company_name: companyName,
    selected_template: selectedTemplate,
    audit_url: auditUrl,
    prefilled_audit_url: auditUrl,
  }), null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
