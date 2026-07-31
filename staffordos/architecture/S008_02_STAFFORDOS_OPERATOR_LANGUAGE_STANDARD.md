# S008.02 StaffordOS Operator Language Standard

## Classification

LANGUAGE_STANDARD_READY

## Existing Language Authority Result

PARTIAL_STANDARD_EXISTS

The repository already contains authoritative language-related material, but no
single complete operator-language standard.

Existing authorities remain in force:

- `staffordos/authority/canonical_vocabulary_v1.md` governs business meanings,
  synonyms, deprecated terms, forbidden terms, and AI usage rules.
- `staffordos/operations/operator_design_system_v1.md` governs operator UI
  structure, status language, alerts, evidence cards, recommendation cards, and
  readability principles.
- `staffordos/operations/operator_visibility_architecture_v1.md` governs what
  Ross should be able to see and decide on each operator surface.
- `staffordos/ux_audit/scope/command_center_ux_scope_v1.md` governs the Command
  Center north star: answer "What should Ross do next?" first.
- `staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md`
  governs the route reconciliation strategy: `/os` becomes canonical over time,
  while `/operator` remains runtime-canonical until parity is proven.

This document fills the missing layer: operator-facing language, naming,
UX-copy, terminology, alerts, recommendations, and migration rules.

## Mission Boundary

This mission created documentation only. It did not modify application code,
routes, components, CSS, business logic, authentication, Stripe, ShopiFixer
production behavior, deployment configuration, Git commits, or remote state.

## Sources Inspected

| Source | What it governs | Authority assessment |
| --- | --- | --- |
| `staffordos/authority/canonical_vocabulary_v1.md` | Canonical business terms, deprecated terms, forbidden terms, implementation drift | Authoritative for meaning, partial for UI copy |
| `staffordos/operations/operator_design_system_v1.md` | Operator layout, UI behavior, status meanings, alerts, evidence cards, readability | Authoritative design system, partial language standard |
| `staffordos/operations/operator_visibility_architecture_v1.md` | Operator visibility model, dashboard purpose, route anchors, metric truth | Authoritative visibility architecture |
| `staffordos/ux_audit/scope/command_center_ux_scope_v1.md` | Command Center scope and "what should Ross do next?" model | Authoritative for Command Center UX |
| `staffordos/ux_audit/output/operator_command_center_ux_integrity_v1.json` | Current Command Center findings and recommendations | Audit evidence |
| `staffordos/authority/canonical_business_lifecycle_v1.md` | Business lifecycle and gates | Authoritative lifecycle |
| `staffordos/authority/canonical_department_architecture_v1.md` | Department ownership and human gates | Authoritative ownership model |
| `staffordos/operations/campaign_operating_architecture_v1.md` | Campaign information architecture and revenue labeling rules | Partial capability authority |
| `staffordos/authority/product_definitions_v1.md` | Product/service/platform classification and terminology conflicts | Authoritative identity model |
| `staffordos/SYSTEM_RULES.md` | Control-plane and product-engine boundary | Governance rule source |
| `staffordos/architecture/S008_00_STAFFORDOS_FOUNDATION_ARCHITECTURE.md` | New `/os` shell foundation | Recent framework scope |
| `staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md` | Existing UI and `/os` reconciliation | Current route strategy authority |
| `staffordos/ui/operator-frontend/components/operator/OperatorShell.tsx` | Existing `/operator` shell labels, quick actions, status bar | Implementation evidence |
| `staffordos/ui/operator-frontend/components/operator/OperatorNav.tsx` | Existing local operator navigation | Implementation evidence |
| `staffordos/ui/operator-frontend/app/operator/page.tsx` | Operator Home visible copy and status terms | Implementation evidence |
| `staffordos/ui/operator-frontend/app/operator/leads/page.tsx` | Lead Command copy and table labels | Implementation evidence |
| `staffordos/ui/operator-frontend/app/operator/revenue-command/page.tsx` | Revenue Queue copy, blocker, next-action language | Implementation evidence |
| `staffordos/ui/operator-frontend/app/operator/campaigns/page.tsx` | Campaign Command labels, revenue-at-stake drift | Implementation evidence |
| `staffordos/ui/operator-frontend/app/operator/system-map/page.tsx` | System Map, raw map, policy, blocker language | Implementation evidence |
| `staffordos/ui/operator-frontend/lib/staffordos/workspaces.ts` | S008.00 canonical `/os` section names and operating questions | Implementation evidence |
| `staffordos/ui/operator-frontend/components/staffordos/NextActionCard.tsx` | S008.00 decision-card field labels | Implementation evidence |

