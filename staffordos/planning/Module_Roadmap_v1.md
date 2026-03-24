# Module Roadmap v1

Purpose: define the order of buildout so StaffordOS planning survives the current Abando review period and resumes cleanly afterward.

## Now

- Finish Abando review.
- Freeze neck runtime changes.
- Preserve planning structure.

## Why Now Looks This Way

- Abando review work is active in parallel and should not be disrupted.
- The immediate goal is to keep architecture intent, operating structure, and sequencing intact without changing live runtime behavior.
- Planning documents are the safe handoff layer for resuming StaffordOS work later.

## Next

- Restore or finish the StaffordOS operator UI.
- Build Leads.
- Build Revenue Command.
- Build Analytics.
- Connect StaffordOS to Abando by API.

## Next Phase Notes

- Start with operator-facing read models and working surfaces before heavy automation.
- Make the StaffordOS operator UI useful for real daily work, not just concept demos.
- Prioritize Leads, Revenue Command, and Analytics as the minimum useful control-plane spine.
- Use Abando as the first connected product engine and validate the API boundary there.

## Later

- Add Shopifixer dashboard and workspace.
- Add Actinventory dashboard and workspace.
- Extract the operator backend into a proper StaffordOS backend if warranted.

## Later Phase Notes

- Shopifixer and Actinventory should plug into the same control-plane shape without forcing a merged runtime.
- A dedicated StaffordOS backend should be extracted only if real usage justifies it, not just because the architecture looks cleaner on paper.

## What Not To Do Yet

- Do not merge StaffordOS into Abando.
- Do not build fake analytics.
- Do not overbuild automation before delivery capacity is understood.

## Additional Guardrails

- Do not confuse planning completeness with product readiness.
- Do not create control-plane surfaces that claim data fidelity they do not have yet.
- Do not expand product count faster than the service model can support.

## Current Reality vs Target State

## Real now

- Abando is active and more concrete than the rest of the platform.
- StaffordOS has meaningful modules and UI scaffolding, but not yet a finished operator system.
- The architecture direction is visible, even though the control plane is still incomplete.

## Next

- Resume StaffordOS as a practical operator platform after the Abando review stabilizes.
- Build only the pieces that create real coordination value: operator UI, leads, revenue command, analytics, and API linkage.

## Later

- Expand into a true multi-product control plane once one product connection pattern is working and capacity is understood.

## Restart Checklist

- Re-open these planning docs first.
- Confirm Abando review outcome and any constraints that remain.
- Re-check current StaffordOS modules before building new ones.
- Resume in the order listed here unless new evidence changes priorities.
