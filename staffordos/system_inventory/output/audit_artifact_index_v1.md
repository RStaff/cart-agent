# StaffordOS Audit Artifact Index

Generated: 2026-04-28T21:56:47Z

## Audit / Truth / Inventory Commits
93e7ac2f staffordos: add objective binding and fix system truth typing
2425ba9e infra: add enforceable pre-patch gate
43e0c84f infra: add static runtime shape diff tool
5875148f infra: add static and runtime shape mapping tools
bc947a65 infra: add canonical lead lifecycle registry
67585999 infra: add system truth sync agent
ce2f4600 infra: implement revenue truth agent
9a20220e infra: add dev task integrity agent
16f9c64c infra: add registry compatibility wrappers
5f95a838 infra: add registry reality audit
bb5a1255 Merge pull request #72 from RStaff/surface/shopifixer/product-patch-v1
03845971 surface: add ShopiFixer product patch lane
18c35dc2 infra: add system map v2.2 governance lane
c5a67798 On surface/shopifixer/wire_hero_cta_to_existing_runAudit: safety-before-branch-split-v1-real
335b509f untracked files on surface/shopifixer/wire_hero_cta_to_existing_runAudit: 16ae3a1c Add autonomous agent router scoring and execution loop
16ae3a1c Add autonomous agent router scoring and execution loop
59051818 Add governed agent registry and execution gate
ed8d28b7 Record first SMTP send through revenue loop
3fec528e Add approval decision agent v1
e49f7917 Add message validation agent
2ae0d16a Refresh truth after product boundary rollback
69a8b8d6 Add contact research agent v2
c7580775 Add contact enrichment bottleneck agent
d4304631 Classify revenue bottleneck from outreach queue truth
8492a84b Treat health-only route as valid system map state
a41cf9eb Make system map render from truth JSON
127ada88 Design Category and Decision Packet engines
8b29f5b7 Design Operator lead action endpoint
018f7347 Design Operator UI lead truth integration
521805da Design Shopifixer HTTP lead truth bridge
2b86cb60 Audit Shopifixer lead truth bridge
e9ed414c Add StaffordOS multi-repo deep inventory and integration plan
047e1ce3 Wire execution layer to existing noise classifier
4d576e2c Verify execution loop with existing hygiene layer
9c96e49e Add StaffordOS system map truth and execution layer v1
c55e205d fix oauth redirect uri
6b3c2aba fix oauth redirect uri
4dee9681 Refine hygiene state evaluation
ff99fc57 Refine hygiene state evaluation
125967d9 Fix false dirty state in hygiene evaluation
2d00b37d Fix false dirty state in hygiene evaluation
6dec344a Isolate hygiene runtime outputs and add operator front door
113e221d Isolate hygiene runtime outputs and add operator front door
435f91f1 Harden promotion blocker breakdown
946d2d01 Harden promotion blocker breakdown
10d45e18 Add promotion blocker breakdown tooling
8b2a5041 Add promotion blocker breakdown tooling
f6ffa41d Finalize hygiene governance tooling
5070e0b7 Finalize hygiene governance tooling
8b84ee52 Add hygiene governance tooling
ad07640d Add hygiene governance tooling
82a2d33e deploy-ready backend
6b4665fb deploy-ready backend

## Current Audit / Truth / Inventory Files
staffordos/agents/agent_registry_v1.json
staffordos/agents/system_truth_sync_agent_v1.mjs
staffordos/connectors/shopifixer_audit_to_outreach_v1.mjs
staffordos/hygiene/build_environment_inventory.js
staffordos/hygiene/environment_inventory_v1.json
staffordos/hygiene/output/environment_inventory_v1.json
staffordos/revenue/revenue_truth_v1.json
staffordos/revenue/revenue_truth_v1.md
staffordos/scorecards/guidedAuditEngine.js
staffordos/scorecards/runAuditResolver.js
staffordos/scorecards/verify_guided_audit.js
staffordos/scorecards/verify_run_audit.js
staffordos/system_inventory/objective_binding_v1.json
staffordos/system_inventory/output/audit_artifact_index_v1.md
staffordos/system_inventory/patch_gate_v1.mjs
staffordos/system_inventory/registry_alias_map_v1.mjs
staffordos/system_inventory/registry_reality_audit_v1.mjs
staffordos/system_inventory/shape_diff_v1.mjs
staffordos/system_inventory/shape_map_v1.mjs
staffordos/system_inventory/shape_runtime_v1.mjs
staffordos/system_inventory/source_runtime_policy_register_v1.md
staffordos/system_inventory/source_runtime_policy_register_v1.mjs
staffordos/system_map/system_map_truth_v1.json
staffordos/truth/lead_truth_store.mjs
staffordos/ui/operator-frontend/app/api/operator/system-map/route.ts
staffordos/ui/operator-frontend/app/api/operator/system-truth/route.ts
staffordos/ui/operator-frontend/app/operator/system-map/page.tsx

## Key Artifact Contents

