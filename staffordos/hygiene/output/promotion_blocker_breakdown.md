# Promotion Blocker Breakdown

## Current Promotion Status

- Status: `STILL_BLOCKED`
- Current Operating State: `CLEAN`
- Deployment State: `BLOCKED_ON_THIS_MACHINE_ONLY`
- Merchant Proof State: `INCOMPLETE`
- Promotion State: `STILL_BLOCKED`

## Blocker Categories

- HYGIENE_BLOCKERS: 0
- DEPLOY_BLOCKERS: 2
- PRODUCT_BLOCKERS: 2
- ENVIRONMENT_BLOCKERS: 3
- GOVERNANCE_BLOCKERS: 0

## Exact Remaining Blockers

### HYGIENE_BLOCKERS

- None

### DEPLOY_BLOCKERS

- Blocker: `missing_vercel_token`
  Category: DEPLOY_BLOCKERS
  Why: Deploy credentials are missing in the local environment used for promotion actions.
  Evidence: VERCEL_TOKEN missing while abando-frontend/.vercel is present
  Next Action: Set VERCEL_TOKEN before treating frontend deployment from this environment as available.
  Blocks Continued Local Work: no
  Blocks Promotion: yes
  Blocks Merchant Proof: no
  Blocks Deployment: yes

- Blocker: `missing_render_token`
  Category: DEPLOY_BLOCKERS
  Why: Deploy credentials are missing in the local environment used for promotion actions.
  Evidence: RENDER_API_KEY/RENDER_TOKEN missing while Render config is present
  Next Action: Set RENDER_API_KEY or RENDER_TOKEN before treating Render promotion from this environment as available.
  Blocks Continued Local Work: no
  Blocks Promotion: yes
  Blocks Merchant Proof: no
  Blocks Deployment: yes

### PRODUCT_BLOCKERS

- Blocker: `live_proof_loop_is_not_yet_fully_completed_end_to_end`
  Category: PRODUCT_BLOCKERS
  Why: Merchant proof is not yet complete end to end.
  Evidence: Live proof loop is not yet fully completed end to end.
  Next Action: Finish the real proof loop: send, receive, click, return, attribution.
  Blocks Continued Local Work: no
  Blocks Promotion: yes
  Blocks Merchant Proof: yes
  Blocks Deployment: no

- Blocker: `live_proof_loop_currently_stops_if_no_real_storefront_checkout_has_been_captured`
  Category: PRODUCT_BLOCKERS
  Why: Merchant proof is not yet complete end to end.
  Evidence: Live proof loop currently stops if no real storefront checkout has been captured.
  Next Action: Capture a real live storefront checkout, then rerun send-live-test and the return flow.
  Blocks Continued Local Work: no
  Blocks Promotion: yes
  Blocks Merchant Proof: yes
  Blocks Deployment: no

### ENVIRONMENT_BLOCKERS

- Blocker: `oauth_callback_drift_previously_pointed_installs_at_the_render_host_instead_of_app_abando_ai`
  Category: ENVIRONMENT_BLOCKERS
  Why: Historical environment drift still affects promotion confidence.
  Evidence: OAuth callback drift previously pointed installs at the Render host instead of app.abando.ai.
  Next Action: Keep merchant-facing OAuth locked to app.abando.ai and verify no regressions before promotion.
  Blocks Continued Local Work: no
  Blocks Promotion: yes
  Blocks Merchant Proof: yes
  Blocks Deployment: no

- Blocker: `render_api_must_never_be_used_as_the_oauth_redirect_host`
  Category: ENVIRONMENT_BLOCKERS
  Why: Historical environment drift still affects promotion confidence.
  Evidence: Render API must never be used as the OAuth redirect host.
  Next Action: Keep merchant-facing OAuth locked to app.abando.ai and verify no regressions before promotion.
  Blocks Continued Local Work: no
  Blocks Promotion: yes
  Blocks Merchant Proof: yes
  Blocks Deployment: no

- Blocker: `historical_base_url_drift_created_multiple_sources_of_truth_for_merchant_facing_urls`
  Category: ENVIRONMENT_BLOCKERS
  Why: Historical environment drift still affects promotion confidence.
  Evidence: Historical base URL drift created multiple sources of truth for merchant-facing URLs.
  Next Action: Verify merchant-facing URLs resolve from the canonical production frontend and API only.
  Blocks Continued Local Work: no
  Blocks Promotion: yes
  Blocks Merchant Proof: yes
  Blocks Deployment: no

### GOVERNANCE_BLOCKERS

- None


## What No Longer Blocks

- Unstaged and untracked source changes are cleared from the active worktree.
- Branch scope is now clean and mostly isolated to governance/hygiene.

## Allowed Next Step

- targeted blocker resolution in priority order

## Blocked Next Step

- promotion

## Exact Resolution Order

- Restore deploy credentials and re-verify canonical production environment ownership.
- Complete the real merchant proof loop with a real storefront checkout and verified return.
