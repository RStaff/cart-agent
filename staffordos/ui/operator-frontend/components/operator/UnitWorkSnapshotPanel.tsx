import React from "react";

type Unit = {
  unit_id: string;
  type: string;
  domain_id: string;
  status: string;
  stage?: string;
  owner: string;
  next_action: string;
};

function getPriority(unit: Unit) {
  if (unit.type === "opportunity") return "high";
  if (unit.status === "waiting_for_payment") return "high";
  if (unit.type === "action") return "medium";
  if (unit.domain_id === "internal_dev") return "low";
  return "medium";
}

function getLabel(unit: Unit) {
  if (unit.type === "opportunity") return "Revenue Opportunity";
  if (unit.type === "delivery") return unit.domain_id === "internal_dev" ? "Internal Dev Work" : "Client Delivery";
  if (unit.type === "action") return "Action";
  return unit.type;
}

export function UnitWorkSnapshotPanel({ snapshot }: any) {
  if (!snapshot) return null;

  const units: Unit[] = snapshot.open_work || [];
  const sorted = [...units].sort((a, b) => {
    const weight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return weight[getPriority(b)] - weight[getPriority(a)];
  });

  const primary = sorted[0];
  const otherUnits = sorted.slice(1);
  const backgroundUnits = otherUnits.filter((u) => getPriority(u) === "low");
  const activeUnits = otherUnits.filter((u) => getPriority(u) !== "low");

  return (
    <section className="unitWorkShell">
      <div className="unitWorkHeader">
        <p className="unitEyebrow">StaffordOS Unit-of-Work Spine</p>
        <h2>What should Ross do from the unit system?</h2>
        <p>
          Domains → Units → Gates → Outcomes. This layer connects business, client work,
          internal dev, personal domains, memory, and proof.
        </p>
      </div>

      <div className="unitSummaryStrip">
        <span>Domains: {snapshot.summary.domains}</span>
        <span>Opportunities: {snapshot.summary.opportunities}</span>
        <span>Issues: {snapshot.summary.issues}</span>
        <span>Delivery: {snapshot.summary.delivery_units}</span>
        <span>Actions: {snapshot.summary.actions}</span>
        <span>Memory: {snapshot.summary.memory_units}</span>
        <span>Outcomes: {snapshot.summary.outcome_events}</span>
      </div>

      {primary ? (
        <article className="primaryUnitCard">
          <div className="primaryUnitTop">
            <span className="unitBadge high">Do now</span>
            <span className="unitBadge">{getLabel(primary)}</span>
          </div>

          <h3>{primary.unit_id}</h3>

          <div className="primaryAction">
            <span>Next Action</span>
            <strong>{primary.next_action}</strong>
          </div>

          <div className="unitMetaGrid">
            <div><span>Domain</span><strong>{primary.domain_id}</strong></div>
            <div><span>Status</span><strong>{primary.status}</strong></div>
            <div><span>Stage</span><strong>{primary.stage || "—"}</strong></div>
            <div><span>Owner</span><strong>{primary.owner}</strong></div>
          </div>
        </article>
      ) : null}

      {activeUnits.length > 0 ? (
        <div className="unitSection">
          <h3>Active Supporting Work</h3>
          <div className="unitCardGrid">
            {activeUnits.map((unit) => (
              <article key={unit.unit_id} className={`unitActionCard ${getPriority(unit)}`}>
                <div className="unitCardTop">
                  <span className={`unitBadge ${getPriority(unit)}`}>{getLabel(unit)}</span>
                  <span className="unitStatus">{unit.status}</span>
                </div>

                <h4>{unit.unit_id}</h4>

                <div className="unitNextAction">
                  <span>Next Action</span>
                  <p>{unit.next_action}</p>
                </div>

                <div className="unitSmallMeta">
                  <span>{unit.domain_id}</span>
                  <span>{unit.stage || "no stage"}</span>
                  <span>{unit.owner}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {backgroundUnits.length > 0 ? (
        <details className="backgroundWork">
          <summary>Background / System Work ({backgroundUnits.length})</summary>
          <div className="unitCardGrid">
            {backgroundUnits.map((unit) => (
              <article key={unit.unit_id} className="unitActionCard low">
                <div className="unitCardTop">
                  <span className="unitBadge low">{getLabel(unit)}</span>
                  <span className="unitStatus">{unit.status}</span>
                </div>
                <h4>{unit.unit_id}</h4>
                <div className="unitNextAction">
                  <span>Next Action</span>
                  <p>{unit.next_action}</p>
                </div>
              </article>
            ))}
          </div>
        </details>
      ) : null}

      <p className="unitSnapshotTime">Snapshot generated: {snapshot.generated_at}</p>
    </section>
  );
}