## Current Terminology Findings

| Current term | Current surface | Classification | Recommended operator-facing direction |
| --- | --- | --- | --- |
| Operator Home | `/operator`, shell nav | ACCEPTABLE_WITH_CONTEXT | Use `Home` in canonical `/os`; keep "Operator Home" as legacy route context until migration |
| Morning surface | `/operator` page title | ACCEPTABLE_WITH_CONTEXT | Prefer `Start My Day` when the surface is action-oriented |
| Executive | Shell nav and breadcrumbs | AMBIGUOUS | Prefer `Command` or `Company Command` depending on route purpose |
| Executive Command Center | Home CTA | TOO_ABSTRACT | Prefer `Open Command` or `Review Company Priorities` |
| Revenue Command | Nav and CTA | ACCEPTABLE_WITH_CONTEXT | Prefer `Money to Collect` for operator-facing action queues; preserve `Finance` for department |
| Lead Command | `/operator/leads` | ACCEPTABLE_WITH_CONTEXT | Prefer `People to Contact` when the page is a lead action queue |
| Campaign Command | `/operator/campaigns` | ACCEPTABLE_WITH_CONTEXT | Prefer `Marketing Activity` or `Campaigns` depending on detail level |
| Command Center | Multiple routes/docs | DUPLICATIVE | Use only when the surface truly ranks company-wide decisions |
| Workday Control | `/operator` | ACCEPTABLE_WITH_CONTEXT | Prefer `Start My Day` / `End My Day` for actions |
| Validation Status | Shell status bar | TOO_TECHNICAL | Prefer `Checks to Clear` or `Checks Passed` |
| Campaign Registry | Shell status bar | TOO_TECHNICAL | Prefer `Marketing Records` or `Campaign Records` |
| Campaign Attribution | Shell status bar | ACCEPTABLE_WITH_CONTEXT | Prefer `Where Leads Came From` or `Where Customers Came From` |
| System Health | Shell, Home, Cockpit | ACCEPTABLE_WITH_CONTEXT | Prefer `Is Everything Working?` for summary pages |
| Execution Log | Nav and page title | TOO_TECHNICAL | Prefer `Recent Activity`; keep technical label in evidence views |
| Proof Gate | Mission and authority docs | GOVERNANCE_LANGUAGE | Prefer `What Still Needs to Be Proven` in UI |
| Readiness Score | ShopiFixer/operator pages | TOO_ABSTRACT | Prefer `Ready to Move?` plus evidence |
| Relationship Registry | Architecture/entity language | INTERNAL_ONLY | Prefer `Customers and Contacts` in navigation |
| Governance | `/os` top-level | ACCEPTABLE_WITH_CONTEXT | Prefer `Rules and Approvals` where the user must act |
| Pipeline | `/os` top-level | PLAIN_AND_ACTIONABLE | Keep as top-level when it represents the full value flow |
| Knowledge | `/os` top-level | ACCEPTABLE_WITH_CONTEXT | Keep if the page answers evidence/memory questions |
| System | `/os` top-level | ACCEPTABLE_WITH_CONTEXT | Prefer `Settings and Connections` if the surface becomes configuration-heavy |
| Authority | docs, evidence, packet links | GOVERNANCE_LANGUAGE | Keep in governance/evidence; explain in operator UI |
| Packet | ShopiFixer evidence/lifecycle | INTERNAL_ONLY | Prefer `Work Package`; show `Packet ID` only in technical evidence |
| Execute / Execution | buttons, logs, proof surfaces | NEEDS_RENAMING | Prefer concrete verbs such as `Send follow-up`, `Review proof`, or `Start approved work` |
| Not Yet Implemented | placeholders | TOO_TECHNICAL | Prefer `Not available yet` plus the next expected source or dependency |
| Revenue at stake | Campaign Command | NEEDS_RENAMING | Use `Pipeline Value (estimate)` per canonical vocabulary |
| Blocker | queues and system map | ACCEPTABLE_WITH_CONTEXT | Prefer `What is stopping this?` as a heading |

## Purpose

StaffordOS must help the operator understand and act. It must not expose internal
implementation concepts as the primary user experience.

The interface should sound like a clear, capable chief of staff:

