# StaffordOS P3 Founder Operating Experience V1

Mission: STAFFORDOS_P3.4_FOUNDER_OPERATING_EXPERIENCE_V1
Status: documentation and design only
Implementation status: not implemented
Commit status: do not commit

## Executive Summary

This document defines the founder operating experience for Stafford Media
Consulting. It is the daily, weekly, monthly, quarterly, and annual operating
blueprint Ross uses to run the business inside StaffordOS.

Repository truth:

- The lifecycle is already defined in `canonical_business_lifecycle_v1.md`.
- Ownership is already defined in `canonical_department_architecture_v1.md`.
- Money truth is already defined in `canonical_money_model_v1.md`.
- The fiscal cadence is already defined in `fiscal_operating_model_v1.md`.
- Campaign traceability remains broken at Campaign -> Lead.
- Lead -> Relationship -> Merchant -> Payment -> Revenue -> Customer Success ->
  Abando is already traceable through existing registries and resolvers.

This experience must unify those authorities into one coherent founder loop:

Annual Goals -> Quarterly Objectives -> Marketing Campaigns -> Leads ->
Relationships -> Merchant -> Proposal -> ShopiFixer Audit -> Fix Sprint ->
Evidence -> Payment -> Customer Success -> Abando Expansion -> Lifetime Value ->
Quarterly Review -> Annual Review

It is not a UI specification. It defines the operating experience, the decisions
Ross makes, the evidence StaffordOS must present, and the next action the system
should always surface.

## Founder Operating Philosophy

The founder experience should obey five rules:

1. Ross should always see the highest-value governed next action.
2. Ross should never have to infer whether work is blocked, waiting approval, or
   waiting evidence.
3. Estimates must remain labeled as estimates.
4. Captured Stafford Revenue must remain separate from Merchant Value.
5. AI may rank, draft, summarize, and surface gaps, but may not self-approve or
   replace Ross on irreversible decisions.

The operating experience is built around one question:

What is the best governed action Ross can take next?

That answer must come from the live business spine, not from a speculative
planning layer.

## Operating Spine

The founder spine is the end-to-end path Ross should be able to run every day:

Annual Goals
-> Quarterly Objectives
-> Marketing Campaigns
-> Leads
-> Relationships
-> Merchant
-> Proposal
-> ShopiFixer Audit
-> Fix Sprint
-> Evidence
-> Payment
-> Customer Success
-> Abando Expansion
-> Lifetime Value
-> Quarterly Review
-> Annual Review

Each stage should answer three things:

- What does StaffordOS believe is true right now?
- What decision is blocked on Ross?
- What is the next governed action?

## Stage Model

### Annual Goals

Founder objective:

- Set the year’s company targets, growth priorities, and governance boundaries.

Questions StaffordOS must answer:

- What is the annual Stafford Revenue target?
- What are the annual product and service priorities?
- What departments and campaigns are funded?
- What risks threaten the year?

Decisions Ross makes:

- Approve annual goals.
- Approve annual budget direction.
- Approve product and service emphasis.
- Decide what not to pursue.

Decisions AI may make:

- Summarize prior-year performance.
- Propose target ranges.
- Detect gaps between current truth and annual goals.

Required evidence:

- Fiscal model.
- Money model.
- Department architecture.
- Current revenue truth.
- Current backlog and open risks.

Required approvals:

- Ross annual approval.

Success metrics:

- Goals are explicit, consistent, and decomposed into quarterly objectives.

Next possible actions:

- Create quarterly objectives.
- Rebalance budget and operating priorities.

### Quarterly Objectives

Founder objective:

- Translate annual goals into a concrete quarterly operating plan.

Questions StaffordOS must answer:

- What are the quarter’s 3 to 5 objectives?
- What campaigns, delivery actions, and revenue moves support them?
- What is the quarter’s target Stafford Revenue?
- What work is blocked by missing attribution or missing evidence?

Decisions Ross makes:

- Approve quarterly objectives.
- Approve quarterly budget allocation.
- Prioritize campaign, sales, delivery, and finance work.

Decisions AI may make:

- Rank candidate objectives.
- Estimate effort and risk.
- Surface dependencies and blocked work.

Required evidence:

- Annual goals.
- Revenue actuals.
- Lead pipeline.
- Campaign inventory.
- Delivery backlog.

Required approvals:

- Ross quarterly approval.

Success metrics:

- Each quarter has explicit objectives, owners, and evidence-linked outcomes.

Next possible actions:

- Launch or revise campaigns.
- Advance leads and merchant work.
- Resolve blocked evidence or payment items.

