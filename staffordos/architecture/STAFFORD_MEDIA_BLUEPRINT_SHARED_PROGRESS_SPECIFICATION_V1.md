# Stafford Media Blueprint shared progress specification v1

Status: **DESIGN CHECKPOINT — NOT UI AUTHORIZATION**
Date: 2026-10-12

This specification is a projection of the existing durable
`StaffordosBlueprintEngagement`; it does not add states, scoring, commercial
terms, delivery automation, or a client portal. The implementation authority
is the Step 4A decision checkpoint and the released Step 4A/4B code. The exact
acceptance-contract file and the deployed source containing the six public
deliverable names were not available in the inspected checkouts; their names
are therefore intentionally not reconstructed here.

## Authority and flow

```text
optional inquiry (untrusted reference)
        -> verified Stripe payment
        -> buyer/identity review (Ross)
        -> onboarding: one workflow + required inputs/limitations
        -> interview complete + readiness
        -> six Blueprint deliverables (contract names unresolved here)
        -> artifact delivery / review meeting / client acceptance
        -> separately approved implementation (optional)
        -> ongoing operation and outcome review
```

Payment facts and payment events remain immutable. No email, client merge,
implementation credit, or delivery action is implied by a progress value.

## Phase contract

The required-item set is versioned per engagement (`checklistVersion` for
required inputs, and the governing contract/version for delivery items). For
any phase, `completed / total` is calculated only from required items whose
completion evidence is present and valid. Display both values, for example
`2/4 (50%)`; a missing or unavailable item is not complete. If no versioned
set exists, display **Not configured**, never 100%. A required gate remains
blocking even when the percentage is high.

| Phase and plain-language label | Versioned required items and source | Responsible person / next action | Completion evidence / approver | Blocked, unavailable, N/A |
|---|---|---|---|---|
| **Payment verified / “Getting started”** | Paid, server-verified Blueprint engagement; payment facts from `StaffordosBlueprintEngagement` and `StaffordosBlueprintPaymentEvent` (`web/prisma/schema.prisma`), not a checkout click. | Ross reviews the buyer evidence and decides identity treatment. | Durable payment event and engagement; no client approval is inferred. | Unpaid, wrong offer, or provider failure is blocked. An absent inquiry is **N/A**, not an error. |
| **Buyer review / “Confirming who we work with”** | One approved identity decision; safe operating contact confirmation; optional inquiry/client association only after explicit Ross decision. Rules: Step 4A checkpoint, `DECIDE_IDENTITY` in `web/src/lib/blueprintOnboardingAuthority.js`. | Ross; next action is record/confirm or leave unassociated pending. | Server-derived Ross actor, reason, evidence reference, timestamp, and audit event. | Missing identity evidence blocks progression. Candidate email/inquiry references remain unverified. |
| **Onboarding / “Preparing your Blueprint”** | Exactly one versioned workflow boundary, client confirmation evidence, and the engagement-specific required-input checklist. Source: Step 4A checkpoint; `CONFIRM_WORKFLOW_BOUNDARY`/`SET_REQUIRED_INPUTS`; fields in `StaffordosBlueprintOnboarding`. | Ross coordinates; client supplies inputs and confirms the boundary. | Boundary JSON/version, client confirmation evidence, each item status plus evidence/received time or limitation agreement. | Pending items block readiness. `UNAVAILABLE` is allowed only with limitation evidence, client agreement, and an affirmative finding that all six deliverables remain achievable; it is not full fulfillment of an omitted deliverable. |
| **Interview and readiness / “Ready to build”** | Interview completion date, participants/roles, evidence reference; checklist readiness; later of the two local dates starts the five-business-day clock. Source: Step 4A checkpoint; `RECORD_INTERVIEW`; `blueprintOnboardingCalendar.js`. | Ross records the interview; client provides missing inputs. | Authenticated Ross record plus durable readiness evidence; original/current clock and due dates. | Missing interview or readiness is blocked. The deadline excludes weekends and observed US federal holidays under the versioned OPM calendar; day zero is the later New York date and the due time is 5 p.m. on business day five. |
| **Blueprint preparation and delivery / “Blueprint delivered”** | The six contract-required deliverables, each with its contract/versioned item identifier, artifact evidence, owner, and released timestamp. **Exact names and storage authority are unresolved because the acceptance contract/public source was unavailable.** | Stafford Media prepares; Ross releases the artifacts. | Artifact references and release record; delivery timeliness is recorded at artifact release, not when the client replies. | Missing artifact evidence blocks “delivered.” A scope exception cannot be represented as complete fulfillment of the original offer. |
| **Review and client acceptance** | Separate review meeting record and separate client acceptance decision/evidence. **No durable authority is currently implemented in the inspected Step 4A/4B models/routes.** | Ross schedules/reviews; client accepts or records requested clarification. | Proposed: meeting evidence and client response with actor/time; requires authority approval before implementation. | No response does not rewrite delivery timeliness. Acceptance is not delivery and is not implementation approval. |
| **Separately approved implementation** | Explicit scope, operating owner, approval, and credit eligibility under existing commercial terms. No automatic application. | Ross and client approve separately; next action is a separately governed implementation decision. | Proposed approval and scope record; absent from Step 4A/4B authority. | Not included in Blueprint completion. If not approved, show **Not applicable**, not blocked delivery. |
| **Ongoing operation / “Operating and improving”** | Agreed measures and dated observations; no automatic monitoring authority is present. | Client owns operation; Ross supports the agreed cadence. | Proposed review evidence and outcome record; absent from current authority. | “Not measured yet” is distinct from zero or achieved progress. |

