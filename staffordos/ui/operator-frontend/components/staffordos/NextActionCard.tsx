type NextActionCardProps = {
  action?: string;
  headerLabel?: string;
  headerStatus?: string;
  supports?: string;
  whyNow?: string;
  evidence?: string;
  expectedValue?: string;
  expectedResult?: string;
  risk?: string;
  confidence?: string;
  governance?: string;
  approvalNeeded?: string;
  deadline?: string;
  effort?: string;
  proof?: string;
  completionProof?: string;
  continueHref?: string | null;
  continueLabel?: string;
  transparencyNote?: string;
};

const DEFAULT_NEXT_ACTION = {
  action: "Next action placeholder",
  headerLabel: "Next Action",
  headerStatus: "Decision-ready card",
  supports: "",
  whyNow: "Priority rationale placeholder",
  evidence: "Evidence placeholder",
  expectedValue: "Expected value placeholder",
  expectedResult: "Expected value placeholder",
  risk: "Risk placeholder",
  confidence: "Confidence placeholder",
  governance: "Governance placeholder",
  approvalNeeded: "Authority placeholder",
  deadline: "Deadline placeholder",
  effort: "Effort placeholder",
  proof: "Proof placeholder",
  completionProof: "Proof placeholder",
  continueHref: null,
  continueLabel: "Continue",
  transparencyNote: "",
};

const DETAIL_FIELDS = [
  ["Why now", "whyNow"],
  ["Evidence", "evidence"],
  ["Expected result", "expectedResult"],
  ["Expected value", "expectedValue"],
  ["Effort", "effort"],
  ["Risk", "risk"],
  ["Confidence", "confidence"],
  ["Governance", "governance"],
  ["Approval needed", "approvalNeeded"],
  ["Deadline", "deadline"],
  ["Completion proof", "completionProof"],
  ["Proof", "proof"],
] as const;

export function NextActionCard(props: NextActionCardProps) {
  const nextAction = { ...DEFAULT_NEXT_ACTION, ...props };
  const detailFields = DETAIL_FIELDS.filter(([, key]) => Boolean(props[key] || (key in props ? nextAction[key] : "")));

  return (
    <article className="staffordNextAction" aria-label="Next action">
      <div className="staffordNextActionHeader">
        <span>{nextAction.headerLabel}</span>
        <strong>{nextAction.headerStatus}</strong>
      </div>
      <h2>{nextAction.action}</h2>
      {nextAction.supports ? (
        <p className="staffordNextActionSupport">
          <span>Supports:</span> {nextAction.supports}
        </p>
      ) : null}
      {nextAction.transparencyNote ? <p className="staffordNextActionNote">{nextAction.transparencyNote}</p> : null}
      <div className="staffordNextActionGrid">
        {detailFields.map(([label, key]) => (
          <div key={key} className="staffordNextActionField">
            <span>{label}</span>
            <strong>{nextAction[key]}</strong>
          </div>
        ))}
      </div>
      {nextAction.continueHref ? (
        <a className="staffordNextActionContinue" href={nextAction.continueHref}>
          {nextAction.continueLabel}
        </a>
      ) : null}
    </article>
  );
}
