type MissionObservation = {
  missionId: string;
  missionName: string;
  product: string;
  roadmapLane: string;
  roadmapItem: string;
  objective: string;
  status: string;
  authorityStatus: string;
  authority: {
    sourceRefs: string[];
    repository: string;
    worktree: string;
    branch: string | null;
    allowedMutations: string[];
    prohibitedActions: string[];
    executor: string | null;
    validators: string[];
  };
  approval: { required: boolean | null; state: string; reference: string | null; approvedAt: string | null };
  steps: Array<{ id: string; label: string; state: string }>;
  validations: Array<{ name: string; result: string; evidenceRef: string | null; summary: string }>;
  blockers: string[];
  risks: string[];
  changedFiles: string[];
  rollback: { status: string; reference: string | null };
  audit: { eventRefs: string[]; lastUpdatedAt: string | null };
  aggregateCareerOs: { totalBetaUsers: number; usersWithDiscoveryObserved: number; totalOpportunities: number; totalEvaluations: number } | null;
  nextAction: string;
  readOnly: boolean;
};

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value: string) {
  if (value === "PASS" || value === "COMPLETE" || value === "APPROVED") return "statusPillReady";
  if (value === "BLOCKED" || value === "FAILED" || value === "REJECTED") return "statusPillDegraded";
  return "statusPillPartial";
}

function Status({ value }: { value: string }) {
  return <span className={`statusPill ${statusClass(value)}`}>{label(value)}</span>;
}

export function CareerOsMissionObservation({ observation }: { observation: MissionObservation }) {
  return (
    <div className="container betaOperationsContainer">
      <section className="panel betaOperationsHero">
        <div className="panelInner">
          <p className="eyebrow">StaffordOS · CareerOS</p>
          <div className="betaOperationsTitleRow">
            <div>
              <h1 className="title">{observation.missionName}</h1>
              <p className="subtitle">{observation.objective}</p>
            </div>
            <Status value={observation.status} />
          </div>
          <p className="hint">Mission ID: {observation.missionId}</p>
          <p className="hint">Roadmap: {observation.roadmapLane} · {observation.roadmapItem}</p>
        </div>
      </section>

      <section className="grid gridTwo">
        <article className="panel"><div className="panelInner">
          <h2 className="sectionTitle">Authority and scope</h2>
          <dl>
            <div><dt>Authority sources</dt><dd>{observation.authority.sourceRefs.join(", ")}</dd></div>
            <div><dt>Recorded status</dt><dd>{observation.authorityStatus}</dd></div>
            <div><dt>Repository</dt><dd>{observation.authority.repository}</dd></div>
            <div><dt>Worktree</dt><dd>{observation.authority.worktree}</dd></div>
            <div><dt>Branch</dt><dd>{observation.authority.branch || "UNAVAILABLE"}</dd></div>
            <div><dt>Executor</dt><dd>{observation.authority.executor || "UNAVAILABLE"}</dd></div>
            <div><dt>Validators</dt><dd>{observation.authority.validators.length ? observation.authority.validators.join(", ") : "UNAVAILABLE"}</dd></div>
          </dl>
          <p><strong>Allowed mutations:</strong> none</p>
          <p><strong>Prohibited:</strong> {observation.authority.prohibitedActions.join("; ")}</p>
        </div></article>
        <article className="panel"><div className="panelInner">
          <h2 className="sectionTitle">Approval</h2>
          <p><Status value={observation.approval.state} /></p>
          <p>{observation.approval.required === true
            ? "Manual acceptance is required."
            : observation.approval.required === false
              ? "No approval is required for this read-only observation."
              : "Approval requirement unavailable."}</p>
          <p className="hint">Reference: {observation.approval.reference || "UNAVAILABLE"}</p>
        </div></article>
      </section>

      <section className="panel"><div className="panelInner">
        <h2 className="sectionTitle">Mission progress</h2>
        <ol className="executionList">
          {observation.steps.map((step) => <li className="executionItem" key={step.id}><strong>{step.label}</strong><Status value={step.state} /></li>)}
        </ol>
      </div></section>

      {observation.aggregateCareerOs ? (
        <section className="panel"><div className="panelInner">
          <h2 className="sectionTitle">CareerOS operational context</h2>
          <div className="betaOperationsMetricGrid">
            <div className="betaOperationsMetric"><dt>Beta users</dt><dd>{observation.aggregateCareerOs.totalBetaUsers}</dd></div>
            <div className="betaOperationsMetric"><dt>Discovery observed</dt><dd>{observation.aggregateCareerOs.usersWithDiscoveryObserved}</dd></div>
            <div className="betaOperationsMetric"><dt>Opportunities</dt><dd>{observation.aggregateCareerOs.totalOpportunities}</dd></div>
            <div className="betaOperationsMetric"><dt>Evaluations</dt><dd>{observation.aggregateCareerOs.totalEvaluations}</dd></div>
          </div>
        </div></section>
      ) : null}

      <section className="grid gridTwo">
        <article className="panel"><div className="panelInner">
          <h2 className="sectionTitle">Validation and blockers</h2>
          <details>
            <summary>Technical evidence</summary>
            {observation.validations.map((validation) => <div className="executionItem" key={validation.name}><strong>{validation.name}</strong><Status value={validation.result} /><p>{validation.summary}</p><small>{validation.evidenceRef || "No evidence reference"}</small></div>)}
          </details>
          {observation.blockers.map((blocker) => <p className="hint" key={blocker}>Blocker: {blocker}</p>)}
        </div></article>
        <article className="panel"><div className="panelInner">
          <h2 className="sectionTitle">Rollback and audit</h2>
          <p>Rollback: <Status value={observation.rollback.status} /></p>
          <p>Reference: {observation.rollback.reference || "UNAVAILABLE"}</p>
          <p>Changed files: {observation.changedFiles.length ? observation.changedFiles.join(", ") : "None recorded"}</p>
          <p>Audit references: {observation.audit.eventRefs.length ? observation.audit.eventRefs.join(", ") : "None recorded"}</p>
          {observation.risks.map((risk) => <p className="hint" key={risk}>Risk: {risk}</p>)}
        </div></article>
      </section>

      <section className="panel"><div className="panelInner">
        <p className="eyebrow">Next action</p>
        <h2 className="sectionTitle">{observation.nextAction}</h2>
        <p className="hint">This page is read-only. It does not launch work or change CareerOS state.</p>
      </div></section>
    </div>
  );
}
