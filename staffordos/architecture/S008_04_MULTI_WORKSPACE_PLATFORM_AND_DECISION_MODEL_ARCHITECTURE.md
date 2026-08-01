# S008.04 Multi-Workspace Platform and Decision Model Architecture

## Classification

MULTI_WORKSPACE_ARCHITECTURE_READY_FOR_LOCAL_COMMIT

## Mission Boundary

This mission is architecture documentation only. It does not modify application
code, routes, components, CSS, authentication, Stripe, ShopiFixer runtime
behavior, Abando runtime behavior, database schemas, migrations, deployments, or
production configuration.

Authorized artifacts:

- `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md`
- `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.json`

## Checkpoint Authority

Approved local checkpoints:

- `7d661d1cea4e447e855dfec59e80d6b8feb44bad` -
  `S008 StaffordOS foundation, reconciliation, and operator language standard`
- `4503ebb5a15484384d5dbb463dcdce551c3e9293` -
  `S008 add operator capability map`

Checkpoint verification:

- Current branch: `main`
- Current HEAD: `4503ebb5a15484384d5dbb463dcdce551c3e9293`
- `7d661d1cea4e447e855dfec59e80d6b8feb44bad` remains in HEAD history.
- S008.00 through S008.03 artifacts exist.
- `/operator` remains runtime-canonical.
- `/os` remains isolated and framework/read-only.
- `/os/capabilities` links to existing `/operator` truth without duplicating
  business logic.

Worktree safety:

- The broader worktree contains preexisting unrelated S007, ShopiFixer,
  StaffordOS runtime, identity, issuer, web, Prisma, daemon, generated, and
  mission-evidence changes.
- Those changes are excluded from this mission and must not be staged with the
  S008.04 checkpoint.

## Existing Platform Evidence

Repository-backed evidence:

| Evidence | Source | Architectural implication |
| --- | --- | --- |
| StaffordOS is the internal control plane, not customer SaaS. | `staffordos/authority/product_definitions_v1.md`, `staffordos/SYSTEM_RULES.md` | The platform owns coordination, governance, memory, audit, and decisions. |
| ShopiFixer is an AI-governed engineering service. | `staffordos/authority/product_definitions_v1.md`, `staffordos/authority/canonical_business_lifecycle_v1.md` | ShopiFixer should appear as a business product/service lens with its own operational boundary. |
| Abando is a separate SaaS product and product engine. | `staffordos/authority/product_definitions_v1.md`, `staffordos/SYSTEM_RULES.md` | Abando must remain API-bound and not be merged into StaffordOS UI or state mutation. |
| Business lifecycle spans marketing through referral and Abando expansion. | `staffordos/authority/canonical_business_lifecycle_v1.md` | StaffordOS workspaces need lifecycle-aware actions, evidence, proof, and gates. |
| Current operator UI contains real business surfaces under `/operator`. | `staffordos/architecture/S008_01_EXISTING_OPERATOR_UI_AND_NEW_OS_SHELL_RECONCILIATION.md` | `/operator` stays runtime-canonical until `/os` reaches parity. |
| `/os` provides canonical sections and read-only capability links. | `staffordos/architecture/S008_00_STAFFORDOS_FOUNDATION_ARCHITECTURE.md`, `staffordos/architecture/S008_03_OS_CAPABILITY_LINK_MAP.md` | The S008 shell is a suitable platform shell, but it needs workspace context before deeper migration. |
| Operator-facing language standard exists. | `staffordos/architecture/S008_02_STAFFORDOS_OPERATOR_LANGUAGE_STANDARD.md` | New multi-workspace language must remain clear, action-oriented, and evidence-based. |
| Memory has explicit business/private boundary rules. | `staffordos/memory/memory_units_v1.json` | Platform memory must be domain-scoped and source-aware; family/private memory must not mix with business execution by default. |
| Durable operator identity, session, role, and permission concepts exist locally. | `web/prisma/schema.prisma`, `staffordos/shopifixer/S007_01A_TRUSTED_OPERATOR_IDENTITY_AUTHORITY.md` | Future workspace membership can reuse the deny-by-default authority pattern, but this mission does not change auth. |
| Execution authorization proves authority separation. | `staffordos/shopifixer/S007_02R_EXECUTION_AUTHORIZATION_ENGINE.md` | Packet authorization, execution requests, tokens, and Shopify mutation remain distinct concepts. |
| Personal OS exists only as a scoped future concept. | `staffordos/scope/scope_forge_v1.json` | Personal and family architecture should be designed now but treated as not implemented. |