- It tells Ross what is happening.
- It explains why it matters.
- It names the best next action.
- It shows what evidence supports the recommendation.
- It identifies what could block progress.
- It shows what success will prove.

## Audience

Primary audience:

- Ross operating Stafford Media Consulting.

Future audiences:

- Employees.
- Contractors.
- Operators.
- Managers.
- Administrators.

Language must scale from solo operation to multi-user operation without assuming
every future operator knows repository terms, file paths, enum names, or project
history.

## Voice

StaffordOS should sound:

- Clear.
- Direct.
- Calm.
- Specific.
- Evidence-based.
- Respectful.
- Action-oriented.
- Honest about uncertainty.

StaffordOS should not sound:

- Robotic.
- Overly technical.
- Vague.
- Dramatic.
- Bureaucratic.
- Judgmental.
- Artificially confident.
- Like a developer console.

## Core Language Rule

Every important label, heading, alert, recommendation, and action should help the
operator answer at least one of these questions:

- What happened?
- Why does it matter?
- What should I do?
- What is blocking me?
- What happens next?
- What will prove completion?

If copy does not answer one of those questions, it should be shortened, moved to
technical details, or removed.

## Operating Loop Language

StaffordOS language must support this loop:

1. Observe: show what changed, what is waiting, and what is at risk.
2. Interpret: explain why the state matters to the business.
3. Decide: name the next decision and the tradeoff.
4. Act: provide one clear action with visible consequence.
5. Prove: show evidence, source, and completion criteria.
6. Learn: preserve reusable context for future decisions.

## Language Boundaries

| Boundary | Allowed language | Should avoid |
| --- | --- | --- |
| Operator-facing UI | Business outcomes, next actions, evidence, risks, approvals, deadlines | Raw enum names, file paths, stack traces, unexplained "authority" jargon |
| Internal architecture | Canonical terms, system boundaries, models, route strategy, authority names | Casual renames that obscure source-of-truth meaning |
| Developer/debug views | File paths, API routes, enum values, validator output, raw maps | Presenting debug labels as primary operator guidance |
| Governance views | Authority, audit, approval, proof, fingerprint, immutable state | Hiding required gates or weakening precise control language |
| Customer-facing copy | Merchant benefit, proof, scope, price, next customer step | Internal StaffordOS terminology, AI-agent internals, Packet language |

## Naming Hierarchy

### Top-Level Navigation

Use short capability names that describe where the operator is going:

- Home
- Command
- Work
- Pipeline
- Knowledge
- Governance
- System

These are canonical `/os` section labels. During migration, `/operator` route
labels may remain as route context, but new operator-facing copy should use the
canonical section meaning.

### Page Titles

Page titles should name the decision surface, not the implementation route.

Preferred:

- Start My Day
- Company Priorities
- Money to Collect
- People to Contact
- Marketing Activity
- Current Work
- Recent Activity
- Rules and Approvals
- Settings and Connections

### Section Headings

Section headings should ask or answer an operator question.

Preferred:

- What to do next
- Why this matters
- What is stopping this?
- Checks to clear
- Evidence
- Waiting on Ross
- Waiting on a customer
- Ready to move
- What changed recently

### Action Buttons

Buttons must use verbs and clearly state the result.

Preferred:

- Contact this lead
- Review the proposal
- Open payment details
- Start today's work
- See why this matters
- Mark as complete
- Ask for approval
- Review proof
- Open customer record

Avoid:

- Execute
- Process
- Submit action
- Run operation
- Open module
- Manage entity

Exceptions are allowed only in developer/debug views or where an operator is
explicitly controlling a governed execution process and the surrounding copy
explains the consequence.

### Status Labels

Status labels should translate technical state into an understandable condition
without hiding authority.

| Internal or technical state | Operator-facing label |
| --- | --- |
| `payment_pending` | Waiting for payment |
| `not_started` | Not started |
| `proof_status=missing` | Proof still needed |
| `ready` | Ready |
| `missing` | Not available yet |
| `invalid` | Needs review |
| `failed` | Failed |
| `blocked` | Blocked |
| `proposal_sent` | Proposal sent |
| `send_initial_outreach` | Ready to contact |
| `at_risk` | At risk |
| `dormant` | Dormant |
| `prepared` | Prepared |
| `authorized` | Approved to move to the next lifecycle state |

Exact technical values may appear under `Technical details`, in evidence tables,
or in governance/audit pages where precision matters.