## Shared fields and access

Both future views must read the same engagement ID and durable authority; no
parallel CRM or client copy is permitted.

| Field/action | Existing source and status | Operator / client exposure |
|---|---|---|
| Stage, engagement ID, payment amount/currency/quantity, paid time | `StaffordosBlueprintEngagement`; implemented in `GET /api/staffordos/blueprint-engagements` and detail route | Operator-only payment/provider facts; client may see a safe “payment verified” label, not provider IDs. |
| Buyer evidence, claimed inquiry, identity decision, association status | Engagement plus `StaffordosBlueprintOnboarding`; implemented in Step 4A/4B | Buyer evidence is operator-only. A client-safe identity label is proposed; no client/inquiry ID is exposed as verified unless Ross explicitly establishes it. |
| Workflow, checklist, limitations, interview, clock/deadline | Onboarding JSON/date fields and `POST .../onboarding/commands`; implemented | Operator edits through governed commands. Client-safe subset (boundary summary, required client action, due date) is proposed and must be server-filtered. |
| Audit actor subject, security/permission details, raw payload, internal evidence refs | `StaffordosBlueprintOnboardingAuditEvent`; implemented and append-only | Operator governance only; never client-visible. |
| Next action, responsible person, blocker, released deliverables, updated time | Next-action and deliverable/review authority is not durable in inspected code; proposed projection only | Safe for both views after authority is approved; client may see only its action and released evidence. |
| DBM baseline, agreed target, dated observed result, supporting evidence, business outcome/ROI | Approved definitions in the acceptance contract are unavailable in the checkout; Step 4A does not implement DBM storage | Proposed later projection. Depth = workflow integration/execution; Breadth = coverage/adoption; Maturity = reliability/governance/improvement. No combined score, weights, or standard claim. |

## State and presentation behavior

Use the existing audited states and allowlist in `BLUEPRINT_ONBOARDING_STATES`
and `TRANSITIONS`: `PAID_IDENTITY_REVIEW → ONBOARDING →
WAITING_FOR_CLIENT_INPUT | READY_FOR_INTERVIEW → INTERVIEW_COMPLETE →
DELIVERY_READY`, with only the approved material-change rollback. Do not add
client-facing backend states. Show loading, empty, blocked, saving, failed
save, stale-write, and delivered states. Failed saves retain entered values;
stale writes explain that the record changed and require refresh. “Unavailable”
must show the limitation and its evidence, not silently disappear. “N/A” is
shown only when the contract makes the item inapplicable.

## Compact illustrative projection

```text
PREPARING YOUR BLUEPRINT   2/4 (50%)   [BLOCKED: interview not recorded]
Next action: Ross — record interview evidence
Responsible: Ross Stafford                         Updated: 2026-10-12 15:40 ET

▸ Required checklist (version 3)
  ✓ Workflow boundary — client confirmation evidence recorded
  ✓ Input A — evidence reference recorded
  ○ Input B — awaiting client evidence
  ○ Interview — required gate, not yet recorded

Blocker: readiness/interview gate; percentage cannot override it.

DBM measures (not a combined score)
  Depth     baseline: Not measured yet | target: agreed target pending | observed: Not measured yet
  Breadth   baseline: Not measured yet | target: agreed target pending | observed: Not measured yet
  Maturity  baseline: Not measured yet | target: agreed target pending | observed: Not measured yet
```

