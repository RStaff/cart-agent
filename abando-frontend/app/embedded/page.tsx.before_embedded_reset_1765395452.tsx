'use client';
import { WeeklyImpactPanel } from "@/components/demo/WeeklyImpactPanel";

import React, { useEffect, useState } from "react";

type SegmentSummary = {
  segment: string;
  urgency: string;
  risk: string;
  event_count: string | number;
  total_value: string | number;
};

type RecentEvent = {
  created_at: string;
  event_type: string;
  value: string | number;
  segment: string;
  urgency: string;
  risk: string;
  note?: string | null;
};

type ApiResponse = {
  ok: boolean;
  storeId: string;
  segments: SegmentSummary[];
  recent: RecentEvent[];
};

const API_BASE = process.env.NEXT_PUBLIC_ABANDO_API_BASE;

// --- Styles -------------------------------------------------

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  padding: 0,
  backgroundColor: "#020617",
  color: "#e5e7eb",
  fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

const outerContainerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  padding: "32px 16px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 960,
  borderRadius: 24,
  border: "1px solid #1f2937",
  background: "radial-gradient(circle at top left, #020617, #020617 55%, #020617)",
  padding: 24,
  boxShadow: "0 24px 80px rgba(0,0,0,0.65)",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const logoWrapperStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  backgroundColor: "#020617",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(148,163,184,0.3)",
};

const titleTextStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: "0.03em",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
};

const storeBadgeStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  background: "rgba(15,23,42,0.85)",
  border: "1px solid rgba(148,163,184,0.4)",
  color: "#9ca3af",
};

const apiChipStyle: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  background: "rgba(15,118,110,0.12)",
  border: "1px solid rgba(45,212,191,0.4)",
  color: "#6ee7b7",
};

const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 20,
};

const summaryItemStyle: React.CSSProperties = {
  flex: "1 1 140px",
  minWidth: 140,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #1f2937",
  background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.6))",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#9ca3af",
  marginBottom: 4,
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
};

const tableContainerStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid #1f2937",
  background: "radial-gradient(circle at top left, #020617, #020617 45%, #020617)",
  overflow: "hidden",
};

const tableHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #1f2937",
};

const tableTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
};

const tableSubtitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#9ca3af",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 12px",
  color: "#9ca3af",
  fontWeight: 500,
  borderBottom: "1px solid #111827",
  backgroundColor: "#020617",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #020617",
  color: "#e5e7eb",
};

const rowStyle: React.CSSProperties = {
  backgroundColor: "#020617",
};

const tagBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  borderWidth: 1,
  borderStyle: "solid",
};

const segmentTagStyle: React.CSSProperties = {
  ...tagBase,
  borderColor: "rgba(56,189,248,0.45)",
  background: "rgba(8,47,73,0.75)",
  color: "#7dd3fc",
};

const urgencyTagStyle: React.CSSProperties = {
  ...tagBase,
  borderColor: "rgba(251,191,36,0.45)",
  background: "rgba(113,63,18,0.75)",
  color: "#facc15",
};

const riskTagStyle: React.CSSProperties = {
  ...tagBase,
  borderColor: "rgba(248,113,113,0.45)",
  background: "rgba(127,29,29,0.75)",
  color: "#fecaca",
};

const footerStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 11,
  color: "#6b7280",
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
};

// --- Components ---------------------------------------------

