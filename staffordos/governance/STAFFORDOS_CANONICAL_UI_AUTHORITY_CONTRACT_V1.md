# StaffordOS Canonical UI Authority Contract V1

Status: GOVERNANCE AUTHORITY
Date: 2026-08-29

## Purpose

This contract prevents parallel StaffordOS shells, workspace models, and primary navigation from being introduced by capability work.

## Canonical Product and Shell

StaffordOS is one operating system with multiple workspaces, sections, and product capability lenses.

The canonical outer shell is:

- Route: `/os`
- Component: `staffordos/ui/operator-frontend/components/staffordos/StaffordOsShell.tsx`

The canonical workspace model is:

- Stafford Media: current and available
- Professional: available as a read-only foundation
- Personal: planned

The canonical workspace authorities are `lib/staffordos/workspaces.ts` and `lib/staffordos/workspaceRegistry.ts`. Workspace selection is presentation context, not a separate application or shell.

The canonical primary navigation is:

1. Home
2. Command
3. Work
4. Pipeline
5. Knowledge
6. Governance
7. System

`/os/chief-of-staff` remains the Chief of Staff demonstration authority within this shell and taxonomy.

## Capability and Product Rule

CareerOS, ShopiFixer, Marketing, Sales, Finance, Engineering, and AI Operations are capability lenses or modules within StaffordOS. They must map to an existing canonical section and must not create an independent top-level StaffordOS shell without explicit architecture approval.

CareerOS customer UX is a separate customer application. CareerOS operational administration belongs to the StaffordOS control plane and may use a dedicated operator/admin route while its presentation is mapped to the canonical `/os` taxonomy.

## Compatibility Surface

`/operator`, owned by `components/operator/OperatorShell.tsx`, remains a compatibility and runtime control-plane surface during convergence. It is not a second canonical StaffordOS information architecture. New operator/admin capabilities may use its established runtime authority where required, but their intended presentation must map to an existing `/os` section.

`/operator` cannot be deleted or redirected away until route parity, business-logic parity, security/session behavior, human acceptance, and separate replacement authority are proven.

## Authority and Convergence Rules

- Reuse existing business logic, read models, authority boundaries, and security guards during convergence.
- Do not duplicate business logic merely to render a capability under `/os`.
- Route migration must be incremental, reversible, and parity-gated.
- No StaffordOS mission may create, replace, rename, or restructure the outer shell, workspace hierarchy, primary navigation, or top-level information architecture without verifying this contract and receiving explicit architecture approval.
- No customer application shell may become StaffordOS shell authority.
- The local operator session's module-level in-memory store is a separate security/runtime infrastructure issue. It must not be mixed into UI convergence work.

## Required UI Mission Gate

Before any StaffordOS UI implementation mission:

1. Locate this contract.
2. Verify that the proposed work does not create a new shell, workspace model, or navigation model.
3. Map the work to an existing canonical section.
4. Stop if the mapping is ambiguous.

The exact mission-gate question is:

> Does this mission alter StaffordOS outer-shell, workspace, or primary-navigation authority?

If the answer is yes, explicit architecture approval is required before implementation.
