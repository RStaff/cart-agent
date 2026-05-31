# EXISTING OUTREACH PATH V1

## Verified Existing Path

staffordos/outreach/leads.json
  -> staffordos/operator_daemon/write_followup_draft_v1.mjs
  -> staffordos/operator_daemon/output/shopifixer_followup_draft_v1.json
  -> staffordos/operator_daemon/write_approved_outreach_queue_v1.mjs
  -> staffordos/operator_daemon/output/approved_outreach_queue_v1.json
  -> staffordos/operator_daemon/output/send_readiness_gate_v1.json

## Current Source Problem

staffordos/outreach/leads.json currently contains controlled test data.

## Current Opportunity

Reuse the existing path by feeding it real qualified merchant candidates instead of rebuilding outreach.

## Next Required Step

Create or refresh one real-candidate input item, then run the existing draft -> approval -> readiness flow.