### Warnings

Every warning must explain:

- What is wrong.
- What it affects.
- Whether work can continue.
- What the operator should do next.

Do not make raw file paths, enum names, stack details, missing JSON filenames,
or implementation errors the primary message.

Use `Technical details` for exact diagnostic evidence.

### Recommendations

AI recommendations must include:

- What to do.
- Why now.
- Evidence.
- Expected result.
- Risk or uncertainty.
- Required approval.
- What completion will prove.

Avoid unsupported certainty. Use words like "likely", "based on", or "not enough
evidence yet" when the evidence is incomplete.

## Operator-First Terminology Map

| Operator-facing label | Internal or current term | Where technical term may still appear | Rationale | Priority |
| --- | --- | --- | --- | --- |
| Home | Operator Home | Breadcrumbs during route migration | Matches `/os` canonical taxonomy | P1 |
| Start My Day | Morning surface, Workday Control | Architecture docs and implementation identifiers | Describes the operator action | P1 |
| Company Priorities | Executive, Executive Command Center | Legacy route labels until migration | Clearer than role-based "Executive" | P1 |
| Current Work | Command Center when fulfillment-oriented | Architecture docs if route remains mixed-purpose | Names work in motion instead of generic command | P1 |
| Money to Collect | Revenue Command, Revenue Queue | Finance architecture and route names | Makes the operator goal obvious | P1 |
| People to Contact | Lead Command | Internal route/file names | Better for an action queue than "Lead Command" | P1 |
| Marketing Activity | Campaign Command, Campaign Registry | Campaign authority docs and registry evidence | Describes activity without exposing registry mechanics | P1 |
| Where Customers Came From | Campaign Attribution | Evidence and analytics detail | Explains attribution in plain language | P2 |
| Checks to Clear | Validation Status | Validator/debug detail | Tells Ross whether work is blocked | P1 |
| Is Everything Working? | System Health | System/admin detail | Converts health into the operator question | P2 |
| Recent Activity | Execution Log | Developer/debug logs and audit evidence | Less technical for global navigation | P1 |
| What Still Needs to Be Proven | Proof Gate | Governance and authority docs | Preserves proof requirement in plain language | P1 |
| Customers and Contacts | Relationship Registry | Architecture/entity docs | Names the human/business object | P2 |
| Ready to Move? | Readiness Score | Evidence detail showing score formula | Turns abstract score into a decision | P2 |
| What is stopping this? | Blocker | Tables and diagnostics | Makes blocker actionable | P2 |
| What to do next | Next Action | Decision-card field names | Keep concept; prefer sentence case in headings | P0 |
| Rules and Approvals | Governance | Top-level `/os` nav may stay Governance | Clarifies the work inside governance | P2 |
| Settings and Connections | System | Top-level `/os` nav may stay System | Better for configuration-heavy areas | P2 |
| Work Package | Packet | Packet authority evidence, technical details | Keeps internal Packet precision without making it primary UI language | P1 |
| Start approved work | Execute | Explicit execution-control screens only | Avoids vague or risky action wording | P0 |
| Pipeline Value (estimate) | Revenue at stake | Technical evidence that identifies source field | Prevents estimates from sounding like captured revenue | P0 |
| Not available yet | Not Yet Implemented | Developer backlog and source comments | Sounds like a product state, not a code failure | P2 |

## Action Language Rules

1. Start with a verb.
2. Name the object.
3. Avoid vague system verbs.
4. Match the consequence.
5. Add approval language when the action is governed.

Examples:

- Use `Contact this lead`, not `Execute lead action`.
- Use `Open payment details`, not `Process payment`.
- Use `Review proof`, not `Open proof module`.
- Use `Ask for approval`, not `Submit approval operation`.

## Error And Warning Language

Preferred structure:

1. Human-readable summary.
2. Business impact.
3. Next step.
4. Technical details, collapsed or secondary.

Example:

- Primary: `Payment proof is missing. Delivery should not start until Stripe payment is verified.`
- Next step: `Open payment details and confirm the payment source.`
- Technical details: `payment_status=payment_pending; source=client registry`

## Accessibility And Readability Rules

- Use sentence case for headings, buttons, and status labels unless a proper noun
  requires title case.
- Keep sentences short.
- Use familiar words before system terms.
- Avoid unexplained acronyms.
- Avoid all-caps paragraphs.
- Keep warnings, blockers, and informational messages visually and textually
  distinct.
