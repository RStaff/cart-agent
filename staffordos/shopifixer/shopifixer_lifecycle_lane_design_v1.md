# ShopiFixer Lifecycle Lane Design

## Purpose

Render the ShopiFixer lifecycle directly inside the existing StaffordOS Command Center as a read-only lane.

## Current State

- Current stage: `offer_sent`
- Active stage: `Offer Sent`
- Blocked stage: `Payment Received`
- Next action: `Collect verified payment for the authorized $950 Fix Sprint.`
- Readiness score source: `staffordos/shopifixer/shopifixer_runtime_payment_verification_v1.json.readiness_score`

## Stages

### 1. Audit Complete

- Source file: `staffordos/audit/audit_result_surface.json`
- Source field: `audit_score`, `top_issue`, `fix_recommendation`
- Completion condition: audit surface exists and contains a scored merchant problem statement plus recommendation.
- Visual state: `complete`

### 2. Conversion Brief Generated

- Source file: `staffordos/shopifixer/shopifixer_conversion_brief_v1.json`
- Source field: `store_domain`, `audit_score`, `benchmark_summary`, `top_issue`, `fix_recommendation`, `sprint_price`
- Completion condition: conversion brief exists for the same merchant and carries the $950 Fix Sprint authority.
- Visual state: `complete`

### 3. Offer Sent

- Source file: `staffordos/shopifixer/shopifixer_offer_outcome_authority_v1.json`
- Source field: `current_outcome_state`, `allowed_next_states`, `offer_sent status`
- Completion condition: offer outcome authority records `offer_sent` for the active merchant.
- Visual state: `active`

### 4. Payment Received

- Source file: `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- Source field: `items[0].payment_status`, `items[0].paid_at`, `items[0].amount`
- Completion condition: client registry and fulfillment truth both reflect verified paid ShopiFixer truth for the same merchant.
- Visual state: `blocked`

### 5. Fulfillment Started

- Source file: `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- Source field: `items[0].execution_status`, `items[0].fix_started_at`
- Completion condition: fulfillment truth changes execution status from `not_started` to an in-progress paid-delivery state.
- Visual state: `pending`

### 6. Proof Package Complete

- Source file: `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- Source field: `items[0].proof_status`, `items[0].proof_package_status`, `items[0].merchant_proof_package_ready`
- Completion condition: before evidence, after evidence, and merchant-facing proof package are present in fulfillment truth.
- Visual state: `pending`

### 7. Completed

- Source file: `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- Source field: `items[0].completion_status`, `items[0].completed_at`, `items[0].completion_complete`
- Completion condition: fulfillment truth records completed delivery and no further proof or work is required.
- Visual state: `pending`

## Operator Actions

- Confirm merchant alignment.
- Watch for Stripe payment completion.
- Verify paid truth lands in client registry.
- Verify fulfillment rebuild advances to `payment_received`.
- Do not start fulfillment before payment is verified.

## Files Required To Render The Lane

- `staffordos/shopifixer/shopifixer_command_center_v1.json`
- `staffordos/shopifixer/shopifixer_operator_experience_audit_v1.json`
- `staffordos/ui/operator-frontend/app/operator/command-center/page.tsx`
- `staffordos/ui/operator-frontend/components/operator/OperatorHomeV1.tsx`
- `staffordos/ui/operator-frontend/lib/operator/loadShopifixerCommandCenter.ts`
