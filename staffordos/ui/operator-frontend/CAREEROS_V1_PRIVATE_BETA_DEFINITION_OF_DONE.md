# CareerOS Private Beta Definition Of Done

This document describes the CareerOS private-beta product contract and the
bounded StaffordOS operations view. It does not certify deployment, production
data access, or reconciliation execution.

## Customer lifecycle

`KNOW ME -> FIND -> UNDERSTAND -> PURSUE -> MANAGE -> RETURN`

- **KNOW ME:** private profile, Career Story, reviewed source-backed facts,
  context, and capabilities.
- **FIND:** authorized discovery and user-supplied opportunities.
- **UNDERSTAND:** explainable direct, transferable, partial, and unknown
  relationships, gaps, uncertainty, and next action.
- **PURSUE:** explicit considering, pursue, or pass decisions and truthful
  preparation with human approval.
- **MANAGE:** saved opportunities, lifecycle state, notes, follow-up, and
  next actions.
- **RETURN:** account-scoped state supports continuation later.

## Customer authority

CareerFacts remain source-backed and customer-confirmed. Context claims and
capabilities remain separate reviewed authorities. Matching and ranking do not
promote unconfirmed material. External applications and messages require
human approval. Provider requests contain generic search criteria and do not
include private career evidence, resumes, notes, or application history.

## Customer route map

| Surface | Route |
|---|---|
| Career Home | `/career` |
| Profile | `/career/profile` |
| Career Story | `/career/onboarding` |
| Context | `/career/context` |
| Capabilities | `/career/capabilities` |
| Discovery | `/career/discover` |
| Job intake | `/career/jobs` |
| Opportunity inbox | `/career/inbox` |
| Opportunity detail | `/career/jobs/[opportunityId]` |
| Application evidence | `/career/jobs/[opportunityId]/application-evidence` |
| Resume preparation | `/career/jobs/[opportunityId]/application/resume` |
| Cover letter preparation | `/career/jobs/[opportunityId]/application/cover-letter` |
| Application questions | `/career/jobs/[opportunityId]/application/questions` |

These customer routes use CareerOS customer session authority. They are
separate from StaffordOS operator routes.

## StaffordOS operations view

The StaffordOS compatibility surface includes `/operator/careeros/beta-users`
and its API. It provides a privacy-safe operational aggregate for beta-account
progress, lifecycle observations, aggregate activity, and deterministic health
reasons. The view requires the `careeros.beta.operations.read` operator
permission and does not return private Career Evidence.

The canonical StaffordOS shell is `/os` using `StaffordOsShell`. Professional
job activity is presented at `/os/professional/jobs`, using existing private
artifact/read-model loaders for daily brief, priorities, opportunities,
application intelligence, resume readiness, pipeline, follow-up, and search
health. This local operator view is not itself a deployment certification.

## Operations boundaries

Missing or invalid operator authority fails closed. Customer sessions do not
authorize operator APIs, and operator sessions do not become customer sessions.
The operations read model is read-only, pseudonymous, bounded, and excludes
raw resume bodies, provider payloads, credentials, and arbitrary customer
selection.

Persistent StaffordOS operator-session storage is a separate schema capability
and is not asserted by this document. No reconciliation primitive or automatic
production query is asserted here.

## Definition of done

A beta customer can establish and review a private career profile, evaluate
authorized or user-supplied opportunities, understand fit and gaps, make an
explicit decision, and enter truthful preparation without automatic external
action. The StaffordOS operations view can show bounded account-level progress
when an authorized operator session is available.

Remaining production and human-acceptance claims require their own evidence.
