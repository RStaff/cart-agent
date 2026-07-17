# SHOPIFIXER_ENGINEERING_CURRICULUM_V1

## Executive Summary

ShopiFixer must master the practical engineering of Shopify themes before it can work on production merchants independently. The curriculum below moves from read-only theme literacy, to controlled edits in NoKings, to validated reusable patterns, to merchant-ready work.

Current classification: **CONDITIONAL GO**

ShopiFixer is ready to continue controlled NoKings training, but it is not yet ready for autonomous production merchant engagements. The main gaps are breadth of Shopify file mastery, repeated rollback rehearsal, and enough exercised pattern depth across non-homepage surfaces.

---

## 1) Canonical Competencies for a Senior Shopify Engineer

1. Read Shopify theme architecture at the file-system level.
2. Trace a visible UI element back to its section, block, snippet, asset, and setting sources.
3. Distinguish layout, templates, sections, snippets, assets, config, and locales.
4. Explain how JSON templates assemble sections and blocks.
5. Predict how Liquid objects affect render-time output.
6. Safely modify homepage, product, collection, cart, header, footer, and trust surfaces.
7. Make responsive changes that preserve desktop and mobile behavior.
8. Preserve cart and checkout-adjacent behavior while changing presentation.
9. Use before/after evidence to prove a fix.
10. Roll back a theme change cleanly and quickly.
11. Use theme settings and schema before editing Liquid.
12. Avoid breaking shared snippets and global shell components.
13. Validate changes across viewports and interaction states.
14. Diagnose theme behavior from rendered output and source references.
15. Classify edits by risk and select the smallest safe change.
16. Reuse established patterns instead of inventing new ones.
17. Record lessons and reusable patterns in durable training artifacts.
18. Work from an authority model, not from chat memory.
19. Separate read-only audit work from supervised fixes.
20. Translate merchant goals into theme-safe implementation steps.

---

## 2) Learning Modules

### Module 1 - Shopify Theme Architecture Basics

**Objective**
- Understand how Shopify themes are structured and how a rendered page is assembled.

**Concepts**
- layout
- templates
- sections
- blocks
- snippets
- assets
- config
- locales
- Liquid execution
- JSON templates

**Required Shopify knowledge**
- what a theme directory contains
- how templates reference sections
- how sections define schema and blocks
- how snippets are shared
- how assets and settings affect behavior

**Prerequisite modules**
- none

**Practical exercises**
- identify the directories in a theme backup
- locate the homepage template
- trace one rendered element to its source file

**Graduation criteria**
- can explain the render chain for a homepage, product page, and cart page
- can name the purpose of each major theme directory

**Common mistakes**
- assuming a page is one file
- confusing snippets with sections
- treating settings data as code

**Validation methods**
- source tree inspection
- render-chain trace from UI to file
- verbal explanation checked against actual files

---

### Module 2 - NoKings Theme Inventory

**Objective**
- Build a complete inventory of the NoKings theme structure before making changes.

**Concepts**
- homepage section order
- shared header/footer shell
- global configuration
- theme-specific assets
- static blocks versus dynamic blocks

**Required Shopify knowledge**
- index template structure
- section-group JSON
- schema settings
- theme editor persistence

**Prerequisite modules**
- Module 1

**Practical exercises**
- inventory homepage sections
- inventory product, collection, and cart templates
- inventory header and footer groups

**Graduation criteria**
- can produce a file map for the core storefront surfaces
- can name the source of every visible homepage element

**Common mistakes**
- missing shared shell files
- overlooking config/locales
- ignoring static block nesting

**Validation methods**
- file inventory checklist
- direct source inspection
- compare rendered UI to file map

---

### Module 3 - Homepage and Discovery Surfaces

**Objective**
- Learn how homepage and discovery pages are assembled and how merchandising is structured.

**Concepts**
- hero sections
- product lists
- collection-backed merchandising
- CTA hierarchy
- hero media fallback
- product cards

**Required Shopify knowledge**
- homepage JSON template composition
- hero section schema
- product-list section schema
- shared product-card snippet behavior