Evidence gaps:

- No implemented Professional workspace was found.
- No implemented Family workspace was found.
- No media library, media watching, media creation, uploads, or sharing runtime
  was found for StaffordOS.
- No general workspace membership schema was found.
- No global workspace context middleware was found.
- No cross-workspace search, notification, memory, or agent policy engine was
  found.

## Platform and Workspace Boundary

StaffordOS should be modeled in two levels.

### Level 1 - StaffordOS Platform

The platform owns shared primitives:

- identity
- profile
- sessions
- workspace membership
- roles
- permissions
- capability access
- navigation
- missions
- objectives
- actions
- decisions
- evidence
- proof
- memory
- governance
- audit
- notifications
- agent policy

These primitives describe who is using StaffordOS, where they are operating,
what they are allowed to see or do, what evidence supports a recommendation, and
what proof closes the loop.

### Level 2 - Workspace Families

Workspace families own domain-specific objects, workflows, views, language,
policies, and data.

| Workspace family | Purpose | Initial workspace types |
| --- | --- | --- |
| Business | Operate Stafford Media Consulting and its products/services. | Stafford Media, ShopiFixer, Abando, Executive, Marketing, Leads, Sales, Relationships, Revenue, Delivery, Customer Success, Finance, Engineering, AI Operations |
| Professional | Help the owner operate career decisions privately before and after employment. | Job Search mode, My Job mode |
| Personal | Help the owner manage private life, learning, family, creative work, and optional sharing. | Private planning, learning, life administration, creative projects, family activities, media watching, media creation, shared memories, invited access |

### Product and Workspace Recommendation

Stafford Media should be the parent Business workspace because it is the company
that owns the operating outcomes.

ShopiFixer should be a first-class Business product/service workspace lens. It
has its own merchant evidence, audit lifecycle, proof, payment gates, execution
authority, and customer-success actions. It should not be treated as an
undifferentiated department.

Abando should be a first-class Business product workspace lens with a separate
product-engine boundary. StaffordOS may read Abando summaries through explicit
API contracts, but must not import Abando product logic or mutate Abando state
from shared platform pages.

Family and Media should begin as capability areas inside Personal, not separate
top-level workspace families. Their privacy, membership, and item-level sharing
rules are likely more important than their navigation label. They can graduate
to separate workspaces later only if their membership, lifecycle, audit, storage,
or policy boundaries diverge enough to justify it.

## Owner-First Membership Model

Default model:

```
one owner
+ optional invited members
+ access granted per workspace and capability
```

Rules:

- Business data is private to the owner unless explicitly shared.
- Professional data is private to the owner.
- Personal data is owner-private unless explicitly shared.
- Family access does not imply access to Business or Professional information.
- Business employees and contractors receive only selected Business workspaces or
  capabilities.
- Workspace membership and capability permission are separate.
- A shared identity system does not imply shared data access.
- AI agents inherit the active user, workspace, role, permission, policy, memory,
  search, and notification boundaries.
- Cross-workspace actions require explicit owner authorization.

## Role and Capability Access Model

Conceptual roles:

