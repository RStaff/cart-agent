# Cleanup Execution Plan

## CLEANUP PLAN

### STEP 1 — Generated Noise Removal

Files/dirs:
- /Users/rossstafford/projects/cart-agent/abando-frontend/.next/build
- /Users/rossstafford/projects/cart-agent/abando-frontend/.next/cache
- /Users/rossstafford/projects/cart-agent/abando-frontend/.next/dev
- /Users/rossstafford/projects/cart-agent/abando-frontend/.next/diagnostics
- /Users/rossstafford/projects/cart-agent/abando-frontend/.next/server
- /Users/rossstafford/projects/cart-agent/abando-frontend/.next/static
- /Users/rossstafford/projects/cart-agent/abando-frontend/.next/types
- /Users/rossstafford/projects/cart-agent/web/node_modules/.cache

Commands:
```bash
rm -rf '/Users/rossstafford/projects/cart-agent/abando-frontend/.next/build' '/Users/rossstafford/projects/cart-agent/abando-frontend/.next/cache' '/Users/rossstafford/projects/cart-agent/abando-frontend/.next/dev' '/Users/rossstafford/projects/cart-agent/abando-frontend/.next/diagnostics' '/Users/rossstafford/projects/cart-agent/abando-frontend/.next/server' '/Users/rossstafford/projects/cart-agent/abando-frontend/.next/static' '/Users/rossstafford/projects/cart-agent/abando-frontend/.next/types' '/Users/rossstafford/projects/cart-agent/web/node_modules/.cache'
```

### STEP 2 — Safe Commits

Files:
- staffordos/hygiene/

Commands:
```bash
git -C '/Users/rossstafford/projects/cart-agent' add 'staffordos/hygiene/'
git -C '/Users/rossstafford/projects/cart-agent' commit -m "Add hygiene governance tooling"
```

### STEP 3 — Safe Stash