### Marketing Campaigns

Founder objective:

- Turn approved goals into governed outreach and conversion motions.

Questions StaffordOS must answer:

- Which campaigns are active?
- Which campaigns are healthy, warm, at risk, dormant, or unknown?
- Which campaigns need budget, approval, or evidence?
- Which campaigns are producing attributable leads?

Decisions Ross makes:

- Approve campaigns.
- Approve budgets.
- Approve launches, pauses, and closures.

Decisions AI may make:

- Draft campaign copy and variations.
- Propose audiences and channel options.
- Detect missing campaign fields.
- Rank campaigns by risk and likely value.

Required evidence:

- Campaign definition.
- Audience.
- Offer.
- Budget.
- Planned spend.
- Current lead output.
- Status and health.

Required approvals:

- Campaign approval.
- Budget approval.
- Launch approval.

Success metrics:

- Campaigns are governed, budgeted, and linked to leads.
- Pipeline Value remains clearly labeled as estimate.

Next possible actions:

- Review leads created by the campaign.
- Adjust budget or channel.
- Close the campaign.

### Leads

Founder objective:

- Turn campaign output into structured prospects that can be qualified.

Questions StaffordOS must answer:

- Which leads are new, qualified, blocked, or ready to hand off?
- Which leads need contact, message approval, or qualification?
- Which leads are attributable and which are still unknown?

Decisions Ross makes:

- Approve outreach.
- Confirm qualification on non-obvious cases.

Decisions AI may make:

- Draft outreach.
- Score or rank leads.
- Detect missing contact or routing data.
- Surface likely next action.

Required evidence:

- Lead record.
- Contact signal.
- Source and channel.
- Routing hints.
- Engagement signals.
- Qualification reason and source.

Required approvals:

- Outreach approval before send.
- Ross qualification approval.

Success metrics:

- Leads are structured, contactable, and ready to qualify.

Next possible actions:

- Move to relationship management.
- Approve or reject outreach.
- Promote qualified leads.

### Relationships

Founder objective:

- Preserve the unified identity across lead, client, and merchant records.

Questions StaffordOS must answer:

- Is the identity resolved?
- Is the relationship healthy, warm, dormant, or at risk?
- What is the next governed action?

Decisions Ross makes:

- Approve routing in ambiguous cases.
- Decide whether a relationship should be advanced or paused.

Decisions AI may make:

- Resolve cross-store identity signals.
- Rank relationship urgency.
- Surface conflicts and missing identity links.

Required evidence:

- Lead IDs.
- Client IDs.
- Merchant IDs.
- Relationship resolver output.
- Conflict notes.

Required approvals:

- Ross approval for non-obvious routing decisions.

Success metrics:

- Relationship identity is stable and preserved across the spine.

Next possible actions:

- Advance to merchant management.
- Trigger proposal or audit work.

### Merchant

Founder objective:

- Maintain a governed view of the merchant journey and commercial state.

Questions StaffordOS must answer:

- What stage is the merchant in?
- What is the current offer, payment, and revenue state?
- What is blocked?

Decisions Ross makes:

- Approve offers.
- Approve escalation or re-routing.
- Decide whether delivery should proceed.

Decisions AI may make:

- Surface merchant state.
- Detect payment blockers.
- Summarize current journey risks.

Required evidence:

- Merchant lifecycle state.
- Offer status.
- Payment status.
- Revenue status.
- Fulfillment status.

Required approvals:

- Offer approval.
- Routing approval when ambiguous.

Success metrics:

- Merchant truth stays aligned with lifecycle and money authorities.

Next possible actions:

- Create proposal.
- Move to audit.
- Prepare delivery.

### Proposal

Founder objective:

- Present a governed offer to the merchant.

Questions StaffordOS must answer:

- What offer is being presented?
- What price is being offered?
- Is the proposal approved?
- Is the proposal blocked by missing evidence or route clarity?

Decisions Ross makes:

- Approve the proposal.
- Change or reject the offer.

Decisions AI may make:

- Draft proposal text.
- Summarize offer context.
- Identify missing evidence.

Required evidence:

- Offer.
- Price.
- Routing context.
- Audit evidence where relevant.

Required approvals:

- Ross proposal approval.

Success metrics:

- Proposal is clear, approved, and consistent with canonical product identity.

Next possible actions:

- Launch ShopiFixer audit.
- Await merchant response.

### ShopiFixer Audit

Founder objective:

- Diagnose the merchant’s issue and establish proof for the fix path.

Questions StaffordOS must answer:

- What was found?
- What is the recommended fix path?
- Is the audit complete?

