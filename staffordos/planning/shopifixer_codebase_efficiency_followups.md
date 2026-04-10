# Shopifixer Codebase Efficiency Follow-ups

## 1. Purpose of this file

This file tracks codebase organization and efficiency follow-up work for the Shopifixer module.

It is NOT an execution log.
It is NOT a feature roadmap for unrelated systems.
It is a focused reminder of:
- what currently works
- where the working logic lives
- what code/structure inefficiencies exist
- what should be cleaned up later
- what is explicitly deferred for now

---

## 2. Current working flow

### Current operator flow
1. Add Lead or Find Leads
2. Persist row into Shopifixer outreach queue
3. Render row in Active Queue
4. Select active row
5. Generate Draft
6. Review / edit
7. Open Gmail Draft
8. Send manually
9. Mark Sent
10. Move row to Sent Queue

### Current working status
- [x] Add Lead works
- [x] Find Leads works
- [x] Queue persists correctly
- [x] Active selection works
- [x] Editor hydrates from selected row
- [x] Generate Draft works
- [x] Mark Sent works
- [x] Sent Queue works

---

## 3. Current code locations

### UI
- `staffordos/ui/operator-frontend/components/operator/ShopifixerOutreachConsole.tsx`

### API
- `staffordos/ui/operator-frontend/app/api/shopifixer/outreach/route.ts`

### Queue store / queue helpers
- `staffordos/products/shopifixer/assisted/queue_store.js`

### Lead ingestion
- `staffordos/products/shopifixer/assisted/find_candidate_leads.js`

### Queue data
- `staffordos/products/shopifixer/outreach/shopifixer_outreach_queue.json`

### Logs
- `staffordos/products/shopifixer/logs/shopifixer_conversation_log_v1.md`

---

## 4. Current architectural truths

### Source of truth
State must derive from:
- `shopifixer_outreach_queue.json`

### Active editor rule
The editor must only render from:
- currently selected active row
- persisted queue-backed state

### Queue lifecycle
Current statuses:
- `queued`
- `draft_generated`
- `sent`

### Product boundary
Shopifixer is:
- outbound acquisition
- lead -> queue -> draft -> send -> outcome

It is NOT:
- Abando recovery
- generic CRM
- generalized platform logic

---

## 5. Known inefficiencies / code smells

### A. UI logic and queue mutation are too close together
`ShopifixerOutreachConsole.tsx` still owns a large amount of orchestration logic around loading queue state, preserving selection, clearing editor state, inserting leads, and reconciling API responses. That makes the component harder to debug because render concerns and mutation concerns are living side by side.

### B. Queue helper naming is inconsistent
Current helper responsibilities are split across names that are technically correct but not yet uniform:
- `addQueueRow`
- `updateQueueRow`
- `readQueue`
- `writeQueue`
- `getQueueRow`
- `findCandidateLeads`

The queue helpers live in `queue_store.js`, while ingestion lives in `find_candidate_leads.js` and mutations are partially orchestrated again in the API route. That naming and placement works, but it is not yet one clean queue contract.

### C. Selection / hydration logic is fragile or duplicated
Selection and hydration logic currently depends on several cooperating paths:
- `getActiveQueueRows(...)`
- `resolveActiveRow(...)`
- `applyQueueState(...)`
- `selectRow(...)`
- the `useEffect(...)` that rebuilds editor state from queue + `selectedRowId`

This is much better than stale local state, but the logic is still spread across multiple functions and could be centralized further later.

### D. Ingestion logic is deterministic local seed logic only
The current ingestion layer is workflow-valid and honest, but lead-quality-limited. `find_candidate_leads.js` generates deterministic local candidates from seeded niche shapes. That is sufficient for proving queue behavior, dedupe, and operator flow, but it is not a real discovery engine.

### E. Outcome tracking is too thin
Current outcome tracking effectively stops at `sent` in the main queue lifecycle. The system does not yet track richer post-send states like reply, interested, no response, booked, or converted, so it cannot yet close the loop on lead quality.

---

## 6. Follow-ups to improve efficiency later

### Follow-up 1 — Formalize queue helper contract
Goal:
- one authoritative queue helper layer
- dedupe, insert, update status, refresh

### Follow-up 2 — Separate UI rendering from queue mutation logic
Goal:
- cleaner console component
- easier debugging
- fewer hydration/state issues

### Follow-up 3 — Add outcome tracking after sent
Goal:
- reply status
- interested / no response / converted
- better lead quality feedback loop

### Follow-up 4 — Connect real ICP scoring to ingestion
Goal:
- rank leads before queue insertion
- avoid low-quality seeded-only flow

### Follow-up 5 — Clarify long-term module boundaries
Goal:
- Shopifixer stays acquisition
- Abando stays recovery
- shared patterns without merging product logic

---

## 7. Explicitly deferred in this phase

These are intentionally NOT being done right now:

- broad codebase refactor
- Abando changes
- live internet-scale discovery
- Kubernetes / infra expansion
- generic platformization
- batch sending
- auto-send
- CRM abstraction

---

## 8. What would count as "done enough" for current phase

Current phase is good enough when:
- queue is stable
- ingestion works
- draft/send workflow is reliable
- lead quality can be improved via ICP scoring next

---

## 9. Next recommended focus

### Immediate next focus
- inspect / improve ICP scoring
- connect score or rank into Shopifixer ingestion

### After that
- use scoring to decide what gets queued first
- improve outcome tracking

---

## 10. Notes

Use this section only for short factual notes, not generic brainstorming.

- Deterministic ingestion is intentionally honest and local for now.
- The queue remains the single execution surface.
- This file is a planning artifact, not a refactor mandate.
- The public Shopifixer fix route is now standardized on `https://app.abando.ai/fix?store=<domain>`.
- Shopifixer link generation now lives in `staffordos/products/shopifixer/assisted/fix_link.js` and is consumed by queue creation and draft generation helpers.
- The Shopifixer console now shows a compact Gmail draft-ready link state instead of rendering the full raw Gmail compose URL.