Files:
- _archive_repo_cleanup/
- abando-frontend/app/marketing/demo/playground/page.tsx
- abando-frontend/app/marketing/page.tsx
- abando-frontend/app/marketing/supplements/page.tsx
- abando-frontend/app/marketing/supplements/playbook/page.tsx
- abando-frontend/app/marketing/verticals/page.tsx
- abando-frontend/app/marketing/women-boutique/page.tsx
- abando-frontend/app/marketing/women-boutique/playbook/page.tsx
- abando-frontend/app/marketing/womens-boutique/page.tsx
- ross_operator/
- staffordos/docs/
- staffordos/governance/
- staffordos/leads/README.md
- staffordos/leads/candidate_stores.json
- staffordos/leads/contact_discovery.js
- staffordos/leads/contact_research.js
- staffordos/leads/contact_research_queue.json
- staffordos/leads/enrich_stores.js
- staffordos/leads/enriched_stores.json
- staffordos/leads/ingest_candidates.js
- staffordos/leads/install_events.json
- staffordos/leads/live_validated_stores.json
- staffordos/leads/outreach.js
- staffordos/leads/outreach_queue.json
- staffordos/leads/outreach_templates.json
- staffordos/leads/premium_source_candidates.json
- staffordos/leads/premium_source_intake.js
- staffordos/leads/quality_filter.js
- staffordos/leads/router.js
- staffordos/leads/run_lead_engine.js
- staffordos/leads/validate_live_stores.js
- staffordos/pm/
- staffordos/proof/
- staffordos/ui/operator-frontend/README.md
- staffordos/ui/operator-frontend/app/api/family/
- staffordos/ui/operator-frontend/app/api/leads/queue/route.ts
- staffordos/ui/operator-frontend/app/api/operator/abando/
- staffordos/ui/operator-frontend/app/api/operator/actions/
- staffordos/ui/operator-frontend/app/api/operator/billing-readiness/
- staffordos/ui/operator-frontend/app/api/operator/daily-brief/
- staffordos/ui/operator-frontend/app/api/operator/daily-decision-board/
- staffordos/ui/operator-frontend/app/api/operator/execution/
- staffordos/ui/operator-frontend/app/api/operator/launch-readiness/
- staffordos/ui/operator-frontend/app/api/operator/loop-status/
- staffordos/ui/operator-frontend/app/api/operator/message-readiness/
- staffordos/ui/operator-frontend/app/api/operator/opportunities/
- staffordos/ui/operator-frontend/app/api/operator/public-surface-readiness/
- staffordos/ui/operator-frontend/app/api/operator/query/
- staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts
- staffordos/ui/operator-frontend/app/api/operator/routed-query/
- staffordos/ui/operator-frontend/app/api/operator/send-readiness/
- staffordos/ui/operator-frontend/app/api/operator/system-check/
- staffordos/ui/operator-frontend/app/api/operator/system-health/
- staffordos/ui/operator-frontend/app/family/
- staffordos/ui/operator-frontend/app/globals.css
- staffordos/ui/operator-frontend/app/operator/command-center/page.tsx
- staffordos/ui/operator-frontend/app/operator/family/
- staffordos/ui/operator-frontend/app/operator/products/page.tsx
- staffordos/ui/operator-frontend/app/operator/professional/
- staffordos/ui/operator-frontend/app/operator/profiles/
- staffordos/ui/operator-frontend/components/family/
- staffordos/ui/operator-frontend/components/operator/AbandoModulePanel.tsx
- staffordos/ui/operator-frontend/components/operator/DailyBriefPanel.tsx
- staffordos/ui/operator-frontend/components/operator/DailyDecisionBoardPanel.tsx
- staffordos/ui/operator-frontend/components/operator/LaunchReadinessPanel.tsx
- staffordos/ui/operator-frontend/components/operator/OperatorConsole.tsx
- staffordos/ui/operator-frontend/components/operator/OperatorNav.tsx
- staffordos/ui/operator-frontend/components/operator/ProfessionalQASurface.tsx
- staffordos/ui/operator-frontend/components/operator/RossCommandCenterSurface.tsx
- staffordos/ui/operator-frontend/components/operator/SystemHealthCard.tsx
- staffordos/ui/operator-frontend/components/operator/TodayQueuePanel.tsx
- staffordos/ui/operator-frontend/components/operator/TopRecoveryOpportunitiesPanel.tsx
- staffordos/ui/operator-frontend/lib/familyAccess.ts
- staffordos/ui/operator-frontend/lib/operatorClient.ts
- staffordos/ui/operator-frontend/lib/rossOperatorArtifacts.ts
- staffordos/ui/operator-frontend/next.config.mjs
- staffordos/ui/operator-frontend/package-lock.json
- staffordos/ui/operator-frontend/package.json
- web/src/dev/checkoutPublic.esm.js.bak
- web/src/index.before-full-rewrite.js
- web/src/index.before-loadshops-fix.js
- web/src/index.before-shopify-fix.js
- web/src/public/index.html.bak