The example is presentation-only; it does not create checklist items,
deliverables, measures, or records.

## Step 5 delivery reconciliation (2026-10-18)

This checkpoint now reflects the merged Step 5A/5B implementation. Ross can
record and review durable drafts for the six public deliverables through the
operator workspace and the governed Step 5A authority:

1. `workflow_interview_current_state_map`
2. `primary_automation_diagnosis`
3. `recommended_system_design`
4. `prioritized_opportunities`
5. `implementation_roadmap`
6. `written_blueprint_review`

For each identifier, the authority stores versioned JSON contents, owner,
prerequisite references, evidence references, claim classifications,
limitations, and version-specific quality-review evidence. `recorded` and
`reviewed` are available; revisions preserve prior versions and reset the
new version to unreviewed. Release, delivery, client access, and acceptance
are not implemented.

### What is available now

| Audience | Currently available | Not available |
|---|---|---|
| Ross/operator | Read and governed recording/revision/review of six deliverable versions, audit history, evidence references, classifications, and limitations. | A released package, delivery record, client acceptance, external artifact file, portal, or implementation approval. |
| Client | No client-facing package or access channel is currently established. | A readable Blueprint, delivery notification, acceptance action, or implementation view. |

Onboarding readiness, preparation/review status, delivery, client acceptance,
DBM observations, and business outcomes remain separate. Six `reviewed`
versions are evidence of preparation quality; they are not delivery or an
implemented result.

### Minimum path to one readable, recorded package

The smallest sufficient next slice is a governed **Blueprint package
manifest and renderer**:

1. Require exactly one reviewed, immutable version for each of the six
   identifiers. Missing versions, missing quality evidence, or unresolved
   required limitations block package release.
2. Render a deterministic Markdown/HTML document from those six JSON
   contents. Include the identifier/version, owner, findings, classifications,
   limitations, source/evidence references, generation time, and package
   digest. The renderer must label references as references; a reference alone
   does not claim that an external file was stored or delivered.
3. Persist a package manifest/digest tied to the engagement and exact six
   versions, plus separate `RELEASED` and `DELIVERED` audit records. Delivery
   records must include the approved channel/recipient, server-derived Ross
   actor, timestamp, and digest. Client acceptance remains a separate record.
4. Keep implementation approval and the existing implementation credit
   entirely separate from release or delivery.

This can be done without a portal, uploads, messaging, or external artifact
storage: the document is generated from immutable reviewed JSON and the
manifest/digest proves which versions were delivered. External object
storage would add credentials, access control, retention, and recovery
authority without advancing the first package; it is therefore deferred.

### Decisions that block this slice

Ross must approve only:

1. The generated document format (Markdown/HTML) and the delivery channel
   and recipient definition.
2. Whether the durable authority stores only the rendered digest/manifest
   (recommended, with deterministic regeneration) or also stores a package
   snapshot.
3. Operator-only PostgreSQL access and retention/deletion policy. Proposed
   default: retain draft contents, immutable released snapshots, and audit
   metadata together until Ross authorizes a governed deletion; provide no
   automatic expiry or deletion job. This preserves reproducibility and
   auditability but retains client content longer and requires deliberate
   deletion authority. A shorter approved retention would reduce exposure
   but could prevent package regeneration, dispute review, or audit proof.

No deletion or expiry behavior is implied. Until these decisions and a
durable delivery authority exist, all six reviewed versions remain
preparation evidence and `RELEASED`/`DELIVERED` stay unavailable.

### Final package-and-delivery approval package

The governing Step 5 design is this shared-progress specification, cross-
referenced to the Step 5A authority in `web/prisma/schema.prisma`,
`web/src/lib/blueprintDeliverableAuthority.js`, and
`web/src/routes/blueprintDeliverables.esm.js`. Those existing sources support
only draft, revision, and quality-review commands; package release and
delivery authority are not implemented.

