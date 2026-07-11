# P10.2 NoKings ShopiFixer Merchant Authority Reconciliation

## 1. Canonical NoKings Shopify Store

Canonical NoKings Shopify store domain:

- `no-kings-athletics.myshopify.com`

Observed alias / alternate writable execution target:

- `no-kings-athletics-dev.myshopify.com`

Authority read:

- `staffordos/governance/archive/20260604_artifact_archive/canonical_systems_v1.md` explicitly names `no-kings-athletics.myshopify.com` as the canonical proof store for public evidence.
- The same authority notes that `no-kings-athletics-dev.myshopify.com` is only confirmed as theme-access / write-adjacent evidence.

Conclusion:

- The authoritative NoKings store is the public `no-kings-athletics.myshopify.com`.
- The dev store is a separate writable environment and must not be treated as the canonical proof target unless a mission explicitly recaptures proof there.

## 2. Where NoKings Merchant Identity Is Stored

| File | Field / Evidence | What it proves |
| --- | --- | --- |
| `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md` | `environment: NoKings Shopify store`, `related training store: NoKings` | Mission 001 is explicitly tied to NoKings training. |
| `staffordos/audits/no_kings/evidence/before_evidence_record_v1.md` | `Store URL: https://no-kings-athletics.myshopify.com` | Before-state evidence is bound to the public NoKings store. |
| `staffordos/governance/archive/20260604_artifact_archive/canonical_systems_v1.md` | `Canonical proof store for public evidence: no-kings-athletics.myshopify.com` | Canonical proof target is public NoKings. |
| `staffordos/governance/archive/20260604_artifact_archive/canonical_artifact_inventory_v1.md` | `Store URL: https://no-kings-athletics.myshopify.com` and `public store domain` | Public proof evidence is the canonical NoKings store. |
| `staffordos/audits/no_kings/no_kings_shopifixer_sprint_validation_v1.md` | `Store: No Kings Athletics` | The selected sprint validation is NoKings-specific. |
| `staffordos/audits/no_kings/final_audit/no_kings_shopifixer_final_audit_v1.md` | `Store reviewed: No Kings Athletics` | Final audit scope is NoKings Athletics. |
| `staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md` | Dev-store access confirmation | Confirms a separate dev store exists for execution access, not as the canonical proof store. |
| `staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt` | Dev Horizon theme pull | Confirms theme access/write-adjacent activity on the dev store. |

## 3. Prior NoKings Changes Successfully Made

Repository-backed truth does **not** prove a completed NoKings storefront mutation.

What is proven:

| Mission / artifact | Target surface | Execution method | Before evidence | Change artifact | Validation evidence | Rollback method |
| --- | --- | --- | --- | --- | --- | --- |
| Mission 001 / NoKings training | Theme literacy, homepage and product-path analysis | Read-only discovery, theme access, and theme pull against NoKings/dev evidence | Before screenshots and annotations exist | No completed storefront after-state is proven in this repo | Final audit, sprint validation, theme pull evidence | Not applicable for a completed mutation, because no completed mutation is proven |

What is **not** proven:

- No repository-backed NoKings after-state.
- No completed NoKings proof package.
- No validated NoKings applied theme change.
- No rollback artifact for a completed NoKings mutation.

Closest proven execution path:

- `staffordos/audits/no_kings/evidence/before_evidence_record_v1.md`
- `staffordos/audits/no_kings/evidence/before/homepage_desktop_before.png`
- `staffordos/audits/no_kings/evidence/before/homepage_mobile_before.png`
- `staffordos/audits/no_kings/execution_truth/execution_access_result_v1.md`
- `staffordos/audits/no_kings/execution_truth/theme_pull_test_v2.txt`

Those artifacts prove discovery, evidence capture, and dev-store theme access, not a finished merchant-facing mutation.

## 4. Why the Current Pilot Workspace Resolves to `cart-agent-dev.myshopify.com`

Resolver chain:

1. `staffordos/ui/operator-frontend/lib/operator/loadShopifixerCommandCenter.ts` reads `staffordos/shopifixer/shopifixer_command_center_v1.json`.
2. That command-center JSON binds `merchant.store` and `merchant.client_id` to `cart-agent-dev.myshopify.com`.
3. `staffordos/ui/operator-frontend/app/operator/shopifixer-pilot/page.tsx` uses that merchant as `merchantKey`.
4. The same page matches `staffordos/clients/shopifixer_offer_latest.json` by `merchant_shop` / `client_id`, which are also `cart-agent-dev.myshopify.com`.
5. The page then reads `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`, whose fulfillment item is also keyed to `cart-agent-dev.myshopify.com`.
6. `staffordos/snapshots/primary_action_snapshot_v1.json` is likewise keyed to `opp_cart-agent-dev.myshopify.com`.
7. `staffordos/qa/evaluate_shopifixer_operational_readiness_v1.mjs` resolves the same merchant from fulfillment, client registry, and offer truth, then reports the same store.

First incorrect or overly generic authority source:

