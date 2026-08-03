import { NextActionCard } from "./NextActionCard";
import { JOB_SEARCH_COMMAND_PRESENTATION } from "../../lib/staffordos/jobSearchCommandPresentation";

const presentation = JOB_SEARCH_COMMAND_PRESENTATION;

function StatusNote({ label, children }: { label: string; children: string }) {
  return (
    <article className="staffordHomeStatusNote">
      <span>{label}</span>
      <strong>{children}</strong>
    </article>
  );
}

function JobCommandSectionCard({
  title,
  state,
  summary,
}: {
  title: string;
  state: string;
  summary: string;
}) {
  return (
    <article className="staffordHomeSupportCard">
      <div>
        <span>{state}</span>
        <h3>{title}</h3>
        <p>{summary}</p>
      </div>
    </article>
  );
}

export function JobCommandSurface() {
  return (
    <div className="staffordJobCommand">
      <section className="staffordHomeHeader">
        <div>
          <span className="staffordEyebrow">Professional</span>
          <h1>{presentation.title}</h1>
          <p>{presentation.primaryQuestion}</p>
          <p>{presentation.summary}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{presentation.availabilityState}</span>
          <strong>Professional owner-private planning</strong>
        </div>
      </section>

      <section className="staffordHomeAttention">
        <div className="staffordHomeAttentionCopy">
          <span className="staffordEyebrow">Start here</span>
          <h2>{presentation.primaryAction.label}</h2>
          <p>{presentation.primaryAction.headline}</p>
          <button type="button" className="staffordJobCommandDisabledAction" disabled>
            {presentation.primaryAction.controlLabel}
          </button>
          <p className="staffordJobCommandControlNote">{presentation.primaryAction.controlNote}</p>
        </div>

        <NextActionCard
          headerLabel={presentation.primaryAction.label}
          headerStatus={presentation.primaryAction.state}
          action={presentation.primaryAction.headline}
          whyNow={presentation.primaryAction.explanation[0]}
          evidence={presentation.primaryAction.explanation[1]}
          approvalNeeded={presentation.primaryAction.explanation[2]}
          governance={presentation.authorityStatement}
          risk="StaffordOS cannot safely compare jobs or tailor resumes until career facts are reviewed."
          expectedResult="Career evidence is ready for governed review before job intake or fit analysis."
          transparencyNote={presentation.primaryAction.controlState}
        />
      </section>

      <section className="staffordHomeSupport" aria-label="Job search queues">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Queues</span>
          <h2>What is connected right now</h2>
          <p>These sections are truthful empty states. No job, application, follow-up, interview, or outcome record is connected.</p>
        </div>
        <div className="staffordHomeSupportGrid">
          {presentation.supportingSections.map((section) => (
            <JobCommandSectionCard
              key={section.id}
              title={section.title}
              state={section.state}
              summary={section.summary}
            />
          ))}
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Search health">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Search Health</span>
          <h2>What is available and what is not connected yet</h2>
          <p>{presentation.authorityStatement}</p>
        </div>
        <div className="staffordJobCommandHealthGrid">
          {presentation.searchHealth.map((item) => (
            <article key={item.id} className="staffordHomeStatusNote">
              <span>{item.label}</span>
              <strong>{item.state}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="staffordObjectiveNote" aria-label="Human approval boundary">
        <strong>{presentation.humanAuthority.summary}</strong>
        <p>{presentation.approvalStatement}</p>
        <ul className="staffordJobCommandApprovalList">
          {presentation.humanAuthority.rossMustApprove.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="staffordHomeTransparency" aria-label="Data authority">
        <StatusNote label="Available">{presentation.dataAuthority.available.join("; ")}</StatusNote>
        <StatusNote label="Not connected yet">{presentation.dataAuthority.notConnectedYet.join("; ")}</StatusNote>
      </section>
    </div>
  );
}
