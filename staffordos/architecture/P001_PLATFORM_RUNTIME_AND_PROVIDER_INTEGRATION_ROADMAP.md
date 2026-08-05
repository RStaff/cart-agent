# P001 Platform Runtime and Provider Integration Roadmap

Date: 2026-08-04

Mode: read-only architecture

Status: `PLATFORM_RUNTIME_PROVIDER_ROADMAP_DOCUMENTED`

## Scope

This document reconciles the canonical StaffordOS platform runtime and provider architecture using repository authority only. It does not implement source code, routes, UI, APIs, schemas, provider adapters, deployments, OAuth changes, or runtime writes.

Repository authority used:

- `STAFFORDOS_ENTERPRISE_ARCHITECTURE_REVIEW_V1`
- `STAFFORDOS_TARGET_PLATFORM_AND_WORKSPACE_MODEL_V2`
- `STAFFORDOS_MEDIA_AND_PROVIDER_BOUNDARY_V1`
- `STAFFORDOS_ANTI_DRIFT_REGISTER_V1`
- Asset Authority V1, provider-reference, privacy/rights/provenance, storage/lifecycle, and ADR-0002
- ADR-0001 canonical persistence authority for ShopiFixer
- G001 through G004.01 governance artifacts
- S007 local issuer, OAuth configuration, local issuer configuration authority, and verifier dependency map
- S008, S009, S010, and J001 architecture artifacts
- Targeted route, package, and deployment metadata

## Canonical Runtime Topology

### Current Proven Topology

StaffordOS currently has separate runtime surfaces with different authority levels:

| Surface | Current role | Authority status |
| --- | --- | --- |
| `/operator` in `staffordos/ui/operator-frontend` | Current Stafford Media operating surface. Reads local repository/runtime JSON and exposes existing operator workflows. | Runtime-canonical for current Stafford Media operations. Writes are isolated by G004.01 and fail closed unless explicit local loopback conditions pass. |
| `/os` in `staffordos/ui/operator-frontend` | Parent StaffordOS shell for workspace navigation, Professional foundation, static registries, Chief of Staff demo, actions, objectives, decisions, evidence, proof, and learning. | Canonical shell and information architecture. Static/read-model only. Non-static data must enter through governed adapters. |
| `web/` product runtime | Express/Prisma backend for existing product/business runtime, including Abando and ShopiFixer-related routes. | Product runtime authority where implemented. Packet lifecycle is database-backed; audit/lead/finding continuity remains constrained by ADR-0001. |
| `web/frontend` and `abando-frontend` | Public/static product frontend surfaces with provider rewrites where configured. | Product-facing runtime surfaces, not StaffordOS parent shell authority. |
| `staffordos/operator-issuer` | Standalone local StaffordOS Operator Issuer with `/login`, `/auth/google/callback`, `/public-key`, and `/health`. | Implemented locally and tested with KMS proof. Not deployed, not browser-proven, and not connected to `/operator` or `/os`. |
| Device-local private roots | Private Professional and Job Search storage outside Git. | Current private-data boundary. Not connected to UI except through future server-side authorization and adapters. |
| Home server | Future storage, Jellyfin, local model, backup, and family/media tier. | Not currently a StaffordOS runtime authority except for documented backup/home-server references. |
| Local Ollama proof | One bounded local Chief of Staff provider proof. | Certified proof-of-architecture provider only. Ollama is not permanent AI authority and is not running as canonical runtime. |

Git remains code, governance, architecture, tests, and redacted/sealed evidence authority. Git is not user-content, media, private record, runtime database, resume, job, family, provider credential, or binary payload storage.

### Target Topology

The target StaffordOS platform has one shared platform layer and three top-level workspaces:

```text
Device-local private tier
  - owner-private Professional and Personal sources
  - local issuer configuration and local proof material outside Git
  - temporary private drafts and intake

Home server tier
  - bulk media storage
  - Jellyfin-accessible media and playback provider
  - local backups
  - local model runtime where explicitly approved
  - approved family content

Cloud tier
  - Stafford Media product runtimes
  - durable database-backed platform/product records
  - provider integrations
  - approved publications
  - deployed identity only after OAuth, verifier, session, and deployment authority

StaffordOS shared platform
  - identity and sessions
  - workspace registry and membership
  - policy, permissions, approvals, and audit
  - actions, decisions, objectives, evidence, proof, and learning
  - Asset metadata authority and provider references
  - governed read-model adapters
  - provider-neutral AI orchestration

Top-level workspaces
  - Stafford Media
  - Professional
  - Personal
```

