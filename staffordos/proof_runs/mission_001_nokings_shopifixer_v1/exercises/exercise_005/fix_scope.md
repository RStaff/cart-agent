# Fix Scope

Status:
Complete

Mission:
Mission 001 - NoKings Shopify Engineering Training

Product:
ShopiFixer

Environment Type:
controlled_training

Store:
no-kings-athletics.myshopify.com

Exact Problem / Learning Objective:
Exercise 005 - Collection Page Inventory

The next governed training objective is to map the NoKings collection page file stack and its filtering, sorting, grid, pagination, and product-card dependencies so ShopiFixer can safely understand the collection-page architecture before any reversible implementation is considered.

Target Page / Template / Artifact:
templates/collection.json
sections/main-collection.liquid
sections/collection-list.liquid
snippets/product-grid.liquid
snippets/product-card.liquid
snippets/collection-card.liquid
snippets/list-filter.liquid
snippets/filter-remove-buttons.liquid
snippets/pagination-controls.liquid

Smallest Governed Scope:
Read-only inventory of the NoKings collection page architecture, including the template, section, block, and snippet chain that controls filters, sorting, pagination, grid layout, product cards, and collection metadata behavior.

In Scope:
- Collection page file-stack inventory
- Filter and sorting dependency mapping
- Pagination and infinite-scroll dependency mapping
- Product-card and collection-card dependency mapping
- Desktop/mobile architecture review
- Collection metadata dependency capture
- Knowledge capture for the collection-page surface

Out of Scope:
- Shopify theme edits
- Payment changes
- Completion changes
- Evidence fabrication
- Unscoped theme changes
- Broad merchant-selection architecture
- Reusing generic pilot truth for NoKings mission evidence

Merchant Approval Requirement:
No

Implementation Permitted:
No

Required Before Evidence:
- Existing NoKings discovery artifacts for collection-page context
- Prior mission knowledge from Exercise 004
- Archived collection-page and product-grid evidence from NoKings archives
- No new evidence capture required for scope completion

Success Criteria:
- The NoKings collection page file stack is mapped from template to section to block to snippet
- Filter, sorting, pagination, and product-card dependencies are identified
- Prior product-page knowledge is carried forward
- The scope is governed, analysis-only, and ready for the next controlled phase

Rollback Expectation:
- Restore this file to the previous scaffold state if the mission objective changes

Knowledge Capture Requirement:
- Record the file map, dependency chain, and safe-change observations for Mission 001 reuse

Source Artifacts:
- STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1.md
- SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1.md
- SHOPIFIXER_ENGINEERING_CURRICULUM_V1.md
- staffordos/implementation/p10_10_exercise_004_knowledge_consolidation_v1.md
- staffordos/implementation/p10_9_mission_001_exercise_004_certification_v1.md
- staffordos/audits/no_kings/product_discovery/collection_reference_v1.txt
- staffordos/shopifixer/patterns/pattern_003_collection_backed_product_grid_reuse_v1.md
- staffordos/audits/no_kings/reconciliation/dev_collection_all_products_current.json
- staffordos/audits/no_kings/reconciliation/dev_collection_all_current.html
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/collection.json
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/main-collection.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/collection-list.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/product-grid.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/product-card.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/collection-card.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/list-filter.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/filter-remove-buttons.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/pagination-controls.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/collection-links.js
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/product-card.js
