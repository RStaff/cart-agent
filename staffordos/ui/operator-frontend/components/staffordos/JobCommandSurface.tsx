import {
  EMPTY_CAREEROS_DAILY_JOB_SEARCH_EXPERIENCE,
  type CareerOsDailyApplicationOutcomeItem,
  type CareerOsDailyApplicationWorkItem,
  type CareerOsDailyApplicationIntelligenceItem,
  type CareerOsDailyBriefMetric,
  type CareerOsDailyJobSearchExperience,
  type CareerOsDailyOpportunityDecisionItem,
  type CareerOsDailyPipelineStage,
  type CareerOsDailyPriority,
  type CareerOsDailyResumeExportItem,
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

function OpportunityDecisionItem({
  item,
  opportunityDecisionAction,
}: {
  item: CareerOsDailyOpportunityDecisionItem;
  opportunityDecisionAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <article className="staffordCareerCommandRecommendation staffordCareerOpportunityDecision">
      <header>
        <div>
          <span>{item.recommendation}</span>
          <h3>{item.role}</h3>
          <p>{item.company}</p>
        </div>
        <strong>{item.operatorDecision}</strong>
      </header>
      <dl className="staffordCareerCommandDetails">
        <div>
          <dt>CareerOS Recommendation</dt>
          <dd>{item.recommendation}</dd>
        </div>
        <div>
          <dt>Ross Decision</dt>
          <dd>{item.operatorDecision}</dd>
        </div>
        <div>
          <dt>Readiness</dt>
          <dd>{item.applicationReadiness}</dd>
        </div>
        <div>
          <dt>Fit</dt>
          <dd>{item.explainableFit}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{item.evidence}</dd>
        </div>
        <div>
          <dt>Gaps / Risk</dt>
          <dd>{item.gaps}</dd>
        </div>
        <div>
          <dt>Resume</dt>
          <dd>{item.resumeReadiness}</dd>
        </div>
        <div>
          <dt>Recommended Next</dt>
          <dd>{item.recommendedNextAction}</dd>
        </div>
        <div>
          <dt>After Decision</dt>
          <dd>{item.currentWorkflowNextAction}</dd>
        </div>
      </dl>
      <p className="staffordJobCommandControlNote">{item.whyItFits}</p>
      <footer className="staffordOpportunityDecisionFooter">
        <span>{item.decisionAuthority}</span>
        <div className="staffordOpportunityDecisionActionRow">
          {item.availableActions.map((action) =>
            opportunityDecisionAction && action.enabled ? (
              <form action={opportunityDecisionAction} key={action.actionType}>
                <input type="hidden" name="recommendationId" value={item.recommendationId} />
                <input type="hidden" name="workflowAction" value={action.actionType} />
                <button type="submit" className="staffordJobCommandSecondaryAction" title={action.reason}>
                  {action.label}
                </button>
              </form>
            ) : (
              <button
                key={action.actionType}
                type="button"
                className="staffordJobCommandDisabledAction"
                title={action.reason}
                disabled
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      </footer>
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

function ApplicationOutcomeItem({
  item,
  applicationOutcomeAction,
}: {
  item: CareerOsDailyApplicationOutcomeItem;
  applicationOutcomeAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <article className="staffordCareerCommandRecommendation staffordApplicationOutcomeCard">
      <header>
        <div>
          <span>{item.currentStage}</span>
          <h3>{item.role}</h3>
          <p>{item.company}</p>
        </div>
        <strong>{item.nextAction}</strong>
      </header>
      <dl className="staffordCareerCommandDetails">
        <div>
          <dt>Submitted</dt>
          <dd>{item.submittedDate || "UNKNOWN"}</dd>
        </div>
        <div>
          <dt>Resume</dt>
          <dd>{item.exactResumeArtifactKnown ? item.resumeArtifact : "UNKNOWN"}</dd>
        </div>
        <div>
          <dt>Employer Response</dt>
          <dd>{item.employerResponseStatus}</dd>
        </div>
        <div>
          <dt>Latest Event</dt>
          <dd>{item.latestOutcome || "No response recorded"}</dd>
        </div>
        <div>
          <dt>Follow-up</dt>
          <dd>{item.followUpState}</dd>
        </div>
        <div>
          <dt>Next</dt>
          <dd>{item.recommendedNextEngagementAction}</dd>
        </div>
      </dl>
      {item.unknowns.length ? (
        <section className="staffordApplicationOutcomeUnknowns" aria-label="Unknown application details">
          <span>Unknown</span>
          <ul>
            {item.unknowns.map((unknown, index) => (
              <li key={`unknown-${item.applicationId}-${index}`}>{unknown}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="staffordJobCommandControlNote">
        Silence is not a rejection. Record an outcome only after Ross confirms it happened outside CareerOS.
      </p>
      {applicationOutcomeAction && item.availableActions.length ? (
        <div className="staffordApplicationOutcomeActions">
          {item.availableActions.map((action) => (
            <form action={applicationOutcomeAction} key={`${item.applicationId}-${action.decisionType}`}>
              <input type="hidden" name="applicationId" value={item.applicationId} />
              <input type="hidden" name="actionId" value={action.actionId} />
              <input type="hidden" name="decisionType" value={action.decisionType} />
              <label>
                <span>Date</span>
                <input name="occurredAt" type="date" />
              </label>
              {action.decisionType === "RECORD_REJECTION" ? (
                <label>
                  <span>Employer Reason</span>
                  <input name="employerProvidedReason" type="text" placeholder="Optional" />
                </label>
              ) : (
                <label>
                  <span>Private Note</span>
                  <input name="operatorContext" type="text" placeholder="Optional" />
                </label>
              )}
              <label className="staffordApplicationOutcomeConfirm">
                <input name="operatorConfirmed" type="checkbox" value="true" required />
                <span>I confirm this happened outside CareerOS.</span>
              </label>
              <button type="submit" className="staffordJobCommandSecondaryAction" title={action.reason}>
                {action.label}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <button type="button" className="staffordJobCommandDisabledAction" disabled>
          No outcome action available
        </button>
      )}
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

function ResumeDraftItem({
  item,
  resumeReviewAction,
}: {
  item: CareerOsDailyResumeDraftItem;
  resumeReviewAction?: (formData: FormData) => void | Promise<void>;
}) {
  const hasDraftContent =
    item.sections.summary.length > 0 ||
    item.sections.skills.length > 0 ||
    item.sections.experience.length > 0 ||
    item.sections.projects.length > 0 ||
    item.sections.education.length > 0 ||
    item.sections.certifications.length > 0;
  const approvalAvailable = Boolean(resumeReviewAction && item.approvalAllowed);
  const requestChangesAvailable = Boolean(resumeReviewAction && item.requestChangesAllowed);
  const rejectAvailable = Boolean(resumeReviewAction && item.rejectAllowed);

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
          <dt>Omitted</dt>
          <dd>{item.omittedUnsupportedClaimCount} unsupported claims</dd>
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
      <details className="staffordCareerResumeDraftReview" open>
        <summary>View Resume Draft</summary>
        {hasDraftContent ? (
          <div className="staffordCareerResumeDraftBody">
            {item.sections.summary.length ? (
              <section>
                <h4>Professional Summary</h4>
                {item.sections.summary.map((line, index) => (
                  <p key={`summary-${index}`}>{line}</p>
                ))}
              </section>
            ) : null}
            {item.sections.skills.length ? (
              <section>
                <h4>Core Skills / Technologies</h4>
                <p>{item.sections.skills.join(", ")}</p>
              </section>
            ) : null}
            {item.sections.experience.length ? (
              <section>
                <h4>Professional Experience</h4>
                {item.sections.experience.map((entry, index) => (
                  <article className="staffordCareerResumeDraftEntry" key={`experience-${index}`}>
                    <strong>{[entry.title, entry.employer].filter(Boolean).join(" / ") || "Experience"}</strong>
                    {entry.dateRange ? <span>{entry.dateRange}</span> : null}
                    <ul>
                      {entry.bullets.map((bullet, bulletIndex) => (
                        <li key={`experience-${index}-${bulletIndex}`}>{bullet}</li>
                      ))}
                    </ul>
                    {entry.limitations.length ? <p>{entry.limitations.join(" ")}</p> : null}
                  </article>
                ))}
              </section>
            ) : null}
            {item.sections.projects.length ? (
              <section>
                <h4>Selected Projects / Products</h4>
                {item.sections.projects.map((project, index) => (
                  <article className="staffordCareerResumeDraftEntry" key={`project-${index}`}>
                    <strong>{project.label}</strong>
                    <ul>
                      {project.bullets.map((bullet, bulletIndex) => (
                        <li key={`project-${index}-${bulletIndex}`}>{bullet}</li>
                      ))}
                    </ul>
                    {project.limitations.length ? <p>{project.limitations.join(" ")}</p> : null}
                  </article>
                ))}
              </section>
            ) : null}
            {item.sections.education.length ? (
              <section>
                <h4>Education</h4>
                {item.sections.education.map((line, index) => (
                  <p key={`education-${index}`}>{line}</p>
                ))}
              </section>
            ) : null}
            {item.sections.certifications.length ? (
              <section>
                <h4>Certifications</h4>
                {item.sections.certifications.map((line, index) => (
                  <p key={`certification-${index}`}>{line}</p>
                ))}
              </section>
            ) : null}
          </div>
        ) : (
          <p className="staffordJobCommandControlNote">
            This draft was created before the review projection was available. Regenerate the draft from the packet to review content here.
          </p>
        )}
      </details>
      {item.needsAttention.length ? (
        <section className="staffordCareerResumeDraftAttention" aria-label="Needs Attention">
          <span>Needs Attention</span>
          <ul>
            {item.needsAttention.map((attention, index) => (
              <li key={`attention-${index}`}>{attention}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <footer>
        <span>{item.detail}</span>
        {resumeReviewAction ? (
          <div className="staffordResumeReviewActionRow">
            {approvalAvailable ? (
              <form action={resumeReviewAction}>
                <input type="hidden" name="artifactVersionId" value={item.id} />
                <input type="hidden" name="reviewDecision" value="APPROVE_FOR_EXPORT" />
                <button type="submit" className="staffordJobCommandSecondaryAction">
                  Approve for Export
                </button>
              </form>
            ) : (
              <button type="button" className="staffordJobCommandDisabledAction" disabled>
                {item.safetyState === "DRAFT_NEEDS_EVIDENCE_REVIEW" || item.safetyState === "DRAFT_BLOCKED"
                  ? "Evidence Review Required"
                  : item.operatorApprovalState === "APPROVED"
                    ? "Approved"
                    : "Approve Unavailable"}
              </button>
            )}
            {requestChangesAvailable ? (
              <form action={resumeReviewAction}>
                <input type="hidden" name="artifactVersionId" value={item.id} />
                <input type="hidden" name="reviewDecision" value="REQUEST_CHANGES" />
                <button type="submit" className="staffordJobCommandSecondaryAction">
                  Request Changes
                </button>
              </form>
            ) : null}
            {rejectAvailable ? (
              <form action={resumeReviewAction}>
                <input type="hidden" name="artifactVersionId" value={item.id} />
                <input type="hidden" name="reviewDecision" value="REJECT" />
                <button type="submit" className="staffordJobCommandSecondaryAction">
                  Reject
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <button type="button" className="staffordJobCommandDisabledAction" disabled>
            Review Draft
          </button>
        )}
      </footer>
    </article>
  );
}

function ResumeExportItem({
  item,
  manualSubmissionAction,
}: {
  item: CareerOsDailyResumeExportItem;
  manualSubmissionAction?: (formData: FormData) => void | Promise<void>;
}) {
  const canMarkSubmitted =
    manualSubmissionAction &&
    item.submissionStatus === "NOT_SUBMITTED" &&
    item.docxCreated &&
    item.downloadPath &&
    item.validationIssueCount === 0;
  return (
    <article className="staffordCareerCommandRecommendation">
      <header>
        <div>
          <span>{item.exportState}</span>
          <h3>{item.role}</h3>
          <p>{item.company}</p>
        </div>
        <strong>v{item.version}</strong>
      </header>
      <dl className="staffordCareerCommandDetails">
        <div>
          <dt>DOCX</dt>
          <dd>{item.docxFilename || "Not available"}</dd>
        </div>
        <div>
          <dt>PDF</dt>
          <dd>{item.pdfCreated ? "Available" : "Not supported yet"}</dd>
        </div>
        <div>
          <dt>Submission</dt>
          <dd>{item.submissionStatus === "SUBMITTED" && item.submittedDate ? `SUBMITTED ${item.submittedDate}` : item.submissionStatus}</dd>
        </div>
        {item.applicationId ? (
          <div>
            <dt>Application</dt>
            <dd>{item.exactResumeArtifactKnown ? "Exact resume artifact linked" : "Resume linkage unknown"}</dd>
          </div>
        ) : null}
        {item.followUpState ? (
          <div>
            <dt>Follow-up</dt>
            <dd>{item.followUpState}</dd>
          </div>
        ) : null}
        <div>
          <dt>Validation</dt>
          <dd>{item.validationIssueCount} blocking issues</dd>
        </div>
      </dl>
      <footer>
        <span>{item.detail}</span>
        {item.docxCreated && item.downloadPath ? (
          <a className="staffordJobCommandSecondaryAction" href={item.downloadPath}>
            Download DOCX
          </a>
        ) : (
          <button type="button" className="staffordJobCommandDisabledAction" disabled>
            Review Evidence
          </button>
        )}
      </footer>
      {canMarkSubmitted ? (
        <form className="staffordManualSubmissionForm" action={manualSubmissionAction}>
          <input type="hidden" name="artifactVersionId" value={item.id} />
          <label>
            <span>Submitted Date</span>
            <input name="submittedAt" type="date" required />
          </label>
          <label>
            <span>Submission Channel</span>
            <input name="submissionChannel" type="text" placeholder="Company careers site" />
          </label>
          <button type="submit" className="staffordJobCommandSecondaryAction">
            Mark as Submitted
          </button>
          <p>Ross must have already submitted this application outside CareerOS.</p>
        </form>
      ) : item.submissionStatus === "SUBMITTED" ? (
        <p className="staffordJobCommandControlNote">
          Recorded after Ross confirmed manual submission. CareerOS did not submit or upload anything.
        </p>
      ) : null}
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
  resumeReviewAction,
  manualSubmissionAction,
  opportunityDecisionAction,
  applicationOutcomeAction,
}: {
  experience?: CareerOsDailyJobSearchExperience;
  jobIntakeAction?: (formData: FormData) => void | Promise<void>;
  resumeDraftAction?: (formData: FormData) => void | Promise<void>;
  resumeReviewAction?: (formData: FormData) => void | Promise<void>;
  manualSubmissionAction?: (formData: FormData) => void | Promise<void>;
  opportunityDecisionAction?: (formData: FormData) => void | Promise<void>;
  applicationOutcomeAction?: (formData: FormData) => void | Promise<void>;
}) {
  const hasPriorities = experience.todaysPriorities.length > 0;
  const hasOpportunityDecisions = experience.opportunityDecisions.length > 0;
  const hasOpportunities = experience.topOpportunities.length > 0;
  const hasApplicationWork = experience.applicationWork.length > 0;
  const hasApplicationOutcomes = experience.applicationOutcomes.length > 0;
  const hasApplicationIntelligence = experience.applicationIntelligence.length > 0;
  const hasResumeDrafts = experience.resumeDrafts.length > 0;
  const hasResumeExports = experience.resumeExports.length > 0;

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

      <section className="staffordHomeSupport" aria-label="Opportunity Decisions">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Opportunity Decisions</span>
          <h2>Decide which roles deserve work</h2>
          <p>CareerOS recommends; Ross decides. Buttons record planning decisions only.</p>
        </div>
        {hasOpportunityDecisions ? (
          <div className="staffordCareerCommandRecommendationList">
            {experience.opportunityDecisions.map((item) => (
              <OpportunityDecisionItem
                key={item.id}
                item={item}
                opportunityDecisionAction={opportunityDecisionAction}
              />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No pending decision</span>
            <strong>No ranked opportunity currently needs an Apply, Review later, Skip, or Not interested decision.</strong>
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
              <ResumeDraftItem key={item.id} item={item} resumeReviewAction={resumeReviewAction} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No resume draft connected</span>
            <strong>Prepare a draft from an Application Intelligence packet when evidence authority supports it.</strong>
          </article>
        )}
      </section>

      <section className="staffordHomeSupport" aria-label="Resume Files">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Resume Files</span>
          <h2>Reviewed application artifacts</h2>
          <p>DOCX files are rendered from approved truth-bound drafts. No submission has occurred.</p>
        </div>
        {hasResumeExports ? (
          <div className="staffordCareerCommandRecommendationList">
            {experience.resumeExports.map((item) => (
              <ResumeExportItem key={item.id} item={item} manualSubmissionAction={manualSubmissionAction} />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No exported resume file</span>
            <strong>Approve a ready truth-bound draft to create a private DOCX artifact.</strong>
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

      <section className="staffordHomeSupport" aria-label="Follow-Up and Outcomes">
        <div className="staffordHomeSectionHeader">
          <span className="staffordEyebrow">Follow-Up & Outcomes</span>
          <h2>Submitted application lifecycle</h2>
          <p>Record only real responses or outcomes Ross received outside CareerOS.</p>
        </div>
        {hasApplicationOutcomes ? (
          <div className="staffordCareerCommandRecommendationList">
            {experience.applicationOutcomes.map((item) => (
              <ApplicationOutcomeItem
                key={item.id}
                item={item}
                applicationOutcomeAction={applicationOutcomeAction}
              />
            ))}
          </div>
        ) : (
          <article className="staffordHomeStatusNote">
            <span>No submitted application connected</span>
            <strong>Submitted applications will appear here after Ross marks a manual application submitted.</strong>
          </article>
        )}
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
