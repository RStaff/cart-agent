const CONTACT_PATH_CANDIDATES = [
  "",
  "/contact",
  "/pages/contact",
  "/contact-us",
];

function cleanText(value) {
  return String(value || "").trim();
}

export function normalizeStoreUrl(value) {
  const raw = cleanText(value);
  if (!raw) {
    return {
      normalized_store_url: "",
      host: "",
    };
  }

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return {
      normalized_store_url: `https://${host}`,
      host,
    };
  } catch {
    const host = raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .toLowerCase();

    return {
      normalized_store_url: host ? `https://${host}` : "",
      host,
    };
  }
}

function withTimeout(signal, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timer);
    },
  };
}

async function fetchText(url, timeoutMs = 5000) {
  const timeout = withTimeout(undefined, timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "ShopifixerContactResolver/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: timeout.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        url,
        status: response.status,
        html: "",
      };
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const html = contentType.includes("text/html") || contentType.includes("application/xhtml+xml")
      ? await response.text()
      : "";

    return {
      ok: true,
      url: response.url || url,
      status: response.status,
      html,
    };
  } catch {
    return {
      ok: false,
      url,
      status: 0,
      html: "",
    };
  } finally {
    timeout.clear();
  }
}

function extractEmails(html = "") {
  const found = new Set();
  const mailtoMatches = html.matchAll(/mailto:([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi);
  for (const match of mailtoMatches) {
    if (match[1]) found.add(match[1].toLowerCase());
  }

  const regexMatches = html.matchAll(/\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/gi);
  for (const match of regexMatches) {
    if (match[1]) found.add(match[1].toLowerCase());
  }

  return Array.from(found);
}

function isPlaceholderEmail(email = "") {
  const normalized = cleanText(email).toLowerCase();
  if (!normalized) return true;
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return true;

  const [, domain = ""] = normalized.split("@");
  const placeholderDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "domain.com",
    "email.com",
    "company.com",
    "yourcompany.com",
    "test.com",
  ]);

  return placeholderDomains.has(domain);
}

function detectContactForm(html = "") {
  const normalized = html.toLowerCase();
  return normalized.includes("<form")
    && normalized.includes('type="email"')
    && normalized.includes("<textarea")
    && (normalized.includes("contact") || normalized.includes("message"));
}

function buildContactNotes(parts) {
  return parts.filter(Boolean).join("; ");
}

export async function resolveContactForCandidate(candidate = {}) {
  const { normalized_store_url, host } = normalizeStoreUrl(candidate.store_url);
  const fallback = {
    normalized_store_url,
    site_reachable: false,
    contact_email: "",
    contact_source: "",
    contact_confidence: "low",
    has_real_contact_path: false,
    valid_contact_status: "unreachable",
    admission_decision: "reject",
    contact_notes: "site_unreachable",
  };

  if (!normalized_store_url || !host) {
    return fallback;
  }

  const homepage = await fetchText(normalized_store_url);
  if (!homepage.ok) {
    return fallback;
  }

  const pages = [homepage];
  for (const contactPath of CONTACT_PATH_CANDIDATES.slice(1)) {
    const page = await fetchText(`${normalized_store_url}${contactPath}`);
    if (page.ok) {
      pages.push(page);
    }
  }

  for (const page of pages) {
    const emails = extractEmails(page.html).filter((email) => !isPlaceholderEmail(email));
    if (emails.length > 0) {
      return {
        normalized_store_url,
        site_reachable: true,
        contact_email: emails[0],
        contact_source: page.url === normalized_store_url ? "homepage_html" : `path:${page.url.replace(normalized_store_url, "") || "/"}`,
        contact_confidence: "high",
        has_real_contact_path: true,
        valid_contact_status: "email_found",
        admission_decision: "admit",
        contact_notes: buildContactNotes([
          "email_present_in_html",
          page.url === normalized_store_url ? "homepage_checked" : "contact_path_checked",
        ]),
      };
    }
  }

  const formPage = pages.find((page) => detectContactForm(page.html));
  if (formPage) {
    return {
      normalized_store_url,
      site_reachable: true,
      contact_email: "",
      contact_source: formPage.url === normalized_store_url ? "homepage_form" : `path:${formPage.url.replace(normalized_store_url, "") || "/"}`,
      contact_confidence: "medium",
      has_real_contact_path: true,
      valid_contact_status: "contact_form_only",
      admission_decision: "review_needed",
      contact_notes: "contact_form_detected_without_email",
    };
  }

  return {
    normalized_store_url,
    site_reachable: true,
    contact_email: "",
    contact_source: "",
    contact_confidence: "low",
    has_real_contact_path: false,
    valid_contact_status: "no_contact_found",
    admission_decision: "reject",
    contact_notes: "no_email_or_contact_form_detected",
  };
}
