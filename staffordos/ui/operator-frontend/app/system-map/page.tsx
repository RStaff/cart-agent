"use client";
import { useEffect, useState } from "react";

interface SystemState {
  timestamp: string;
  services: Record<string, { status: string; url: string }>;
  shopifixer: { total: number; sent: number; pending: number; withEmail: number };
  media: { photos: number; grace: number; maya: number };
}

const STATUS_COLOR: Record<string, string> = {
  live: "#1D9E75",
  unknown: "#BA7517",
  down: "#D85A30",
};

function StatusDot({ status }: { status: string }) {
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: STATUS_COLOR[status] || "#888",
      marginRight: 6,
    }}/>
  );
}

function Card({ title, children, color = "#1D9E75" }: any) {
  return (
    <div style={{
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: "16px 20px",
      background: `${color}08`,
      marginBottom: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #88888820" }}>
      <span style={{ fontSize: 13, opacity: 0.7 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500, color: color || "inherit" }}>{value}</span>
    </div>
  );
}

export default function SystemMapPage() {
  const [state, setState] = useState<SystemState | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  async function fetchState() {
    try {
      const res = await fetch("/api/system-map");
      const data = await res.json();
      setState(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Loading system state...</div>;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>System map</h1>
          <div style={{ fontSize: 12, opacity: 0.4, marginTop: 4 }}>Live · updates every 30s · {lastUpdated}</div>
        </div>
        <button onClick={fetchState} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "1px solid #88888840", background: "transparent", cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {/* Goal */}
      <Card title="The goal" color="#BA7517">
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: "#BA7517" }}>{state?.media.grace ?? 0}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Grace — photos on tower</div>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: "#BA7517" }}>{state?.media.maya ?? 0}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Maya — photos on tower</div>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: "#BA7517" }}>{state?.media.photos ?? 0}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Total photos synced</div>
          </div>
        </div>
      </Card>

      {/* Services */}
      <Card title="Live services" color="#185FA5">
        {state && Object.entries(state.services).map(([name, svc]) => (
          <Stat
            key={name}
            label={<span><StatusDot status={svc.status}/>{name}</span> as any}
            value={svc.url}
            color={STATUS_COLOR[svc.status]}
          />
        ))}
      </Card>

      {/* ShopiFixer */}
      <Card title="ShopiFixer pipeline — first sale" color="#D85A30">
        <Stat label="Total leads" value={state?.shopifixer.total ?? 0}/>
        <Stat label="With email" value={state?.shopifixer.withEmail ?? 0}/>
        <Stat label="Sent" value={state?.shopifixer.sent ?? 0} color="#1D9E75"/>
        <Stat label="Pending" value={state?.shopifixer.pending ?? 0} color="#BA7517"/>
      </Card>

      {/* Infrastructure */}
      <Card title="Infrastructure" color="#534AB7">
        <Stat label="Tower" value="home-server · k3s · ArgoCD"/>
        <Stat label="Abando" value={state?.services.abando.status ?? "checking..."} color={STATUS_COLOR[state?.services.abando.status ?? "unknown"]}/>
        <Stat label="CI/CD" value="GitHub Actions → GHCR → k3s"/>
        <Stat label="Media" value={`${state?.media.photos ?? 0} files synced`}/>
      </Card>

      <div style={{ fontSize: 11, opacity: 0.3, textAlign: "center", marginTop: 24 }}>
        StaffordOS · System Map · {state?.timestamp ? new Date(state.timestamp).toLocaleDateString() : ""}
      </div>
    </div>
  );
}