- `staffordos/shopifixer/shopifixer_command_center_v1.json`

Why:

- It is the first merchant anchor consumed by the Pilot Workspace.
- It is generic ShopiFixer runtime truth, not a NoKings mission binding.
- Everything downstream follows that merchant selection faithfully.

## 5. Legitimate References vs Drift

Legitimate `cart-agent-dev.myshopify.com` references:

- Abando development / test store proof
- Current ShopiFixer service truth
- Current pilot workspace merchant
- Current client registry / offer / fulfillment / snapshot / readiness outputs

Legitimate NoKings references:

- `no-kings-athletics.myshopify.com` as the canonical proof target
- `no-kings-athletics-dev.myshopify.com` only as a separately confirmed writable / theme-access environment
- NoKings before evidence, audits, and execution-truth artifacts

Drift:

- Treating `cart-agent-dev.myshopify.com` as the NoKings training merchant
- Reusing `cart-agent-dev.myshopify.com` scope, evidence, proof, seal, payment, or fulfillment truth for NoKings
- Rebinding the current ShopiFixer pilot workspace to NoKings without a separate mission binding layer

## 6. Canonical Execution Path For A Governed NoKings Change

Repository-backed canonical path:

1. StaffordOS mission authority names NoKings explicitly.
2. A NoKings merchant binding is resolved to the canonical NoKings store.
3. ShopiFixer execution request is governed by StaffordOS.
4. Shopify authority check confirms the exact store being used.
5. Before evidence is captured on that same store.
6. The smallest reversible change is applied.
7. Validation is performed.
8. After evidence is captured on the same store.
9. Rollback artifact is preserved.
10. Lesson / pattern is recorded back into StaffordOS.

Actual repository-backed state today:

- The NoKings path is documented and partially evidenced.
- The current generic Pilot Workspace is not the NoKings executor.
- No completed NoKings mutation loop is proven in the repository.

## 7. What The Generic Pilot Workspace Should Be

Recommendation: **mission-specific workspace**

Reason:

- The current generic Pilot Workspace is already bound to `cart-agent-dev.myshopify.com`.
- NoKings has a separate canonical proof store and separate evidence archive.
- Explicit merchant selection inside the same generic workspace would increase cross-binding risk.
- A mission-specific NoKings workspace preserves the Abando/cart-agent-dev binding while keeping NoKings isolated.

## 8. Artifacts That Must Not Be Reused For NoKings

Quarantine these current ShopiFixer pilot artifacts from NoKings:

- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/fix_scope.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/before_evidence.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/after_evidence.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.md`
- `staffordos/proof_runs/internal_shopifixer_dry_run_v1/merchant_proof_package.seal.json`
- `staffordos/proof_runs/output/evidence_manifest_v1.json`
- `staffordos/fulfillment/shopifixer_fulfillment_truth_v1.json`
- `staffordos/clients/client_registry_v1.json` current `cart-agent-dev.myshopify.com` binding
- `staffordos/clients/shopifixer_offer_latest.json`
- `staffordos/clients/operator_dashboard_snapshot_v1.json`
- `staffordos/snapshots/primary_action_snapshot_v1.json`
- `staffordos/qa/output/shopifixer_operational_readiness_v1.json`
- `staffordos/qa/evaluate_shopifixer_operational_readiness_v1.mjs`
- `staffordos/qa/validate_shopifixer_operational_readiness_v1.mjs`
- `staffordos/qa/validate_shopifixer_completion_authority_v1.mjs`

Also quarantine the validation-fixture proof artifacts already present in the dirty worktree:

- current `before_evidence.md`
- current `after_evidence.md`
- current `merchant_proof_package.md`
- current `merchant_proof_package.seal.json`
- current proof-run evidence manifest contents tied to validation fixture output

## 9. Smallest Safe Correction Plan

1. Keep `cart-agent-dev.myshopify.com` bound to the current Abando / ShopiFixer runtime.
2. Introduce a separate NoKings mission binding layer instead of mutating the current client registry broadly.
3. Bind that mission layer to `no-kings-athletics.myshopify.com` as the canonical proof target.
4. If only `no-kings-athletics-dev.myshopify.com` is writable, recapture before/after evidence against dev and label the proof explicitly as dev-store proof.
5. Create a separate NoKings proof run directory and keep historical proof artifacts untouched.
6. Reuse existing governed evidence/proof patterns only within the NoKings mission path.
7. Avoid broad client-registry mutation; add only the minimum mission-scoped binding or read model needed.
8. Require payment only if the canonical NoKings doctrine for the specific mission explicitly requires it.

## Certification

- **Recommendation for correcting the binding:** CONDITIONAL GO

Why conditional:

- The canonical NoKings store is clear.
- The current ShopiFixer pilot runtime is still Abando/dev-scoped.
- The repository does not yet prove a completed NoKings write authority path inside the current generic workspace.
- A safe correction requires a separate mission-specific binding, not a direct retarget of the existing ShopiFixer pilot truth.
