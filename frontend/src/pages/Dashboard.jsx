import { Link } from "react-router-dom";
import { fetchAnalytics } from "../services/api";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [data, setData] = useState({ recoveryRate: 0, sentEmails: 0, recoveredRevenue: 0 });

  useEffect(() => {
    fetchAnalytics().then(setData).catch(() => {});
  }, []);

  return (
    <div className="container main">
      <div className="h1">Analytics Summary</div>
      <div style={{display:"grid",gap:"1rem",gridTemplateColumns:"repeat(3,minmax(0,1fr))"}}>
        <div className="card">
          <div className="mono">Recovery Rate</div>
          <div style={{fontSize:"2rem",fontWeight:700}}>{data.recoveryRate}%</div>
          <div className="mono">* Mock data displayed if backend is offline</div>
          <div style={{marginTop:"0.75rem"}}>
            <Link to="/ai-copy"><button className="btn btn-primary">Go to AI Copy Generator</button></Link>
          </div>
        </div>
        <div className="card">
          <div className="mono">Emails Sent</div>
          <div style={{fontSize:"2rem",fontWeight:700}}>{data.sentEmails}</div>
        </div>
        <div className="card">
          <div className="mono">Recovered Revenue</div>
          <div style={{fontSize:"2rem",fontWeight:700}}>${data.recoveredRevenue.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
