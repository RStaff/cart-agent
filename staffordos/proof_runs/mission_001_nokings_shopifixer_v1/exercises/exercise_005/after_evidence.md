# After Evidence

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Exercise ID:
exercise_005

Exercise:
Exercise 005 - Collection Page Inventory

Merchant:
NoKings Athletics

Store:
no-kings-athletics.myshopify.com

Environment Type:
controlled_training

Authority:
Analysis-only. No Shopify mutation. No payment. No commercial pilot execution.

Affected Page / Artifact:
Collection page inventory completion evidence for Exercise 005

Issue:
Collection page inventory completed from repository-backed Exercise 005 artifacts.

Objective Completed:
Yes. The governed read-only Collection Page Inventory objective was completed using the exercise-specific scope, baseline, and execution-notes artifacts.

Analysis Completed:
Yes. The inventory maps the collection template hierarchy, Liquid render hierarchy, product-grid flow, product-card dependency flow, collection-card distinction, filter architecture, sorting flow, grid-density controls, pagination behavior, CTA locations, risks, and reusable ShopiFixer patterns.

Files Inventoried:
- templates/collection.json
- sections/main-collection.liquid
- sections/collection-list.liquid
- snippets/product-grid.liquid
- snippets/product-card.liquid
- snippets/collection-card.liquid
- snippets/list-filter.liquid
- snippets/filter-remove-buttons.liquid
- snippets/pagination-controls.liquid
- blocks/filters.liquid
- blocks/_product-card.liquid
- blocks/_product-card-gallery.liquid
- blocks/product-title.liquid
- blocks/price.liquid
- blocks/_collection-card.liquid
- blocks/_collection-card-image.liquid
- blocks/collection-title.liquid
- snippets/sorting.liquid
- snippets/grid-density-controls.liquid
- snippets/price-filter.liquid
- assets/results-list.js
- assets/facets.js

Collection Template Hierarchy:
- Active entry point: `templates/collection.json`.
- Active template order: `section`, then `main`.
- `section` is a generic collection heading section using collection title and description blocks.
- `main` resolves to `sections/main-collection.liquid`.
- `sections/collection-list.liquid` is a reusable collection-list section, but it is not active in the proven `templates/collection.json` order.

Liquid Render Hierarchy:
- `templates/collection.json`
- `sections/main-collection.liquid`
- `blocks/filters.liquid`
- `snippets/filter-remove-buttons.liquid`
- `snippets/list-filter.liquid`
- `snippets/price-filter.liquid`
- `snippets/sorting.liquid`
- `snippets/grid-density-controls.liquid`
- `snippets/product-grid.liquid`
- `blocks/_product-card.liquid`
- `snippets/product-card.liquid`
- `blocks/_product-card-gallery.liquid`
- `blocks/product-title.liquid`
- `blocks/price.liquid`
- `snippets/price.liquid`

Product-Grid Flow:
- `sections/main-collection.liquid` loads `assets/results-list.js`.
- The section renders a `results-list` custom element and renders the `filters` block before product pagination.
- The section defaults `products_per_page` to 24 and uses `section.settings.products_per_page` when infinite scroll is disabled.
- The section paginates `collection.products`, captures product-card list items through the static `_product-card` block, then renders `snippets/product-grid.liquid`.
- `snippets/product-grid.liquid` computes product-card size, renders empty state, renders captured product-card children, stores grid view in `sessionStorage`, and chooses infinite-scroll sentinels or `pagination-controls` based on `enable_infinite_scroll`.

Product-Card Dependency Flow:
- `templates/collection.json` declares the active static `_product-card` block.
- `_product-card` renders `snippets/product-card.liquid` after capturing child blocks.
- `product-card` builds the wrapper link from `product.selected_or_first_available_variant`.
- `_product-card-gallery` handles badges and quick-add surface before delegating media to the shared card-gallery path.
- `product-title` links to `closest.product.selected_or_first_available_variant.url`.
- `price` derives the selected variant from `closest.product.selected_or_first_available_variant` and delegates rendering to `snippets/price.liquid`.

Collection-Card Distinction:
- `sections/collection-list.liquid` is a separate reusable collection-card section.
- Its card flow uses `_collection-card`, `_collection-card-image`, `collection-title`, and `snippets/collection-card.liquid`.
- This collection-card path is proven as reusable source architecture, but it is not active in the proven `templates/collection.json` order.