Commands:
```bash
git -C '/Users/rossstafford/projects/cart-agent' stash push -u -m "cleanup-stash" -- '_archive_repo_cleanup/' 'abando-frontend/app/marketing/demo/playground/page.tsx' 'abando-frontend/app/marketing/page.tsx' 'abando-frontend/app/marketing/supplements/page.tsx' 'abando-frontend/app/marketing/supplements/playbook/page.tsx' 'abando-frontend/app/marketing/verticals/page.tsx' 'abando-frontend/app/marketing/women-boutique/page.tsx' 'abando-frontend/app/marketing/women-boutique/playbook/page.tsx' 'abando-frontend/app/marketing/womens-boutique/page.tsx' 'ross_operator/' 'staffordos/docs/' 'staffordos/governance/' 'staffordos/leads/README.md' 'staffordos/leads/candidate_stores.json' 'staffordos/leads/contact_discovery.js' 'staffordos/leads/contact_research.js' 'staffordos/leads/contact_research_queue.json' 'staffordos/leads/enrich_stores.js' 'staffordos/leads/enriched_stores.json' 'staffordos/leads/ingest_candidates.js' 'staffordos/leads/install_events.json' 'staffordos/leads/live_validated_stores.json' 'staffordos/leads/outreach.js' 'staffordos/leads/outreach_queue.json' 'staffordos/leads/outreach_templates.json' 'staffordos/leads/premium_source_candidates.json' 'staffordos/leads/premium_source_intake.js' 'staffordos/leads/quality_filter.js' 'staffordos/leads/router.js' 'staffordos/leads/run_lead_engine.js' 'staffordos/leads/validate_live_stores.js' 'staffordos/pm/' 'staffordos/proof/' 'staffordos/ui/operator-frontend/README.md' 'staffordos/ui/operator-frontend/app/api/family/' 'staffordos/ui/operator-frontend/app/api/leads/queue/route.ts' 'staffordos/ui/operator-frontend/app/api/operator/abando/' 'staffordos/ui/operator-frontend/app/api/operator/actions/' 'staffordos/ui/operator-frontend/app/api/operator/billing-readiness/' 'staffordos/ui/operator-frontend/app/api/operator/daily-brief/' 'staffordos/ui/operator-frontend/app/api/operator/daily-decision-board/' 'staffordos/ui/operator-frontend/app/api/operator/execution/' 'staffordos/ui/operator-frontend/app/api/operator/launch-readiness/' 'staffordos/ui/operator-frontend/app/api/operator/loop-status/' 'staffordos/ui/operator-frontend/app/api/operator/message-readiness/' 'staffordos/ui/operator-frontend/app/api/operator/opportunities/' 'staffordos/ui/operator-frontend/app/api/operator/public-surface-readiness/' 'staffordos/ui/operator-frontend/app/api/operator/query/' 'staffordos/ui/operator-frontend/app/api/operator/ross-command-center/route.ts' 'staffordos/ui/operator-frontend/app/api/operator/routed-query/' 'staffordos/ui/operator-frontend/app/api/operator/send-readiness/' 'staffordos/ui/operator-frontend/app/api/operator/system-check/' 'staffordos/ui/operator-frontend/app/api/operator/system-health/' 'staffordos/ui/operator-frontend/app/family/' 'staffordos/ui/operator-frontend/app/globals.css' 'staffordos/ui/operator-frontend/app/operator/command-center/page.tsx' 'staffordos/ui/operator-frontend/app/operator/family/' 'staffordos/ui/operator-frontend/app/operator/products/page.tsx' 'staffordos/ui/operator-frontend/app/operator/professional/' 'staffordos/ui/operator-frontend/app/operator/profiles/' 'staffordos/ui/operator-frontend/components/family/' 'staffordos/ui/operator-frontend/components/operator/AbandoModulePanel.tsx' 'staffordos/ui/operator-frontend/components/operator/DailyBriefPanel.tsx' 'staffordos/ui/operator-frontend/components/operator/DailyDecisionBoardPanel.tsx' 'staffordos/ui/operator-frontend/components/operator/LaunchReadinessPanel.tsx' 'staffordos/ui/operator-frontend/components/operator/OperatorConsole.tsx' 'staffordos/ui/operator-frontend/components/operator/OperatorNav.tsx' 'staffordos/ui/operator-frontend/components/operator/ProfessionalQASurface.tsx' 'staffordos/ui/operator-frontend/components/operator/RossCommandCenterSurface.tsx' 'staffordos/ui/operator-frontend/components/operator/SystemHealthCard.tsx' 'staffordos/ui/operator-frontend/components/operator/TodayQueuePanel.tsx' 'staffordos/ui/operator-frontend/components/operator/TopRecoveryOpportunitiesPanel.tsx' 'staffordos/ui/operator-frontend/lib/familyAccess.ts' 'staffordos/ui/operator-frontend/lib/operatorClient.ts' 'staffordos/ui/operator-frontend/lib/rossOperatorArtifacts.ts' 'staffordos/ui/operator-frontend/next.config.mjs' 'staffordos/ui/operator-frontend/package-lock.json' 'staffordos/ui/operator-frontend/package.json' 'web/src/dev/checkoutPublic.esm.js.bak' 'web/src/index.before-full-rewrite.js' 'web/src/index.before-loadshops-fix.js' 'web/src/index.before-shopify-fix.js' 'web/src/public/index.html.bak'
```

### STEP 4 — Decision Required

