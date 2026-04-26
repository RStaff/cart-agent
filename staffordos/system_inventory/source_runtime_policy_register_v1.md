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
