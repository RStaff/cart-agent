# Mission 001 Exercise 005 Planning v1

## 1. Mission and Exercise Identity
- Mission ID: `mission_001`
- Mission: `Mission 001 - NoKings Shopify Engineering Training`
- Exercise ID: `ex_005_collection_page_inventory`
- Exercise name: `Exercise 005 - Collection Page Inventory`
- Canonical store: `no-kings-athletics.myshopify.com`
- Product: `ShopiFixer`
- Environment type: `controlled_training`

## 2. Objective
Identify the NoKings collection page structure and its filtering, sorting, grid, pagination, and product-card rendering behavior so later ShopiFixer work can safely reason about the collection surface before any reversible implementation is considered.

## 3. Authority Classification
- Analysis-only exercise: `Yes`
- Reversible implementation permitted: `No`
- Shopify mutation permitted: `No`
- Payment gate required: `No`
- Completion gate required: `No`
- Abando truth reuse: `No`
- Generic `cart-agent-dev` truth reuse: `No`

Exercise 005 is a governed inventory exercise. It is intended to produce repository-backed architecture knowledge, not storefront changes.

## 4. Canonical NoKings Collection-Page Targets
Primary targets for Exercise 005 are the archived NoKings collection page sources:

- `templates/collection.json`
- `sections/main-collection.liquid`
- `sections/collection-list.liquid`
- `snippets/product-grid.liquid`
- `snippets/product-card.liquid`
- `snippets/collection-card.liquid`
- `snippets/list-filter.liquid`
- `snippets/filter-remove-buttons.liquid`
- `snippets/pagination-controls.liquid`
- `blocks/collection-card.liquid`
- `blocks/_collection-card.liquid`
- `blocks/_collection-card-image.liquid`
- `blocks/_collection-info.liquid`
- `blocks/_inline-collection-title.liquid`
- `blocks/_product-card.liquid`
- `blocks/_product-card-gallery.liquid`
- `blocks/_card.liquid`
- `blocks/product-card.liquid`
- `blocks/featured-collection.liquid`
- `assets/collection-links.js`
- `assets/product-card.js`

Collection metadata and render dependencies to verify:
- collection title
- collection description
- collection handle and URL
- collection.products
- collection.products_count
- collection.filters
- collection.sort_options
- pagination state
- grid density controls
- infinite-scroll controls
- product-card image, title, price, and badge rendering

## 5. Scope
The exercise should inventory the collection-page file stack, the product-grid and collection-card composition, and the filter/sort/pagination pathways that shape the NoKings collection surface.

### In Scope
- JSON template entry point tracing
- main collection section behavior
- collection card and product grid composition
- filter and sort controls
- pagination and infinite-scroll behavior
- product-card rendering and metadata dependencies
- card-gallery / image / title / price composition
- collection metadata flow
- reusable ShopiFixer pattern capture

### Out of Scope
- Shopify edits
- theme mutations
- payment changes
- proof package generation
- evidence fabrication
- completion claims
- broader merchant-selection architecture
- runtime storefront changes

## 6. Analysis Versus Implementation Authority
- Exercise 005 is analysis-only in the canonical mission sequence.
- No reversible implementation is authorized by the exercise definition.
- Any future implementation would require a separate governed scope and evidence chain.

## 7. Required Before-Evidence Baseline
Before evidence should establish the collection-page baseline from repository truth, including:

- mission and merchant identity
- canonical NoKings store
- target collection-page files
- existing archived NoKings collection evidence
- prior product-page knowledge carried forward from Exercise 004
- explicit note that no Shopify mutation occurred
- explicit note that theme identity and source hashes remain unresolved unless proven

Before evidence should not invent screenshots or live storefront claims.

## 8. Inventory Method
Use a read-only file-graph inventory:

1. Start from `templates/collection.json`.
2. Trace the main collection section and collection-list section.
3. Trace filter, sort, pagination, and infinite-scroll controls.
4. Trace product-card rendering into card-gallery, title, and price primitives.
5. Trace metadata dependencies from `collection` into card and filter controls.
6. Record any unresolved theme or runtime gaps as unknown, not inferred.

## 9. Expected Inventory Artifact
The governed analysis artifact for Exercise 005 should be a read-only execution notes file such as:

- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/execution_notes.md`

If the exercise sequence requires a separate mission-specific staging area later, it should use a separate governed path rather than reusing generic pilot truth.

## 10. Required After-Evidence Artifact
The after-evidence record should summarize:

- the collection-page architecture discovered
- the filter/sort/pagination file chain
- the product-card dependency chain
- risks and unknowns that remain
- reusable ShopiFixer knowledge captured from the exercise
- a clear statement that no Shopify mutation was performed

## 11. Success Criteria
- The NoKings collection page file stack is mapped from template to section to snippet/block.
- Filter, sort, grid, pagination, and product-card dependencies are identified.
- Collection metadata dependencies are recorded from repository truth.
- Exercise 004 knowledge is explicitly carried forward.
- No Shopify mutation occurs.
- The analysis artifacts are complete enough to support a later governed exercise if needed.

## 12. Rollback Expectations
- Restore the planning file if the canonical exercise definition changes.
- No Shopify rollback is expected because the exercise is analysis-only.
- No theme file rollback is required unless a later governed implementation is separately approved.

## 13. Knowledge-Capture Requirements
Capture the following in the exercise artifacts:

- template-to-section-to-snippet trace
- collection filter/sort/pagination chain
- product-card and collection-card composition
- metadata dependencies
- reusable ShopiFixer lesson from Exercise 004
- unresolved gaps that must remain explicit

## 14. Carry-Forward From Exercise 004
Exercise 005 should inherit these validated rules from Exercise 004:

- start from the template and trace downward
- keep structural inventory separate from mutation work
- respect block-driven and schema-governed dependencies
- treat analysis evidence as distinct from proof or mutation artifacts
- preserve mission-specific NoKings truth as separate from generic cart-agent-dev truth
- do not claim theme identity or app-block/metafield behavior without proof

## 15. Risks and Unknowns
Remain explicit about unresolved repository-backed gaps:

- theme name
- theme ID
- theme version
- source hashes
- app-block behavior
- metafield dependencies
- runtime storefront validation
- any collection filter behavior that is not visible in archived theme truth

## 16. Readiness Transition
- Current readiness state for Exercise 005 planning: `GO`
- Expected next readiness transition after planning: governed scope for Exercise 005
- Expected next mission phase after planning: collection-page baseline / inventory execution under the mission-specific governed path

## 17. Recommendation
- Start Exercise 005 planning now using the canonical collection-page targets above.
- Keep it analysis-only unless a later governed scope explicitly authorizes a reversible implementation.
- Preserve all historical NoKings evidence and mission truth.
