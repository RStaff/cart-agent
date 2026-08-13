import Link from "next/link";
import {
  PROFESSIONAL_MODE_TRANSITION_RULES,
  PROFESSIONAL_MODES,
} from "../../../lib/staffordos/professionalModes";

const RETAINED_RECORD_LABELS = [
  "Career facts",
  "Career evidence",
  "Resume versions",
  "Achievements",
  "Projects",
  "Skills and technology context",
  "Certifications",
  "Education",
];

export default function ProfessionalCareerHomePage() {
  return (
    <div className="staffordUnifiedHome">
      <section className="staffordHomeHeader">
        <div>
          <span className="staffordEyebrow">Professional</span>
          <h1>Career Home</h1>
          <p>What deserves my attention in my professional life?</p>
          <p>Professional supports finding work now and succeeding at work later without creating separate workspaces.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>Available now</span>
          <strong>Static, read-only foundation</strong>
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Professional modes">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Career</span>
          <h2>Professional modes</h2>
          <p>Mode selection is presentation only. Ross decides when his work status changes.</p>
        </div>
        <div className="staffordHomeSupportGrid">
          {PROFESSIONAL_MODES.map((mode) => (
            <article key={mode.modeId} className="staffordHomeSupportCard">
              <div>
                <span>{mode.availability === "available_now" ? "Available now" : "Planned"}</span>
                <h3>{mode.name}</h3>
                <p>{mode.summary}</p>
                <p>{mode.operatorQuestion}</p>
              </div>
              {mode.route ? (
                <div>
                  <Link href={mode.route} className="staffordHomeActionLink">
                    {mode.modeId === "JOB_SEARCH" ? "Open Job Command" : "Open Career Home"}
                  </Link>
                  {mode.modeId === "JOB_SEARCH" ? (
                    <Link href="/os/professional/jobs#job-search-preferences" className="staffordHomeActionLink">
                      Job Search Preferences
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="staffordObjectiveNote" aria-label="Professional continuity">
        <strong>What carries forward</strong>
        <p>
          Career evidence, achievements, relationships, decisions, proof, learning, assets, and outcomes are
          intended to survive movement between Job Search and My Job.
        </p>
        <div className="staffordPlannedList" aria-label="Retained Professional records">
          {RETAINED_RECORD_LABELS.map((record) => (
            <span key={record}>{record}</span>
          ))}
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Mode transition rules">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Transitions</span>
          <h2>Work status changes require Ross</h2>
          <p>A job offer does not automatically activate My Job, and a mode change does not delete records.</p>
        </div>
        <div className="staffordJobCommandHealthGrid">
          {PROFESSIONAL_MODE_TRANSITION_RULES.slice(0, 6).map((rule) => (
            <article key={rule} className="staffordHomeStatusNote">
              <span>Rule</span>
              <strong>{rule}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="staffordHomeTransparency" aria-label="Professional data authority">
        <article className="staffordHomeStatusNote">
          <span>Available</span>
          <strong>Career Home, Job Command foundation, and local Job Opportunity intake bridge.</strong>
        </article>
        <article className="staffordHomeStatusNote">
          <span>Not connected yet</span>
          <strong>
            Canonical career facts, live job ranking, My Job records, employment management, access controls, and
            external integrations.
          </strong>
        </article>
      </section>
    </div>
  );
}