### staffordos/system_map/system_map_truth_v1.json
{
  "version": "system_map_truth_v1",
  "generated_at": "2026-04-27T11:28:42.920Z",
  "sources": {
    "local_repo": "~/projects/cart-agent",
    "home_server_repo": "/home/ross/projects/cart-agent",
    "k8s_namespace": "cart-agent",
    "argocd_app": "abando"
  },
  "local": {
    "machine": "Darwin Mac 25.3.0 Darwin Kernel Version 25.3.0: Wed Jan 28 20:53:05 PST 2026; root:xnu-12377.81.4~5/RELEASE_ARM64_T6020 arm64",
    "branch": "main",
    "status": "M _system_audit/system_map_truth_v1.json\n M staffordos/agents/agent_execution_log_v1.json\n M staffordos/agents/execution_loop_log_v1.json\n M staffordos/agents/opportunity_scores_v1.json\n M staffordos/agents/opportunity_scoring_log_v1.json\n M staffordos/agents/run_agent_v1.mjs\n M staffordos/leads/contact_enrichment_agent_v1.mjs\n M staffordos/leads/contact_enrichment_log_v1.json\n M staffordos/leads/contact_research_queue_v1.json\n M staffordos/leads/message_validation_log_v1.json\n M staffordos/leads/outreach_queue.json\n M staffordos/leads/send_execution_log_v1.json\n M staffordos/revenue/revenue_truth_v1.json\n M staffordos/revenue/revenue_truth_v1.md\n M staffordos/system_map/command_center_v2.html\n M staffordos/system_map/system_map_truth_v1.json\n?? staffordos/agents/approval_interface_v1.mjs\n?? staffordos/agents/execution_driver_v1.mjs\n?? staffordos/agents/progress_contract_loader_v1.mjs\n?? staffordos/agents/progress_contract_v1.json\n?? staffordos/agents/validate_progress_contract_v1.mjs",
    "recent_commits": "16ae3a1c Add autonomous agent router scoring and execution loop\n59051818 Add governed agent registry and execution gate\nd30377cf Add followup agent v1\n34cfb76b Add reply response agent v1\naadbc210 Add reply interpretation agent v1\nb325e6a4 Add reply detection agent v1\ned8d28b7 Record first SMTP send through revenue loop\n35563f82 Add SMTP-backed send execution agent"
  },
  "server": {
    "reachable": true,
    "machine": "Linux home-server 6.6.87.2-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Thu Jun  5 18:30:46 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux",
    "branch": "fix/embedded-8081",
    "status": "M abando-frontend/app/page.tsx\n M abando-frontend/package-lock.json\n M web/prisma/schema.prisma\n?? _system_audit/\n?? abando-frontend/_config_bak/\n?? staffordos/",
    "recent_commits": "4f22104 Remove disabled ingress from kustomization\nb1f3cf6 Disable placeholder ingress from Argo health\n172cfef Align cart-agent k8s probes with backend port\n503a32d Fix cart-agent k8s image and backend port\n7825bfd Scope ArgoCD k8s resources with kustomization\nd25ce82 Move local deployment manifest out of ArgoCD path\n587d231 Add Next /api/auth aliases + bypass session-token middleware\n3dfd3c0 Fix Vercel build: use ESM-only next.config.mjs"
  },
  "revenue": {
    "truth": {
      "ok": true,
      "generated_at": "2026-04-25T20:41:43.940Z",
      "funnel": {
        "leads": 7,
        "qualified": 7,
        "queue": 7,
        "sent": 1,
        "replies": 0,
        "meetings": 0,
        "customers": 0
      },
      "derived_rates": {
        "reply_rate": 0,
        "meeting_rate": 0,
        "close_rate": 0
      },
      "outreach_classification": {
        "stages": {
          "contact_needed": 5,
          "message_needed": 0,
          "approval_needed": 0,
          "send_ready": 1,
          "sent": 1
        },
        "blocker": "contact_data",
        "next_action": "Find or add valid contact emails before generating or sending outreach.",
        "classified_preview": [
          {
            "domain": "fitgearpro.myshopify.com",
            "email": "",
            "status": "routed",
            "approved": false,
            "sent": false,
            "stage": "contact_needed"
          },
          {
            "domain": "homegoodsco.myshopify.com",
            "email": "",
            "status": "routed",
            "approved": false,
            "sent": false,
            "stage": "contact_needed"
          },
          {
            "domain": "luxbath.myshopify.com",
            "email": "",
            "status": "routed",
            "approved": false,
            "sent": false,
            "stage": "contact_needed"
          },
          {
            "domain": "modernpets.myshopify.com",
            "email": "",
            "status": "routed",
            "approved": false,
            "sent": false,
            "stage": "contact_needed"
          },
          {
            "domain": "store1.myshopify.com",
            "email": "owner@store1.com",
            "status": "sent",
            "approved": true,
            "sent": true,
            "stage": "sent"
          },
          {
            "domain": "store2.com",
            "email": "hello@store2.com",
            "status": "approved_for_send",
            "approved": true,
            "sent": false,
            "stage": "send_ready"
          },
          {
            "domain": "urbankitchen.myshopify.com",
            "email": "",
            "status": "routed",
            "approved": false,
            "sent": false,
            "stage": "contact_needed"
          }
        ]
      },
      "current_bottleneck": "message",
      "next_actions": [
        {
          "priority": 1,
          "action": "Find or add valid contact emails before generating or sending outreach.",
          "expected_outcome": "valid contact emails > 0"
        }
      ],
      "day_over_day": {
        "today": "2026-04-25",
        "yesterday": "2026-04-24",
        "today_progress_events": 1,
        "yesterday_progress_events": 0,
        "closer_to_revenue_today_than_yesterday": true,
        "reason": "More real funnel-progress events were recorded today than yesterday."
      },
      "sources": {
        "contact_targets": "/Users/rossstafford/projects/cart-agent/staffordos/leads/contact_targets.json",
        "qualified_targets": "/Users/rossstafford/projects/cart-agent/staffordos/leads/qualified_targets.json",
        "outreach_queue": "/Users/rossstafford/projects/cart-agent/staffordos/leads/outreach_queue.json",
        "outcomes": "/Users/rossstafford/projects/cart-agent/staffordos/leads/outcomes.json"
      }
    },
    "execution_packet": {
      "ok": true,
      "generated_at": "2026-04-25T19:35:42.155Z",
      "mode": "dry_run",
      "agent": "revenue_agent_v1",
      "bottleneck": "message",
      "decision": "no_action",
      "command": null,
      "expected_outcome": "sent > 0",
      "reason": "Current bottleneck is message, not outreach."
    }
  },
  "kubernetes": {
    "nodes": "NAME          STATUS   ROLES           AGE   VERSION        INTERNAL-IP     EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION                     CONTAINER-RUNTIME\nhome-server   Ready    control-plane   13d   v1.34.6+k3s1   172.31.55.216   <none>        Ubuntu 24.04.4 LTS   6.6.87.2-microsoft-standard-WSL2   containerd://2.2.2-bd1.34",
    "pods_all": "NAMESPACE     NAME                                                READY   STATUS      RESTARTS      AGE     IP            NODE          NOMINATED NODE   READINESS GATES\nargocd        argocd-application-controller-0                     1/1     Running     0             24h     10.42.0.114   home-server   <none>           <none>\nargocd        argocd-applicationset-controller-7d6d4bbf7c-cpmgj   1/1     Running     0             7h14m   10.42.0.120   home-server   <none>           <none>\nargocd        argocd-dex-server-694c74cbb8-jb9fd                  1/1     Running     4 (6d ago)    13d     10.42.0.105   home-server   <none>           <none>\nargocd        argocd-notifications-controller-67dd6d74b5-2d494    1/1     Running     4 (6d ago)    13d     10.42.0.103   home-server   <none>           <none>\nargocd        argocd-redis-85b9d55dc4-8d8kw                       1/1     Running     4 (6d ago)    13d     10.42.0.99    home-server   <none>           <none>\nargocd        argocd-repo-server-644855665b-m7msx                 1/1     Running     0             24h     10.42.0.113   home-server   <none>           <none>\nargocd        argocd-server-79fdfd7f5b-2sz8c                      1/1     Running     4 (6d ago)    13d     10.42.0.101   home-server   <none>           <none>\ncart-agent    cart-agent-backend-69695bfff7-6d8m4                 1/1     Running     0             24h     10.42.0.118   home-server   <none>           <none>\ncart-agent    cart-agent-backend-69695bfff7-xxvj4                 1/1     Running     5 (6d ago)    12d     10.42.0.112   home-server   <none>           <none>\nkube-system   coredns-76c974cb66-62ml5                            1/1     Running     5 (6d ago)    13d     10.42.0.106   home-server   <none>           <none>\nkube-system   helm-install-traefik-4f2w4                          0/1     Completed   1             13d     <none>        home-server   <none>           <none>\nkube-system   helm-install-traefik-crd-lrb4c                      0/1     Completed   0             13d     <none>        home-server   <none>           <none>\nkube-system   local-path-provisioner-8686667995-fv2dp             1/1     Running     5 (6d ago)    13d     10.42.0.98    home-server   <none>           <none>\nkube-system   metrics-server-c8774f4f4-ll2r9                      1/1     Running     5 (6d ago)    13d     10.42.0.100   home-server   <none>           <none>\nkube-system   svclb-traefik-87158b6f-pdnd9                        2/2     Running     10 (6d ago)   13d     10.42.0.111   home-server   <none>           <none>\nkube-system   traefik-c5c8bf4ff-dkwz5                             1/1     Running     5 (6d ago)    13d     10.42.0.109   home-server   <none>           <none>",
    "cart_agent": {
      "pods": "NAME                                  READY   STATUS    RESTARTS     AGE   IP            NODE          NOMINATED NODE   READINESS GATES\ncart-agent-backend-69695bfff7-6d8m4   1/1     Running   0            24h   10.42.0.118   home-server   <none>           <none>\ncart-agent-backend-69695bfff7-xxvj4   1/1     Running   5 (6d ago)   12d   10.42.0.112   home-server   <none>           <none>",
      "deploy": "NAME                 READY   UP-TO-DATE   AVAILABLE   AGE   CONTAINERS   IMAGES                             SELECTOR\ncart-agent-backend   2/2     2            2           13d   web          ghcr.io/rstaff/cart-agent:latest   app=cart-agent-backend",
      "svc": "NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE   SELECTOR\ncart-agent-svc   ClusterIP   10.43.127.252   <none>        80/TCP    13d   app=cart-agent-backend",
      "probe_root": "{\"ok\":true,\"service\":\"cart-agent-api\",\"route\":\"/\"}",
      "probe_health": "{\"ok\":true,\"service\":\"cart-agent-api\"}",
      "probe_healthz": ""
    },
    "argocd": {
      "app_summary": "RepoURL:https://github.com/RStaff/cart-agent\nTargetRevision:fix/embedded-8081\nPath:k8s\nSync:Synced\nHealth:Healthy\nMessage:",
      "pods": "NAME                                                READY   STATUS    RESTARTS     AGE     IP            NODE          NOMINATED NODE   READINESS GATES\nargocd-application-controller-0                     1/1     Running   0            24h     10.42.0.114   home-server   <none>           <none>\nargocd-applicationset-controller-7d6d4bbf7c-cpmgj   1/1     Running   0            7h14m   10.42.0.120   home-server   <none>           <none>\nargocd-dex-server-694c74cbb8-jb9fd                  1/1     Running   4 (6d ago)   13d     10.42.0.105   home-server   <none>           <none>\nargocd-notifications-controller-67dd6d74b5-2d494    1/1     Running   4 (6d ago)   13d     10.42.0.103   home-server   <none>           <none>\nargocd-redis-85b9d55dc4-8d8kw                       1/1     Running   4 (6d ago)   13d     10.42.0.99    home-server   <none>           <none>\nargocd-repo-server-644855665b-m7msx                 1/1     Running   0            24h     10.42.0.113   home-server   <none>           <none>\nargocd-server-79fdfd7f5b-2sz8c                      1/1     Running   4 (6d ago)   13d     10.42.0.101   home-server   <none>           <none>"
    }
  },
  "inferred_health": {
    "local_repo_clean": false,
    "server_repo_clean": false,
    "server_reachable": true,
    "argocd_degraded": false,
    "cart_agent_has_bad_pods": false,
    "deployment_expects_healthz": false,
    "health_path_mismatch": false,
    "revenue_truth_available": true,
    "revenue_bottleneck": "contact_data",
    "revenue_has_next_action": true
  },
  "next_actions": [
    {
      "priority": 1,
      "component": "revenue",
      "issue": "Current revenue bottleneck is contact_data.",
      "action": "Find or add valid contact emails before generating or sending outreach."
    },
    {
      "priority": 2,
      "component": "local repo hygiene",
      "issue": "Local repo has uncommitted or untracked changes.",
      "action": "Review git status before patching more system-map files."
    },
    {
      "priority": 3,
      "component": "server repo hygiene",
      "issue": "Home-server repo has uncommitted or untracked changes.",
      "action": "Review server git status before treating server repo as deploy-clean."
    }
  ],
  "ok": true,
  "artifact": "system_map_truth_v1",
  "source": "system_truth_sync_agent_v1",
  "system_status": {
    "capability_matrix_ok": true,
    "capability_summary": {
      "total": 11,
      "ready": 11,
      "ready_to_packet_only": 0,
      "needs_connector": 0,
      "needs_agent_repair": 0,
      "blocked_by_missing_capability": 0
    },
    "revenue_truth_ok": true,
    "current_bottleneck": "lead_supply_or_contact_quality",
    "next_actions": [
      {
        "priority": 1,
        "action": "Add stronger real leads or valid contact emails.",
        "expected_outcome": "Move at least one item to the next real funnel state."
      }
    ]
  },
  "latest_revenue_truth": {
    "ok": true,
    "artifact": "revenue_truth_v1",
    "generated_at": "2026-04-27T11:28:42.909Z",
    "funnel": {

### staffordos/revenue/revenue_truth_v1.json
{
  "ok": true,
  "artifact": "revenue_truth_v1",
  "generated_at": "2026-04-27T09:47:22.103Z",
  "funnel": {
    "outreach_queue": 7,
    "approval_items": 0,
    "send_ledger_items": 0,
    "outcomes": 3
  },
  "stages": {
    "captured": 0,
    "message_generated": 0,
    "integrity_passed": 0,
    "approval_needed": 0,
    "approved": 0,
    "send_ready": 0,
    "pending_send": 0,
    "dry_run_ready": 0,
    "sent": 0,
    "replies": 0,
    "customers": 0
  },
  "current_bottleneck": "lead_supply_or_contact_quality",
  "next_actions": [
    {
      "priority": 1,
      "action": "Add stronger real leads or valid contact emails.",
      "expected_outcome": "Move at least one item to the next real funnel state."
    }
  ],
  "sources": {
    "outreach_queue": "staffordos/leads/outreach_queue.json",
    "approval_queue": "staffordos/leads/approval_queue_v1.json",
    "send_ledger": "staffordos/leads/send_ledger_v1.json",
    "outcomes": "staffordos/leads/outcomes.json"
  }
}

### staffordos/revenue/revenue_truth_v1.md
# Revenue Truth v1

Generated at: 2026-04-27T09:47:22.103Z

## Funnel

- Outreach queue: 7
- Approval items: 0
- Send ledger items: 0
- Outcomes: 3

## Stages

- captured: 0
- message_generated: 0
- integrity_passed: 0
- approval_needed: 0
- approved: 0
- send_ready: 0
- pending_send: 0
- dry_run_ready: 0
- sent: 0
- replies: 0
- customers: 0

## Current Bottleneck

- lead_supply_or_contact_quality

## Next Action

- Add stronger real leads or valid contact emails.

## Sources

- staffordos/leads/outreach_queue.json
- staffordos/leads/approval_queue_v1.json
- staffordos/leads/send_ledger_v1.json
- staffordos/leads/outcomes.json

No fake metrics. This reflects local truth files only.

### staffordos/hygiene/environment_inventory_v1.json
{
  "generated_at": "2026-04-04T14:15:09.978Z",
  "inventory_version": "environment_inventory_v1",
  "note": "Inventory only. This file documents current environment ownership and current known issues. It is not a new policy source.",
  "environments": [
    {
      "environment_id": "LOCAL_FRONTEND",
      "canonical_url": "http://localhost:3000",
      "purpose": "Operator-only frontend rehearsal for install, proof, and layout validation.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "INSTALL_FLOW",
        "MERCHANT_DASHBOARD",
        "EXPERIENCE_PROOF"
      ],
      "source_of_truth_for": [
        "local_ui_layout",
        "local_cta_visibility",
        "operator_rehearsal"
      ],
      "not_valid_for": [
        "merchant_proof",
        "live_oauth",
        "delivery_execution",
        "production_promotion"
      ],
      "critical_dependencies": [
        "local Next.js frontend",
        "frontend environment variables",
        "operator browser session"
      ],
      "current_known_issues": [
        "Local frontend is not valid promotion proof for merchant experience.",
        "Historical local vs production ownership drift created confusion in merchant-facing flows."
      ]
    },
    {
      "environment_id": "LOCAL_API",
      "canonical_url": "http://localhost:8081",
      "purpose": "Operator-only backend validation for local APIs and forwarded webhook behavior.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "API_ENDPOINTS",
        "WEBHOOKS"
      ],
      "source_of_truth_for": [
        "local_api_behavior",
        "local_webhook_handler_validation"
      ],
      "not_valid_for": [
        "merchant_proof",
        "live_oauth",
        "production_delivery_success",
        "production_promotion"
      ],
      "critical_dependencies": [
        "local backend process",
        "local env files",
        "optional webhook forwarding"
      ],
      "current_known_issues": [
        "Local API success does not prove production delivery or merchant-safe routing.",
        "Historical local/prod mismatch created environment ownership drift."
      ]
    },
    {
      "environment_id": "LOCAL_NETWORK",
      "canonical_url": "http://127.0.0.1:8081",
      "purpose": "Loopback variant of the local backend when tooling prefers explicit 127.0.0.1 access.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "API_ENDPOINTS",
        "WEBHOOKS"
      ],
      "source_of_truth_for": [
        "loopback_local_api_access",
        "tooling_compatibility_checks"
      ],
      "not_valid_for": [
        "merchant_proof",
        "live_oauth",
        "production_delivery_success",
        "production_promotion"
      ],
      "critical_dependencies": [
        "local backend process",
        "loopback networking",
        "operator tooling"
      ],
      "current_known_issues": [
        "127.0.0.1 is operator-only and must never appear in merchant-facing flows.",
        "Historical localhost and loopback leakage contributed to environment confusion."
      ]
    },
    {
      "environment_id": "PRODUCTION_FRONTEND",
      "canonical_url": "https://app.abando.ai",
      "purpose": "Canonical merchant-facing frontend for install, proof, returned state, and Shopify callback host.",
      "primary_user": "MERCHANT",
      "allowed_surfaces": [
        "INSTALL_FLOW",
        "MERCHANT_DASHBOARD",
        "EXPERIENCE_PROOF",
        "OAUTH_CALLBACK"
      ],
      "source_of_truth_for": [
        "merchant_ui",
        "merchant_proof_surface",
        "oauth_callback_host",
        "returned_page_render"
      ],
      "not_valid_for": [
        "backend_webhook_processing",
        "local_operator_debug_assumptions"
      ],
      "critical_dependencies": [
        "Vercel deployment",
        "frontend env alignment",
        "production API proxying"
      ],
      "current_known_issues": [
        "OAuth callback drift previously pointed installs at the Render host instead of app.abando.ai.",
        "Live proof loop is not yet fully completed end to end.",
        "Frontend production deployment is currently blocked from this environment because VERCEL_TOKEN is missing."
      ]
    },
    {
      "environment_id": "PRODUCTION_API",
      "canonical_url": "https://cart-agent-api.onrender.com",
      "purpose": "Canonical live backend truth for API responses, health checks, delivery execution, and webhooks.",
      "primary_user": "SYSTEM",
      "allowed_surfaces": [
        "API_ENDPOINTS",
        "WEBHOOKS"
      ],
      "source_of_truth_for": [
        "api_health",
        "delivery_readiness",
        "delivery_execution",
        "status_truth",
        "webhook_processing"
      ],
      "not_valid_for": [
        "merchant_facing_page_render",
        "oauth_redirect_host"
      ],
      "critical_dependencies": [
        "Render deployment",
        "backend env variables",
        "Prisma/database",
        "delivery providers",
        "Shopify webhooks"
      ],
      "current_known_issues": [
        "Render API must never be used as the OAuth redirect host.",
        "Live proof loop currently stops if no real storefront checkout has been captured.",
        "Historical base URL drift created multiple sources of truth for merchant-facing URLs."
      ]
    },
    {
      "environment_id": "SHOPIFY_EMBEDDED",
      "canonical_url": "https://admin.shopify.com",
      "purpose": "Merchant-facing embedded Shopify context used when Abando opens inside Shopify Admin.",
      "primary_user": "MERCHANT",
      "allowed_surfaces": [
        "MERCHANT_DASHBOARD",
        "INSTALL_FLOW"
      ],
      "source_of_truth_for": [
        "embedded_navigation_context",
        "merchant_admin_launch_context"
      ],
      "not_valid_for": [
        "direct_api_truth",
        "oauth_callback_host_source_of_truth",
        "local_operator_testing"
      ],
      "critical_dependencies": [
        "Shopify Admin session",
        "embedded app configuration",
        "frontend render compatibility"
      ],
      "current_known_issues": [
        "Embedded flows depend on canonical production frontend routing, not local assumptions.",
        "Embedded proof is not valid unless the underlying production frontend and API are aligned."
      ]
    },
    {
      "environment_id": "STAFFORDOS_OPERATOR_SURFACE",
      "canonical_url": "http://localhost:3000/operator",
      "purpose": "Operator-only command and analysis surface for StaffordOS workflows and diagnostics.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "OPERATOR_SURFACE"
      ],
      "source_of_truth_for": [
        "operator coordination",
        "diagnostics",
        "internal execution planning"
      ],
      "not_valid_for": [
        "merchant_proof",
        "merchant_install_claims",
        "delivery_execution_proof",
        "oauth_production_validation"
      ],
      "critical_dependencies": [
        "local frontend",
        "operator auth/session",
        "StaffordOS modules"
      ],
      "current_known_issues": [
        "Operator surfaces are separate from merchant-facing Abando truth.",
        "Mixed operator and merchant concerns in one worktree are currently creating operational drag."
      ]
    }
  ]
}

