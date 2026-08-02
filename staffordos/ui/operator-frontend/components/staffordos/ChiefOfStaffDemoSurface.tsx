"use client";

import type { ReactNode } from "react";
import {
  CHIEF_OF_STAFF_DEMO_QUESTION,
  getChiefOfStaffDemoPresentation,
  type ChiefOfStaffBlockedExample,
  type ChiefOfStaffStaffordMediaPresentation,
  type ChiefOfStaffTrustedDemo,
} from "../../lib/staffordos/chiefOfStaffDemo";
import {
  DEFAULT_STAFFORDOS_WORKSPACE_ID,
  WORKSPACE_AVAILABILITY_LABELS,
} from "../../lib/staffordos/workspaceRegistry";
import { useStaffordOsWorkspace } from "./WorkspaceContext";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="staffordObjectiveNote">
      <strong>{title}</strong>
      {children}
    </section>
  );
}

function ChiefOfStaffSources({ trusted }: { trusted: ChiefOfStaffTrustedDemo }) {
  return (
    <section className="staffordObjectiveGrid" aria-label="Sources">
      {trusted.displayedSources.map((source) => (
        <article key={source.sourceId} className="staffordObjectiveCard">
          <div className="staffordObjectiveMeta">
            <span>{source.sourceType}</span>
            <span>{source.freshness}</span>
          </div>
          <h2>{source.title}</h2>
          <p>{source.contentSummary}</p>
          <dl className="staffordObjectiveFacts">
            <div>
              <dt>Authority</dt>
              <dd>{source.authorityClassification}</dd>
            </div>
            <div>
              <dt>Limitation</dt>
              <dd>{source.limitations[0] || "Source limits are not stated."}</dd>
            </div>
            <div>
              <dt>Source reference</dt>
              <dd>{source.exactSourceReference}</dd>
            </div>
          </dl>
          <details className="staffordObjectiveEvidence">
            <summary>Technical details</summary>
            <ul>
              <li>{source.sourceId}</li>
              <li>{source.privacyClassification}</li>
              <li>{source.immutable ? "Snapshot is fixed for this demonstration." : "Snapshot can change outside this demonstration."}</li>
            </ul>
          </details>
        </article>
      ))}
    </section>
  );
}

function ChiefOfStaffTrustPanel({ presentation }: { presentation: ChiefOfStaffStaffordMediaPresentation }) {
  return (
    <section className="staffordHomeTransparency" aria-label="Trust and limitations">
      <article className="staffordHomeStatusNote">
        <span>Current status</span>
        <strong>{presentation.trustPanel.currentStatus.join(" ")}</strong>
      </article>
      <article className="staffordHomeStatusNote">
        <span>Not connected</span>
        <strong>{presentation.trustPanel.notConnected.join(", ")}</strong>
      </article>
    </section>
  );
}

function ChiefOfStaffTrustedResponse({ trusted }: { trusted: ChiefOfStaffTrustedDemo }) {
  const { response, validationReport } = trusted;
  const recommendation = response.candidateActions[0];

  return (
    <>
      <Section title="What deserves attention">
        <p>{response.headline}</p>
        {response.attentionItems.map((item) => (
          <p key={item.title}>{item.title}: {item.reason}</p>
        ))}
      </Section>

      <Section title="Why it matters">
        <p>{response.summary}</p>
        {recommendation ? <p>{recommendation.whyNow}</p> : null}
      </Section>

      <Section title="What we know">
        <div className="staffordObjectiveCapabilities">
          <span>Source-backed claims</span>
          <div>
            {response.supportingClaims.map((claim) => (
              <span key={claim.claimId}>{claim.statement}</span>
            ))}
          </div>
        </div>
      </Section>

      <Section title="What is uncertain or not connected">
        {response.missingInformation.map((item) => (
          <p key={`${item.type}-${item.statement}`}>{item.statement}</p>
        ))}
        {response.limitations.map((limitation) => (
          <p key={limitation}>{limitation}</p>
        ))}
      </Section>

      <Section title="Suggested next step">
        {recommendation ? (
          <>
            <p>{recommendation.operatorFacingAction}</p>
            <p>{recommendation.recommendationStatus}</p>
            <p>{recommendation.riskSummary}</p>
          </>
        ) : (
          <p>No candidate next step is present.</p>
        )}
      </Section>

      <Section title="Authority or review needed">
        {response.approvalsNeeded.map((approval) => (
          <p key={approval}>{approval}</p>
        ))}
        {recommendation ? <p>{recommendation.authorityNeeded}</p> : null}
      </Section>

      <Section title="What success would prove">
        <p>{response.proofExpected}</p>
      </Section>

      <Section title="Response passed StaffordOS validation">
        <p>{validationReport.summary}</p>
        <div className="staffordObjectiveCapabilities">
          <span>Checked</span>
          <div>
            <span>{validationReport.claimsChecked} claims</span>
            <span>{validationReport.recommendationsChecked} recommendation</span>
            <span>{validationReport.sourcesChecked} sources</span>
          </div>
        </div>
        <details className="staffordObjectiveEvidence">
          <summary>Technical details</summary>
          <ul>
            <li>{validationReport.headline}</li>
            <li>{trusted.validationResult.validationStatus}</li>
          </ul>
        </details>
      </Section>

      <div>
        <div className="staffordObjectiveHeader">
          <div>
            <span className="staffordEyebrow">Sources</span>
            <h1>Sources</h1>
            <p>These are the static Stafford Media records that support the visible claims.</p>
          </div>
          <div className="staffordWorkspaceStatus">
            <span>Read-only</span>
            <strong>No source is changed by viewing this page.</strong>
          </div>
        </div>
        <ChiefOfStaffSources trusted={trusted} />
      </div>
    </>
  );
}