Decisions Ross makes:

- Approve audit findings.
- Approve the move to Fix Sprint.

Decisions AI may make:

- Summarize findings.
- Draft recommendations.
- Flag missing proof or contradictory evidence.

Required evidence:

- Audit findings.
- Inspection checklist.
- Before evidence if applicable.

Required approvals:

- Ross review of the audit.

Success metrics:

- Audit output is understandable, evidence-backed, and usable for sale.

Next possible actions:

- Start Fix Sprint.
- Stop or revisit the proposal.

### Fix Sprint

Founder objective:

- Execute approved ShopiFixer work with governed scope and delivery proof.

Questions StaffordOS must answer:

- Is payment received?
- Is the scope approved?
- What work is in progress?

Decisions Ross makes:

- Approve the execution scope.
- Approve scope changes.
- Approve proof package readiness.

Decisions AI may make:

- Execute approved work.
- Run QA.
- Capture before and after evidence.

Required evidence:

- Verified payment.
- Execution scope.
- QA results.
- Before and after evidence.
- Proof package.

Required approvals:

- Payment gate.
- Scope approval.
- Proof package approval.

Success metrics:

- Delivery completes on scope, with proof, after payment.

Next possible actions:

- Publish evidence.
- Move to customer success.

### Evidence

Founder objective:

- Preserve proof that the work happened and the outcome is real.

Questions StaffordOS must answer:

- Is the evidence complete?
- Does the proof package match the work?
- Is the merchant ready for success or upsell?

Decisions Ross makes:

- Approve the evidence package.
- Decide whether more proof is needed.

Decisions AI may make:

- Organize evidence.
- Summarize the outcome.
- Detect missing proof artifacts.

Required evidence:

- Before evidence.
- After evidence.
- Proof package.
- Completion markers.

Required approvals:

- Ross evidence approval.

Success metrics:

- Evidence is sufficient to support delivery completion and customer success.

Next possible actions:

- Confirm payment and revenue state.
- Move to customer success.

### Payment

Founder objective:

- Ensure actual captured Stafford Revenue is correct and governed.

Questions StaffordOS must answer:

- Was payment received?
- Was it Stripe-authoritative?
- What revenue is actually earned?

Decisions Ross makes:

- None for payment capture itself.
- Review payment state for operational awareness.

Decisions AI may make:

- Summarize payment status.
- Surface pending payment blockers.

Required evidence:

- Stripe webhook proof.
- Payment record.
- Merchant and engagement linkage.

Required approvals:

- None for capture.
- Stripe webhook is the capture authority.

Success metrics:

- Captured Stafford Revenue is accurate and not confused with Merchant Value.

Next possible actions:

- Start or complete delivery.
- Feed revenue review.

### Customer Success

Founder objective:

- Keep the merchant successful after delivery and expose follow-up needs.

Questions StaffordOS must answer:

- Is the customer healthy?
- Is review or follow-up required?
- Is upsell readiness present?

Decisions Ross makes:

- Approve follow-up priorities.
- Approve referral or customer success escalation.

Decisions AI may make:

- Summarize outcomes.
- Flag follow-up risk.
- Surface review completion and referral signals.

Required evidence:

- Review status.
- Success state.
- Outcome signals.
- Client and merchant context.

Required approvals:

- Ross review for key customer decisions.

Success metrics:

- Customer success is visible and actionable.

Next possible actions:

- Trigger Abando expansion.
- Record referral.
- Close the engagement loop.

### Abando Expansion

Founder objective:

- Convert customer success into recurring value through Abando when appropriate.

Questions StaffordOS must answer:

- Is the merchant ready for Abando?
- Is the upsell approved?
- What recurring value is at stake or captured?

Decisions Ross makes:

- Approve Abando offer timing.
- Approve upsell or pause it.

Decisions AI may make:

- Surface readiness.
- Summarize expansion signal.
- Detect missing proof or timing risk.

Required evidence:

- Customer success state.
- Abando readiness signal.
- Payment and revenue context.

Required approvals:

- Ross approval for offer timing and positioning.

Success metrics:

- Abando is offered only when the upstream journey justifies it.

Next possible actions:

- Record recurring revenue.
- Move into LTV review.

### Lifetime Value

Founder objective:

- Understand the total realized value from a client over time.

Questions StaffordOS must answer:

- What is the captured one-time revenue?
- What recurring revenue exists?
- What is the true lifetime value?

Decisions Ross makes:

- Decide where to invest follow-up effort.
- Decide which client types warrant more focus.

Decisions AI may make:

- Summarize value trends.
- Rank clients by realized value.
- Surface gaps between Merchant Value and Stafford Revenue.

Required evidence:

- Captured Stafford Revenue.
- Recurring revenue.
- Client history.

Required approvals:

- None for calculation.

Success metrics:

- Lifetime value is captured as realized value, not projected value.

Next possible actions:

- Feed quarterly review.
- Feed annual review.

### Quarterly Review

Founder objective:

- Compare the quarter’s plan to actual performance.

Questions StaffordOS must answer:

- Did the quarter hit its objectives?
- Which campaigns, leads, and merchants mattered most?
- What is blocked or slipping?
- What approvals remain open?

Decisions Ross makes:

- Reprioritize the next quarter.
- Reallocate budget or effort.
- Close out underperforming work.

Decisions AI may make:

- Summarize quarter outcomes.
- Rank risks and opportunities.
- Prepare review narratives.

Required evidence:

- Campaign results.
- Lead and relationship performance.
- Revenue actuals.
- Delivery proof.
- Customer success signals.
- Open approvals and blockers.

Required approvals:

- Ross quarterly review acceptance.

Success metrics:

- The quarter produces clear decisions, not just reporting.

Next possible actions:

- Update annual goals or next-quarter objectives.
- Close or continue campaigns.

### Annual Review

Founder objective:

- Convert the full year into operating truth and next-year planning inputs.

Questions StaffordOS must answer:

- What worked?
- What failed?
- Where was the biggest value created?
- What should be repeated or stopped?

Decisions Ross makes:

- Approve annual lessons.
- Set next-year goals.
- Decide structural changes and investments.

Decisions AI may make:

- Compile year-end summaries.
- Compare annual goals to realized outcomes.
- Detect recurring failure modes.

Required evidence:

- Quarterly reviews.
- Revenue truth.
- Campaign truth.
- Delivery truth.
- Customer success truth.

Required approvals:

- Ross annual review acceptance.

Success metrics:

- The year yields a better operating model for the next one.

Next possible actions:

- Start next annual planning cycle.

## Daily Operating Loop

The daily loop is the real founder operating experience. It should always end in
a concrete next action.

Morning startup workflow:

1. Open StaffordOS.
2. Review the highest-value governed queue.
3. Check for payments pending, evidence pending, and approvals pending.
4. Check campaigns that need attention.
5. Check leads that are ready, blocked, or waiting qualification.
6. Check relationships that need advancement.
7. Check merchant work that is waiting on Ross.
8. Check customer success and Abando follow-up.

Daily work queue:

- Highest-value opportunity.
- Highest risk.
- Blocked work.
- Waiting approvals.
- Payments pending.
- Customers requiring follow-up.
- Campaigns needing attention.
- Engineering work needing approval.
- Delivery requiring evidence.

Daily queue ordering rule:

1. Revenue or payment blockers.
2. Evidence or approval blockers.
3. High-risk leads or merchants.
4. High-value campaign or relationship work.
5. Follow-up and cleanup.

Ross should never be left with a blank queue. If everything is quiet, StaffordOS
should surface review, cleanup, or planning work.

## Weekly Operating Loop

Weekly review rhythm:

- Monday: set priorities from quarter objectives and open blockers.
- Midweek: review execution, approvals, and risk.
- Friday: inspect shipped work, revenue movement, and customer state.

Weekly review subjects:

- Campaigns with weak performance or missing attribution.
- Leads waiting for qualification or outreach approval.
- Relationships with unresolved identity or route conflicts.
- Merchants waiting on proposal or audit decisions.
- Delivery items waiting on scope approval or evidence.
- Payments that are pending or not reconciled.
- Customer success items needing follow-up.
- Abando opportunities that should be deferred.

Weekly success metric:

- Ross knows what matters next without searching for it.

## Monthly Operating Loop

Monthly review should be a control point, not a status ritual.

Monthly review subjects:

- Revenue actuals versus target.
- Campaign performance versus budget and expected value.
- Pipeline Value labeled as estimate.
- Lead quality and routing quality.
- Delivery completion and proof completion.
- Customer success outcomes.
- Abando expansion readiness.
- Open governance issues or authority drift.

Monthly decisions Ross makes:

- Reallocate effort.
- Adjust campaign spend.
- Stop weak work.
- Expand strong work.

Monthly success metric:

- The month produces course correction, not just a report.

## Quarterly Planning

Quarterly planning is the bridge between annual goals and daily work.

Quarterly inputs:

- Annual goals.
- Prior quarter actuals.
- Open campaign inventory.
- Lead and relationship state.
- Delivery backlog.
- Revenue actuals.
- Customer success state.

Quarterly outputs:

- Quarterly objectives.
- Campaign plan.
- Budget direction.
- Revenue target.
- Risk register.
- Priority queue.

Quarterly planning rule:

- Never use Pipeline Value or Merchant Value as revenue targets.
- Never treat attribution as solved if Campaign -> Lead is still missing.

## Annual Planning

Annual planning starts the year by setting the entire business frame.

Annual planning inputs:

- Prior year review.
- Current revenue truth.
- Strategic product and service direction.
- Campaign lessons.
- Delivery lessons.
- Customer success lessons.

Annual planning outputs:

- Annual goals.
- Fiscal priorities.
- Department priorities.
- Campaign principles.
- Evidence and governance priorities.

Annual planning rule:

- If a business concept is not grounded in repository truth, it cannot be a
  planning authority.

## Decision Framework

Ross decides the things that cannot be delegated:

- Strategy.
- Goals.
- Budget.
- Campaign approval.
- Launch approval.
- Qualification approval.
- Offer approval.
- Execution scope approval.
- Evidence approval.
- Annual and quarterly acceptance.

AI may decide or recommend:

- Ranking.
- Drafting.
- Summarizing.
- Detecting missing fields.
- Identifying blockers.
- Identifying likely next actions.

AI may not:

- Self-approve anything irreversible.
- Convert estimates into revenue.
- Grant payment.
- Replace Ross judgment.

Decision hierarchy:

1. Constitutional authority.
2. Operational authority.
3. Source-of-record data.
4. Derived projections.
5. Human judgment.
6. AI recommendations.

If those disagree, the higher authority wins.

## AI Collaboration Model

AI should behave like a disciplined operating assistant, not a parallel manager.

Allowed AI work:

- Summarize current state.
- Rank opportunities.
- Surface risks.
- Draft outreach, proposals, and retrospectives.
- Detect missing attribution or missing evidence.
- Identify blocked work.
- Flag payment and revenue anomalies.

Forbidden AI work:

- Make irreversible business approvals.
- Pretend Pipeline Value is revenue.
- Pretend Merchant Value is revenue.
- Ignore payment authority.
- Ignore human gates.
- Hide uncertainty.

Good AI output should always include:

- What is true.
- What is missing.
- What is blocked.
- What Ross should do next.

## Operational Priorities

StaffordOS should constantly surface these priorities in order:

- Highest value opportunity.
- Highest risk.
- Blocked work.
- Waiting approvals.
- Payments pending.
- Customers requiring follow-up.
- Campaigns needing attention.
- Engineering work needing approval.
- Delivery requiring evidence.

Priority interpretation:

- Value means captured Stafford Revenue or a clearly labeled estimate.
- Risk means loss of revenue, missed approval, or broken proof.
- Blocked means Ross or another authority must act before progress can continue.

## Future Opportunities

Future opportunities that fit this operating experience once foundations are
stable:

- Campaign attribution drill-through.
- Better campaign ROI reporting.
- Better opportunity ranking by evidence.
- Better customer success and Abando timing.
- Better annual planning summaries.
- Better evidence automation.
- Better risk forecasting.

These are future because they depend on cleaner attribution, spending, and
governed projection layers.

## Known Gaps

The founder experience must acknowledge current gaps rather than hide them.

Known gaps:

- Campaign -> Lead attribution is missing.
- Campaign IDs are not yet stable per campaign.
- UTM capture is missing.
- Campaign budget and spend storage are missing.
- Campaign ROI is not yet computable.
- Pipeline Value can be inflated in current projections.
- Lead records contain duplicate and transitional fields.
- Some stages are represented by projections rather than full stored authorities.
- The fiscal store is still greenfield.
- Some downstream artifact IDs are missing or partial.

The operating experience should still work with these gaps by making them visible
as blocked, pending, or future work.

## Certification

Recommendation: CONDITIONAL GO.

Reason:

- The founder operating experience is grounded in the existing lifecycle,
  department, money, and fiscal authorities.
- The experience is coherent enough to support daily use without inventing a new
  authority layer.
- The design correctly keeps campaign attribution, revenue truth, and payment
  authority in their current places.

Conditions:

- Do not turn this into a UI spec.
- Do not invent new business authorities.
- Do not treat estimates as revenue.
- Do not move payment authority away from Stripe webhook.
- Do not assume campaign attribution is solved until Campaign -> Lead exists.

This document is a blueprint for operating Stafford Media Consulting, not a
software implementation plan.