Files:
- abando-frontend/app/api/_proxy-utils.ts
- abando-frontend/app/api/auth/callback/
- abando-frontend/app/api/billing/
- abando-frontend/app/api/experience/
- abando-frontend/app/api/experiments/recommendations/route.ts
- abando-frontend/app/api/recovery-actions/
- abando-frontend/app/api/recovery/
- abando-frontend/app/api/signals/route.ts
- abando-frontend/app/api/signals/top/route.ts
- abando-frontend/app/audit-result/page.tsx
- abando-frontend/app/auth/
- abando-frontend/app/billing/
- abando-frontend/app/embedded/dashboard/page.tsx
- abando-frontend/app/embedded/page.tsx
- abando-frontend/app/experience/
- abando-frontend/app/install/shopify/page.tsx
- abando-frontend/app/layout.tsx
- abando-frontend/app/privacy/page.tsx
- abando-frontend/app/proof/
- abando-frontend/app/recover/
- abando-frontend/app/shopify-app/
- abando-frontend/app/shopify/callback/route.ts
- abando-frontend/app/terms/page.tsx
- abando-frontend/app/verticals/page.tsx
- abando-frontend/app/verticals/supplements/page.tsx
- abando-frontend/app/verticals/women-boutique/page.tsx
- abando-frontend/deploy_prod.sh
- abando-frontend/middleware.ts
- abando-frontend/next.config.mjs
- abando-frontend/public/favicon.ico
- abando-frontend/src/components/BrandLogo.tsx
- abando-frontend/src/components/EmbeddedAdminTitleBar.tsx
- abando-frontend/src/components/MarketingLandingPage.tsx
- abando-frontend/src/components/brand/PublicHeader.tsx
- abando-frontend/src/components/install/InstallClient.tsx
- abando-frontend/src/lib/storeLabel.ts
- abando-frontend/vercel.json
- package-lock.json
- package.json
- shopify.app.r12b-dev.toml
- shopify.app.toml
- staffordos/action_memory/
- staffordos/deploy/registry/sites.json
- staffordos/dev/README.md
- staffordos/dev/abando_public_demo_runbook.md
- staffordos/enrichment/
- staffordos/events/
- staffordos/execution_assist/
- staffordos/icp_engine/
- staffordos/modules/
- staffordos/operator/
- staffordos/opportunities/
- staffordos/outreach/experiment_config.json
- staffordos/outreach/message_performance_summary.json
- staffordos/outreach/message_variants.json
- staffordos/query_router/
- staffordos/review/
- staffordos/shared/
- staffordos/ui/icp-engine-frontend/
- staffordos/ui/surfaces/
- web/dev/
- web/package-lock.json
- web/package.json
- web/src/abandoDevProxy.js
- web/src/auth/getUser.js
- web/src/clients/prisma.js
- web/src/clients/stripe.js
- web/src/components/abandoStatusCard.js
- web/src/content/
- web/src/db.js
- web/src/index.finalize-backup.js
- web/src/index.js
- web/src/index.js.pre_gdpr_patch.20260106_120522
- web/src/index.js.pre_git_restore.20260106_120427
- web/src/index.js.pre_recover.20260106_123244
- web/src/index.js.pre_restore_fix.20260106_121550
- web/src/index.js.pre_restore_fix99.20260106_122018
- web/src/index.js.pre_restore_fix99.20260106_123819
- web/src/index.js.pre_restore_fix99.20260106_123921
- web/src/index.shopify-fix-backup.js
- web/src/index.syntaxfix-backup.js
- web/src/jobs/repository.js
- web/src/jobs/repository.ts
- web/src/jobs/types.ts
- web/src/jobs/worker.js
- web/src/lib/decisionLogs.js
- web/src/lib/emailSender.js
- web/src/lib/merchantBillingState.js
- web/src/lib/recoveryAttribution.js
- web/src/lib/send-worker.js
- web/src/lib/smsSender.js
- web/src/lib/storefrontCheckoutDetector.js
- web/src/lib/stripeConfig.js
- web/src/middleware/auth.js
- web/src/middleware/devAuth.js
- web/src/middleware/usageGate.js
- web/src/public/checkout_grader.html
- web/src/public/checkout_score_demo.html
- web/src/public/dashboard/index.html
- web/src/public/index.html
- web/src/routes/billing.js
- web/src/routes/billing_public.js
- web/src/routes/checkoutSignals.esm.js
- web/src/routes/installShopify.esm.js
- web/src/routes/internalTest.esm.js
- web/src/routes/invites.esm.js
- web/src/routes/landing.esm.js
- web/src/routes/me.js
- web/src/routes/orderWebhook.esm.js
- web/src/routes/pricing.esm.js
- web/src/routes/publicPages.esm.js
- web/src/routes/scorecard.esm.js
- web/src/routes/shopifyAppListing.esm.js
- web/src/routes/snippet.esm.js
- web/src/services/entitlements.js
- web/src/system-events.js
- web/src/system-events.ts

