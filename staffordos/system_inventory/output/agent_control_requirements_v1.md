# StaffordOS Agent Control Requirements v1

Generated: 2026-04-28

---

## Purpose

Define how agents become controllable, observable, and useful within the Command Center.

This is NOT a build.
This is the contract that all agents must meet to be usable.

---

## Core Principle

Agents are NOT code files.

Agents are OPERATORS that must behave like employees:

- They have a role
- They have responsibilities
- They produce output
- They can fail
- They must be supervised

---

## Required Control Dimensions

Every agent MUST expose the following:

---

### 1. Identity

- agent_id
- name
- category
- business_objective

---

### 2. Execution State

- last_run_at
- status:
  - idle
  - running
  - blocked
  - failed
  - completed

---

### 3. Input Contract

What the agent needs to run:

- required_inputs
- optional_inputs
- data_sources

---

### 4. Output Contract

What the agent produces:

- output_type (file, JSON, message, decision)
- output_location
- last_output_summary

---

### 5. Trigger Mode

How it runs:

- manual
- scheduled
- event-driven
- chained (triggered by another agent)

---

### 6. Control Mode

Who controls it:

- automatic
- requires_approval
- manual_only

---

### 7. Business Impact

- supports_revenue: true/false
- supports_system_health: true/false
- supports_delivery (Shopifixer/clients): true/false

---

### 8. Risk Level

- low
- medium
- high

---

### 9. Approval Requirement

- none
- soft (log only)
- required (must approve before execution)

---

### 10. Observability

Must expose:

- last_run_result
- success/failure
- error_message (if any)
- output usefulness (subjective later)

---

## Command Center Requirements (Critical)

Command Center must show:

---

### Agent Overview Panel

- Active agents (running now)
- Blocked agents
- Failed agents
- Idle agents

---

### Agent Detail View

For each agent:

- role
- last run
- output summary
- control buttons:
  - run
  - approve
  - pause
  - inspect output

---

### Income Alignment

Command Center must highlight:

- agents that directly drive revenue
- agents that are blocking revenue
- agents producing no useful output

---

## Current System Reality (From Audit)

- Agents exist (29 detected)
- No execution state tracking
- No input/output contracts defined
- No control layer
- No visibility in Command Center

---

## Gap

Agents are currently:

- DISCOVERED ✅
- NOT CONTROLLED ❌
- NOT TRUSTED ❌
- NOT SURFACED ❌

---

## Next Step (Required)

Before UI work:

1. Add execution state tracking
2. Define input/output contracts for key agents
3. Attach agents to real data they read/write
4. Identify which agents:
   - drive revenue
   - support system health

---

## Critical Insight

You do NOT need more agents.

You need:

- fewer agents
- clearer roles
- visible output
- controlled execution

---

## End State Vision

Ross opens Command Center and sees:

- 3 agents running
- 2 agents blocked (needs email data)
- 1 agent ready for approval (send outreach)
- 1 agent generated revenue opportunity

He acts in minutes, not hours.

