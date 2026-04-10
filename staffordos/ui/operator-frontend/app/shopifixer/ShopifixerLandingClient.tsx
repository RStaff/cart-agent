"use client";

import { useState } from "react";

function deriveCompanyFromUrl(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const parsed = new URL(candidate);
    const host = parsed.hostname.replace(/^www\./i, "");
    return host
      .split(".")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  }
}

export function ShopifixerLandingClient() {
  const [storeUrl, setStoreUrl] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitLead() {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: deriveCompanyFromUrl(storeUrl),
          url: storeUrl,
          email,
          niche: "",
          observed_issue: "landing page submission",
          why_it_matters: "store owner requested review",
          confidence: "medium",
          lead_quality: "maybe",
          status: "backlog",
          source: "landing_page",
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.errors?.join(", ") || payload?.error || "Could not save your store review request.");
      }

      setStoreUrl("");
      setEmail("");
      setMessage("Store received. I’ll review where friction likely exists and what I would fix first.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save your store review request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="shopifixerLandingShell">
      <div className="shopifixerLandingContainer">
        <header className="shopifixerLandingHeader">
          <div className="shopifixerLandingBrand">
            <img src="/shopifixer-logo.svg" alt="Shopifixer" className="shopifixerLandingLogo" />
            <div>
              <p className="eyebrow">Shopifixer</p>
              <h1 className="shopifixerLandingTitle">Your Store May Be Leaking Revenue in Places You&apos;re Not Seeing</h1>
            </div>
          </div>
          <p className="shopifixerLandingSubtitle">
            Shopifixer gives you a fast audit-style read on the friction likely hurting conversion.
          </p>
          <div className="shopifixerLandingHeroActions">
            <a className="button buttonPrimary shopifixerLandingCta" href="#shopifixer-review-form">
              See My Shopifixer Score
            </a>
            <p className="shopifixerLandingSupportLine">Fast signal. Real friction. What I&apos;d fix first.</p>
          </div>
        </header>

        <section className="shopifixerLandingScoreBand">
          <article className="panel shopifixerLandingScoreCard">
            <div className="panelInner">
              <p className="workspaceSectionEyebrow">Quick Read</p>
              <h2 className="workspaceSectionTitle">Conversion Risk Snapshot</h2>
              <div className="shopifixerScorePreview">
                <div className="shopifixerScoreDial">
                  <span className="shopifixerScoreValue">72</span>
                  <span className="shopifixerScoreLabel">Shopifixer Score</span>
                </div>
                <div className="shopifixerScoreNotes">
                  <p className="shopifixerLandingBodyStrong">A fast audit-style signal, not a vague pitch.</p>
                  <ul className="shopifixerSignalList">
                    <li>⚠️ Quiet leaks that reduce trust before checkout</li>
                    <li>📱 Mobile friction that creates hesitation</li>
                    <li>✅ What I&apos;d fix first if this were my store</li>
                  </ul>
                </div>
              </div>
            </div>
          </article>

          <article className="panel shopifixerLandingCtaCard" id="shopifixer-review-form">
            <div className="panelInner">
              <p className="workspaceSectionEyebrow">Get Your Read</p>
              <h2 className="workspaceSectionTitle">See what&apos;s hurting conversion</h2>
              <p className="shopifixerLandingBodyStrong">
                Enter your store URL and I&apos;ll send back a quick audit-style read, likely friction points, and what I&apos;d fix first.
              </p>
              <div className="shopifixerLandingForm">
                <label className="label">
                  Store URL
                  <input
                    className="input"
                    value={storeUrl}
                    onChange={(event) => setStoreUrl(event.target.value)}
                    placeholder="https://yourstore.com"
                  />
                </label>
                <label className="label">
                  Email
                  <input
                    className="input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="founder@yourstore.com"
                  />
                </label>
                <div className="row">
                  <button className="button buttonPrimary" type="button" onClick={() => void submitLead()} disabled={isSubmitting}>
                    {isSubmitting ? "Checking..." : "Get My Shopifixer Score"}
                  </button>
                </div>
              </div>
              <p className="shopifixerLandingMicrocopy">No long deck. No generic advice. Just the fast read and the first fixes.</p>
              {message ? <p className="shopifixerLandingNotice shopifixerLandingNoticeOk">{message}</p> : null}
              {error ? <p className="shopifixerLandingNotice shopifixerLandingNoticeError">{error}</p> : null}
            </div>
          </article>
        </section>

        <section className="shopifixerLandingEvidenceRow">
          <article className="panel shopifixerLandingCard">
            <div className="panelInner">
              <p className="workspaceSectionEyebrow">What I Usually Flag</p>
              <ul className="shopifixerLandingList shopifixerLandingListTight">
                <li>product pages that don&apos;t fully build confidence</li>
                <li>mobile layouts that create hesitation</li>
                <li>unclear value or positioning</li>
                <li>weak transition into checkout</li>
              </ul>
            </div>
          </article>

          <article className="panel shopifixerLandingCard">
            <div className="panelInner">
              <p className="workspaceSectionEyebrow">Why Shopifixer Exists</p>
              <p className="shopifixerLandingBody">
                Stores that should convert often don&apos;t because of small issues nobody is surfacing clearly. Shopifixer is built to make that visible fast.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
