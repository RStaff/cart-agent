# S010.02D Role-Focused Career Evidence Review

Date: 2026-08-06

Status: `ROLE_FOCUSED_CAREER_EVIDENCE_REVIEW_IMPLEMENTED`

## Objective

S010.02D adds a narrow owner-private local workflow for reviewing a small set of Career evidence questions that matter to one private Job Analysis run.

The workflow is intended for reusable Professional positioning across AI Product, AI Governance, AI Platform, Agentic Development, Automation, and Technical Product roles.

## Boundary

The workflow is local only.

It does not create:

- an `/os` route;
- an `/operator` route;
- a public UI;
- an API;
- a database;
- a provider integration;
- an AI or Ollama call;
- an application submission;
- a message send;
- a resume mutation.

Real review decisions and regenerated analyses remain outside Git under owner-private storage.

## Evidence-Safe Outcomes

Allowed outcomes:

- `VERIFIED`
- `PARTIALLY_SUPPORTED`
- `TRANSFERABLE`
- `NEEDS_EVIDENCE`
- `CONFLICTING`
- `REJECTED`
- `DEFERRED`

`VERIFIED` is fail-closed unless direct non-resume authority is already present in the private Career evidence set. Resume wording and operator recollection alone cannot verify a fact.

## Review Scope

The workflow ranks only selected `UNKNOWN` and `TRANSFERABLE` mappings from a private analysis run. It does not review the entire historical Career queue.

The ranking favors reusable evidence lanes:

- AI Product
- AI Governance
- AI Platform
- Agentic Development
- Automation
- Technical Product

It excludes compensation, benefits, legal policy, accommodation language, employment-type metadata, and section headings from the focused review set.

## Regeneration

After focused decisions are saved, the workflow regenerates the private analysis from:

1. the selected private analysis run;
2. the append-only S010.02D decisions;
3. existing private Career candidate facts and evidence.

Regeneration produces a new private analysis run and an S010.02D private change report. The original analysis remains unchanged.

## Canonical CareerFact Boundary

S010.02D records role-focused decisions only. It does not directly rewrite canonical Career history.

Canonical Career Evidence may be updated only in a later governed workflow when S010-approved evidence authority is present.

## Validation

Validation scope:

- focused S010.02D tests;
- J001.03B regression tests;
- S010 regression tests;
- source-safety scan;
- private-data absence scan;
- JSON validation;
- diff checks.

## Rollback

Repository rollback:

`git revert <S010.02D commit SHA>`

Private review decisions and regenerated analyses are separate owner-private records. They must not be deleted without explicit Ross approval.

## Next Step

Use the private S010.02D review result to prepare evidence-safe resume positioning or interview stories for the selected opportunity without submitting applications or changing resumes automatically.
