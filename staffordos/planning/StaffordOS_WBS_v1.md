# StaffordOS WBS v1

Purpose: define the top-level work breakdown structure for StaffordOS and its product engines, while separating what is real now from what is still planned.

## Status Key

- Real now: present in the repo today, partially or fully implemented, or clearly represented by existing modules and surfaces.
- Next: intended near-term buildout after Abando review.
- Later: target structure that is not yet fully built.

## A. StaffordOS (Control Plane)

### 1. Operator System

- Operator Home
  - Status: Next
  - Notes: operator-facing landing surface is conceptually clear, but not yet a complete daily home.
- Leads System
  - Status: Next
  - Notes: some lead and truth concepts exist, but there is not yet a full cross-product leads workspace.
- Revenue Command (Dev Command Center)
  - Status: Real now, partial
  - Notes: `staffordos/ui/command-center/` and revenue modules exist, but the full operating layer is not yet complete.
- Analytics
  - Status: Next
  - Notes: reporting ideas and scorecard logic exist, but a unified StaffordOS analytics layer is not yet finished.
- Product Routing Layer
  - Status: Real now, partial
  - Notes: router modules exist in `staffordos/router/`, but product routing is not yet the full control-plane coordination layer.

### 2. Service Delivery Engine

- Intake
  - Status: Real now, partial
  - Notes: intake and execution concepts exist in StaffordOS modules, but not yet as a full operator service system.
- Job Classification
  - Status: Real now, partial
  - Notes: optimization and execution packet logic suggests classification behavior, but this is not yet exposed as a formal service layer.
- Execution Pipeline
  - Status: Real now, partial
  - Notes: execution, optimization, and action modules exist and provide a real foundation.
- Client Communication
  - Status: Real now, partial
  - Notes: outreach, replies, and Gmail integration modules exist, but not yet a complete client communication workspace.
- Close / Payment Loop
  - Status: Real now, partial
  - Notes: revenue gate and payment agreement modules exist, but the full delivery-to-payment loop is still being shaped.

### 3. Product Integrations

- Abando
  - Status: Real now
  - Notes: active product with merchant-facing and runtime surfaces in the repo.
- Shopifixer
  - Status: Planned
  - Notes: named as a target engine, but not yet visible as a product surface in this repo.
- Actinventory
  - Status: Planned
  - Notes: named as a target engine, but not yet visible as a product surface in this repo.
- Future Engines
  - Status: Planned
  - Notes: control plane should support more product engines over time.

### 4. Data Layer (Data Moat)

- Leads
  - Status: Real now, partial
  - Notes: truth and intake concepts exist, but not yet a consolidated control-plane lead model.
- Merchants
  - Status: Real now, partial
  - Notes: Abando clearly operates on merchant records, but StaffordOS does not yet expose a unified merchant layer.
- Events
  - Status: Real now, partial
  - Notes: signals, feedback, and product event concepts exist.
- Actions
  - Status: Real now, partial
  - Notes: action and execution records are represented in existing StaffordOS modules.
- Outcomes
  - Status: Real now, partial
  - Notes: scorecards, feedback, and payment/revenue modules imply outcome tracking, but not yet a single shared moat.

### 5. Automation Layer

- Signals
  - Status: Real now, partial
  - Notes: signal handling is explicit in Abando system docs and StaffordOS optimization concepts.
- Opportunity Scoring
  - Status: Real now, partial
  - Notes: opportunity decision and scoring behavior is represented in current modules.
- Packet Generation
  - Status: Real now, partial
  - Notes: execution packet generator and registry already exist.
- Execution Gate
  - Status: Real now, partial
  - Notes: payment gate and execution control logic exist.
- Feedback Loop
  - Status: Real now, partial
  - Notes: feedback recorder and related verification modules already exist.

## B. Abando (Recovery Engine)

### 1. Merchant Loop

- Install Flow
  - Status: Real now
  - Notes: install and Shopify app flows are active in the repo.
- Connected State
  - Status: Real now
  - Notes: merchant-connected product behavior exists.
- Listening State
  - Status: Real now, partial
  - Notes: event and signal collection are present, with ongoing review work around runtime truth.
- Signal Detection
  - Status: Real now, partial
  - Notes: signal-driven logic exists, but truth constraints remain important.
- Recovery Ready
  - Status: Next
  - Notes: this is the reliable readiness state Abando should expose once review hardening is complete.

### 2. Recovery Engine

- Action Creation
  - Status: Real now, partial
  - Notes: recovery action concepts and records exist, but current review is validating truthfulness and durability.
- Job Queue
  - Status: Real now, partial
  - Notes: queue and worker patterns are present in the repo.
- Worker Processing
  - Status: Real now, partial
  - Notes: worker processing exists, but current review is still active.
- Email / Send Layer
  - Status: Real now, partial
  - Notes: send capabilities exist; current truth rules must continue to prevent fake sends.
- Result Tracking
  - Status: Real now, partial
  - Notes: tracking is present, but trustworthy merchant-facing reporting is still being tightened.

### 3. Merchant Dashboard

- Status Cards
  - Status: Real now
- Event Counts
  - Status: Real now, partial
- Recovery Actions
  - Status: Real now, partial
- Honest Messaging
  - Status: Real now, partial
  - Notes: dashboard surfaces exist, but messaging must stay tied to real tracked state.

### 4. API Layer

- `/signal/*`
  - Status: Real now, partial
- `/recovery-actions/*`
  - Status: Real now, partial
- `/dashboard`
  - Status: Real now, partial

### 5. Truth Layer

- No fake sends
  - Status: Required now
- No fake revenue
  - Status: Required now
- Durable actions only
  - Status: Required now

These are not optional future ideals. They are present-tense operating constraints for Abando.

## Current Reality vs Target State

## Current Reality

- Abando is the most concrete product engine in the repo today.
- StaffordOS already has meaningful building blocks: router, execution, optimization, revenue, outreach, truth, and operator UI scaffolding.
- StaffordOS is not yet a finished control plane with a unified operator workflow, cross-product leads system, or mature analytics layer.
- Shopifixer and Actinventory are strategy-level product engines right now, not visibly complete product modules in this codebase.
- The repo already supports the idea that StaffordOS should coordinate work above the product level, but that coordination layer is still incomplete.

## Target State

- StaffordOS becomes the control plane for operator work, service delivery, cross-product coordination, leads, analytics, and revenue command.
- Product engines such as Abando, Shopifixer, and Actinventory own their own product-specific execution logic and merchant-facing experiences.
- StaffordOS consumes product status and product outputs through explicit APIs instead of folding product UIs into one merged interface.
- Service capacity, execution tracking, and automation decisions are measured consistently across products.

## Practical Restart Notes

- Treat StaffordOS as a control-plane program that already has real foundations, not as a blank-slate concept.
- Treat Abando as the active execution engine that needs truth-preserving review completion before broader platform expansion.
- Use this WBS to decide whether work belongs in control-plane infrastructure, product execution, data moat, or automation.