The target topology does not merge providers into StaffordOS. StaffordOS owns governance metadata, workspace scope, permissions, decisions, approvals, provenance, audit, and provider references. Providers retain their own operational authority unless a governed StaffordOS adoption decision says otherwise.

## Workspace Ownership Boundaries

Top-level workspaces remain exactly:

- `stafford-media`
- `professional`
- `personal`

No current authority promotes Family, Media, Creative, ShopiFixer, Abando, Job Search, My Job, or Jellyfin into a top-level workspace.

| Workspace | Owns | Does not own |
| --- | --- | --- |
| Stafford Media | Business operations, company objectives, pipeline, relationships, revenue, delivery, ShopiFixer service lens, Abando product lens, customer-authorized business assets, Stafford Media operator decisions. | Professional private career facts, Personal/family media, provider internal state, Jellyfin catalog truth, payment provider truth, Shopify store truth. |
| Professional | Career Home, Job Search, future My Job, career evidence, resume authority, job opportunity review, professional decisions, owner-private professional assets. | Stafford Media customer data, Personal/family records, public job-source truth, employer system truth, automatic publication. |
| Personal | Private planning, learning, memories, Media Studio, family sharing overlay, child-safe learning/creativity, personal and family assets once gates exist. | Stafford Media operations, Professional career/work records, whole-family access by default, Jellyfin playback authority, external provider rights authority. |

Workspace crossing requires an explicit governed action or relationship with provenance. A provider, folder, route, file type, or UI selection does not determine workspace ownership.

## Capability Ownership

| Capability area | Canonical owner | Current state |
| --- | --- | --- |
| `/operator` operations | Stafford Media | Runtime-canonical for current Stafford Media operations. Write surfaces are locally isolated, not authenticated. |
| ShopiFixer | Stafford Media capability/service lens | Existing product/service authority exists. Packet authority is database-backed. Audit/lead/finding persistence still needs ADR-0001 execution. |
| Abando | Stafford Media capability/product lens | Existing API/product runtime exists. StaffordOS integration remains read-only/API-bound unless a later mission authorizes deeper control. |
| Professional Career Home | Professional mode | Available as static/read-only foundation. |
| Job Search | Professional mode | Job Command shell and private intake bridge exist. Real private UI display is blocked on server authorization. |
| My Job | Professional mode | Planned. No employment-management runtime exists. |
| Media Studio | Personal capability | Planned shared creation platform. Not a top-level workspace and not a second Asset model. |
| Family sharing | Personal sharing/membership overlay | Planned. Requires membership, guardian/child gates, privacy, rights, and audit before access. |
| Chief of Staff / AI | Shared platform service | Read-only, provider-neutral, advisory, guarded, and validation-first. Runtime/private ingestion requires adapters and authorization. |
| Identity, membership, permissions, approvals, audit | Shared platform service | Identity issuer exists locally, but session/verifier/workspace membership are not connected. |
| Asset authority | Shared platform service | Architecture accepted. No runtime Asset model or migration exists. |

## Provider Boundaries

Provider systems must enter StaffordOS through governed adapters or provider references. UI components must not call providers directly for authoritative state.

