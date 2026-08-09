import {
  EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION,
  type CareerOsBriefItem,
  type CareerOsCommandCenterPresentation,
  type CareerOsTopRecommendation,
} from "../../lib/staffordos/careerOsCommandCenterPresentation";

function BriefMetric({ item }: { item: CareerOsBriefItem }) {
  return (
    <article className="staffordCareerCommandMetric">
      <span>{item.label}</span>
      <strong>{item.value}</strong>
    </article>
  );
}

function PipelineMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="staffordCareerCommandMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function RecommendationRow({ recommendation }: { recommendation: CareerOsTopRecommendation }) {
  return (
    <article className="staffordCareerCommandRecommendation">
      <header>
        <div>
          <span>{recommendation.recommendation}</span>
          <h3>{recommendation.position}</h3>
          <p>{recommendation.company}</p>
        </div>
        <strong>{recommendation.applicationReadiness}</strong>
      </header>
      <dl className="staffordCareerCommandDetails">
        <div>
          <dt>Explainable Fit</dt>
          <dd>{recommendation.explainableFit}</dd>
        </div>
        <div>
          <dt>ResumeVersion</dt>
          <dd>{recommendation.resumeVersion}</dd>
        </div>
        <div>
          <dt>Next Action</dt>
          <dd>{recommendation.nextAction}</dd>
        </div>
        <div>
          <dt>Evidence / Gaps</dt>
          <dd>
            {recommendation.supportingEvidenceCount} supporting, {recommendation.missingSkillCount} missing or unknown
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function JobCommandSurface({
  commandCenter = EMPTY_CAREEROS_COMMAND_CENTER_PRESENTATION,
}: {
  commandCenter?: CareerOsCommandCenterPresentation;
}) {
  const hasRecommendations = commandCenter.topRecommendations.length > 0;
  const primaryProviderStatus = commandCenter.systemHealth.providerStatus[0];

  return (
    <div className="staffordJobCommand">
      <section className="staffordHomeHeader">
        <div>
          <span className="staffordEyebrow">Professional</span>
          <h1>{commandCenter.title}</h1>
          <p>{commandCenter.primaryQuestion}</p>
          <p>{commandCenter.summary}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{commandCenter.capturedAsOf}</span>
          <strong>Read-only Career Operations</strong>
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Today's Brief">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Today's Brief</span>
          <h2>Opportunity and application posture</h2>
          <p>{commandCenter.authorityStatement}</p>
        </div>
        <div className="staffordCareerCommandBriefGrid">
          {commandCenter.todaysBrief.map((item) => (
            <BriefMetric key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Top Recommendations">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Top Recommendations</span>
          <h2>What should be reviewed first</h2>
          <p>
            {hasRecommendations
              ? "Recommendation order and content come from the existing J003.01 recommendation read model."
              : "No recommendation read model is connected to this route yet."}
          </p>
        </div>
        {hasRecommendations ? (
          <div className="staffordCareerCommandRecommendationList">
            {commandCenter.topRecommendations.map((recommendation) => (
              <RecommendationRow key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No recommendations connected</span>
            <strong>Run the existing private discovery and recommendation pipeline, then supply its read model.</strong>
          </article>
        )}
      </section>

      <section className="staffordHomeSupport" aria-label="Pipeline">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Pipeline</span>
          <h2>Application state</h2>
          <p>{commandCenter.pipeline.sourceAuthority}</p>
        </div>
        <div className="staffordCareerCommandPipelineGrid">
          <PipelineMetric label="Applications Submitted" value={commandCenter.pipeline.applicationsSubmitted} />
          <PipelineMetric label="Interviews" value={commandCenter.pipeline.interviews} />
          <PipelineMetric label="Follow-ups Due" value={commandCenter.pipeline.followUpsDue} />
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="System Health">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">System Health</span>
          <h2>Discovery and queue status</h2>
          <p>{commandCenter.systemHealth.sourceAuthority}</p>
        </div>
        <div className="staffordJobCommandHealthGrid">
          <article className="staffordHomeStatusNote">
            <span>Provider Status</span>
            <strong>{primaryProviderStatus ? `${primaryProviderStatus.label}: ${primaryProviderStatus.state}` : "UNKNOWN"}</strong>
            <p>{primaryProviderStatus?.detail || "No provider status read model is connected."}</p>
          </article>
          <article className="staffordHomeStatusNote">
            <span>Last Discovery Run</span>
            <strong>{commandCenter.systemHealth.lastDiscoveryRun}</strong>
            <p>Discovery timestamps come from existing provider or import queue results.</p>
          </article>
          <article className="staffordHomeStatusNote">
            <span>Queue Size</span>
            <strong>{commandCenter.systemHealth.queueSize}</strong>
            <p>Queue size is read from the existing opportunity queue or recommendation result.</p>
          </article>
        </div>
      </section>

      <section className="staffordObjectiveNote" aria-label="Approval boundary">
        <strong>Operator authority remains closed</strong>
        <p>{commandCenter.approvalStatement}</p>
      </section>
    </div>
  );
}