| Role | Visible workspaces | Typical readable information | Actions allowed | Approval and prohibited access |
| --- | --- | --- | --- | --- |
| Platform Owner | All workspaces they own | All owner-owned evidence, settings, audit, and governance records | Prepare and approve owner-level actions; manage membership and capabilities | No bypass of payment, execution, legal, or external-provider authority |
| Business Operator | Selected Business workspaces | Business queues, customers, evidence, and decisions granted by permission | Prepare and execute permitted business actions | May require owner approval for irreversible, financial, customer-facing, or production actions |
| Business Employee | Assigned Business capabilities | Assigned leads, customers, tasks, evidence, and notes | Prepare and complete assigned work | No owner settings, Personal, Professional, unrelated customer, or security access |
| Business Contractor | Time-bounded assigned Business project | Specific project or task evidence | Prepare work and submit proof | No broad customer list, finance, platform settings, or retained access after expiration |
| Professional Owner | Their Professional workspace | Job search, work commitments, accomplishments, private notes | Prepare, decide, and approve personal professional actions | External submission and employer data reuse require explicit owner action |
| Family Administrator | Selected Family-shared Personal capabilities | Approved family activities, shared media, shared plans | Manage selected family capabilities | No Business, Professional, owner-private Personal, security, or billing access unless separately granted |
| Family Member | Shared family capabilities | Shared activities, shared media, approved memories | View and contribute where allowed | Cannot change security, broad sharing, deletion policy, or owner-private records |
| Child or Restricted Member | Age-appropriate shared or training capabilities | Approved media, approved creation spaces, training records | Create or watch approved items; participate in training | No unrestricted sharing, purchases, external publishing, security changes, or private browsing |
| Friend or Guest | Explicitly shared item or project | Only the shared item, project, or invitation context | View or comment where allowed | No library browsing, resharing, deletion, or cross-workspace visibility |
| Learner | Training workspace only | Training fixtures, synthetic examples, permitted lessons | Practice selected creation or operating workflows | No production, customer, financial, infrastructure, or private data access |
| Media Creator | Approved media projects | Assets and drafts they are granted | Create, edit, or prepare media within policy | External publishing, asset reuse, and deletion require assigned authority |
| Viewer | Explicitly granted read-only areas | Evidence and summaries in scope | Read only | No mutation, sharing, export, or approval authority |

Implementation guidance for future missions:

- Roles are labels of responsibility.
- Permissions decide access.
- Capability access decides which product or workflow is reachable.
- Membership decides which workspace boundary applies.
- Audit decides what must be attributable.

## Workspace Context Model

Every future StaffordOS request should carry a server-derived workspace context.
This is a conceptual contract, not a schema change in this mission.

Minimum context:

- `workspace_id`
- `workspace_family`
- `workspace_type`
- `current_user_id`
- `membership_id`
- `active_role`
- `permission_set`
- `capability_set`
- `policy_set`
- `data_boundary`
- `memory_boundary`
- `search_boundary`
- `notification_boundary`
- `enabled_agents`
- `language_profile`
- `audit_context`

Boundary protections:

| Risk | Context rule |
| --- | --- |
| Business data appears in Family | Query and search must include Business workspace membership and capability permission. |
| Professional notes appear in Stafford Media | Professional memory and evidence stay in the Professional data and memory boundaries unless explicitly selected by the owner. |
| Family media appears in Business evidence | Evidence links must include workspace family and visibility class; cross-workspace reuse requires owner approval. |
| Guest reaches operator routes | Routes require workspace membership plus capability permission, not just identity. |
| Employee reaches Personal or Professional | Business roles do not grant Personal or Professional memberships. |
| AI memory crosses boundaries | Agent memory retrieval must be scoped by active workspace and policy. |
| Global search leaks private content | Search is global in interface only; execution is workspace-aware and permission-filtered. |
| Notifications appear in the wrong workspace | Notifications carry workspace and visibility metadata. |
| Media creation uses unauthorized assets | Assets carry ownership, license, age, and sharing policy. |
| Agents act outside active workspace | Agent execution requires the active context and cannot select another workspace without owner approval. |
| Children reach unrestricted creation or sharing tools | Restricted roles receive policy-limited capability sets and no sharing/security permissions. |

## Canonical Decision Model

StaffordOS should answer:

```
What should this person do next in this workspace?
```

Shared entities:

| Entity | Definition |
| --- | --- |
| Mission | The outcome being pursued. |
| Objective | A measurable or observable result that advances the mission. |
| Action | What the person or approved agent can do next. |
| Evidence | What supports the recommendation. |
| Risk | What could go wrong or what may be lost. |
| Proof | What demonstrates successful completion. |
| Decision | What was chosen, why, by whom, and under what authority. |
| Learning | What StaffordOS should retain for future decisions. |

