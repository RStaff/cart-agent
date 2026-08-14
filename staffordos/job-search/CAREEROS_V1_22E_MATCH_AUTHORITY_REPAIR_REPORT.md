# CareerOS V1.22E Match Authority Repair Report

## Scope

Offline authority repair only. No weights, production ranking, J002/J003/J010, shortlist, CareerFact, CareerEvidence, workflow, provider, or application behavior was changed.

## Repairs

- Preference compatibility no longer short-circuits on J010 HARD_MISMATCH. It evaluates only explicit preferences and normalized opportunity facts.
- Responsibility comparison now recognizes responsibility, leadership, program-management, and operations requirement categories and exposes requirement-to-evidence comparisons.
- Seniority is represented as direct, upward stretch with supported scope, adjacent, unresolved, or proven mismatch only when evidence supports it.
- Domain transfer is represented separately and does not treat title or industry difference as a blocker.
- UNKNOWN, MISSING, PARTIAL, and TRANSFERABLE remain distinct.

## Before/after

- Preference before: {"OUTSIDE_PREFERENCE":18,"UNKNOWN":22}
- Preference after: {"OUTSIDE_PREFERENCE":27,"UNKNOWN":13}
- Hard-mismatch records with independently resolved preference state: 9
- Responsibility evidence: {"STRONG_TRANSFERABLE_SUPPORT":122,"UNKNOWN":845}
- Seniority: {"ADJACENT_LEVEL":10,"UNRESOLVED":5,"UPWARD_STRETCH_WITH_SUPPORTED_SCOPE":25}
- Domain: {"TRANSFERABLE_DOMAIN":35,"UNRESOLVED_DOMAIN":5}
- Fit changed only where independent preference projection changed the existing geography component: 0

## Human-positive audit

- M21-015 Scale AI — [Annotations] Operations Program Manager: TRANSFERABILITY_UNDERVALUE
- M21-023 Anthropic — Cloud Partner Enablement Lead: GEOGRAPHY_GAP
- M21-026 Airtable — Delivery Consultant: GEOGRAPHY_GAP
- M21-009 Scale AI — AI Builder Intern: EVIDENCE_GAP
- M21-010 Anthropic — Applied AI Architect, Commercial: GEOGRAPHY_GAP
- M21-011 Anthropic — Applied AI Architect, Enterprise Tech: GEOGRAPHY_GAP
- M21-012 Anthropic — Applied AI Architect, Industries: GEOGRAPHY_GAP
- M21-013 Anthropic — Data Engineer, Safeguards: GEOGRAPHY_GAP
- M21-006 Anthropic — Director, Global Order-to-Cash Transformation: AUTHORITY_CONFLICT
- M21-007 Airtable — Program Manager, Professional Services - East: AUTHORITY_CONFLICT
- M21-008 Airtable — Program Manager, Professional Services - West: AUTHORITY_CONFLICT
- M21-034 Scale AI — Engineering Manager, Agent Oversight: AUTHORITY_CONFLICT
- M21-040 Anthropic — Applied AI Engineer, Enterprise Tech: AUTHORITY_CONFLICT
- M21-004 Scale AI — Frontier Agent Engineering Manager, Enterprise: AUTHORITY_CONFLICT
- M21-036 Anthropic — Anthropic Fellows Program: AUTHORITY_CONFLICT
- M21-037 Anthropic — Anthropic Fellows Program, AI Safety & Security: AUTHORITY_CONFLICT
- M21-038 Anthropic — Anthropic Fellows Program, ML Systems & Reinforcement Learning: AUTHORITY_CONFLICT
- M21-039 Anthropic — Anthropic Fellows Program, The Anthropic Institute (Economics & Policy): AUTHORITY_CONFLICT
- M21-001 Scale AI — AI Infrastructure Engineer, Sandbox Platform: AUTHORITY_CONFLICT

## Decision

READY_FOR_RECALIBRATION. Rerun V1.22D metrics with unchanged weights before considering any weight changes.
