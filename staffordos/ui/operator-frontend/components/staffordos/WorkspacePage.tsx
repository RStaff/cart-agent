import { NextActionCard } from "./NextActionCard";
import type { StaffordOsSection } from "../../lib/staffordos/workspaces";

type WorkspacePageProps = {
  section: StaffordOsSection;
};

const FOUNDATION_STATES = [
  "Evidence before action",
  "AI-assisted, operator-authorized",
  "Governed by default",
  "Reusable knowledge output",
] as const;

export function WorkspacePage({ section }: WorkspacePageProps) {
  return (
    <div className="staffordWorkspace">
      <section className="staffordWorkspaceHeader">
        <div>
          <span className="staffordEyebrow">{section.purpose}</span>
          <h1>{section.label}</h1>
          <p>{section.operatingQuestion}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>Framework State</span>
          <strong>Ready for capability wiring</strong>
        </div>
      </section>

      <NextActionCard
        action={`${section.label} action placeholder`}
        whyNow={section.frame}
        evidence="Evidence placeholder"
        expectedValue="Value placeholder"
        risk="Risk placeholder"
        confidence="Confidence placeholder"
        governance="Authority placeholder"
        deadline="Deadline placeholder"
        proof="Proof placeholder"
      />

      <section className="staffordWorkspaceGrid" aria-label={`${section.label} foundation areas`}>
        {FOUNDATION_STATES.map((state) => (
          <article key={state} className="staffordWorkspaceTile">
            <span>{state}</span>
            <strong>Placeholder</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