**Prerequisite modules**
- Module 1
- Module 2

**Practical exercises**
- map the NoKings homepage
- map product card composition
- identify safe visual-only changes

**Graduation criteria**
- can explain the homepage architecture without guessing
- can identify one safe homepage improvement and one risky homepage change

**Common mistakes**
- changing product logic when only visual emphasis is needed
- editing hero media without validating mobile fallback
- assuming product list is a simple grid

**Validation methods**
- homepage render trace
- desktop/mobile screenshot comparison
- collection and CTA verification

---

### Module 4 - Product, Collection, and Cart Surfaces

**Objective**
- Understand commerce-critical surfaces and their shared dependencies.

**Concepts**
- product information sections
- media galleries
- collection grid behavior
- cart summary
- add-to-cart behavior
- quick add

**Required Shopify knowledge**
- product.json
- collection.json
- cart.json
- product-card snippets
- add-to-cart snippet behavior

**Prerequisite modules**
- Module 1
- Module 2

**Practical exercises**
- inventory product page file stack
- inventory collection page file stack
- inventory cart page file stack

**Graduation criteria**
- can identify the minimum safe file set for a product or cart change
- can describe how a card or cart action is wired

**Common mistakes**
- touching shared card snippets without checking every consumer
- ignoring empty-state behavior
- not validating cart interactions after a cosmetic change

**Validation methods**
- product view check
- collection view check
- cart behavior check
- add-to-cart interaction check

---

### Module 5 - Global Shell: Header, Footer, Navigation, Trust

**Objective**
- Learn the shared shell components that affect every page.

**Concepts**
- header groups
- announcement bars
- drawer navigation
- localization
- footer utilities
- trust and policy surfaces

**Required Shopify knowledge**
- group JSON structure
- header and footer section dependencies
- shared navigation snippets
- global JS assets for menus and announcements

**Prerequisite modules**
- Module 1
- Module 2

**Practical exercises**
- inventory header group dependencies
- inventory footer group dependencies
- trace announcement bar and drawer behavior

**Graduation criteria**
- can identify global versus page-specific UI
- can describe the risk of changing shell components

**Common mistakes**
- treating global header changes as local
- breaking mobile navigation by editing the wrong snippet
- editing trust surfaces without validating every page

**Validation methods**
- desktop and mobile header test
- footer render test
- announcement bar interaction test

---

### Module 6 - Safe Editing, Validation, and Rollback

**Objective**
- Learn how to make and reverse Shopify changes safely.

**Concepts**
- smallest safe change
- before/after evidence
- rollback path
- validation checklist
- regression detection
- risk classification

**Required Shopify knowledge**
- theme editor persistence
- section settings versus code
- shared snippet blast radius

**Prerequisite modules**
- Module 1
- Module 2
- Module 3
- Module 4
- Module 5

**Practical exercises**
- propose a safe change without applying it
- define rollback for a homepage visual change
- validate a non-destructive change with screenshots

**Graduation criteria**
- can produce a valid rollback plan before editing
- can validate a change without relying on guesswork

**Common mistakes**
- editing without a rollback path
- skipping mobile validation
- changing shared components for a page-specific issue

**Validation methods**
- screenshot evidence
- diff review
- rollback rehearsal

---

### Module 7 - Conversion-Focused Shopify Engineering

**Objective**
- Learn how to make changes that improve conversion without creating risk.

**Concepts**
- CTA hierarchy
- trust signaling
- merchandising clarity
- mobile UX
- cart confidence
- review and social proof surfaces

**Required Shopify knowledge**
- section settings that affect prominence and spacing
- CTA and button snippets
- media presentation controls

**Prerequisite modules**
- Module 3
- Module 4
- Module 5
- Module 6

**Practical exercises**
- analyze the homepage for a safe conversion improvement
- identify a trust change that does not affect checkout

**Graduation criteria**
- can propose a small conversion improvement with clear evidence
- can explain why the change is safe

**Common mistakes**
- over-optimizing too early
- changing multiple variables at once
- confusing visual polish with conversion improvement

**Validation methods**
- before/after screenshot review
- click-path verification
- mobile and desktop comparison

