# Execution Board Template

Purpose: define the lightweight daily operating board that turns the WBS into actual movement.

## Suggested Columns

- Backlog
- Ready
- In Progress
- Waiting (System)
- Waiting (Client)
- Review
- Done

## Task Template

Use one card per actual job or next executable work item.

| Field | Description |
| --- | --- |
| Client | Merchant, prospect, or internal owner connected to the work |
| Product | Abando, Shopifixer, Actinventory, StaffordOS, or another mapped engine |
| Job Type | The concrete service unit or task class |
| WBS Node | The matching WBS area so the work stays anchored to structure |
| Stage | Current step in the execution path |
| Operator Minutes Used | Human time spent so far |
| System Minutes Used | Automated processing time spent so far |
| Waiting On | System, operator, client, or a named dependency |
| Revenue Value | Contract value, projected value, or protected value tied to the work |
| Due Date | The next real deadline |
| Notes | Short operating notes, risks, or handoff guidance |

## Example Card

| Field | Example |
| --- | --- |
| Client | Test Merchant A |
| Product | Abando |
| Job Type | Recovery readiness review |
| WBS Node | Abando -> Recovery Engine -> Result Tracking |
| Stage | Review |
| Operator Minutes Used | 35 |
| System Minutes Used | 70 |
| Waiting On | Operator |
| Revenue Value | $500 monthly retained value target |
| Due Date | 2026-03-25 |
| Notes | Confirm action durability before any merchant-facing claim |

## Board Rules

- Keep cards small enough that they can move within a day or a clear waiting state.
- Do not hide blocked work inside "In Progress".
- When a card moves to a waiting column, name the blocker explicitly.
- Review should mean a decision is needed soon, not indefinite parking.
- Done should mean the current unit of work is complete, not that the whole client relationship is over.

## WBS vs Board

- WBS is for clarity.
- Board is for movement.

The WBS explains where work belongs. The board explains what is moving today, what is blocked, and what needs attention next.

## Current Reality vs Target State

## Real now

- The repo has enough module structure to justify a disciplined operating board.
- There is not yet a clearly standardized daily StaffordOS execution board in this repo.

## Next

- Use this board template for active Abando-adjacent service work and future StaffordOS coordination.
- Record operator and system time honestly from the start.

## Later

- Turn board data into StaffordOS reporting and capacity analytics.