- Do not rely on color alone to communicate status.
- Keep labels consistent across surfaces.
- Use raw identifiers only as evidence, never as the primary explanation.

## Before And After Examples

| Current repository-backed wording | Preferred operator wording | Why |
| --- | --- | --- |
| `Validation Status` | `Checks to clear` | Describes whether work is blocked |
| `Campaign Registry` | `Marketing records` | Avoids exposing storage mechanics |
| `Campaign Attribution` | `Where customers came from` | Explains the business question |
| `System Health` | `Is everything working?` | Frames health as an operator decision |
| `Execution Log` | `Recent activity` | Better global navigation language |
| `Proof Gate` | `What still needs to be proven` | Keeps governance but makes the question clear |
| `Readiness score` | `Ready to move?` | Turns score into decision support |
| `Lead Command` | `People to contact` | Names the work Ross is doing |
| `Revenue at stake` | `Pipeline Value (estimate)` | Matches canonical money rules |
| `Not Yet Implemented` | `Not available yet` | Avoids developer-console tone |
| `Open Executive Command Center` | `Review company priorities` | Names the outcome of clicking |
| `Execute now` | `Start approved work` | Shows consequence and authority |

## Reconciliation With S008.01

The language standard supports the S008.01 route strategy:

- `/os` becomes the canonical shell over time.
- `/operator` remains runtime-canonical until parity is proven.
- Existing real operating truth must be reused.
- Duplicate shells, route labels, and decision cards must not proliferate.

During migration:

- Do not rename routes merely to improve wording.
- Do not rewrite implementation identifiers solely for display language.
- Add operator-facing labels in metadata first.
- Keep route aliases and technical evidence visible where needed.
- Move one surface at a time only after its data, side effects, and authority
  boundaries are understood.
- Preserve product workspace boundaries, especially ShopiFixer proof and
  completion flows.

## Migration Priorities

P0: confusing or unsafe

- Replace vague or high-risk action words such as `Execute now` where the
  consequence is not explicit.
- Replace estimate-as-revenue labels such as `Revenue at stake`.
- Ensure warnings explain impact and next step.

P1: major navigation and page-title conflicts

- Reconcile `Executive`, `Command`, and `Command Center`.
- Reconcile `Revenue Command` and `Pipeline`.
- Reconcile `Lead Command` and `People to Contact`.
- Reconcile `Execution Log` and `Recent Activity`.
- Add display labels to `/os` capability links without moving routes.

P2: section headings and status language

- Translate `Validation Status`, `Campaign Registry`, `Campaign Attribution`,
  and `System Health` in primary UI.
- Add `Technical details` affordances for raw file paths, enum values, and source
  artifacts.
- Turn readiness scores into decision questions.

P3: refinement and polish

- Normalize title case versus sentence case.
- Tighten subtitles.
- Reduce repeated "command" language.
- Make empty states explain what is needed next.

## Enforcement Checklist

Use this checklist for future StaffordOS UI work:

- Can Ross understand this without repository knowledge?
- Does the page identify the next decision?
- Are technical terms hidden, translated, or explained?
- Does every warning provide a next step?
- Are labels consistent across surfaces?
- Does the wording preserve authority and uncertainty?
- Is evidence available without dominating the interface?
- Are estimates clearly labeled as estimates?
- Does the action button describe the consequence?
- Is the copy scoped to StaffordOS rather than product-engine internals?

## Exact Next Narrow Implementation Slice

Recommended next mission:

S008_03_OS_CAPABILITY_LINK_MAP

Objective:

Add a read-only capability link map that lets `/os` point to existing
`/operator` surfaces using this language standard for display labels, without
moving routes or duplicating business logic.

Allowed implementation scope:

- Add `staffordos/ui/operator-frontend/lib/staffordos/capabilities.ts`.
- Add a small reusable `CapabilityLinkPanel` component.
- Render section-specific links on `/os` workspace pages.
- Use operator-facing labels from this standard.
- Keep link targets pointed at existing `/operator` routes.
- Do not import existing data loaders into `/os`.
- Do not move or duplicate API routes.
- Do not touch authentication, Stripe, ShopiFixer production behavior,
  deployment, or environment variables.

Rollback:

- Delete the capability map.
- Delete the link panel.
- Remove the panel from `/os` workspace pages.

## Artifacts Created

- `staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md`
- `staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.json`
