"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type FixAuditIssue = {
  id?: string;
  title?: string;
  detail?: string;
  severity?: string;
};

type FixAuditResponse = {
  ok?: boolean;
  leadId?: string;
  analysis?: {
    opportunityScore?: number;
    estimatedLoss?: {
      display?: string;
    };
    issues?: FixAuditIssue[];
    benchmark?: {
      recommendation?: string | null;
      topFriction?: string | null;
    } | null;
  };
  emailSent?: boolean;
  error?: string;
};

function formatSeverity(value?: string) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatFriction(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ");
}

type Props = {
  initialStoreUrl: string;
};

export default function FixPageClient({ initialStoreUrl }: Props) {
  const [storeUrl, setStoreUrl] = useState(initialStoreUrl);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FixAuditResponse | null>(null);
  const trackedViewRef = useRef(false);

  async function trackOutcome(event: "fix_page_view" | "fix_cta_click") {
    const normalizedStore = String(storeUrl || initialStoreUrl || "").trim();
    if (!normalizedStore) return;

    try {
      await fetch("/api/shopifixer/track", {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          event,
          store: normalizedStore,
        }),
      });
    } catch {
      // Tracking should never block the public /fix experience.
    }
  }

  useEffect(() => {
    if (trackedViewRef.current || !initialStoreUrl) {
      return;
    }

    trackedViewRef.current = true;
    void trackOutcome("fix_page_view");
  }, [initialStoreUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://pay.abando.ai/api/fix-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ storeUrl, email }),
      });

      const data = (await response.json()) as FixAuditResponse;

      if (!response.ok || data.ok !== true || !data.analysis) {
        setError(typeof data.error === "string" && data.error ? data.error : "fix_audit_failed");
        return;
      }

      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "fix_audit_failed");
    } finally {
      setLoading(false);
    }
  }

  const issues = Array.isArray(result?.analysis?.issues) ? result.analysis.issues : [];

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(56, 189, 248, 0.14), transparent 28%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        color: "#f8fafc",
        padding: "48px 20px 72px",
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 1100 }}>
        <section style={{ margin: "0 auto", maxWidth: 760, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              color: "#67e8f9",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Shopifixer
          </p>
          <h1
            style={{
              margin: "16px 0 0",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              lineHeight: 1,
              letterSpacing: "-0.05em",
            }}
          >
            Find the conversion leaks costing your Shopify store revenue.
          </h1>
          <p style={{ margin: "20px auto 0", maxWidth: 640, fontSize: 20, lineHeight: 1.5, color: "#cbd5e1" }}>
            Run a fast storefront audit, see the biggest friction points, and get a focused fix plan.
          </p>
          <p style={{ margin: "12px auto 0", maxWidth: 620, fontSize: 16, lineHeight: 1.6, color: "#94a3b8" }}>
            No long setup. No dashboard maze. Just a direct audit and a next step.
          </p>
        </section>

        <section
          style={{
            margin: "36px auto 0",
            maxWidth: 760,
            border: "1px solid rgba(148, 163, 184, 0.16)",
            borderRadius: 28,
            background: "rgba(15, 23, 42, 0.82)",
            padding: 28,
            boxShadow: "0 24px 80px rgba(2, 6, 23, 0.38)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              }}
            >
              <div>
                <label htmlFor="storeUrl" style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#cbd5e1" }}>
                  Store URL
                </label>
                <input
                  id="storeUrl"
                  name="storeUrl"
                  value={storeUrl}
                  onChange={(event) => setStoreUrl(event.target.value)}
                  placeholder="your-store.myshopify.com"
                  style={{
                    width: "100%",
                    minHeight: 52,
                    borderRadius: 16,
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    background: "rgba(2, 6, 23, 0.72)",
                    color: "#f8fafc",
                    padding: "0 16px",
                    fontSize: 16,
                  }}
                />
              </div>
              <div>
                <label htmlFor="email" style={{ display: "block", marginBottom: 8, fontSize: 14, color: "#cbd5e1" }}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@store.com"
                  style={{
                    width: "100%",
                    minHeight: 52,
                    borderRadius: 16,
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    background: "rgba(2, 6, 23, 0.72)",
                    color: "#f8fafc",
                    padding: "0 16px",
                    fontSize: 16,
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <button
                type="submit"
                disabled={loading || !storeUrl || !email}
                style={{
                  minHeight: 52,
                  borderRadius: 16,
                  border: "none",
                  background: "linear-gradient(180deg, #67e8f9 0%, #38bdf8 100%)",
                  color: "#082f49",
                  padding: "0 22px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: loading || !storeUrl || !email ? "not-allowed" : "pointer",
                  opacity: loading || !storeUrl || !email ? 0.6 : 1,
                }}
              >
                {loading ? "Running..." : "Run my audit"}
              </button>
              <p style={{ margin: "12px 0 0", fontSize: 13, color: "#94a3b8" }}>
                We’ll email your audit and recommended next fix.
              </p>
            </div>
          </form>

          {error ? (
            <p
              style={{
                margin: "18px 0 0",
                borderRadius: 16,
                background: "rgba(127, 29, 29, 0.3)",
                border: "1px solid rgba(248, 113, 113, 0.25)",
                padding: 14,
                color: "#fecaca",
              }}
            >
              {error}
            </p>
          ) : null}
        </section>

        <section
          style={{
            margin: "20px auto 0",
            maxWidth: 980,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {[
            "Focused on storefront conversion issues",
            "Audit sent directly to your inbox",
            "Optional $99 implementation plan",
          ].map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 20,
                border: "1px solid rgba(148, 163, 184, 0.14)",
                background: "rgba(15, 23, 42, 0.65)",
                padding: 18,
                color: "#dbeafe",
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              {item}
            </div>
          ))}
        </section>

        <section
          style={{
            margin: "48px auto 0",
            maxWidth: 980,
            borderRadius: 28,
            border: "1px solid rgba(148, 163, 184, 0.16)",
            background: "rgba(15, 23, 42, 0.74)",
            padding: 28,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.03em" }}>How it works</h2>
          <div
            style={{
              marginTop: 20,
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {[
              "1. Enter your store",
              "2. We analyze visible storefront friction",
              "3. You get the audit + next recommended fix",
            ].map((step) => (
              <div
                key={step}
                style={{
                  borderRadius: 20,
                  background: "rgba(2, 6, 23, 0.5)",
                  border: "1px solid rgba(148, 163, 184, 0.12)",
                  padding: 20,
                  color: "#e2e8f0",
                  fontSize: 16,
                }}
              >
                {step}
              </div>
            ))}
          </div>
        </section>

        {result?.analysis ? (
          <section
            style={{
              margin: "36px auto 0",
              maxWidth: 980,
              display: "grid",
              gap: 20,
            }}
          >
            <div
              style={{
                borderRadius: 28,
                border: "1px solid rgba(148, 163, 184, 0.16)",
                background: "rgba(15, 23, 42, 0.82)",
                padding: 28,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.03em" }}>Results</h2>
              {result.emailSent === true ? (
                <p
                  style={{
                    margin: "18px 0 0",
                    borderRadius: 16,
                    background: "rgba(6, 78, 59, 0.35)",
                    border: "1px solid rgba(52, 211, 153, 0.2)",
                    padding: 14,
                    color: "#d1fae5",
                  }}
                >
                  Audit sent to your inbox.
                </p>
              ) : null}

              <div
                style={{
                  marginTop: 20,
                  display: "grid",
                  gap: 16,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div
                  style={{
                    borderRadius: 20,
                    background: "rgba(2, 6, 23, 0.5)",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    padding: 20,
                  }}
                >
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Opportunity score</p>
                  <p style={{ margin: "10px 0 0", fontSize: 40, fontWeight: 700, color: "#67e8f9" }}>
                    {result.analysis.opportunityScore ?? "—"}
                  </p>
                </div>
                <div
                  style={{
                    borderRadius: 20,
                    background: "rgba(2, 6, 23, 0.5)",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    padding: 20,
                  }}
                >
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Estimated revenue loss</p>
                  <p style={{ margin: "10px 0 0", fontSize: 28, fontWeight: 700, color: "#f8fafc" }}>
                    {result.analysis.estimatedLoss?.display || "—"}
                  </p>
                </div>
                <div
                  style={{
                    borderRadius: 20,
                    background: "rgba(2, 6, 23, 0.5)",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    padding: 20,
                  }}
                >
                  <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>Top friction</p>
                  <p style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>
                    {formatFriction(result.analysis.benchmark?.topFriction)}
                  </p>
                </div>
              </div>

              <p style={{ margin: "20px 0 0", fontSize: 14, lineHeight: 1.7, color: "#94a3b8" }}>
                This audit is based on visible storefront patterns and benchmark-backed friction checks. It is
                directional and designed to identify the most likely revenue leaks fast.
              </p>

              <div
                style={{
                  marginTop: 24,
                  display: "grid",
                  gap: 20,
                  gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.9fr)",
                }}
              >
                <div
                  style={{
                    borderRadius: 20,
                    background: "rgba(2, 6, 23, 0.5)",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    padding: 20,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 20 }}>Top issues</h3>
                  <ul style={{ margin: "16px 0 0", paddingLeft: 20 }}>
                    {issues.map((issue, index) => (
                      <li key={`${issue.id || issue.title || "issue"}-${index}`} style={{ marginBottom: 16 }}>
                        <div style={{ color: "#f8fafc", fontWeight: 700 }}>{issue.title || "Issue detected"}</div>
                        <div style={{ marginTop: 4, color: "#cbd5e1", lineHeight: 1.6 }}>
                          {issue.detail || "No detail provided."}
                        </div>
                        <div style={{ marginTop: 6, color: "#67e8f9", fontSize: 13 }}>
                          Severity: {formatSeverity(issue.severity)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    borderRadius: 20,
                    background: "rgba(2, 6, 23, 0.5)",
                    border: "1px solid rgba(148, 163, 184, 0.12)",
                    padding: 20,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 20 }}>Recommended next fix</h3>
                  <p style={{ margin: "16px 0 0", color: "#f8fafc", fontSize: 18, lineHeight: 1.5 }}>
                    {result.analysis.benchmark?.recommendation || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: 28,
                border: "1px solid rgba(103, 232, 249, 0.2)",
                background: "rgba(8, 47, 73, 0.45)",
                padding: 28,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.03em" }}>Need help implementing the fix?</h2>
              <p style={{ margin: "14px 0 0", color: "#cbd5e1", fontSize: 17, lineHeight: 1.7 }}>
                Get a focused $99 fix plan for the highest-impact issue we found.
              </p>
              <a
                href="https://buy.stripe.com/28E3cw7G4brNg1Vg0d00000"
                onClick={() => {
                  void trackOutcome("fix_cta_click");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 20,
                  minHeight: 52,
                  borderRadius: 16,
                  background: "linear-gradient(180deg, #67e8f9 0%, #38bdf8 100%)",
                  color: "#082f49",
                  padding: "0 22px",
                  fontSize: 16,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Get the $99 fix plan
              </a>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