| Provider class | Provider authority | StaffordOS authority |
| --- | --- | --- |
| Google Identity / Cloud KMS | OAuth authentication provider, KMS signing authority, provider-side client and key configuration. | Local issuer assertions, later verifier/session policy, workspace membership, capability permission, action approval, and audit. |
| Stripe | Payment provider truth. | Business/payment governance references and approval/audit around actions; no silent replacement of Stripe truth. |
| Shopify | Store/provider truth for merchant systems. | ShopiFixer governance, packet/execution authority where implemented, proof and approvals. Shopify mutation remains separately governed. |
| Render / Vercel / deployment providers | Deployment and runtime environment state. | Deployment decisions, release evidence, runtime authority classification, limitations. |
| Email/messaging providers | Delivery and communication provider truth. | StaffordOS-approved communication actions, audit, recipient policy, and suppression rules. |
| Job sources and employer systems | External job listing and employer-owned information. | Private Professional review models, provenance, and future redacted read models. |
| Jellyfin | Playback and library-catalog authority for media it manages. | Asset governance, workspace scope, rights, privacy, sharing, approval, audit, and provider references. Jellyfin IDs are external aliases, not Asset IDs. |
| Storage providers, NAS, buckets, home server | Payload storage authority. | Asset metadata, lifecycle, retention, deletion request state, and governance references. |
| AI/model providers | Generated response or transformation provider. | Source selection, prompt/input envelope, validation, review status, approvals, and output governance. |

StaffordOS must not rebuild Jellyfin, copy an entire Jellyfin catalog without explicit authority, scan private media without authority, or treat provider availability as the survival condition for StaffordOS governance records.

## Asset Flow

Canonical Asset flow:

```text
source material or provider item
  -> storage/catalog/playback/creation provider reference
  -> StaffordOS Asset record
  -> workspace, owner, capability, privacy, rights, provenance, and lifecycle metadata
  -> review and approval state
  -> relationships to originals, versions, derivatives, evidence, proof, publications, or shares
  -> governed retention/deletion/audit history
```

Asset rules:

- An Asset is a governed record, not the binary payload.
- Payloads may live on device-local storage, home server, cloud storage, or external providers.
- Asset IDs are StaffordOS IDs, never provider IDs, Jellyfin IDs, URLs, file paths, or public sequential identifiers.
- Asset type describes content purpose or handling, not workspace ownership.
- ShopiFixer, Abando, Job Search, Family, and Jellyfin are relationships, capabilities, workspaces, or providers, not Asset types.
- An Asset is not automatically Evidence or Proof. Evidence and Proof require explicit relationships and authority decisions.
- Unknown rights, provenance, timestamps, or provider states must remain unknown.
- Temporary paths and machine-local cache locations are not durable locators.

## Identity Flow

### Current Identity Flow

Current authority:

```text
Google OAuth provider configuration
  -> local StaffordOS Operator Issuer source
  -> KMS-backed local assertion proof
  -> unconnected verifier/session architecture
  -> G004.01 local write isolation remains separate
```

Current identity status:

- Google provider configuration now includes the repository-required local callback and Ross test-user eligibility.
- Local issuer configuration is absent.
- Browser OAuth proof has not run.
- The issuer is not deployed.
- `/operator` and `/os` do not consume an authenticated StaffordOS session.
- G004.01 write isolation is not authentication or authorization.

### Target Identity Flow

Target flow before any deployed or multi-user writes:

```text
Google OAuth login
  -> local or deployed StaffordOS Operator Issuer
  -> signed StaffordOS assertion or session
  -> verifier middleware / server library
  -> server-derived user identity
  -> workspace membership
  -> role and capability permission
  -> action-specific approval for high-impact actions
  -> audit context and request ID
  -> guarded read or write surface
```

WorkspaceContext in `/os` remains presentation-only until server-derived membership and authorization are connected.

## AI Orchestration Flow

Current AI authority is intentionally narrow:

- S009 defines the Chief of Staff as read-only and advisory.
- Static fixtures and deterministic validators are authoritative for presentation safety.
- Ollama with `qwen2.5:1.5b` passed one bounded local provider proof, but it is not permanent reasoning authority.
- No model provider may read arbitrary repository files, private files, providers, databases, email, calendars, or runtime stores.
- AI cannot approve, execute, publish, delete, share, grant access, claim rights, or override retention.

Target AI flow:

```text
workspace-scoped request
  -> governed source selection
  -> read-model adapter
  -> immutable source snapshot with asOf, authority, freshness, limitations, and authorization status
  -> provider-neutral model request
  -> replaceable model provider adapter
  -> structural guard
  -> deterministic validator
  -> advisory response or fail-closed result
  -> optional human-approved action through normal StaffordOS authority
```

AI output is a generated proposal until Ross or another authorized human approves a governed action.

