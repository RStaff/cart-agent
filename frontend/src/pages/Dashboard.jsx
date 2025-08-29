import React, { useMemo, useState } from "react";
import AICopyGenerator from "../components/AICopyGenerator.jsx";

const BASE = import.meta.env.VITE_BACKEND_BASE || "";

export default function Dashboard(){
  const [lastFlag, setLastFlag] = useState(null);

  return (
    <div className="container">
      <div className="h-stack">
        <div className="page-title">Dashboard</div>
        <span className="badge">Connected</span>
        <span className="small">Backend: {BASE || "local dev"}</span>
      </div>

      <div className="space" />

      {/* top stats */}
      <div className="grid grid-3">
        <div className="stat">
          <div className="label">Abandoned carts today</div>
          <div className="value">—</div>
          <div className="small">Hooking to DB soon</div>
        </div>
        <div className="stat">
          <div className="label">Emails sent</div>
          <div className="value">—</div>
          <div className="small">Resend/SendGrid next</div>
        </div>
        <div className="stat">
          <div className="label">Recovery rate</div>
          <div className="value">—</div>
          <div className="small">Coming with analytics</div>
        </div>
      </div>

      <div className="space" />

      <div className="grid" style={{gridTemplateColumns:"1.2fr .8fr"}}>
        {/* Copy generator card */}
        <div className="card">
          <div className="row">
            <h3>AI Copy Generator</h3>
            <span className="small">Generate + preview cart recovery copy</span>
          </div>
          <div className="divider" />
          <AICopyGenerator backendBase={BASE} onFlag={(r)=>setLastFlag(r)} />
        </div>

        {/* Last action card */}
        <div className="card">
          <h3>Recent Action</h3>
          {!lastFlag ? (
            <div className="small">No recent abandoned cart flagged yet.</div>
          ) : (
            <pre className="copy" style={{margin:0}}>
{JSON.stringify(lastFlag, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