function ChiefOfStaffBlockedExample({ example }: { example: ChiefOfStaffBlockedExample }) {
  return (
    <article className="staffordObjectiveCard">
      <div className="staffordObjectiveMeta">
        <span>{example.blockedStatus}</span>
      </div>
      <h2>{example.scenario}</h2>
      <p>{example.validationReport.summary}</p>
      <details className="staffordObjectiveEvidence">
        <summary>Technical details</summary>
        <ul>
          {example.validationResult.errors.map((error) => (
            <li key={`${example.id}-${error.code}-${error.path}`}>{error.code}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function StaffordMediaChiefOfStaffDemo({ presentation }: { presentation: ChiefOfStaffStaffordMediaPresentation }) {
  const trusted = presentation.trustedResponse;

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">Read-only demonstration</span>
          <h1>{presentation.title}</h1>
          <p>
            This page uses current static StaffordOS records to answer: {CHIEF_OF_STAFF_DEMO_QUESTION} It does not use
            a live AI model and cannot approve, execute, contact, change, or verify anything.
          </p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>Current question</span>
          <strong>{presentation.question}</strong>
        </div>
      </section>

      <ChiefOfStaffTrustPanel presentation={presentation} />

      {trusted ? (
        <ChiefOfStaffTrustedResponse trusted={trusted} />
      ) : (
        <Section title="Response blocked">
          <p>StaffordOS could not show this response as trusted because validation did not pass.</p>
        </Section>
      )}

      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">Validation examples</span>
          <h1>Why some responses are blocked</h1>
          <p>These examples are not guidance. They show how StaffordOS keeps unsupported responses out of the trusted view.</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>Blocked</span>
          <strong>Invalid examples stay separate.</strong>
        </div>
      </section>

      <section className="staffordObjectiveGrid" aria-label="Blocked response examples">
        {presentation.blockedExamples.map((example) => (
          <ChiefOfStaffBlockedExample key={example.id} example={example} />
        ))}
      </section>

      <Section title="When StaffordOS cannot verify something">
        <p>{presentation.unknownFallback.statement}</p>
        <p>{presentation.unknownFallback.explanation}</p>
      </Section>
    </div>
  );
}

function PlannedChiefOfStaffDemo() {
  const { activeWorkspace, setActiveWorkspace } = useStaffordOsWorkspace();
  const presentation = getChiefOfStaffDemoPresentation(activeWorkspace.id);

  if (presentation.kind !== "planned") {
    return null;
  }

  return (
    <div className="staffordObjectivePage">
      <section className="staffordObjectiveHeader">
        <div>
          <span className="staffordEyebrow">{activeWorkspace.name}</span>
          <h1>{presentation.title}</h1>
          <p>{presentation.summary}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{WORKSPACE_AVAILABILITY_LABELS[activeWorkspace.availability]}</span>
          <strong>{activeWorkspace.currentAuthorityStatus}</strong>
        </div>
      </section>

      <section className="staffordObjectiveNote">
        <strong>Planned only</strong>
        <p>
          This page does not show the Stafford Media demonstration inside {activeWorkspace.name}. Workspace selection
          changes presentation only and is not authorization.
        </p>
      </section>

      <button
        type="button"
        className="staffordReturnWorkspace"
        onClick={() => setActiveWorkspace(DEFAULT_STAFFORDOS_WORKSPACE_ID)}
      >
        {presentation.returnLabel}
      </button>
    </div>
  );
}

export function ChiefOfStaffDemoSurface() {
  const { activeWorkspace } = useStaffordOsWorkspace();
  const presentation = getChiefOfStaffDemoPresentation(activeWorkspace.id);

  if (presentation.kind === "planned") {
    return <PlannedChiefOfStaffDemo />;
  }

  return <StaffordMediaChiefOfStaffDemo presentation={presentation} />;
}
