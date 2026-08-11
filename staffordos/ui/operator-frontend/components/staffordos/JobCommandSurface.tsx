import {
  EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE,
  type CareerOsDailyApplicationWorkItem,
  type CareerOsDailyApplicationIntelligenceItem,
  type CareerOsDailyBriefMetric,
  type CareerOsDailyJobSearchExperience,
  type CareerOsDailyPipelineStage,
  type CareerOsDailyPriority,
  type CareerOsDailyResumeDraftItem,
  type CareerOsDailyTopOpportunity,
} from "../../lib/staffordos/careerOsDailyJobSearchExperience";

function BriefMetric({ item }: { item: CareerOsDailyBriefMetric }) {
  return (
    <article className="staffordCareerCommandMetric">
      <span>{item.label}</span>
      <strong>{item.value}</strong>
      <p>{item.detail}</p>
    </article>
  );
}

function PriorityItem({ item }: { item: CareerOsDailyPriority }) {
  return (
    <article className="staffordCareerDailyTask">
      <header>
        <div>
          <span>{item.category}</span>
          <h3>{item.title}</h3>
          {item.company && item.role ? <p>{item.company} / {item.role}</p> : null}
        </div>
        <strong>{item.urgency === "today" ? "Today" : item.urgency === "next" ? "Next" : "Later"}</strong>
      </header>
      <p>{item.detail}</p>
      <footer>
        <span>{item.status}</span>
        <button type="button" className="staffordJobCommandDisabledAction" disabled>
          {item.action}
        </button>
      </footer>
    </article>
  );
}

function OpportunityItem({ item }: { item: CareerOsDailyTopOpportunity }) {
  return (
    <article className="staffordCareerCommandRecommendation">
      <header>
        <div>
          <span>{item.recommendation}</span>
          <h3>{item.position}</h3>
          <p>{item.company}</p>
        </div>
        <strong>{item.nextAction}</strong>
      </header>
      <dl className="staffordCareerCommandDetails">
        <div>
          <dt>Explainable Fit</dt>
          <dd>{item.explainableFit}</dd>
        </div>
        <div>
          <dt>Resume</dt>
          <dd>{item.resumeVersion}</dd>
        </div>
        <div>
          <dt>Next Action</dt>
          <dd>{item.detail}</dd>
        </div>
      </dl>
    </article>
  );
}

function WorkItem({ item }: { item: CareerOsDailyApplicationWorkItem }) {
  return (
    <article className="staffordCareerDailyTask">
      <header>
        <div>
          <span>{item.task}</span>
          <h3>{item.role}</h3>
          <p>{item.company}</p>
        </div>
        <strong>{item.status}</strong>
      </header>
      <p>{item.detail}</p>
      <footer>
        <span>{item.applicationDate || "Date not shown"}</span>
        <button type="button" className="staffordJobCommandDisabledAction" disabled>
          {item.task}
        </button>
      </footer>
    </article>
  );
}

function IntelligenceItem({
  item,
  resumeDraftAction,
}: {
  item: CareerOsDailyApplicationIntelligenceItem;
  resumeDraftAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <article className="staffordCareerCommandRecommendation">
      <header>
        <div>
          <span>{item.recommendation}</span>
          <h3>{item.role}</h3>
          <p>{item.company}</p>
        </div>
        <strong>{item.nextAction}</strong>
      </header>
      <details className="staffordCareerIntelligenceDetails">
        <summary>View Intelligence</summary>
        <dl className="staffordCareerCommandDetails">
          <div>
            <dt>Fit</dt>
            <dd>{item.fit}</dd>
          </div>
          <div>
            <dt>Evidence</dt>
            <dd>{item.evidence}</dd>
          </div>
          <div>
            <dt>Gaps</dt>
            <dd>{item.gaps}</dd>
          </div>
          <div>
            <dt>Resume</dt>
            <dd>{item.resumeVersion}</dd>
          </div>
          <div>
            <dt>Safety</dt>
            <dd>{item.resumeSafety}</dd>
          </div>
          <div>
            <dt>Next Action</dt>
            <dd>{item.detail}</dd>
          </div>
        </dl>
      </details>
      {resumeDraftAction ? (
        <form action={resumeDraftAction}>
          <input type="hidden" name="packetId" value={item.id} />
          <button type="submit" className="staffordJobCommandSecondaryAction">
            Prepare Resume Draft
          </button>
        </form>
      ) : null}
    </article>
  );
}