Every recommendation should be expressible with:

- workspace
- mission
- objective
- operator-facing action
- why now
- evidence
- expected result
- urgency
- confidence
- effort
- risk
- required authority
- deadline or decay
- alternatives
- proof requirement
- owner
- status
- privacy classification

This mission defines the contract only. It does not implement scoring,
recommendation ranking, or AI generation.

## Workspace-Aware Priority Model

StaffordOS should use a governed priority model, not one universal AI score.

Shared priority factors:

- objective alignment
- urgency
- confidence
- risk
- effort
- blocker-removal value
- relationship impact
- learning value
- time sensitivity
- context-switching cost
- owner availability
- workspace policy

Business-specific factors:

- captured revenue impact
- pipeline movement
- customer impact
- delivery deadlines
- risk reduction
- proof creation
- product learning

Professional-specific factors:

- role fit
- interview stage
- work deadlines
- stakeholder impact
- commitment risk
- accomplishment value
- skill growth
- promotion readiness

Personal-specific factors:

- safety
- privacy
- time
- energy
- health
- learning
- creative progress
- family value
- age appropriateness
- shared availability

Revenue must not become the universal priority measure. The UI should always
show the reasoning behind the recommendation, not only a score.

## Next Action Card Model

The S008.00 `NextActionCard` already defines the right foundation:

- Action
- Why Now
- Evidence
- Expected Value
- Risk
- Confidence
- Governance
- Deadline
- Proof

The shared card anatomy should evolve toward this operator-facing shape:

- What to do
- Why now
- Evidence
- Expected result
- Time or effort
- Risk
- Confidence
- Approval needed
- Completion proof

Placement rules:

| Placement | Belongs there |
| --- | --- |
| Primary card | Action, why now, expected result, deadline or effort, confidence, approval needed. |
| See why | Evidence, alternatives, assumptions, uncertainty, previous related decisions. |
| Rules and approvals | Required authority, policy, role or permission, approval status, audit requirement. |
| Technical details | IDs, routes, enum values, fingerprints, source files, system diagnostics. |

Generic examples:

| Workspace | What to do | Why now | Proof |
| --- | --- | --- | --- |
| Stafford Media | Review the highest-value business priority. | It best advances the current business objective with available evidence. | A recorded decision and updated next step. |
| ShopiFixer | Review the next scoped customer-work package. | It is the nearest governed delivery item with proof requirements. | Scope, before evidence, after evidence, and proof package are linked. |
| Abando | Review recovery opportunity health. | Product signals may show where merchant recovery value is moving or blocked. | Read-only product summary is recorded with source and timestamp. |
| Job Search | Prepare the next application step. | The opportunity is time-sensitive and fits the selected professional objective. | Application record updated with materials and owner-approved next step. |
| My Job | Confirm the next work commitment. | A deadline or stakeholder expectation needs attention. | Commitment status and evidence of completion are recorded privately. |
| Private Personal | Choose the next personal priority. | The item fits current time, energy, and privacy constraints. | Private note or completed action evidence is saved. |
| Family | Plan the next shared activity. | Shared availability and family value make it timely. | Shared plan is visible only to approved members. |
| Media Creation | Continue an approved creative project. | The project has clear assets, rights, and next work. | Draft, source assets, and provenance are recorded. |
| Learner or Training | Practice the next safe exercise. | It advances learning without production access. | Training completion evidence is saved in the training boundary. |

## Professional Workspace Boundary

Professional should be one owner-private workspace that can shift modes without
losing history.

### Mode A - Job Search

Lifecycle:

```
Discover -> Evaluate -> Apply -> Connect -> Prepare -> Interview -> Follow Up -> Negotiate -> Accept or Decline -> Learn
```

Conceptual capabilities:

- opportunity discovery
- job-fit evaluation
- application tracking
- authoritative resume selection
- tailored materials
- recruiter and alumni relationships
- referrals
- interview preparation
- follow-up reminders
- offer comparison
- skill-gap analysis
- outcome and lesson capture

### Mode B - My Job

Lifecycle:

```
Onboard -> Understand -> Prioritize -> Deliver -> Collaborate -> Prove -> Learn -> Grow
```

