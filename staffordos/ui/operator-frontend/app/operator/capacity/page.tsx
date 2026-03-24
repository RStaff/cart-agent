import { OperatorNav } from "../../../components/operator/OperatorNav";

const serviceUnits = [
  {
    serviceName: "Abando",
    jobType: "Recovery readiness and action review",
    setupTime: "20 min",
    systemTime: "90 min",
    operatorTime: "40 min",
    wallClock: "1.5 to 2.5 hours",
    notes: "Use only when signal truth and action durability are clear.",
  },
  {
    serviceName: "Shopifixer",
    jobType: "Store issue triage and fix packet",
    setupTime: "25 min",
    systemTime: "60 min",
    operatorTime: "55 min",
    wallClock: "2 to 6 hours",
    notes: "Review-heavy until fix confidence and templates improve.",
  },
  {
    serviceName: "Actinventory",
    jobType: "Inventory opportunity audit and recommendation pass",
    setupTime: "30 min",
    systemTime: "75 min",
    operatorTime: "50 min",
    wallClock: "3 to 8 hours",
    notes: "Likely limited by merchant data quality and follow-up cycles.",
  },
] as const;

const activeJobs = [
  {
    client: "Placeholder Merchant A",
    product: "Abando",
    jobType: "Recovery readiness review",
    stage: "In Progress",
    waitingOn: "None",
    operatorMinutes: 35,
    systemMinutes: 70,
    notes: "Manual placeholder job based on the planning template.",
  },
  {
    client: "Placeholder Merchant B",
    product: "Shopifixer",
    jobType: "Fix packet triage",
    stage: "Waiting (System)",
    waitingOn: "System",
    operatorMinutes: 20,
    systemMinutes: 45,
    notes: "Waiting on automated packet preparation.",
  },
  {
    client: "Placeholder Merchant C",
    product: "Actinventory",
    jobType: "Opportunity review",
    stage: "Waiting (Operator)",
    waitingOn: "Operator",
    operatorMinutes: 0,
    systemMinutes: 30,
    notes: "Needs manual review to decide next route.",
  },
  {
    client: "Placeholder Merchant D",
    product: "Abando",
    jobType: "Client follow-up",
    stage: "Waiting (Client)",
    waitingOn: "Client",
    operatorMinutes: 15,
    systemMinutes: 10,
    notes: "Waiting on merchant reply before the next action.",
  },
] as const;

const waitingBuckets = [
  {
    title: "Waiting on System",
    items: activeJobs.filter((job) => job.waitingOn === "System"),
  },
  {
    title: "Waiting on Operator",
    items: activeJobs.filter((job) => job.waitingOn === "Operator"),
  },
  {
    title: "Waiting on Client",
    items: activeJobs.filter((job) => job.waitingOn === "Client"),
  },
] as const;

export default function OperatorCapacityPage() {
  return (
    <main className="shell">
      <div className="container">
        <section className="panel">
          <div className="panelInner">
            <p className="eyebrow">StaffordOS Capacity</p>
            <h1 className="title">Service Capacity Board</h1>
            <p className="subtitle">
              Lightweight internal operating view based on the StaffordOS service capacity model and execution board template.
            </p>
            <OperatorNav activeHref="/operator/capacity" />
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <h2 className="sectionTitle">Current Framing</h2>
            <div className="kv">
              <div><strong>Source docs:</strong> `staffordos/planning/Service_Capacity_Model_v1.md` and `staffordos/planning/Execution_Board_Template.md`</div>
              <div><strong>Benchmark:</strong> Support 3 concurrent paid jobs</div>
              <div><strong>Data source:</strong> Manual internal placeholder entries for now</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 className="sectionTitle" style={{ marginBottom: 0 }}>Service Units</h2>
              <p className="hint">Planning model, not live instrumentation</p>
            </div>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Job Type</th>
                    <th>Setup</th>
                    <th>System</th>
                    <th>Operator</th>
                    <th>Wall Clock</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceUnits.map((unit) => (
                    <tr key={unit.serviceName}>
                      <td>{unit.serviceName}</td>
                      <td>{unit.jobType}</td>
                      <td>{unit.setupTime}</td>
                      <td>{unit.systemTime}</td>
                      <td>{unit.operatorTime}</td>
                      <td>{unit.wallClock}</td>
                      <td>{unit.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panelInner">
            <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 className="sectionTitle" style={{ marginBottom: 0 }}>Active Jobs</h2>
              <p className="hint">Manual internal board</p>
            </div>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Product</th>
                    <th>Job Type</th>
                    <th>Stage</th>
                    <th>Waiting On</th>
                    <th>Operator Minutes</th>
                    <th>System Minutes</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {activeJobs.map((job) => (
                    <tr key={`${job.client}-${job.jobType}`}>
                      <td>{job.client}</td>
                      <td>{job.product}</td>
                      <td>{job.jobType}</td>
                      <td>{job.stage}</td>
                      <td>{job.waitingOn}</td>
                      <td>{job.operatorMinutes}</td>
                      <td>{job.systemMinutes}</td>
                      <td>{job.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="capacityBoard">
          {waitingBuckets.map((bucket) => (
            <section className="panel" key={bucket.title}>
              <div className="panelInner">
                <h2 className="sectionTitle">{bucket.title}</h2>
                {bucket.items.length === 0 ? (
                  <div className="emptyState" style={{ marginTop: 0 }}>
                    <p className="emptyStateLabel">Empty</p>
                    <p className="emptyStateText">No jobs are currently parked in this bucket.</p>
                  </div>
                ) : (
                  <div className="boardColumn">
                    {bucket.items.map((job) => (
                      <div className="boardCard" key={`${bucket.title}-${job.client}-${job.jobType}`}>
                        <p className="boardCardTitle">{job.client}</p>
                        <p className="boardCardMeta">{job.product} · {job.jobType}</p>
                        <p className="boardCardNote">{job.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
