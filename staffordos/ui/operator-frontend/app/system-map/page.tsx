"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type NodeStatus = "live" | "unknown" | "down";
type NodeActionKind = "open" | "copy";

interface NodeMetric {
  label: string;
  value: string;
}

interface NodeAction {
  label: string;
  kind: NodeActionKind;
  href?: string;
  value?: string;
}

interface SystemNode {
  id: string;
  title: string;
  subtitle: string;
  status: NodeStatus;
  metric: NodeMetric;
  metrics: NodeMetric[];
  recentActivity: string[];
  actions: NodeAction[];
}

interface SystemMapResponse {
  timestamp: string;
  nodes: Record<string, SystemNode>;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  accent: string;
  fill: string;
  glow: string;
  icon: string;
}

const STATUS_META: Record<NodeStatus, { label: string; color: string }> = {
  live: { label: "Live", color: "#22c55e" },
  unknown: { label: "Unknown", color: "#f59e0b" },
  down: { label: "Down", color: "#ef4444" },
};

const LAYOUT: LayoutNode[] = [
  { id: "github", x: 74, y: 120, width: 210, height: 118, accent: "#60a5fa", fill: "rgba(30, 41, 59, 0.92)", glow: "rgba(96, 165, 250, 0.24)", icon: "GH" },
  { id: "surfaces", x: 74, y: 278, width: 210, height: 118, accent: "#38bdf8", fill: "rgba(12, 20, 38, 0.92)", glow: "rgba(56, 189, 248, 0.24)", icon: "WWW" },
  { id: "media-server", x: 74, y: 438, width: 210, height: 118, accent: "#f59e0b", fill: "rgba(38, 24, 13, 0.92)", glow: "rgba(245, 158, 11, 0.24)", icon: "MM" },
  { id: "tower", x: 352, y: 66, width: 230, height: 128, accent: "#60a5fa", fill: "rgba(9, 20, 41, 0.95)", glow: "rgba(59, 130, 246, 0.28)", icon: "K3" },
  { id: "abando", x: 352, y: 234, width: 230, height: 128, accent: "#2dd4bf", fill: "rgba(6, 37, 39, 0.95)", glow: "rgba(45, 212, 191, 0.28)", icon: "AB" },
  { id: "staffordos-core", x: 352, y: 418, width: 230, height: 128, accent: "#a855f7", fill: "rgba(33, 15, 53, 0.95)", glow: "rgba(168, 85, 247, 0.28)", icon: "OS" },
  { id: "ross-operator", x: 656, y: 100, width: 210, height: 118, accent: "#c084fc", fill: "rgba(37, 17, 63, 0.95)", glow: "rgba(192, 132, 252, 0.24)", icon: "RO" },
  { id: "shopifixer", x: 656, y: 270, width: 210, height: 118, accent: "#fb7185", fill: "rgba(59, 18, 29, 0.95)", glow: "rgba(251, 113, 133, 0.24)", icon: "SF" },
  { id: "ross-llm", x: 656, y: 442, width: 210, height: 118, accent: "#8b5cf6", fill: "rgba(30, 18, 57, 0.95)", glow: "rgba(139, 92, 246, 0.24)", icon: "AI" },
];

const CONNECTIONS = [
  { from: "github", to: "tower", label: "CI/CD deploys" },
  { from: "tower", to: "abando", label: "Runs pod" },
  { from: "tower", to: "media-server", label: "Stores files" },
  { from: "staffordos-core", to: "abando", label: "Operator layer" },
  { from: "staffordos-core", to: "shopifixer", label: "Outreach" },
];