Recommend a **sanitized, self-contained, print-friendly HTML** snapshot with
no scripts and no remote assets. This format is proposed pending Ross
approval. Generate it only when all six exact identifiers have a currently
reviewed version. Store the rendered HTML, source-version tuple,
renderer/template version, asset digest (empty because remote assets are
forbidden), and content digest in one immutable PostgreSQL snapshot. This is
simpler and more truthful than manifest-only regeneration: exact
regeneration cannot be claimed unless renderer, template, assets, and source
versions are preserved. No external object storage, uploads, portal, or
messaging service is required initially.

Concrete lifecycle (proposed, not implemented):

1. `POST .../package/commands` with `CREATE_PREVIEW_SNAPSHOT` reads the six
   reviewed rows in one transaction, records their IDs/versions/digests, and
   persists an immutable preview snapshot. It fails if any identifier is
   missing, not currently reviewed, changed during the transaction, or belongs
   to another engagement.
2. `GET .../package/:snapshotId` returns the operator-only snapshot and its
   source tuple for Ross's final inspection. The response never includes
   identity, security, actor, raw audit, payment-provider, or internal
   association fields.
3. `POST .../package/commands` with `RELEASE_PACKAGE` must include the exact
   snapshot ID and digest. It rechecks all six source versions atomically,
   rejects stale or cross-engagement sources, and appends a release audit.
4. The same command route with `RECORD_DELIVERY` requires a released snapshot,
   verified recipient, approved manual channel, handoff timestamp, and
   evidence reference. It appends a delivery audit; release or download alone
   is never delivery. Client acceptance and implementation approval remain
   separate and are not added here.

Every command uses the existing server-derived operator identity and
`staffordos.revenue_operations.write` permission, transaction-scoped
record-version/concurrency checks, append-only audits, and engagement ID
scoping. No browser-supplied actor, recipient, or permission is trusted.

Proposed models (not implemented):

- `StaffordosBlueprintPackage`: engagement ID, package version, six source
  deliverable IDs/versions, renderer/template/asset digests, rendered
  content, content digest, status, releasedAt, releasedBy, and recordVersion.
- `StaffordosBlueprintDelivery`: package ID, engagement ID, approved
  recipient/channel, handoff evidence reference, deliveredAt, deliveredBy,
  and append-only audit linkage. Delivery cannot precede release.

Proposed governed operator routes (not implemented):

- `POST /api/staffordos/blueprint-engagements/:engagementId/package/commands`
  with `CREATE_PREVIEW_SNAPSHOT`, `RELEASE_PACKAGE`, and
  `RECORD_DELIVERY`.
- `GET /api/staffordos/blueprint-engagements/:engagementId/package/:snapshotId`
  for the operator-only snapshot read.

The existing operator workspace would gain a final inspection panel showing
the six source versions, rendered preview, digest, and separate release and
delivery actions. No client portal is proposed; the released snapshot is
handed off through the approved channel and the operator records evidence.

Release must re-read all six rows in one transaction and reject a stale
package if any status, version, content digest, or engagement ID differs
from the preview tuple. Revisions never mutate a released package. Delivery
requires a released package, the same package digest, an approved
recipient/channel, and evidence of the actual handoff. Client acceptance
and implementation approval remain separate future records.

#### Client-visible allowlist

Expose only the six public titles and rendered substantive contents,
evidence references explicitly labelled as references: each allowlisted
`evidenceRefs[].ref` and its optional `observedAt` date. `prerequisiteRefs`
and `qualityReviewEvidenceRef` remain operator-only because they describe
internal workflow/review authority rather than client evidence. Claim
classifications, recorded limitations, package version/digest, release date,
and delivery date/channel label remain client-safe. Do not expose payment/provider identifiers,
buyer or identity evidence, inquiry/client associations, operator subjects,
permission/security details, raw audit payloads, or internal database IDs.
Client access is an approved handoff, not an implemented portal.

#### Synthetic document example

```text
STAFFORD MEDIA AUTOMATION OPPORTUNITY BLUEPRINT — PACKAGE v1
Source versions: deliverables 1–6, each reviewed; digest: synthetic

1. Workflow interview and current-state map
Finding: The synthetic workflow has three manual handoffs.
Evidence: interview://synthetic/workflow-2026-10-18 (OBSERVED, dated).
Assumption: Weekly volume is CLIENT_STATED, not independently measured.

2. Primary automation diagnosis
Finding: Handoff delay is a candidate constraint; cause is not proven.
Options: retain manual checklist | existing-tool routing | custom automation.

3. Recommended system design
Recommendation: begin with existing-tool routing and retain human approval.
Risk/ownership: Ross owns configuration; client owns operating decisions.

4. Prioritized opportunities (up to three)
Opportunity A: remove duplicate entry. Limitation: no system export supplied.

5. Implementation roadmap
Phase 1: validate the workflow boundary; Phase 2: pilot with review gates.
Dependencies: client access decision and named operating owner.

6. Written Blueprint and review
Review evidence: review://synthetic/ross-review-2026-10-18.
Decision: suitable for client review; implementation is not approved.

Measurement plan: baseline — Not measured yet; target — to be agreed;
observed result — Not measured yet. Business outcome/ROI — Not measured yet.
```

