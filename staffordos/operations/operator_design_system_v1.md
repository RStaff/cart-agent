# OPERATOR DESIGN SYSTEM V1

## Executive Summary

This document is the canonical design system for StaffordOS operator interfaces
Version 1. It defines the shared visual language, layout logic, component
standards, interaction rules, and accessibility expectations that every future
operator screen must follow.

This is an architecture authority, not a UI implementation. It does not specify
code, exact hex values, component class names, or page-level feature behavior.
It defines how StaffordOS operator interfaces must feel, behave, and read.

Repository truth today:

- StaffordOS operator visibility is already architected around the Home Page,
  Executive Command Center, Marketing Command Center, Sales Command Center,
  Finance Command Center, Delivery Command Center, Customer Success Command
  Center, Engineering Command Center, and AI Operations Center.
- Current operator routes already expose a control-plane shell, command center
  pages, execution log, system map, and relationship drill-downs.
- Truth surfaces must respect canonical authorities: lifecycle, department,
  money, vocabulary, and campaign attribution.

Design goal:

- An operator should be able to scan the system, trust what is shown, and act
  without deciphering layout or labels.
- A screen should prefer evidence, status, and next action over decorative
  presentation.
- Every future StaffordOS interface should feel like one system, not a set of
  disconnected pages.

## 1. Design Philosophy

### Simplicity

- Prefer the fewest elements that answer the operator’s question.
- Remove ornamental structure that does not support a decision.
- Keep the highest-value state visible without scrolling whenever possible.

### Operational clarity

- Each screen exists to support a business decision or workflow.
- Labels should describe business meaning, not implementation internals.
- The operator should not need to infer state from visual flourish.

### Trust before aesthetics

- Accuracy, provenance, and governance come before polish.
- Visual balance is acceptable only when it does not obscure truth.
- Evidence-backed surfaces should always look more trustworthy than speculative
  surfaces.

### Evidence over decoration

- Show source-backed state, validation results, and traceable records.
- Avoid ornamental illustrations, unnecessary gradients, or decorative fillers.
- When a surface is uncertain, show uncertainty directly.

### Progressive disclosure

- Show the summary first.
- Reveal detail on drill-down.
- Keep advanced state and raw evidence available without cluttering the primary
  scan path.

## 2. Layout System

### Application shell

- Use a stable shell across all operator surfaces.
- The shell must support persistent navigation, page identity, and visible
  status context.
- The shell should reserve room for alerts, quick actions, and page-level
  controls.

### Sidebar

- Sidebar navigation is for primary domain movement.
- It should list the canonical operator destinations in a stable order.
- It should support a collapsed state on constrained viewports.

### Top navigation

- Top navigation is for global context, search, quick actions, and user/authority
  cues.
- It should not compete with the primary page content.
- It may hold global status, but not full operational detail.

### Page header

- Every screen needs a page header with:
  - screen name
  - canonical business meaning
  - current status summary
  - one-line decision context
- The header should establish whether the page is a summary, queue, report, or
  drill-down.

### Content regions

- Content regions should be full-width operating bands or structured panels.
- Avoid nested card stacks that create visual noise.
- Use a strong hierarchy from summary to detail to evidence.

### Card grid

- Use card grids for compact repeated entities such as campaigns, leads,
  metrics, alerts, and recommendation items.
- Cards should encode one business idea each.
- Cards should be stable in size and avoid content-driven layout shift.

### Detail panels

- Detail panels are for drill-down information, evidence, and timeline state.
- They should expose source, status, key facts, and next action in one place.
- Detail panels should be readable without scrolling through unrelated content.

### Responsive behavior

- Desktop favors multi-column operational density.
- Tablet compresses columns but preserves the same decision hierarchy.
- Mobile collapses to vertical scan order, keeping the highest-value action and
  current status first.

## 3. Navigation Model

### Primary navigation

- Primary navigation is for canonical command centers and core operating
  surfaces.
- It must be predictable and stable.
- It should not expose experimental or duplicate authority routes as primary
  destinations.

### Secondary navigation

- Secondary navigation is for drill-downs, supporting views, and related
  artifacts.
- It should not compete with primary navigation.
- It should always preserve context and origin path.

### Breadcrumbs

- Breadcrumbs should show where a record or screen sits in the operating model.
- Use breadcrumbs when the operator needs to understand hierarchy or traceability
  depth.

### Global search

- Global search should support direct lookup of merchants, leads, campaigns,
  relationships, payments, execution items, and evidence.
- Search results should expose canonical meaning, not implementation-only labels.

### Quick actions

- Quick actions are for high-frequency operator moves such as open, approve,
  review, drill down, or copy a governed reference.
- Quick actions must never hide their consequence.

### Command palette

- Command palette is for fast navigation and governed actions.
- It should prefer canonical actions over page names.
- It must be constrained by authority and role.

## 4. Component Library