Conceptual capabilities:

- onboarding plan
- role expectations
- meetings and commitments
- stakeholders
- projects and deliverables
- priorities and deadlines
- decisions and follow-ups
- professional relationships
- accomplishment evidence
- feedback
- performance-review preparation
- skill development
- promotion readiness
- career decision support

Mode transition:

- The workspace remains the same.
- The active mode changes from Job Search to My Job or back.
- Historical opportunities, decisions, materials, accomplishments, and lessons
  remain private and searchable inside the Professional boundary.
- Mode-specific views change, but the evidence and learning history remains
  continuous.

Strict boundaries:

- Professional information is owner-private by default.
- Applications, compensation, interview notes, employer feedback, and performance
  information do not enter Stafford Media automatically.
- Family, guests, employees, and contractors receive no Professional access by
  default.
- AI may organize and prepare but may not invent experience, credentials,
  accomplishments, feedback, or commitments.
- Employer-confidential information must not be reused externally without
  explicit authority.
- Employer policy and work-product ownership must constrain storage, AI use, and
  sharing.
- External communication and application submission require explicit owner
  approval.
- Business evidence may be reused only by explicit owner selection.

## Business, ShopiFixer, and Abando Model

Business workspace family:

- Stafford Media owns company-wide objectives, pipeline, money, operations, and
  customer relationships.
- ShopiFixer contributes service-specific merchant context, audit evidence,
  packet state, payment state, execution state, proof, and customer-success
  actions.
- Abando contributes product-specific merchant context, recovery opportunities,
  campaign actions, recovered-value evidence, product-health signals, and
  customer-success actions where repository authority proves them.

Integration classification:

| Proposed integration | Classification | Reason |
| --- | --- | --- |
| Stafford Media business lifecycle | Repository-backed | Canonical lifecycle, fiscal model, department architecture, and operator UI exist. |
| ShopiFixer merchant context | Repository-backed | Durable audit, merchant, PacketLink, and packet authority evidence exists locally and in architecture docs. |
| ShopiFixer audit evidence | Repository-backed | S006/S007 artifacts and ShopiFixer durable models define audit, scope, approval, manifest, and proof concepts. |
| ShopiFixer payment state | Repository-backed but gated | Payment authority exists; payment changes remain Stripe/webhook-bound and outside this mission. |
| ShopiFixer execution state | Repository-backed but governed | Packet lifecycle authority and execution grant authority exist locally; Shopify mutation remains separate and fail-closed. |
| ShopiFixer proof | Repository-backed | Proof references, proof runs, and lifecycle proof gates are documented. |
| ShopiFixer customer-success actions | Planned/requires discovery | Lifecycle has customer-success stages; complete UI/data coverage remains partial. |
| Abando merchant context | Repository-backed at product-definition level | Abando product identity and API-bound control-plane rules exist. |
| Abando recovery opportunities | Repository-backed/partial | Abando runtime and scope evidence exist, but current StaffordOS operator integration should remain read-only and API-bound. |
| Abando campaign actions | Requires discovery | Do not assume write authority or current StaffordOS control. |
| Abando recovered-value evidence | Planned/requires discovery | Canonical money model distinguishes merchant value; integration details require later evidence. |
| Abando product-health signals | Planned/requires discovery | Product summary surfaces exist, but deeper health contracts need a separate mission. |
| Abando customer-success actions | Conceptual | Future Business integration; not proven as an implemented workflow. |

Recommended product structure:

- Product lenses inside Business for cross-company planning and next actions.
- Dedicated product workspace views when the product has its own lifecycle,
  customers, evidence, or operational boundary.
- Shared customer context only through explicit authority.
- Separate operational boundaries for ShopiFixer service execution and Abando
  SaaS product execution.

## Personal, Family, Media, and Invited Access

Personal is owner-private by default with optional capability-level sharing.

Future Personal areas:

- private planning
- learning
- life administration
- creative projects
- family activities
- media watching
- media creation
- approved sharing
- shared memories

Visibility classes:

