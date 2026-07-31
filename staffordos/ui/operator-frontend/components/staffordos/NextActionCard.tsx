type NextActionCardProps = {
  action?: string;
  whyNow?: string;
  evidence?: string;
  expectedValue?: string;
  risk?: string;
  confidence?: string;
  governance?: string;
  deadline?: string;
  proof?: string;
};

const DEFAULT_NEXT_ACTION: Required<NextActionCardProps> = {
  action: "Next action placeholder",
  whyNow: "Priority rationale placeholder",
  evidence: "Evidence placeholder",
  expectedValue: "Expected value placeholder",
  risk: "Risk placeholder",
  confidence: "Confidence placeholder",
  governance: "Governance placeholder",
  deadline: "Deadline placeholder",
  proof: "Proof placeholder",
};

const DETAIL_FIELDS = [
  ["Why Now", "whyNow"],
  ["Evidence", "evidence"],
  ["Expected Value", "expectedValue"],
  ["Risk", "risk"],
  ["Confidence", "confidence"],
  ["Governance", "governance"],
  ["Deadline", "deadline"],
  ["Proof", "proof"],
] as const;

export function NextActionCard(props: NextActionCardProps) {
  const nextAction = { ...DEFAULT_NEXT_ACTION, ...props };

  return (
    <article className="staffordNextAction" aria-label="Next action">
      <div className="staffordNextActionHeader">
        <span>Next Action</span>
        <strong>Decision-ready card</strong>
      </div>
      <h2>{nextAction.action}</h2>
      <div className="staffordNextActionGrid">
        {DETAIL_FIELDS.map(([label, key]) => (
          <div key={key} className="staffordNextActionField">
            <span>{label}</span>
            <strong>{nextAction[key]}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