function ResumeDraftItem({ item }: { item: CareerOsDailyResumeDraftItem }) {
  return (
    <article className="staffordCareerCommandRecommendation">
      <header>
        <div>
          <span>{item.safetyState}</span>
          <h3>{item.role}</h3>
          <p>{item.company}</p>
        </div>
        <strong>v{item.version}</strong>
      </header>
      <dl className="staffordCareerCommandDetails">
        <div>
          <dt>Traceability</dt>
          <dd>{item.tracedClaimCount} traced claims</dd>
        </div>
        <div>
          <dt>Review</dt>
          <dd>{item.blockedIssueCount} blocking / {item.reviewIssueCount} review issues</dd>
        </div>
        <div>
          <dt>Approval</dt>
          <dd>{item.operatorApprovalState}</dd>
        </div>
        <div>
          <dt>Next Action</dt>
          <dd>{item.nextAction}</dd>
        </div>
      </dl>
      <footer>
        <span>{item.detail}</span>
        <button type="button" className="staffordJobCommandDisabledAction" disabled>
          Review Draft
        </button>
      </footer>
    </article>
  );
}

function PipelineMetric({ item }: { item: CareerOsDailyPipelineStage }) {
  return (
    <article className="staffordCareerCommandMetric">
      <span>{item.label}</span>
      <strong>{item.value}</strong>
      <p>{item.detail}</p>
    </article>
  );
}