### KPI cards

- Show one metric, one label, one trend, one context sentence.
- KPI cards are for top-level summary.
- If the number is estimated, label it explicitly.

### Metric tiles

- Use for compact counts or state indicators.
- Keep them shallow and scannable.
- Do not overload them with unrelated metadata.

### Tables

- Tables are for comparing records.
- Keep the first columns identity and state.
- Numeric columns should be right-aligned and easy to scan.
- Tables should support sorting, filtering, and drill-down.

### Timelines

- Timelines show chronological business events.
- Use them for execution, evidence, payment, and lifecycle transitions.

### Activity feeds

- Feeds are for recent governed events and operator-visible changes.
- They should distinguish human actions, AI actions, and system events.

### Validation panels

- Validation panels show checks, results, and failing conditions.
- They must expose source, status, and failure reason.
- Validation panels are trust surfaces, not decoration.

### Alerts

- Alerts are for urgent or blocking state.
- An alert must explain what is wrong, why it matters, and what to do next.

### Badges

- Badges are for concise state labels, category tags, and canonical statuses.
- They should be semantic, not purely decorative.

### Progress indicators

- Progress indicators show completion, queue movement, or validation coverage.
- They should represent actual progress, not optimism.

### Charts

- Charts are for trend and comparison.
- They must be labeled with the business meaning of the axis and the unit.
- Charts may not obscure the underlying data source.

### Health widgets

- Health widgets summarize operational state in a single glance.
- They should expose the governing dimension of health and its main driver.

### Recommendation cards

- Recommendation cards show a suggested next action and why it matters.
- They should be traceable to a source or rule whenever possible.

### Evidence cards

- Evidence cards show proof, artifacts, status, and traceability.
- They must prioritize source, timestamp, and business consequence.

### Drill-down panels

- Drill-down panels are for the selected record or workflow object.
- They should preserve the parent context while exposing detail.

### Filters

- Filters should map to operator questions: what is blocked, what is ready,
  what is at risk, what is waiting approval.

### Dialogs

- Dialogs are for explicit decisions or high-consequence confirmations.
- They must make the impact of the action clear before submission.

### Forms

- Forms are for governed input only.
- They should minimize optional inputs and clearly identify required fields.

## 5. Status Language

Canonical status meanings:

- Healthy: operating within expected bounds.
- Warning: needs attention soon; not yet blocking.
- Critical: blocking or high-risk.
- Unknown: not enough information to classify.
- Pending: awaiting a required event or approval.
- Running: in progress now.
- Complete: finished successfully.
- Blocked: cannot proceed until a dependency or approval clears.
- Failed: attempted and did not succeed.
- Verified: checked against governing authority or evidence.
- Unverified: not yet proven against governing authority or evidence.

Rules:

- Use status words consistently across all screens.
- Do not repurpose a status to mean a different business condition.
- Verified and Unverified are trust states, not lifecycle stages.

## 6. Color Semantics

Meaning only, no hex values:

- Healthy / Verified: positive trusted state.
- Warning / Pending: attention needed, but not yet broken.
- Critical / Failed / Blocked: urgent intervention required.
- Unknown / Unverified: no trust or no evidence yet.
- Neutral: informational state.
- Estimated: projected or forecast state.

Rules:

- Color must follow meaning, not decoration.
- Status colors should be stable across all operator screens.
- Estimated values must never use the same visual treatment as captured truth.

## 7. Typography

### Hierarchy

- Title text identifies the business object or screen.
- Section text identifies the decision area.
- Body text explains the current state or next action.

### Readability

- Prioritize short, direct labels.
- Avoid decorative or editorial typography.
- Maintain strong contrast and clear line spacing.

### Density

- Operator screens should support dense information without becoming crowded.
- Tables and dashboards should favor compact readability over large display type.

### Tables

- Use tabular numerals for numerical columns.
- Keep units visible.
- Align numeric content for fast comparison.

### Numbers

- Numeric data should be easy to scan and compare.
- Estimated numbers should be labeled as estimates.
- Currency and percentage values should never be visually ambiguous.

### Evidence

- Evidence text should read like provenance, not marketing copy.
- Timestamps, statuses, and source markers should be legible and subordinate to
  the core evidence content.

## 8. Icon System

- Icons should support recognition, not replace meaning.
- Use canonical icons for:
  - navigation
  - alerts
  - validation
  - evidence
  - time/history
  - approval
  - money
  - health
- A label should still be present when the icon alone would be ambiguous.
- Do not invent decorative iconography for core business states.

## 9. Interaction Principles

- Fast path first: the common operator action should take the fewest steps.
- Show the consequence of the action before it is taken.
- Preserve context on drill-down.
- Avoid modal chains unless a decision is high consequence.
- Favor direct navigation over hidden interactions.
- Prevent accidental destructive action through clear confirmation.
- Keep governed actions visibly distinguished from read-only inspection.