### staffordos/hygiene/output/environment_inventory_v1.json
{
  "generated_at": "2026-04-04T15:57:45.981Z",
  "inventory_version": "environment_inventory_v1",
  "note": "Inventory only. This file documents current environment ownership and current known issues. It is not a new policy source.",
  "machine_role": "BUILD_TEST_ONLY",
  "machine_role_source": "default",
  "environments": [
    {
      "environment_id": "LOCAL_FRONTEND",
      "canonical_url": "http://localhost:3000",
      "purpose": "Operator-only frontend rehearsal for install, proof, and layout validation.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "INSTALL_FLOW",
        "MERCHANT_DASHBOARD",
        "EXPERIENCE_PROOF"
      ],
      "source_of_truth_for": [
        "local_ui_layout",
        "local_cta_visibility",
        "operator_rehearsal"
      ],
      "not_valid_for": [
        "merchant_proof",
        "live_oauth",
        "delivery_execution",
        "production_promotion"
      ],
      "critical_dependencies": [
        "local Next.js frontend",
        "frontend environment variables",
        "operator browser session"
      ],
      "current_known_issues": [
        "Local frontend is not valid promotion proof for merchant experience.",
        "Historical local vs production ownership drift created confusion in merchant-facing flows."
      ]
    },
    {
      "environment_id": "LOCAL_API",
      "canonical_url": "http://localhost:8081",
      "purpose": "Operator-only backend validation for local APIs and forwarded webhook behavior.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "API_ENDPOINTS",
        "WEBHOOKS"
      ],
      "source_of_truth_for": [
        "local_api_behavior",
        "local_webhook_handler_validation"
      ],
      "not_valid_for": [
        "merchant_proof",
        "live_oauth",
        "production_delivery_success",
        "production_promotion"
      ],
      "critical_dependencies": [
        "local backend process",
        "local env files",
        "optional webhook forwarding"
      ],
      "current_known_issues": [
        "Local API success does not prove production delivery or merchant-safe routing.",
        "Historical local/prod mismatch created environment ownership drift."
      ]
    },
    {
      "environment_id": "LOCAL_NETWORK",
      "canonical_url": "http://127.0.0.1:8081",
      "purpose": "Loopback variant of the local backend when tooling prefers explicit 127.0.0.1 access.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "API_ENDPOINTS",
        "WEBHOOKS"
      ],
      "source_of_truth_for": [
        "loopback_local_api_access",
        "tooling_compatibility_checks"
      ],
      "not_valid_for": [
        "merchant_proof",
        "live_oauth",
        "production_delivery_success",
        "production_promotion"
      ],
      "critical_dependencies": [
        "local backend process",
        "loopback networking",
        "operator tooling"
      ],
      "current_known_issues": [
        "127.0.0.1 is operator-only and must never appear in merchant-facing flows.",
        "Historical localhost and loopback leakage contributed to environment confusion."
      ]
    },
    {
      "environment_id": "PRODUCTION_FRONTEND",
      "canonical_url": "https://app.abando.ai",
      "purpose": "Canonical merchant-facing frontend for install, proof, returned state, and Shopify callback host.",
      "primary_user": "MERCHANT",
      "allowed_surfaces": [
        "INSTALL_FLOW",
        "MERCHANT_DASHBOARD",
        "EXPERIENCE_PROOF",
        "OAUTH_CALLBACK"
      ],
      "source_of_truth_for": [
        "merchant_ui",
        "merchant_proof_surface",
        "oauth_callback_host",
        "returned_page_render"
      ],
      "not_valid_for": [
        "backend_webhook_processing",
        "local_operator_debug_assumptions"
      ],
      "critical_dependencies": [
        "Vercel deployment",
        "frontend env alignment",
        "production API proxying"
      ],
      "current_known_issues": [
        "OAuth callback drift previously pointed installs at the Render host instead of app.abando.ai.",
        "Live proof loop is not yet fully completed end to end.",
        "Frontend production deployment is currently blocked from this environment because VERCEL_TOKEN is missing."
      ]
    },
    {
      "environment_id": "PRODUCTION_API",
      "canonical_url": "https://cart-agent-api.onrender.com",
      "purpose": "Canonical live backend truth for API responses, health checks, delivery execution, and webhooks.",
      "primary_user": "SYSTEM",
      "allowed_surfaces": [
        "API_ENDPOINTS",
        "WEBHOOKS"
      ],
      "source_of_truth_for": [
        "api_health",
        "delivery_readiness",
        "delivery_execution",
        "status_truth",
        "webhook_processing"
      ],
      "not_valid_for": [
        "merchant_facing_page_render",
        "oauth_redirect_host"
      ],
      "critical_dependencies": [
        "Render deployment",
        "backend env variables",
        "Prisma/database",
        "delivery providers",
        "Shopify webhooks"
      ],
      "current_known_issues": [
        "Render API must never be used as the OAuth redirect host.",
        "Live proof loop currently stops if no real storefront checkout has been captured.",
        "Historical base URL drift created multiple sources of truth for merchant-facing URLs."
      ]
    },
    {
      "environment_id": "SHOPIFY_EMBEDDED",
      "canonical_url": "https://admin.shopify.com",
      "purpose": "Merchant-facing embedded Shopify context used when Abando opens inside Shopify Admin.",
      "primary_user": "MERCHANT",
      "allowed_surfaces": [
        "MERCHANT_DASHBOARD",
        "INSTALL_FLOW"
      ],
      "source_of_truth_for": [
        "embedded_navigation_context",
        "merchant_admin_launch_context"
      ],
      "not_valid_for": [
        "direct_api_truth",
        "oauth_callback_host_source_of_truth",
        "local_operator_testing"
      ],
      "critical_dependencies": [
        "Shopify Admin session",
        "embedded app configuration",
        "frontend render compatibility"
      ],
      "current_known_issues": [
        "Embedded flows depend on canonical production frontend routing, not local assumptions.",
        "Embedded proof is not valid unless the underlying production frontend and API are aligned."
      ]
    },
    {
      "environment_id": "STAFFORDOS_OPERATOR_SURFACE",
      "canonical_url": "http://localhost:3000/operator",
      "purpose": "Operator-only command and analysis surface for StaffordOS workflows and diagnostics.",
      "primary_user": "OPERATOR",
      "allowed_surfaces": [
        "OPERATOR_SURFACE"
      ],
      "source_of_truth_for": [
        "operator coordination",
        "diagnostics",
        "internal execution planning"
      ],
      "not_valid_for": [
        "merchant_proof",
        "merchant_install_claims",
        "delivery_execution_proof",
        "oauth_production_validation"
      ],
      "critical_dependencies": [
        "local frontend",
        "operator auth/session",
        "StaffordOS modules"
      ],
      "current_known_issues": [
        "Operator surfaces are separate from merchant-facing Abando truth.",
        "Mixed operator and merchant concerns in one worktree are currently creating operational drag."
      ]
    }
  ]
}

