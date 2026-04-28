import { OperatorNav } from "../../../components/operator/OperatorNav";

async function getSystemMap() {
  const res = await fetch("http://localhost:3000/api/operator/system-map", {
    cache: "no-store"
  });
  return res.json();
}

export default async function SystemMapPage() {
  const data = await getSystemMap();
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  const sources = Array.isArray(data.source_inventory) ? data.source_inventory : [];

  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS System Map</p>
            <h1 className="title">True System Map</h1>
            <p className="subtitle">
              Read-only map of current StaffordOS surfaces, business engines, agents, files, and known data flow.
            </p>
            <OperatorNav activeHref="/operator/system-map" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">System Policy</h2>
            <div className="kv">
              <div><strong>Map version:</strong> {data.map_version}</div>
              <div><strong>Generated:</strong> {data.generated_at}</div>
              <div><strong>Policy:</strong> {data.source_policy}</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Capabilities / Surfaces</h2>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>Group</th>
                    <th>Status</th>
                    <th>Purpose</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node: any) => (
                    <tr key={node.id}>
                      <td>{node.label}</td>
                      <td>{node.group}</td>
                      <td>{node.status}</td>
                      <td>{node.purpose}</td>
                      <td>{(node.evidence || []).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Known Data Flow</h2>
            <div className="kv">
              {edges.map((edge: any, index: number) => (
                <div key={`${edge.from}-${edge.to}-${index}`}>
                  <strong>{edge.from}</strong> → <strong>{edge.to}</strong>: {edge.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Source Inventory</h2>
            <div className="kv">
              {sources.map((source: any) => (
                <div key={source.source}>
                  <strong>{source.exists ? "FOUND" : "MISSING"}:</strong> {source.source}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