| Visibility class | Meaning |
| --- | --- |
| OWNER_PRIVATE | Visible only to the owner unless explicitly shared. |
| FAMILY_SHARED | Visible only to invited family members with approved capability access. |
| FRIEND_SHARED | Visible only to specifically invited guests for selected items or projects. |
| TRAINING | A governed environment where children or invited learners may practice selected creation or business capabilities without production, customer, financial, infrastructure, or private data access. |

Future-safe boundaries:

- profile selection
- media ownership
- private libraries
- shared libraries
- creation rights
- AI-generated media
- age-appropriate restrictions
- external sharing
- comments and collaboration
- deletion rights
- provenance
- moderation
- invitation expiration
- access revocation
- audit history

Examples:

- A child may create and watch approved media but cannot change sharing rules.
- A friend may view one shared project but cannot browse the family library.
- A learner may use a safe training environment but cannot reach Stafford Media
  production.
- An employee may access selected Business capabilities but no Personal or
  Professional information.
- A contractor may access one Business project for a limited period.
- The owner retains approval, revocation, deletion, and audit authority.

## Information Architecture Impact

The current top-level `/os` structure remains valid:

- Home
- Command
- Work
- Pipeline
- Knowledge
- Governance
- System

Workspace-aware impact:

| Area | Future adjustment |
| --- | --- |
| Workspace switcher | Add explicit owner/workspace selection before broad capability migration. |
| Home | Becomes workspace-specific: "What should I do next here?" |
| Command | Needs global and workspace modes. Global Command compares workspaces only for the owner. |
| Work | Can be unified for the owner, but member views must show only assigned work. |
| Pipeline | Applies strongly to Business and Job Search; may be hidden or relabeled for Personal. |
| Knowledge | Must be isolated by workspace and visibility class. |
| Governance | Owner sees platform governance; members see only relevant rules and approvals. |
| System | Splits into owner settings, workspace settings, connections, and health. |
| Notifications | Must carry workspace and visibility metadata. |
| Global search | Must be permission-filtered and boundary-aware. |
| Profile selection | Required before Family, child, guest, or learner access. |
| Invited-member experience | Should be simpler and narrower than owner mode. |

Labels may need workspace-aware wording later. The route names should not change
now.

## Rebuild-Risk Assessment

Question:

Will StaffordOS require a rebuild when Abando, Professional, Family, and Media
capabilities are introduced?

Answer:

No full rebuild is required if the next slices add workspace context and
capability-scoped boundaries before real multi-workspace data, search,
notifications, and AI actions are introduced. Without those adjustments,
StaffordOS would drift toward a business-only shell and later require a larger
refactor.

Current S008 elements:

| Element | Classification | Reason |
| --- | --- | --- |
| `/os` shell | EXTENSIBLE_WITH_SMALL_CHANGE | Shell is isolated and responsive; needs workspace switcher and context display. |
| Section registry | EXTENSIBLE_WITH_SMALL_CHANGE | Current sections are good; registry needs workspace applicability and visibility metadata. |
| Capability registry | EXTENSIBLE_WITH_SMALL_CHANGE | Static capability map works; needs workspace family, workspace type, and access metadata. |
| NextActionCard | EXTENSIBLE_WITH_SMALL_CHANGE | Anatomy is directionally right; should add effort, approval, and explicit completion proof language. |
| WorkspacePage | EXTENSIBLE_WITH_SMALL_CHANGE | Generic page wrapper works; needs workspace-aware heading and boundary hints. |
| Language standard | EXTENSIBLE_AS_IS | S008.02 already supports operator-first language and technical-detail boundaries. |
| Route strategy | EXTENSIBLE_AS_IS | Incremental `/operator` to `/os` migration avoids duplicate runtime behavior. |
| Identity assumptions | REQUIRES_FUTURE_REFACTOR | Durable operator identity exists for ShopiFixer locally, but general workspace membership is not implemented. |
| Navigation | EXTENSIBLE_WITH_SMALL_CHANGE | Needs current workspace and role-aware visibility. |
| Decision model | REQUIRES_FUTURE_REFACTOR | Conceptual model must become a read model before AI Chief of Staff work. |
| Current owner-only assumptions | EXTENSIBLE_WITH_SMALL_CHANGE | Owner-first is acceptable if sharing remains explicit and permission-scoped. |
| Future invited-member support | REQUIRES_FUTURE_REFACTOR | Requires membership, capability access, data boundaries, audit, and simplified invited views. |