## 10. Dashboard Composition Rules

- Dashboards must answer three questions immediately:
  1. What is the current state?
  2. What needs attention?
  3. What should happen next?
- Use a top-down structure:
  - summary
  - alerts
  - queues
  - trends
  - detail
  - evidence
- Do not build dashboards as undifferentiated walls of widgets.
- Do not duplicate the same metric in multiple semantic forms on the same screen.
- Keep captured truth separate from estimates.
- Keep business health separate from technical health.
- Keep operator recommendations separate from raw metrics.

## 11. Operator Home Layout

The Operator Home is the morning decision surface.

Order of information:

1. Today’s priorities
2. System health
3. Business health
4. Financial health
5. Campaign health
6. Lead health
7. Engineering health
8. Validation health
9. Recommendations
10. Notifications
11. AI suggestions

Rules:

- The top of the page must answer “what should I do next?”
- Health summaries should be compact and truthful.
- Recommendations must be traceable to a source or rule where possible.
- Alerts must remain visible without blocking the entire page.

## 12. Executive Dashboard Layout

The Executive Dashboard emphasizes company health and risk.

Order of information:

1. Company health
2. Daily priorities
3. Revenue
4. Pipeline
5. Cash
6. Risk
7. Operator recommendations

Rules:

- Present captured revenue separately from merchant value and estimates.
- Make approvals and blockers highly visible.
- Show quarter context by default.

## 13. Department Dashboard Template

Every department dashboard should share a common template:

1. Department health summary
2. Primary KPIs
3. Active queues
4. Alerts
5. Recent events
6. Supporting tables
7. Drill-down evidence

Department-specific emphasis:

- Marketing: campaigns, attribution, coverage, lead sources.
- Sales: leads, relationships, proposals, routing, close state.
- Delivery: execution, proof, completion, bottlenecks.
- Customer Success: onboarding, renewal, referrals, expansion.
- Finance: revenue truth, payment truth, reconciliation.
- Engineering: validators, deployments, architecture health.
- AI Operations: agent health, failures, recommendations.

## 14. Mobile and Tablet Behavior

- Mobile should preserve the same hierarchy as desktop, just vertically.
- The most important status and action must remain first.
- Tables should collapse intelligently or expose a readable detail alternative.
- Tablet should retain multi-column structure where possible.
- Navigation should remain usable without precision gestures.

## 15. Accessibility Principles

- All information must be perceivable without relying on color alone.
- Text contrast must support operational reading.
- Keyboard navigation should reach all core actions.
- Focus states must be obvious.
- Statuses and alerts should have textual equivalents.
- Data tables should be accessible to assistive technology.
- Motion should not interfere with reading or trust.

## 16. Performance Principles

- The operator shell should load quickly enough to support daily use.
- Summary surfaces should render before deep detail.
- Avoid heavy visual treatment that increases cognitive or runtime load without
  improving decision quality.
- Prefer progressive loading for less critical detail.
- Keep repeated data projections consistent and cacheable where possible.

## 17. Future Extensibility

- The design system should support future command centers without redesign.
- It should support more departments, more alert types, and more evidence
  surfaces.
- It should support future financial truth, UTM, spend, budget, and attribution
  enhancements without changing the semantic language of the system.
- It should support read-only and governed-write modes with the same core
  patterns.

## 18. Known Gaps

- Full first-class implementation of Delivery, Customer Success, Engineering,
  and AI Operations command centers does not yet exist as canonical routes.
- The current operator UI still contains transitional surfaces that are not yet
  canonical dashboards.
- Some data stores required for deeper dashboards are future work:
  budget, spend, richer attribution history, and a complete alert engine.
- This design system does not prescribe exact tokens or component code.
- Some current surfaces still need terminology cleanup to fully match canonical
  vocabulary.

## 19. Implementation Order

1. Application shell
2. Navigation system
3. Typography and spacing rules
4. Status language and badge system
5. KPI cards and metric tiles
6. Tables and drill-down panels
7. Health widgets and alert panels
8. Evidence cards and validation panels
9. Dashboard templates
10. Department-specific command center variants

## Certification

### Is the design system sufficiently complete to build every future StaffordOS screen?

Conditional GO.

The design system is complete enough to build a consistent StaffordOS operator
experience, but some future screens will still need future data sources and
canonical routes. The design language and composition rules are ready; not every
future capability is implemented.

### Which components should be implemented first?

Application shell, navigation system, typography/spacing rules, status badges,
KPI cards, tables, alert panels, and drill-down panels.

### Which screens should become reusable templates?

Operator Home, Executive Dashboard, Department Dashboard, and Record Detail /
Drill-down panels.

### GO / CONDITIONAL GO / NO GO

Conditional GO.

The system is sufficiently defined to build future operator interfaces in a
consistent way, starting with shared shell/navigation/typography/status patterns
before domain-specific dashboards.