function Logo() {
  const size = 28;
  return (
    <div style={logoWrapperStyle}>
      <img
        src="/abando-logo.png"
        alt="Abando.ai logo"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

function formatCurrency(value: string | number | undefined): string {
  if (value == null) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmbeddedPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Resolve storeId from ?shop=, default to dev-store
    let storeId = "dev-store";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      storeId = params.get("shop") || storeId;
    }

    if (!API_BASE) {
      setError("NEXT_PUBLIC_ABANDO_API_BASE is not configured.");
      setLoading(false);
      return;
    }

    const url = `${API_BASE}/api/ai-segments/${encodeURIComponent(storeId)}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API ${res.status}: ${text || res.statusText}`);
        }
        return res.json();
      })
      .then((json: ApiResponse) => {
        setData(json);
      })
      .catch((err: any) => {
        console.error("[Abando /embedded] fetch error:", err);
        setError(err?.message || "Failed to load Abando AI segments.");
      })
      .finally(() => setLoading(false));
  }, []);

  const primarySegment = data?.segments?.[0];

  return (
    <html>
      <body style={pageStyle}>
        <div style={outerContainerStyle}>
          <div style={cardStyle}>
            {/* Header */}
            <div style={headerRowStyle}>
              <div style={titleRowStyle}>
                <Logo />
                <div style={titleTextStyle}>
                  <div style={titleStyle}>Abando – AI Segments</div>
                  <div style={subtitleStyle}>
                    Live AI segmentation view for
                    {" "}
                    {data?.storeId || "dev-store"}
                    . This is the embedded dashboard your merchants will see
                    inside Shopify.
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                <span style={apiChipStyle}>
                  API: {API_BASE || "not configured"}
                </span>
                <span style={storeBadgeStyle}>
                  {data?.storeId || "dev-store"}
                </span>
              </div>
            </div>

            {/* Errors */}
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 10,
                  backgroundColor: "#7f1d1d",
                  border: "1px solid #fecaca",
                  color: "#fee2e2",
                  fontSize: 12,
                }}
              >
                <strong>API Error:</strong> {error}
              </div>
            )}

            {/* Summary */}
            <div style={summaryRowStyle}>
              <div style={summaryItemStyle}>
                <div style={summaryLabelStyle}>Primary Segment</div>
                <div style={summaryValueStyle}>
                  {primarySegment?.segment?.toUpperCase() || "N/A"}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
                  based on recent checkouts & carts
                </div>
              </div>
              <div style={summaryItemStyle}>
                <div style={summaryLabelStyle}>Total Value</div>
                <div style={summaryValueStyle}>
                  {formatCurrency(primarySegment?.total_value)}
                </div>
              </div>
              <div style={summaryItemStyle}>
                <div style={summaryLabelStyle}>Urgency</div>
                <div style={summaryValueStyle}>
                  {primarySegment?.urgency || "—"}
                </div>
              </div>
              <div style={summaryItemStyle}>
                <div style={summaryLabelStyle}>Risk</div>
                <div style={summaryValueStyle}>
                  {primarySegment?.risk || "—"}
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={tableContainerStyle}>
              <div style={tableHeaderStyle}>
                <div>
                  <div style={tableTitleStyle}>Recent Cart + Checkout Signals</div>
                  <div style={tableSubtitleStyle}>
                    This is exactly what Abando sees from Shopify checkouts,
                    abandoned carts, and recovery flows.
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 16, fontSize: 12, color: "#9ca3af" }}>
                  Loading latest segments…
                </div>
              ) : !data?.recent?.length ? (
                <div style={{ padding: 16, fontSize: 12, color: "#9ca3af" }}>
                  No recent events yet. Once customers start checking out and abandoning carts,
                  signals will appear here in real time.
                </div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Time</th>
                      <th style={thStyle}>Event</th>
                      <th style={thStyle}>Value</th>
                      <th style={thStyle}>Segment</th>
                      <th style={thStyle}>Urgency</th>
                      <th style={thStyle}>Risk</th>
                      <th style={thStyle}>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((e, idx) => (
                      <tr key={idx} style={rowStyle}>
                        <td style={tdStyle}>{formatTime(e.created_at)}</td>
                        <td style={tdStyle}>{e.event_type}</td>
                        <td style={tdStyle}>{formatCurrency(e.value)}</td>
                        <td style={tdStyle}>
                          <span style={segmentTagStyle}>
                            <span>●</span>
                            {e.segment || "—"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={urgencyTagStyle}>
                            <span>●</span>
                            {e.urgency || "—"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={riskTagStyle}>
                            <span>●</span>
                            {e.risk || "—"}
                          </span>
                        </td>
                        <td style={tdStyle}>{e.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={footerStyle}>
              <div>
                Powered by{" "}
                <span style={{ fontWeight: 500, color: "#e5e7eb" }}>
                  Abando AI Segments
                </span>
                . This view is safe to embed directly in the Shopify admin.
              </div>
              <div>Store: {data?.storeId || "dev-store"}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