## Data Authority

| Data class | Current authority | Target authority |
| --- | --- | --- |
| Architecture, governance, tests, redacted evidence | Git | Git remains canonical for source and governance only. |
| `/operator` Stafford Media runtime JSON | Repository/runtime files | Move toward durable persistence under ADR-0001 and platform data-authority decisions. |
| ShopiFixer packet lifecycle | Product database/Prisma-backed packet authority | Durable product/platform authority with audit, lead, merchant, finding, and packet binding. |
| ShopiFixer audit, lead, and finding continuity | Mixed file-backed surfaces and derived runtime state | Durable database-backed canonical authority before real merchant execution governance. |
| Abando product runtime | `web/` product runtime and API-bound integration | Remain product-owned, API-bound, and governed by provider/adaptor contracts before StaffordOS control. |
| Professional private records | Device-local private roots outside Git | Remain private until server authorization, encrypted storage, and read-model adapters exist. |
| Personal and family content | Planned only | Asset authority plus membership, sharing, rights, guardian, storage, and audit gates. |
| Asset metadata | Architecture only | Platform Asset metadata authority, separate from payload storage providers. |
| Provider state | Provider systems | Cached read models with `asOf`; provider state is not StaffordOS truth unless explicitly adopted. |
| Identity/session | Local issuer proof and unconnected verifier code | Signed sessions/assertions, verifier, membership, permissions, approvals, and audit. |

## Future Deployment Topology

The future topology should separate deployment concerns by authority:

| Tier | Future role | Required gates |
| --- | --- | --- |
| Device-local | Private intake, sensitive drafts, local issuer proof, owner-private Professional and Personal sources. | G001 containment, no Git storage, local secret handling, server-only adapters before UI display. |
| Home server | Bulk media, Jellyfin playback, local backups, approved family content, local model runtimes. | Asset authority, provider contract, membership, sharing, child-safe gates, backup/restore policy. |
| Cloud product runtime | Abando, ShopiFixer, public product APIs, customer-authorized business assets, approved publications. | ADR-0001 persistence execution, provider contracts, deployment governance, audit, secrets management. |
| Cloud identity runtime | Future deployed issuer or verifier support. | OAuth rotation, browser proof, verifier/session integration, deployment policy, secret management. |
| StaffordOS operator frontend | Parent shell and operator surfaces. | Read-only deployment only until identity/session, write authorization, persistence, and provider boundaries are connected. |

No current authority permits deploying the issuer, exposing `/operator` writes publicly, connecting private Job Search data to UI, or integrating Jellyfin.

## Remaining Architectural Risks

| Risk | Current status | Required correction |
| --- | --- | --- |
| Repo-as-database debt | Actual risk. `/operator` runtime JSON and some ShopiFixer continuity surfaces are file-backed. | ADR-0001 persistence execution and broader platform persistence plan. |
| Identity not connected | Actual risk. Local issuer exists, but browser proof, local config, verifier/session, membership, and permissions are incomplete. | Complete OAuth/local issuer proof chain, then verifier/session integration. |
| Write authorization gap | Partially reduced. G004.01 isolates writes locally but is not authentication, authorization, or approval. | Add session, membership, permissions, action-specific approval, and audit. |
| Private Professional display | Blocked correctly. Private records exist outside Git and cannot enter UI safely yet. | Server-side authorization and redacted read-model adapter. |
| Asset runtime absent | Intentional. Asset authority is accepted but not implemented. | Asset contract/static validator before provider/media implementation. |
| Provider contract not uniformly applied | Actual future risk. Legacy providers and product runtimes predate the canonical provider contract. | Apply provider adapter contract incrementally. |
| Jellyfin/media boundary | Planned only. No current implementation. | Keep Jellyfin as provider after Asset/membership/sharing gates. |
| Relationship and Party duplication | Known architecture debt. | Single Party/Relationship authority before cross-workspace CRM/professional/family expansion. |
| Historical/static records mistaken as live | Reduced by G003, still requires discipline. | Preserve staticity, `asOf`, freshness, and limitations in every `/os` surface. |
| Family and child access | Not implemented. | Membership, guardian approval, visibility, rights, moderation, and child-safe policies before access. |
| Product/provider deployment drift | Ongoing risk across Render, Vercel, Google, Stripe, Shopify, and future home server providers. | Provider-state evidence, redacted proofs, deployment authority, and rollback runbooks. |
| Mission namespace drift | Known governance risk. | Continue using canonical naming and authority links. |