### STEP 5 — Environment Risk Notes

- Do not touch or rotate .env files during cleanup without an explicit config decision.
- Frontend production deployment remains blocked from this environment if VERCEL_TOKEN is absent.
- Promotion remains blocked while the worktree cleanup gate is not READY_TO_WORK.
- RENDER_API_KEY/RENDER_TOKEN missing while Render config is present
- VERCEL_TOKEN missing while abando-frontend/.vercel is present

### STEP 6 — Post-Cleanup Verification

Command:
```bash
node /Users/rossstafford/projects/cart-agent/staffordos/hygiene/run_hygiene_control_loop.js
```

## CLASSIFICATION SUMMARY

- Cleanup gate status: `BLOCKED_FOR_PROMOTION`
- SAFE_TO_COMMIT: 1
- SAFE_TO_STASH: 83
- GENERATED_NOISE: 8
- REQUIRES_DECISION: 117
- DO_NOT_TOUCH: 50

## DO NOT TOUCH

- /Users/rossstafford/projects/cart-agent/.env
- /Users/rossstafford/projects/cart-agent/.env.bak_1765840168
- /Users/rossstafford/projects/cart-agent/.env.bak_1765842159
- /Users/rossstafford/projects/cart-agent/.env.bak_1766258457
- /Users/rossstafford/projects/cart-agent/.env.bak_1766258862
- /Users/rossstafford/projects/cart-agent/.env.bak_1766260345
- /Users/rossstafford/projects/cart-agent/.env.bak_1766260353
- /Users/rossstafford/projects/cart-agent/.env.bak_1766265948
- /Users/rossstafford/projects/cart-agent/.env.bak_1766266220
- /Users/rossstafford/projects/cart-agent/.env.bak_1766266237
- /Users/rossstafford/projects/cart-agent/.env.bak_1766266264
- /Users/rossstafford/projects/cart-agent/.env.bak_1766266996
- /Users/rossstafford/projects/cart-agent/.env.bak_1766267014
- /Users/rossstafford/projects/cart-agent/.env.bak_1766267231
- /Users/rossstafford/projects/cart-agent/.env.bak_1766268647
- /Users/rossstafford/projects/cart-agent/.env.bak_1766269929
- /Users/rossstafford/projects/cart-agent/.env.example
- /Users/rossstafford/projects/cart-agent/.env.local
- /Users/rossstafford/projects/cart-agent/.env.local.bak_20251228_132842
- /Users/rossstafford/projects/cart-agent/_bak_dupe_app_20260106_151913/cart-agent.DUPLICATE/web/.env.example
- /Users/rossstafford/projects/cart-agent/abando-frontend/.env.local
- /Users/rossstafford/projects/cart-agent/abando-frontend/.env.local.bak.20260401101112
- /Users/rossstafford/projects/cart-agent/abando-frontend/.vercel/.env.production.local
- /Users/rossstafford/projects/cart-agent/frontend/.env.local
- /Users/rossstafford/projects/cart-agent/frontend/.env.production
- /Users/rossstafford/projects/cart-agent/staffordos/dev/.env.abando.local
- /Users/rossstafford/projects/cart-agent/staffordos/dev/.env.abando.local.example
- /Users/rossstafford/projects/cart-agent/staffordos/ui/operator-frontend/.env.local
- /Users/rossstafford/projects/cart-agent/staffordos/ui/operator-frontend/.env.local.example
- /Users/rossstafford/projects/cart-agent/web/.env
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1765840168
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1765842159
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1765844193
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1765849410
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766258457
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766258862
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766260345
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766260353
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766265948
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766267231
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766268647
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766269929
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766289413
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766343354
- /Users/rossstafford/projects/cart-agent/web/.env.bak_1766363859
- /Users/rossstafford/projects/cart-agent/web/.env.bak_20260304_111858
- /Users/rossstafford/projects/cart-agent/web/.env.example
- /Users/rossstafford/projects/cart-agent/web/.env.local
- /Users/rossstafford/projects/cart-agent/web/shopify/.env
- /Users/rossstafford/projects/cart-agent/web/shopify/.env.example