---

### Module 8 - Evidence, Playbooks, and Pattern Library

**Objective**
- Turn successful fixes into reusable ShopiFixer knowledge.

**Concepts**
- problem class
- file map
- safe fix pattern
- validation checklist
- rollback notes
- reusable lesson
- pattern promotion

**Required Shopify knowledge**
- how a change maps back to files and settings
- how to capture before/after evidence

**Prerequisite modules**
- Module 6
- Module 7

**Practical exercises**
- write a playbook entry from a completed exercise
- promote a validated pattern into the pattern library

**Graduation criteria**
- every applied training exercise produces a reusable pattern entry
- lessons are searchable and specific

**Common mistakes**
- writing vague lessons
- failing to capture evidence
- recording the fix without the file map

**Validation methods**
- playbook review
- evidence audit
- lesson quality check

---

### Module 9 - Mission Engine and StaffordOS Operating Model

**Objective**
- Operate work as missions instead of loose tasks and memory fragments.

**Concepts**
- mission object
- mission lifecycle
- evidence as authority
- training versus merchant missions
- reusable patterns as mission output

**Required Shopify knowledge**
- what Shopify work can be safely trained before merchant use
- how mission records should reference theme evidence

**Prerequisite modules**
- Module 8

**Practical exercises**
- map a completed training exercise to a mission record
- identify the evidence and reusable pattern outputs

**Graduation criteria**
- mission records are complete, durable, and evidence-linked
- AI can use mission history instead of chat memory

**Common mistakes**
- leaving mission status ambiguous
- failing to link evidence and lessons
- not distinguishing training from merchant work

**Validation methods**
- mission record audit
- evidence link check
- lifecycle state review

---

### Module 10 - Controlled Merchant Readiness

**Objective**
- Prepare ShopiFixer to move from controlled training into supervised and then low-risk merchant work.

**Concepts**
- risk gating
- supervised fixes
- low-risk merchant engagement
- rollback confidence
- merchant communication boundaries

**Required Shopify knowledge**
- ability to assess file risk by surface and dependency
- ability to validate safely across devices

**Prerequisite modules**
- Module 7
- Module 8
- Module 9

**Practical exercises**
- classify a change as read-only, supervised, or low-risk
- define a merchant-safe validation checklist

**Graduation criteria**
- can complete multiple NoKings exercises with no rollback surprises
- can explain what is safe to do without supervision

**Common mistakes**
- moving to merchant work before rollback confidence exists
- underestimating shared-shell risk
- skipping evidence capture

**Validation methods**
- threshold review
- supervised signoff
- failure-mode review

---

## 3) Mapping Existing StaffordOS Missions and Pattern Library Entries

### Mission: `STAFFORDOS_MISSION_ENGINE_ARCHITECTURE_V1`

**Curriculum mapping**
- Module 9 - Mission Engine and StaffordOS Operating Model
- Module 8 - Evidence, Playbooks, and Pattern Library

**Why it maps here**
- it defines Mission as the top-level business object
- it establishes evidence, lessons, and reusable patterns as durable outputs
- it is the operating backbone for training and merchant work

### Mission: `STAFFORDOS_MISSION_001_NOKINGS_TRAINING_V1`

**Curriculum mapping**
- Module 2 - NoKings Theme Inventory
- Module 3 - Homepage and Discovery Surfaces
- Module 4 - Product, Collection, and Cart Surfaces
- Module 6 - Safe Editing, Validation, and Rollback
- Module 8 - Evidence, Playbooks, and Pattern Library

**Why it maps here**
- it defines the first controlled NoKings training mission
- it already lists the first exercise path
- it establishes evidence and lesson output for the curriculum

### Pattern Library Entry: `SHOPIFIXER_PATTERN_LIBRARY_0001_HOMEPAGE_ARCHITECTURE`

**Curriculum mapping**
- Module 3 - Homepage and Discovery Surfaces
- Module 6 - Safe Editing, Validation, and Rollback
- Module 8 - Evidence, Playbooks, and Pattern Library