function formatUpdatedLabel(timestamp: string | null) {
  if (!timestamp) return "Waiting for first sample";

  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return "Waiting for first sample";

  return `${value.toLocaleDateString([], { month: "short", day: "numeric" })} ${value.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function describeAge(timestamp: string | null) {
  if (!timestamp) return "No live sample yet";

  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(timestamp).getTime()) / 60000));

  if (diffMinutes <= 1) return "Refreshed just now";
  if (diffMinutes < 60) return `Refreshed ${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  return `Refreshed ${diffHours}h ago`;
}

function mapConnectionPoint(node: LayoutNode, side: "left" | "right" | "top" | "bottom") {
  if (side === "left") return { x: node.x, y: node.y + node.height / 2 };
  if (side === "right") return { x: node.x + node.width, y: node.y + node.height / 2 };
  if (side === "top") return { x: node.x + node.width / 2, y: node.y };
  return { x: node.x + node.width / 2, y: node.y + node.height };
}

function getConnectionPath(fromId: string, toId: string) {
  const source = LAYOUT.find((node) => node.id === fromId);
  const target = LAYOUT.find((node) => node.id === toId);

  if (!source || !target) return null;

  const startSide = target.x > source.x ? "right" : "left";
  const endSide = target.x > source.x ? "left" : "right";
  const start = mapConnectionPoint(source, startSide);
  const end = mapConnectionPoint(target, endSide);
  const midX = (start.x + end.x) / 2;
  const labelX = midX;
  const labelY = (start.y + end.y) / 2 - 10;

  return {
    d: `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`,
    labelX,
    labelY,
  };
}

function fallbackNode(layout: LayoutNode): SystemNode {
  return {
    id: layout.id,
    title: layout.id,
    subtitle: "Awaiting telemetry",
    status: "unknown",
    metric: { label: "Signal", value: "Pending" },
    metrics: [{ label: "Signal", value: "Awaiting first payload" }],
    recentActivity: ["System map is waiting for `/api/system-map`."],
    actions: [],
  };
}

export default function SystemMapPage() {
  const [data, setData] = useState<SystemMapResponse | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("staffordos-core");
  const [fetchError, setFetchError] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function fetchState() {
      try {
        const response = await fetch("/api/system-map", { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const next = (await response.json()) as SystemMapResponse;

        if (!active) return;
        setData(next);
        setFetchError("");
        setSelectedNodeId((current) => (next.nodes[current] ? current : "staffordos-core"));
      } catch (error) {
        if (!active) return;
        setFetchError(error instanceof Error ? error.message : "Unable to refresh system map");
      }
    }

    fetchState();
    const intervalId = window.setInterval(fetchState, 30000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!actionMessage) return undefined;

    const timeoutId = window.setTimeout(() => setActionMessage(""), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [actionMessage]);

  const selectedNode = useMemo(() => {
    const layoutNode = LAYOUT.find((node) => node.id === selectedNodeId) ?? LAYOUT[0];
    return data?.nodes?.[selectedNodeId] ?? fallbackNode(layoutNode);
  }, [data, selectedNodeId]);

  const liveCount = useMemo(
    () => Object.values(data?.nodes ?? {}).filter((node) => node.status === "live").length,
    [data],
  );

  async function handleAction(action: NodeAction) {
    if (action.kind === "open" && action.href) {
      window.open(action.href, "_blank", "noopener,noreferrer");
      setActionMessage(`Opened ${action.label.toLowerCase()}.`);
      return;
    }

    if (action.kind === "copy" && action.value) {
      try {
        await navigator.clipboard.writeText(action.value);
        setActionMessage(`${action.label} command copied.`);
      } catch {
        setActionMessage(`Could not copy ${action.label.toLowerCase()}.`);
      }
    }
  }

  return (
    <div style={styles.shell}>
      <div className="systemMapHeader" style={styles.header}>
        <div>
          <div style={styles.eyebrow}>StaffordOS operator console</div>
          <h1 style={styles.title}>Living system map</h1>
          <p style={styles.subtitle}>
            Interactive architecture view with live health, deployment telemetry, and operator actions.
          </p>
        </div>

        <div className="systemMapHeaderRail" style={styles.headerRail}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Live nodes</span>
            <strong style={styles.statValue}>{liveCount}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Updated</span>
            <strong style={styles.statValueSmall}>{formatUpdatedLabel(data?.timestamp ?? null)}</strong>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Polling</span>
            <strong style={styles.statValueSmall}>30s cadence</strong>
          </div>
        </div>
      </div>

      <div className="systemMapLayout" style={styles.layout}>
        <section style={styles.mapPanel}>
          <div style={styles.panelTopline}>
            <div>
              <div style={styles.panelTitle}>Architecture fabric</div>
              <div style={styles.panelHint}>{describeAge(data?.timestamp ?? null)}</div>
            </div>
            <div style={styles.legend}>
              {Object.entries(STATUS_META).map(([status, meta]) => (
                <span key={status} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: meta.color }} />
                  {meta.label}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.mapCanvas}>
            <svg viewBox="0 0 940 640" style={styles.svg} role="img" aria-label="Interactive StaffordOS system map">
              <defs>
                <linearGradient id="map-background" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#020617" />
                  <stop offset="60%" stopColor="#07111f" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
                <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
                </pattern>
                <marker id="connection-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148,163,184,0.55)" />
                </marker>
              </defs>

              <rect x="0" y="0" width="940" height="640" rx="30" fill="url(#map-background)" />
              <rect x="0" y="0" width="940" height="640" rx="30" fill="url(#map-grid)" />

              <g>
                {CONNECTIONS.map((connection) => {
                  const geometry = getConnectionPath(connection.from, connection.to);
                  if (!geometry) return null;

                  return (
                    <g key={`${connection.from}-${connection.to}`}>
                      <path
                        d={geometry.d}
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.45)"
                        strokeWidth="1.2"
                        markerEnd="url(#connection-arrow)"
                      />
                      <text
                        x={geometry.labelX}
                        y={geometry.labelY}
                        textAnchor="middle"
                        style={styles.connectionLabel}
                      >
                        {connection.label}
                      </text>
                    </g>
                  );
                })}
              </g>

              {LAYOUT.map((layoutNode) => {
                const node = data?.nodes?.[layoutNode.id] ?? fallbackNode(layoutNode);
                const statusMeta = STATUS_META[node.status];
                const selected = selectedNodeId === layoutNode.id;
                const titleId = `node-${layoutNode.id}`;

                return (
                  <g
                    key={layoutNode.id}
                    className="systemMapNode"
                    onClick={() => setSelectedNodeId(layoutNode.id)}
                    role="button"
                    aria-labelledby={titleId}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedNodeId(layoutNode.id);
                      }
                    }}
                  >
                    <rect
                      x={layoutNode.x - (selected ? 8 : 0)}
                      y={layoutNode.y - (selected ? 8 : 0)}
                      width={layoutNode.width + (selected ? 16 : 0)}
                      height={layoutNode.height + (selected ? 16 : 0)}
                      rx="28"
                      fill={selected ? layoutNode.glow : "transparent"}
                    />
                    <rect
                      x={layoutNode.x}
                      y={layoutNode.y}
                      width={layoutNode.width}
                      height={layoutNode.height}
                      rx="24"
                      fill={layoutNode.fill}
                      stroke={selected ? layoutNode.accent : "rgba(148, 163, 184, 0.24)"}
                      strokeWidth={selected ? 2.4 : 1.2}
                    />
                    <circle cx={layoutNode.x + 24} cy={layoutNode.y + 24} r="13" fill={layoutNode.accent} opacity="0.92" />
                    <text x={layoutNode.x + 24} y={layoutNode.y + 28} textAnchor="middle" style={styles.iconText}>
                      {layoutNode.icon}
                    </text>

                    <circle cx={layoutNode.x + layoutNode.width - 24} cy={layoutNode.y + 24} r="6" fill={statusMeta.color} />
                    <text id={titleId} x={layoutNode.x + 48} y={layoutNode.y + 30} style={styles.nodeTitle}>
                      {node.title}
                    </text>
                    <text x={layoutNode.x + 24} y={layoutNode.y + 52} style={styles.nodeSubtitle}>
                      {node.subtitle}
                    </text>
                    <text x={layoutNode.x + 24} y={layoutNode.y + 88} style={styles.nodeMetricValue}>
                      {node.metric.value}
                    </text>
                    <text x={layoutNode.x + 24} y={layoutNode.y + 106} style={styles.nodeMetricLabel}>
                      {node.metric.label}
                    </text>

                    <rect
                      x={layoutNode.x + 24}
                      y={layoutNode.y + layoutNode.height - 28}
                      width={88}
                      height={18}
                      rx="9"
                      fill="rgba(15, 23, 42, 0.8)"
                      stroke="rgba(148, 163, 184, 0.16)"
                    />
                    <text x={layoutNode.x + 68} y={layoutNode.y + layoutNode.height - 15} textAnchor="middle" style={styles.nodeStatus}>
                      {statusMeta.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {fetchError ? <div style={styles.errorBanner}>Map refresh failed: {fetchError}</div> : null}
        </section>

        <aside className="systemMapDetailPanel" style={styles.detailPanel}>
          <div style={styles.detailHeader}>
            <div>
              <div style={styles.detailEyebrow}>Selected node</div>
              <h2 style={styles.detailTitle}>{selectedNode.title}</h2>
              <p style={styles.detailSubtitle}>{selectedNode.subtitle}</p>
            </div>
            <div
              style={{
                ...styles.statusChip,
                borderColor: `${STATUS_META[selectedNode.status].color}55`,
                color: STATUS_META[selectedNode.status].color,
              }}
            >
              <span style={{ ...styles.legendDot, background: STATUS_META[selectedNode.status].color }} />
              {STATUS_META[selectedNode.status].label}
            </div>
          </div>

          <div style={styles.detailMetricHero}>
            <span style={styles.detailMetricLabel}>{selectedNode.metric.label}</span>
            <strong style={styles.detailMetricValue}>{selectedNode.metric.value}</strong>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Key metrics</div>
            <div style={styles.metricList}>
              {selectedNode.metrics.map((metric) => (
                <div key={`${selectedNode.id}-${metric.label}`} style={styles.metricRow}>
                  <span style={styles.metricRowLabel}>{metric.label}</span>
                  <span style={styles.metricRowValue}>{metric.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Recent activity</div>
            <div style={styles.activityList}>
              {selectedNode.recentActivity.map((item) => (
                <div key={item} style={styles.activityItem}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Available actions</div>
            <div className="systemMapActionGrid" style={styles.actionGrid}>
              {selectedNode.actions.map((action) => (
                <button
                  key={`${selectedNode.id}-${action.label}`}
                  type="button"
                  style={styles.actionButton}
                  onClick={() => handleAction(action)}
                >
                  {action.label}
                </button>
              ))}
            </div>
            {actionMessage ? <div style={styles.actionMessage}>{actionMessage}</div> : null}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .systemMapNode {
          cursor: pointer;
          transition: transform 160ms ease;
        }

        .systemMapNode:hover {
          transform: translateY(-2px);
        }

        .systemMapNode:focus-visible rect {
          outline: none;
          stroke: rgba(248, 250, 252, 0.92);
        }

        @media (max-width: 1180px) {
          .systemMapLayout {
            grid-template-columns: 1fr;
          }

          .systemMapDetailPanel {
            position: static;
          }
        }

        @media (max-width: 820px) {
          .systemMapHeaderRail {
            grid-template-columns: 1fr;
            width: 100%;
          }

          .systemMapActionGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .systemMapHeader {
            align-items: start;
          }

          .systemMapNode:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: "100vh",
    padding: "28px 20px 40px",
    background:
      "radial-gradient(circle at top left, rgba(56, 189, 248, 0.12), transparent 28%), radial-gradient(circle at top right, rgba(168, 85, 247, 0.12), transparent 26%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
  },
  header: {
    maxWidth: 1440,
    margin: "0 auto 18px",
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    flexWrap: "wrap",
    alignItems: "end",
  },
  eyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.22em",
    color: "#7dd3fc",
    marginBottom: 10,
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: "clamp(34px, 5vw, 52px)",
    lineHeight: 1,
    color: "#f8fafc",
  },
  subtitle: {
    margin: "12px 0 0",
    maxWidth: 720,
    fontSize: 15,
    lineHeight: 1.6,
    color: "#94a3b8",
  },
  headerRail: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(136px, 1fr))",
    gap: 12,
    width: "min(100%, 440px)",
  },
  statCard: {
    borderRadius: 20,
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "rgba(15, 23, 42, 0.72)",
    padding: "16px 18px",
    boxShadow: "0 16px 40px rgba(2, 6, 23, 0.28)",
  },
  statLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  statValue: {
    display: "block",
    marginTop: 8,
    fontSize: 28,
    lineHeight: 1,
    color: "#f8fafc",
  },
  statValueSmall: {
    display: "block",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.4,
    color: "#e2e8f0",
  },
  layout: {
    maxWidth: 1440,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.7fr) minmax(320px, 0.9fr)",
    gap: 18,
    alignItems: "start",
  },
  mapPanel: {
    borderRadius: 28,
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "rgba(2, 6, 23, 0.52)",
    boxShadow: "0 24px 54px rgba(2, 6, 23, 0.34)",
    overflow: "hidden",
  },
  panelTopline: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "center",
    padding: "20px 22px 0",
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f8fafc",
  },
  panelHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#94a3b8",
  },
  legend: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.78)",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    fontSize: 12,
    color: "#cbd5e1",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
  },
  mapCanvas: {
    padding: 18,
  },
  svg: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  connectionLabel: {
    fontSize: 11,
    fill: "#94a3b8",
    letterSpacing: "0.04em",
  },
  iconText: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.08em",
    fill: "#020617",
  },
  nodeTitle: {
    fontSize: 18,
    fontWeight: 700,
    fill: "#f8fafc",
  },
  nodeSubtitle: {
    fontSize: 12,
    fill: "#cbd5e1",
  },
  nodeMetricValue: {
    fontSize: 28,
    fontWeight: 700,
    fill: "#f8fafc",
  },
  nodeMetricLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fill: "#94a3b8",
  },
  nodeStatus: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    fill: "#cbd5e1",
    fontWeight: 800,
  },
  errorBanner: {
    margin: "0 18px 18px",
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(248, 113, 113, 0.32)",
    background: "rgba(127, 29, 29, 0.22)",
    color: "#fecaca",
    fontSize: 13,
  },
  detailPanel: {
    borderRadius: 28,
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.88))",
    boxShadow: "0 24px 54px rgba(2, 6, 23, 0.34)",
    padding: 22,
    position: "sticky",
    top: 16,
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 14,
    flexWrap: "wrap",
  },
  detailEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "#94a3b8",
    fontWeight: 700,
  },
  detailTitle: {
    margin: "8px 0 0",
    fontSize: 28,
    color: "#f8fafc",
  },
  detailSubtitle: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 480,
  },
  statusChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(2, 6, 23, 0.52)",
    fontSize: 12,
    fontWeight: 700,
  },
  detailMetricHero: {
    marginTop: 18,
    borderRadius: 22,
    padding: "18px 18px 20px",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    background: "rgba(2, 6, 23, 0.4)",
  },
  detailMetricLabel: {
    display: "block",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "#7dd3fc",
    fontWeight: 800,
  },
  detailMetricValue: {
    display: "block",
    marginTop: 12,
    fontSize: 38,
    lineHeight: 1,
    color: "#f8fafc",
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "#94a3b8",
    fontWeight: 800,
    marginBottom: 10,
  },
  metricList: {
    display: "grid",
    gap: 10,
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(2, 6, 23, 0.42)",
    border: "1px solid rgba(148, 163, 184, 0.1)",
  },
  metricRowLabel: {
    color: "#94a3b8",
    fontSize: 13,
  },
  metricRowValue: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "right",
  },
  activityList: {
    display: "grid",
    gap: 10,
  },
  activityItem: {
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(2, 6, 23, 0.34)",
    border: "1px solid rgba(148, 163, 184, 0.08)",
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 1.5,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  actionButton: {
    borderRadius: 16,
    border: "1px solid rgba(125, 211, 252, 0.22)",
    background: "rgba(8, 47, 73, 0.58)",
    color: "#ecfeff",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  actionMessage: {
    marginTop: 10,
    fontSize: 12,
    color: "#7dd3fc",
  },
};