export function JobCommandSurface({
  experience = EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE,
  jobIntakeAction,
  resumeDraftAction,
}: {
  experience?: CareerOsDailyJobSearchExperience;
  jobIntakeAction?: (formData: FormData) => void | Promise<void>;
  resumeDraftAction?: (formData: FormData) => void | Promise<void>;
}) {
  const hasPriorities = experience.todaysPriorities.length > 0;
  const hasOpportunities = experience.topOpportunities.length > 0;
  const hasApplicationWork = experience.applicationWork.length > 0;
  const hasApplicationIntelligence = experience.applicationIntelligence.length > 0;
  const hasResumeDrafts = experience.resumeDrafts.length > 0;

  return (
    <div className="staffordJobCommand">
      <section className="staffordHomeHeader">
        <div>
          <span className="staffordEyebrow">{experience.greeting}</span>
          <h1>{experience.title}</h1>
          <p>{experience.primaryQuestion}</p>
          <p>{experience.dailyBriefing.headline}</p>
        </div>
        <div className="staffordWorkspaceStatus">
          <span>{experience.dailyBriefing.capturedAsOf}</span>
          <strong>Daily Job Search</strong>
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Today's Brief">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Today's Brief</span>
          <h2>What should I do today?</h2>
          <p>{experience.dailyBriefing.summary}</p>
        </div>
        <div className="staffordCareerCommandBriefGrid">
          {experience.dailyBriefing.metrics.map((item) => (
            <BriefMetric key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Today's Priorities">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Today's Priorities</span>
          <h2>Do this first</h2>
          <p>Tasks are ordered from existing opportunity, application, and follow-up information.</p>
        </div>
        {hasPriorities ? (
          <div className="staffordCareerDailyTaskList">
            {experience.todaysPriorities.map((item) => (
              <PriorityItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No priority due</span>
            <strong>{experience.emptyState || "No current action is due from connected artifacts."}</strong>
          </article>
        )}
      </section>

      <section className="staffordHomeSupport" aria-label="Today's Top Opportunities">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Today's Top Opportunities</span>
          <h2>Best opportunities to inspect</h2>
          <p>Shown from existing opportunity recommendations.</p>
        </div>
        {hasOpportunities ? (
          <div className="staffordCareerCommandRecommendationList">
            {experience.topOpportunities.map((item) => (
              <OpportunityItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No opportunities connected</span>
            <strong>Run the existing discovery and recommendation workflow to populate this section.</strong>
          </article>
        )}
      </section>

      <section className="staffordHomeSupport" aria-label="Application Work">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Application Work</span>
          <h2>Application review, follow-ups, and interview handoffs</h2>
          <p>Each item is planning-only until Ross performs any external action himself.</p>
        </div>
        {hasApplicationWork ? (
          <div className="staffordCareerDailyTaskList">
            {experience.applicationWork.map((item) => (
              <WorkItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No application work connected</span>
            <strong>Application review and follow-up details will appear here when available.</strong>
          </article>
        )}
      </section>

      <section className="staffordHomeSupport" aria-label="Application Intelligence">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Application Intelligence</span>
          <h2>Fit, evidence, gaps, and resume safety</h2>
          <p>Shown from private packet read models created by existing CareerOS workflows.</p>
        </div>
        {hasApplicationIntelligence ? (
          <div className="staffordCareerCommandRecommendationList">
            {experience.applicationIntelligence.map((item) => (
              <IntelligenceItem key={item.id} item={item} resumeDraftAction={resumeDraftAction} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No packet connected</span>
            <strong>Analyze a job or run the packet workflow to populate this section.</strong>
          </article>
        )}
      </section>

      <section className="staffordHomeSupport" aria-label="Resume Drafts">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Resume Drafts</span>
          <h2>Truth-bound resume drafts</h2>
          <p>Draft status is shown from redacted artifact read models. Full draft content remains owner-private.</p>
        </div>
        {hasResumeDrafts ? (
          <div className="staffordCareerCommandRecommendationList">
            {experience.resumeDrafts.map((item) => (
              <ResumeDraftItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No resume draft connected</span>
            <strong>Prepare a draft from an Application Intelligence packet when evidence authority supports it.</strong>
          </article>
        )}
      </section>

      <section className="staffordHomeSupport" aria-label="Application Pipeline">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Application Pipeline</span>
          <h2>Current application stages</h2>
          <p>Counts come from existing application tracking and outcome history.</p>
        </div>
        <div className="staffordCareerCommandPipelineGrid">
          {experience.applicationPipeline.map((item) => (
            <PipelineMetric key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Add Job">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Add Job</span>
          <h2>Analyze a job from another source</h2>
          <p>Paste a public job URL with the description to add it to the existing CareerOS review flow.</p>
        </div>
        <form className="staffordJobIntakeForm" action={jobIntakeAction}>
          <label>
            <span>Job URL</span>
            <input name="jobUrl" type="url" placeholder="https://..." />
          </label>
          <label>
            <span>Job Description</span>
            <textarea name="jobDescription" rows={8} placeholder="Paste the job description here." />
          </label>
          <div className="staffordJobIntakeActions">
            <button type="submit">Analyze Job</button>
            <p>No application, message, resume, or cover letter is created.</p>
          </div>
        </form>
      </section>

      <section className="staffordHomeSupport" aria-label="Daily Actions">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Daily Actions</span>
          <h2>Available planning actions</h2>
          <p>No action here submits, sends, edits, or contacts an external system.</p>
        </div>
        <div className="staffordCareerDailyActionRow">
          {experience.dailyActions.map((item) => (
            <button key={item.action} type="button" className="staffordJobCommandDisabledAction" disabled>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="staffordHomeSupport" aria-label="Search Health">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Search Health</span>
          <h2>Discovery and tracking status</h2>
          <p>{experience.systemHealth.detail}</p>
        </div>
        <div className="staffordJobCommandHealthGrid">
          <article className="staffordHomeStatusNote">
            <span>Provider Status</span>
            <strong>{experience.systemHealth.providerStatus}</strong>
          </article>
          <article className="staffordHomeStatusNote">
            <span>Last Discovery</span>
            <strong>{experience.systemHealth.lastDiscoveryRun}</strong>
          </article>
          <article className="staffordHomeStatusNote">
            <span>Opportunity Backlog</span>
            <strong>{experience.systemHealth.openOpportunityBacklog}</strong>
          </article>
        </div>
      </section>

      <section className="staffordObjectiveNote" aria-label="Approval boundary">
        <strong>Human review before external action</strong>
        <p>{experience.approvalBoundary}</p>
      </section>
    </div>
  );
}