**Why it maps here**
- it is the first reusable engineering pattern
- it captures the homepage architecture as a durable reference
- it provides the first pattern-promoted knowledge artifact

---

## 4) Automatic Competency Progress Updates from Future Training Missions

Future Training Missions should update competency progress automatically by attaching evidence to the relevant module and competency items.

### Progress update rules

1. If a mission documents a new file map, mark the corresponding architecture competency as advanced.
2. If a mission captures before/after evidence and validation, mark safe-edit competency as advanced.
3. If a mission records a rollback rehearsal that succeeds, increase rollback readiness.
4. If a mission promotes a reusable pattern, mark playbook competency as advanced.
5. If a mission references mission records instead of chat memory, mark mission-engine competency as advanced.
6. If a mission covers a new Shopify surface, update the relevant surface module and competency matrix.

### Progress artifacts

Each mission should update:
- module completion percentage
- competency confidence level
- reusable pattern count
- rollback confidence level
- merchant-readiness gate status

---

## 5) Readiness Criteria by Capability Level

### Read-only audits

Ready when:
- Shopify architecture is understood at file level
- NoKings theme inventory is complete for core surfaces
- the operator can trace a visible element to source files
- no edits are required to complete the audit

### Supervised fixes

Ready when:
- safe-edit and rollback modules are complete
- at least one controlled change has been applied and validated
- evidence capture is consistent
- rollback rehearsal has been demonstrated

### Autonomous low-risk fixes

Ready when:
- homepage, product, collection, cart, and shell surfaces are inventoried
- multiple low-risk changes have been completed safely
- validation is repeatable
- pattern library entries exist for common fix classes

### Medium-risk engineering

Ready when:
- shared snippet and global shell blast radius is understood
- rollback confidence is high
- mobile and desktop validation is routine
- mission records show repeated success across multiple surfaces

### Production merchant engagements

Ready when:
- controlled NoKings training is complete
- merchant-safe playbooks exist for common problem classes
- authority boundaries are respected
- evidence capture is reliable
- mission records show enough repeated success to trust the operator loop

---

## 6) Competency Matrix

| Capability | Read-only audit | Supervised fix | Low-risk autonomous | Medium-risk engineering | Production merchant |
|---|---:|---:|---:|---:|---:|
| Theme file literacy | basic | strong | strong | strong | strong |
| Render-chain tracing | basic | strong | strong | strong | strong |
| Homepage analysis | basic | strong | strong | strong | strong |
| Product/collection/cart analysis | basic | strong | strong | strong | strong |
| Header/footer analysis | basic | moderate | strong | strong | strong |
| Safe edit planning | none | moderate | strong | strong | strong |
| Validation discipline | moderate | strong | strong | strong | strong |
| Rollback discipline | none | moderate | strong | strong | strong |
| Pattern promotion | none | moderate | strong | strong | strong |
| Mission-based execution | basic | strong | strong | strong | strong |
| Merchant readiness | none | low | moderate | strong | strong |

Progression shape:
- audit skills come first
- safe edits and rollback come next
- then repeated low-risk fixes
- then global and medium-risk surfaces
- production merchant work is the final gate

---

## 7) Highest-Risk Knowledge Gaps

1. Breadth across all major Shopify surfaces beyond the homepage.
2. Shared snippet blast-radius awareness.
3. Repeated rollback execution under pressure.
4. Mobile validation discipline across different templates.
5. Strong pattern promotion discipline across multiple exercises.
6. Merchant-safe judgment on when a fix is low-risk versus medium-risk.

---

## 8) Recommended Next Learning Module

**Module 4 - Product, Collection, and Cart Surfaces**

Reason:
- it extends beyond the homepage into commerce-critical paths
- it is the next step in merchant value
- it exposes higher-risk shared snippets and cart behavior that must be mastered before merchant work

---

## 9) Final Classification

**CONDITIONAL GO**

ShopiFixer should continue controlled NoKings training, but it should not yet move to independent production merchant work. The curriculum shows strong progress in architecture, inventory, pattern capture, and controlled execution, but it still needs broader surface mastery and more repeated rollback-proven fixes before autonomous production engagement.