#### Package definition of done

The slice is complete when a synthetic engagement with six reviewed versions
produces an immutable snapshot; preview and release bind the exact six
versions and digest; stale, cross-engagement, unauthorized, and pre-release
delivery attempts fail; release and delivery audits are atomic, append-only,
and actor-bound; the allowlist is enforced; and payment, onboarding, DBM,
client, email, and implementation records remain unchanged.

Retention of existing draft contents and package snapshots, deletion/expiry,
and client access duration remain unresolved. No retention duration or
indefinite-retention promise is introduced.

### Step 5 package definition of done

The slice is complete when a synthetic engagement with six reviewed,
version-specific records can produce one deterministic package; the manifest
binds all six versions and its digest; unauthorized reads/writes are denied;
stale or cross-engagement writes fail atomically; release and delivery audits
are append-only and actor-bound; and no payment, onboarding, DBM, client,
email, or implementation records are changed implicitly.

## Unresolved decisions and smallest next slice

1. Recover and verify the authoritative deployed Blueprint contract containing
   the exact six deliverable names, artifact storage, owner, release evidence,
   review-meeting record, and client-acceptance authority.
2. Ross must approve the client-safe projection and the meaning of each
   proposed label, especially “Getting started,” “Preparing your Blueprint,”
   “Blueprint delivered,” and the conditional “Implementation.”
3. Define the minimal durable delivery/review/acceptance records without
   altering payment or onboarding authority; separately define DBM measure
   storage and the operating-review cadence.

The smallest implementation slice is a read-only shared progress projection
from the existing engagement/onboarding routes, using only proven fields,
with a versioned required-item resolver that rejects missing evidence and
keeps required gates blocking. Do not build a portal, delivery executor,
automatic monitor, messaging flow, DBM scorer, or implementation runner in
that slice.

### Approved package-and-delivery decisions (2026-10-18)

This section supersedes the package-format, storage, retention, and delivery
choices above for the bounded package slice. The approved client artifact is
sanitized, self-contained, print-friendly HTML with no scripts or remote
assets. It is rendered from an immutable PostgreSQL snapshot containing all
six exact currently reviewed deliverable versions. The snapshot stores the
allowlisted rendered contents, source-version tuple, renderer/template/asset
digests, and content digest. Internal identity, payment, security, audit
payload, and database identifiers are excluded from the client document.

The operator creates a preview, inspects that exact snapshot, and uses
`RELEASE_PACKAGE` only when the snapshot ID and digest still bind to the same
six reviewed sources. `RECORD_DELIVERY` is a separate operator-authorized,
append-only manual handoff record requiring verified recipient, approved
manual channel, actual handoff time, and evidence. Preview, download, and
release never imply delivery, client receipt, client acceptance, or
implementation approval. No automated messaging is introduced.

The package routes are operator-only and use the existing
`staffordos.revenue_operations.write` permission, server-derived actor,
engagement isolation, optimistic record-version checks, and atomic audits:

- `POST /api/staffordos/blueprint-engagements/:engagementId/package/commands`
  with only `CREATE_PREVIEW_SNAPSHOT`, `RELEASE_PACKAGE`, or
  `RECORD_DELIVERY`;
- `GET /api/staffordos/blueprint-engagements/:engagementId/package/:snapshotId`.

There is no automatic expiry or deletion in this slice. Draft contents,
snapshots, and audit metadata remain retained until a separately authorized
governed deletion process is implemented and executed; this is not a promise
of indefinite retention, but it has no fixed retention end date today.

Synthetic screen-preview evidence was inspected with Quick Look, including
long content, evidence labels, limitations, and the explicit “Not measured
yet” state. Print CSS was inspected for heading/page-break behavior; native
PDF conversion was unavailable in the local environment, so this is not a
claim of PDF-output QA.