## Required Architectural Adjustments

Smallest adjustments needed before major capability expansion:

1. Add workspace metadata to the existing capability architecture before adding
   more `/os` pages.
2. Introduce a read-only workspace switcher foundation before exposing Personal,
   Professional, Family, or invited-member surfaces.
3. Define a canonical workspace context contract before global search,
   notifications, memory retrieval, or AI actions become cross-workspace.
4. Extend the Next Action Card contract to include time/effort, approval needed,
   and completion proof as first-class fields.
5. Create a decision read model before introducing AI-generated priority ranking.
6. Preserve `/operator` runtime authority until each migrated capability reaches
   parity and side-effect boundaries are proven.
7. Treat Abando integration as API-bound and read-only until a separate governed
   product-integration mission proves write authority.
8. Treat Personal, Family, Media, Professional, and Learner features as planned
   architecture only until separate missions implement identity, membership,
   storage, moderation, and sharing controls.

## Incremental Roadmap

Recommended sequence:

| Mission | Purpose | Boundary |
| --- | --- | --- |
| S008.04 | Multi-workspace and decision architecture. | Documentation only. |
| S008.05 | Workspace context and owner-first switcher foundation. | Read-only shell metadata; no auth or data migration. |
| S008.06 | Operator Home and priority presentation. | Present next action from existing evidence; no new AI generation. |
| S008.07 | Unified action registry and read model. | Read model over existing actions; no write-route duplication. |
| S008.08 | Mission, objective, evidence, decision, and proof model. | Shared conceptual/read model before automation. |
| S008.09 | Stafford Media capability integration. | Business workspace integration with `/operator` parity protection. |
| S009 | AI Chief of Staff. | Recommendations use evidence, policy, and operator approval. |

Later:

- Abando integration
- Professional workspace
- Job Search mode
- My Job mode
- invited Business access
- Personal/Family profiles
- media library
- media creation
- governed learner mode

Roadmap constraints:

- Preserve `/operator` runtime authority until parity.
- Migrate incrementally with rollback.
- Keep owner-private defaults.
- Separate membership from capability permission.
- Avoid premature shared-data architecture.
- Prevent Business, Professional, and Personal boundary collapse.

## Validation

Completed validation:

- JSON artifact validation with `jq`: passed.
- Documentation diff validation with `git diff --check`: passed.
- Staged diff review before commit: passed; only the two S008.04 artifacts were
  staged.

Runtime checks were intentionally omitted because this mission does not modify
application code.

## Rollback Procedure

Rollback is documentation-only:

1. Revert the S008.04 commit if created.
2. Or delete only:
   - `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.md`
   - `staffordos/architecture/S008_04_MULTI_WORKSPACE_PLATFORM_AND_DECISION_MODEL_ARCHITECTURE.json`
3. No application, database, authentication, Stripe, ShopiFixer, Abando, Render,
   deployment, or migration rollback is required.

## Remaining Blockers

Implementation blockers for later missions:

- General workspace membership is not implemented.
- Workspace context middleware is not implemented.
- Professional, Family, Media, and Learner runtime capabilities are not
  implemented.
- Abando write authority remains out of scope and must stay API-bound until a
  separate mission proves otherwise.
- Cross-workspace search, notifications, memory retrieval, and AI agents need
  explicit boundary enforcement before activation.

## Next Mission Recommendation

S008.05 should implement a read-only workspace context and owner-first workspace
switcher foundation in `/os`, using static metadata only. It should not change
authentication, data access, business logic, routes outside `/os`, ShopiFixer,
Abando, Stripe, schemas, migrations, or deployment.

## Confirmation of Non-Impact

This mission did not change application code, routes, components, CSS,
authentication, Stripe, ShopiFixer runtime behavior, Abando runtime behavior,
database schemas, migrations, deployments, production configuration, operator
bootstrap, execution grants, Packet authorization, queueing, execution tokens,
Shopify mutation, payment behavior, webhook behavior, or customer contact.