Filter Architecture:
- The active template contains a static `filters` block with filtering, sorting, and grid-density controls enabled.
- `blocks/filters.liquid` loads `assets/facets.js` and `assets/scrolling.js`.
- `filters.liquid` derives filters from `results.filters` and derives sorting from `results.sort_by` or `results.default_sort_by`.
- Active filter removal, price filters, non-price filters, and mobile/overflow drawer flows are rendered through their dedicated snippets.
- `assets/facets.js` owns URL parameter generation, page-parameter removal when filters change, browser history updates, filter update events, and section re-rendering.

Sort Architecture:
- Sorting is enabled in the active static filters block.
- `snippets/sorting.liquid` renders `results.sort_options` as radio options and a select fallback where configured.
- `assets/facets.js` provides sorting component behavior for keyboard navigation, selection, form submission, dropdown close, and focus handling.
- Actual NoKings sort-option labels and values remain Not Yet Proven because runtime collection data was not inspected.

Grid-Density Architecture:
- Grid density is enabled in the active filters block.
- `snippets/grid-density-controls.liquid` renders desktop and mobile radio controls.
- `assets/results-list.js` handles layout updates, the `product-grid-view` attribute, and `sessionStorage` persistence.

Pagination Behavior:
- `sections/main-collection.liquid` defaults to infinite scroll.
- If infinite scroll is enabled, `snippets/product-grid.liquid` renders `viewMorePrevious` and `viewMoreNext` sentinels.
- If infinite scroll is disabled, `snippets/product-grid.liquid` renders `snippets/pagination-controls.liquid`.
- Runtime page count and storefront pagination behavior remain Not Yet Proven.

CTA Locations:
- Product-card primary navigation CTA: full-card link in `snippets/product-card.liquid`.
- Product title CTA: `blocks/product-title.liquid`.
- Quick-add CTA: possible through `_product-card-gallery` when theme settings and product availability allow.
- Filter CTAs: `filters`, `list-filter`, `price-filter`, and `filter-remove-buttons`.
- Pagination CTAs: `pagination-controls` when infinite scroll is disabled.
- Runtime CTA visibility remains Not Yet Proven.

Reusable ShopiFixer Patterns:
- Collection pages separate source-wrapper authority from shared card rendering authority.
- Filters, sorting, grid density, pagination, product cards, and collection cards are separable architecture surfaces.
- Collection-card rendering is not the same as active product-grid rendering and must not be conflated.
- Selected-variant URL behavior affects collection product-card and title links.
- Infinite scroll and manual pagination are mutually governed by `enable_infinite_scroll`.

Risks Discovered:
- Runtime storefront behavior was not validated.
- Actual filter values, sort options, product image order, quick-add visibility, and page count were not proven.
- App-block behavior is possible by schema but not proven active.
- `collection-list.liquid` is a target architecture file but is not active in the current collection template order.
- Theme name, theme ID, theme version, and source hashes remain unproven.

Remaining Unknowns:
- Theme name: Not Yet Proven
- Theme ID: Not Yet Proven
- Theme version: Not Yet Proven
- Source hashes: Not Yet Proven
- Runtime storefront validation: Not Yet Proven
- Active collection filter values: Not Yet Proven
- Active sort-option labels and values: Not Yet Proven
- Runtime pagination page count: Not Yet Proven
- Product image availability and order: Not Yet Proven
- Quick-add active storefront state: Not Yet Proven
- App-block runtime behavior: Not Yet Proven
- Metafield dependencies: Not Yet Proven

Rollback Implications:
- No Shopify mutation occurred, so no Shopify rollback is required.
- Repository rollback is limited to restoring this exercise-specific `after_evidence.md` file.
- Future implementation work must preserve the proven collection template hierarchy and shared product-card primitive unless a separate governed scope proves otherwise.
- Mission-root artifacts remain index-only and are not payload authority.

Recommendation for Next Exercise:
- Generate the Exercise 005 mission proof package from the exercise-specific scope, before evidence, execution notes, and this after-evidence artifact.
- Do not begin Exercise 006 until Exercise 005 proof and certification authority are complete.

Observed Improvement:
Not Claimed

Merchant-Facing Summary:
Not Claimed

Remaining Limitations:
- No storefront change was made.
- No UX improvement, conversion improvement, merchant outcome, payment, completion, or production deployment is claimed.
- Runtime behavior remains Not Yet Proven.

Screenshot:
Not Yet Available

Notes:
- Collection page after evidence is complete for the analysis-only Exercise 005 evidence chain.
- This artifact uses only exercise-specific authority.
- No mission-root evidence file was used as payload authority.
- No Shopify mutation occurred.
- No theme file was edited.
- No payment, completion, execution, Abando, or commercial cart-agent-dev truth changed.
- Exercise 004 artifacts were not modified.