### staffordos/agents/agent_registry_v1.json
{
  "version": "agent_registry_v1",
  "generated_at": "2026-04-25T20:50:02.928Z",
  "counts": {
    "agents": 15,
    "high_risk": 2,
    "medium_risk": 11,
    "low_risk": 0
  },
  "agents": [
    {
      "id": "run_agent_v1",
      "version": "v1",
      "department": "unknown",
      "purpose": "run agent v1",
      "entrypoint": "staffordos/agents/run_agent_v1.mjs",
      "reads_from": [
        "staffordos/agents/agent_registry_v1.json",
        "staffordos/agents/agent_execution_log_v1.json"
      ],
      "writes_to": [
        "staffordos/agents/agent_registry_v1.json",
        "staffordos/agents/agent_execution_log_v1.json"
      ],
      "allowed_actions": [
        "read_truth",
        "write_log",
        "write_truth"
      ],
      "forbidden_actions": [
        "write_outside_declared_scope",
        "modify_product_boundary_without_approval",
        "send_email",
        "approve_message",
        "generate_message"
      ],
      "requires_approval": true,
      "risk_level": "high",
      "verification_command": "node staffordos/agents/run_agent_v1.mjs",
      "status": "registered",
      "constraints": [
        "no_cross_domain_writes",
        "must_use_existing_data_structures",
        "no_schema_drift",
        "no_fake_success"
      ],
      "auto_repair": {
        "enabled": false,
        "strategy": "manual_review_first"
      }
    },
    {
      "id": "approval_decision_agent_v1",
      "version": "v1",
      "department": "revenue",
      "purpose": "approval decision agent v1",
      "entrypoint": "staffordos/leads/approval_decision_agent_v1.mjs",
      "reads_from": [
        "staffordos/leads/outreach_queue.json",
        "staffordos/leads/approval_queue_v1.json",
        "staffordos/leads/approval_decision_log_v1.json"
      ],
      "writes_to": [
        "staffordos/leads/outreach_queue.json",
        "staffordos/leads/approval_queue_v1.json",
        "staffordos/leads/approval_decision_log_v1.json"
      ],
      "allowed_actions": [
        "read_truth",
        "write_log",
        "approval_decision",
        "write_truth"
      ],
      "forbidden_actions": [
        "write_outside_declared_scope",
        "modify_product_boundary_without_approval",
        "send_email",
        "generate_message"
      ],
      "requires_approval": false,
      "risk_level": "medium",
      "verification_command": "node staffordos/leads/approval_decision_agent_v1.mjs",
      "status": "registered",
      "constraints": [
        "no_cross_domain_writes",
        "must_use_existing_data_structures",
        "no_schema_drift",
        "no_fake_success"
      ],
      "auto_repair": {
        "enabled": false,
        "strategy": "manual_review_first"
      }
    },
    {
      "id": "contact_enrichment_agent_v1",
      "version": "v1",
      "department": "revenue",
      "purpose": "contact enrichment agent v1",
      "entrypoint": "staffordos/leads/contact_enrichment_agent_v1.mjs",
      "reads_from": [
        "staffordos/leads/outreach_queue.json",
        "staffordos/leads/contact_enrichment_log_v1.json",
        "staffordos/leads/contact_research_queue_v1.json"
      ],
      "writes_to": [
        "staffordos/leads/outreach_queue.json",
        "staffordos/leads/contact_enrichment_log_v1.json",
        "staffordos/leads/contact_research_queue_v1.json"
      ],
      "allowed_actions": [
        "read_truth",
        "write_log",
        "contact_research",
        "write_truth"
      ],
      "forbidden_actions": [
        "write_outside_declared_scope",
        "modify_product_boundary_without_approval",
        "send_email",
        "approve_message",
        "generate_message"
      ],
      "requires_approval": false,
      "risk_level": "medium",
      "verification_command": "node staffordos/leads/contact_enrichment_agent_v1.mjs",
      "status": "registered",
      "constraints": [
        "no_cross_domain_writes",
        "must_use_existing_data_structures",
        "no_schema_drift",
        "no_fake_success"
      ],
      "auto_repair": {
        "enabled": false,
        "strategy": "manual_review_first"
      }
    },
    {
      "id": "contact_research_agent_v1",
      "version": "v1",
      "department": "revenue",
      "purpose": "contact research agent v1",
      "entrypoint": "staffordos/leads/contact_research_agent_v1.mjs",
      "reads_from": [
        "staffordos/leads/outreach_queue.json",
        "staffordos/leads/contact_research_queue_v1.json",
        "staffordos/leads/contact_research_log_v1.json"
      ],
      "writes_to": [
        "staffordos/leads/outreach_queue.json",
        "staffordos/leads/contact_research_queue_v1.json",
        "staffordos/leads/contact_research_log_v1.json"
      ],
      "allowed_actions": [
        "read_truth",
        "write_log",
        "contact_research",
        "write_truth"
      ],
      "forbidden_actions": [
        "write_outside_declared_scope",
        "modify_product_boundary_without_approval",
        "send_email",
        "approve_message",
        "generate_message"
      ],
      "requires_approval": false,
      "risk_level": "medium",
      "verification_command": "node staffordos/leads/contact_research_agent_v1.mjs",
      "status": "registered",
      "constraints": [
        "no_cross_domain_writes",
        "must_use_existing_data_structures",
        "no_schema_drift",
        "no_fake_success"
      ],
      "auto_repair": {
        "enabled": false,
        "strategy": "manual_review_first"
      }
    },
    {
      "id": "followup_agent_v1",
      "version": "v1",
      "department": "revenue",
      "purpose": "followup agent v1",
      "entrypoint": "staffordos/leads/followup_agent_v1.mjs",
      "reads_from": [
        "staffordos/leads/send_ledger_v1.json",
        "staffordos/leads/approval_queue_v1.json",
        "staffordos/leads/followup_log_v1.json"
      ],
      "writes_to": [
        "staffordos/leads/send_ledger_v1.json",
        "staffordos/leads/approval_queue_v1.json",
        "staffordos/leads/followup_log_v1.json"
      ],
      "allowed_actions": [
        "read_truth",
        "write_log",
        "draft_followup",
        "write_truth"
      ],
      "forbidden_actions": [
        "write_outside_declared_scope",
        "modify_product_boundary_without_approval",
        "send_email",
        "approve_message"
      ],
      "requires_approval": false,
      "risk_level": "medium",
      "verification_command": "node staffordos/leads/followup_agent_v1.mjs",
      "status": "registered",
      "constraints": [
        "no_cross_domain_writes",
        "must_use_existing_data_structures",
        "no_schema_drift",
        "no_fake_success"
      ],

### staffordos/system_inventory/source_runtime_policy_register_v1.md
# Source vs Runtime Policy Register v1

Generated: 2026-04-26T18:26:16.929Z
Branch: surface/shopifixer/wire_hero_cta_to_existing_runAudit

## Operating Rule

**Generated JSON is runtime output by default unless explicitly promoted to canonical truth or evidence artifact.**

## Policy

### SOURCE

**Meaning:** Versioned, intentional system logic or human-readable truth.

**Commit rule:** May be committed only on the correct scoped branch.

**Examples:**
- `staffordos/**/*.mjs`
- `staffordos/**/*.js`
- `staffordos/**/*.md`
- `staffordos/SYSTEM_RULES.md`
- `staffordos/system_map/system_map_truth_v1.md`
- `staffordos/system_map/system_map_truth_v1.json ONLY if manually maintained as canonical truth`
- `staffordos/agents/agent_registry_v1.json ONLY if manually maintained registry`

### RUNTIME_OUTPUT

**Meaning:** Generated report, log, queue, ledger, score, snapshot, or audit output.

**Commit rule:** Do not commit by default. Restore, ignore, or archive only after approval.

**Examples:**
- `staffordos/**/*_log*.json`
- `staffordos/**/*_report*.json`
- `staffordos/**/*queue*.json`
- `staffordos/**/*ledger*.json`
- `staffordos/system_inventory/*classifier*.json`
- `staffordos/system_inventory/*split_plan*.json`
- `staffordos/system_inventory/*report*.json`
- `staffordos/hygiene/output/*`
- `staffordos/system_map/command_center_v2.html`

### EVIDENCE_ARTIFACT

**Meaning:** Generated output intentionally preserved as evidence for a decision or audit.

**Commit rule:** May be committed only with explicit evidence label and reason.

**Examples:**
- `staffordos/system_inventory/system_map_v2_2_decision_register.json`
- `staffordos/system_inventory/system_map_v2_2_enforcement_mapping.json`

### BACKUP

**Meaning:** Timestamped or manual backup files.

**Commit rule:** Do not commit. Archive or delete after approval.

**Examples:**
- `*.bak`
- `*.backup`
- `*pre_restore*`
- `*pre_recover*`

### ACTIVE_PRODUCT_WORK

**Meaning:** Product-facing implementation work tied to a specific branch and product outcome.

**Commit rule:** Commit only on product branch after governance/runtime files are split away.

**Examples:**
- `abando-frontend/app/shopifixer/`
- `staffordos/agents/apply_shopifixer_*.mjs`
- `staffordos/surfaces/`
- `staffordos/packets/`

## Next Step

Use this policy to revise the split plan before branch separation.

### staffordos/system_inventory/objective_binding_v1.json
{
  "personal_objectives": [
    "Provide for daughters",
    "Time flexibility",
    "Build scalable income",
    "Operate with control"
  ],
  "business_objectives": [
    "Close deals",
    "Generate revenue",
    "Automate operations"
  ],
  "business_requirements": {
    "close_deals": [
      "lead discovery",
      "outreach",
      "response tracking",
      "conversion tracking"
    ],
    "generate_revenue": [
      "event detection",
      "recovery trigger",
      "message sending",
      "conversion attribution"
    ],
    "operate_system": [
      "blocker detection",
      "next action clarity",
      "execution tracking"
    ]
  },
  "functional_requirements": {
    "leads_engine": [
      "lead storage",
      "lifecycle tracking",
      "outreach tracking"
    ],
    "send_engine": [
      "email sending",
      "sms sending",
      "send logging"
    ],
    "decision_engine": [
      "current blocker",
      "next action",
      "readiness state"
    ]
  },
  "ui_binding": {
    "console": "operator interface",
    "command_center": "decision engine",
    "capacity": "service execution",
    "leads": "deal engine",
    "revenue_command": "revenue truth",
    "analytics": "feedback loop",
    "products": "product summaries",
    "system_map": "system truth"
  }
}