## Anti-Drift Validation

Future work must pass these checks:

1. Top-level workspaces remain exactly Stafford Media, Professional, and Personal.
2. Family, Media, Creative, ShopiFixer, Abando, Job Search, My Job, and Jellyfin are not added as top-level workspaces.
3. `/operator` remains runtime-canonical for current Stafford Media operations until parity migration is explicitly authorized.
4. `/os` does not import `/operator` loaders or server actions.
5. `/os` receives non-static data only through governed read-model adapters.
6. Static and historical surfaces show `asOf`, freshness, staticity, and limitations.
7. WorkspaceContext is not treated as authorization.
8. Private Professional and Personal data remain outside Git and outside client components.
9. Git does not store user content, private runtime records, media payloads, resumes, job descriptions, credentials, or provider secrets.
10. Provider IDs, URLs, or locators do not become StaffordOS Asset IDs.
11. Jellyfin remains a provider, not a StaffordOS playback rebuild.
12. AI remains advisory, guarded, validated, fail-closed, and unable to approve or execute.
13. Write surfaces remain isolated until identity, authorization, approval, and audit exist.
14. No provider state silently replaces StaffordOS governance history.
15. Child/family access is impossible until membership, guardian, rights, visibility, and audit gates exist.

## Recommended Implementation Sequence After OAuth

The immediate OAuth prerequisite remains:

1. `S007_01I5_LOCAL_ISSUER_SECRET_CONFIGURATION_OPERATOR_RUNBOOK`
   - Create the operator-executable runbook for ignored local issuer configuration without exposing secrets.

After local issuer configuration and controlled browser proof are complete, the canonical implementation sequence should be:

| Order | Mission slice | Why it comes here |
| ---: | --- | --- |
| 1 | S007 verifier and session integration architecture | Browser proof alone does not authorize StaffordOS surfaces. The next durable boundary is session verification. |
| 2 | Server-derived workspace membership and capability permission context | `/os` and `/operator` need server-side workspace authority before private or multi-user data enters UI. |
| 3 | Action-specific approval and audit for high-impact writes | G004.01 is only local isolation; protected writes need approval and audit before real use beyond local solo constraints. |
| 4 | ADR-0001 runtime persistence execution plan | Stafford Media and ShopiFixer cannot rely on file-backed runtime truth for controlled merchant execution. |
| 5 | First governed runtime read-model adapter connection | Use the smallest authorized source, preserving G003 envelope/staticity rules and avoiding `/operator` loader imports. |
| 6 | Private Job Opportunity server-adapter prerequisites | Real Job Opportunity display remains blocked until server authorization and redaction are proven. |
| 7 | Asset contract and static validator | Asset metadata authority should be validated before media, portfolio, proof, or provider catalogs are connected. |
| 8 | Party and Relationship authority reconciliation | Needed before Business CRM, Professional relationships, family membership, or invited-member expansion can share a single identity model. |
| 9 | Provider contract application to existing product integrations | Bring Stripe, Shopify, email, Render/Vercel, Google, and product integrations under a consistent provider-boundary model. |
| 10 | Home server and Jellyfin provider planning | Only after Asset authority, membership, sharing, rights, and provider references are ready. |
| 11 | Personal Media Studio and family/child access gates | Requires Asset, membership, guardian approvals, rights/provenance, storage, and audit. |

This sequence preserves useful Professional and Job Search progress while preventing private data, provider state, write authority, or media playback from entering StaffordOS before their governing boundaries exist.

## Non-Impact

This mission:

- created architecture documentation only;
- did not modify source code;
- did not modify routes, UI, APIs, schemas, or migrations;
- did not create an Asset model;
- did not connect Jellyfin or any provider;
- did not start Ollama or the issuer;
- did not run browser OAuth;
- did not read private Career, Job Search, Personal, family, media, or secret contents;
- did not deploy, push, or commit implementation changes.
