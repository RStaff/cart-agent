# SHOPIFIXER_ENGINEERING_EXERCISE_003_PRODUCT_LIST_ANALYSIS_REPORT

## Mission

Mission 001 - NoKings Shopify Training

## Exercise

Exercise 003 - Product List Analysis

## Summary

Exercise 003 mapped how NoKings assembles product lists and product-card style surfaces across the storefront.

The key result is that NoKings does not use one-off product grids. It uses a shared product-card primitive that is reused across:

- homepage featured products
- collection pages
- search results
- product recommendations
- cart recommendations
- predictive search product lists

The reusable pattern is:

`collection / search / recommendation source -> product array -> product-grid or resource-list wrapper -> _product-card -> product-card -> card-gallery + title + price`

This exercise broadened ShopiFixer's understanding beyond the homepage and established the merchant-merchandising architecture for Module 4.

Capability score change:

- before: 31 / 100
- after: 38 / 100
- delta: +7

---

## Phase 1 - Observe

### Core product-list surfaces

1. Homepage featured products
   - Template: [`templates/index.json`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json:91)
   - Section: [`sections/product-list.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/product-list.liquid:1)
   - Entry block: `product_list_fa6P9H`
   - Purpose: homepage merchandising rail and featured products

2. Collection pages
   - Template: [`templates/collection.json`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/collection.json:101)
   - Section: [`sections/main-collection.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/main-collection.liquid:1)
   - Shared wrapper: [`snippets/product-grid.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/product-grid.liquid:1)
   - Purpose: collection product browsing, filters, and pagination

3. Search results
   - Template: [`templates/search.json`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/search.json:57)
   - Section: [`sections/search-results.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/search-results.liquid:1)
   - Shared wrapper: [`snippets/product-grid.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/product-grid.liquid:1)
   - Purpose: product search results and empty-state fallback products

4. Product recommendations / related products
   - Template: [`templates/product.json`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/product.json:268)
   - Section: [`sections/product-recommendations.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/product-recommendations.liquid:1)
   - Also present as block variant: [`blocks/product-recommendations.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/product-recommendations.liquid:1)
   - Purpose: related and complementary products on product pages

5. Cart recommendations
   - Template: [`templates/cart.json`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/cart.json:66)
   - Section: [`sections/product-list.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/product-list.liquid:1)
   - Purpose: cart-page "You may also like" merchandising rail

6. Predictive search product list
   - Section: [`sections/predictive-search.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/predictive-search.liquid:69)
   - Snippet: [`snippets/predictive-search-products-list.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/predictive-search-products-list.liquid:1)
   - Purpose: search dropdown recently-viewed and product result lists
   - Note: uses `resource-card`, not `_product-card`

### Adjacent card-style surfaces

7. Collection list / featured collections
   - Template: [`templates/list-collections.json`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/list-collections.json:12)
   - Section: [`sections/main-collection-list.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/main-collection-list.liquid:1)
   - Card primitive: [`snippets/collection-card.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/collection-card.liquid:1)
   - Purpose: browse collections rather than products

8. Header mega menu / drawer featured products and collections
   - Snippets: [`snippets/header-drawer.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/header-drawer.liquid:526) and [`snippets/mega-menu-list.liquid`](staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/mega-menu-list.liquid:293)
   - Card primitive: `resource-card`
   - Purpose: navigation-adjacent featured merchandise and collections

---

## Phase 2 - Map

### Product-list architecture map

| Surface | Template / section chain | Card primitive | Data source | Main dependencies | Status |
|---|---|---|---|---|---|
| Homepage featured products | `templates/index.json` -> `sections/product-list.liquid` | `_product-card` -> `product-card` -> `_product-card-gallery` | `section.settings.collection.products` | `resource-list`, `product-grid`, `card-gallery`, `product-title`, `price` | LIVE |
| Collection page grid | `templates/collection.json` -> `sections/main-collection.liquid` -> `snippets/product-grid.liquid` | `_product-card` -> `product-card` -> `_product-card-gallery` | `collection.products` | `filters`, pagination, `product-grid`, `card-gallery`, `price` | LIVE |
| Search results | `templates/search.json` -> `sections/search-results.liquid` -> `snippets/product-grid.liquid` | `_product-card` -> `product-card` -> `_product-card-gallery` | `search.results | where: 'object_type', 'product'` or fallback collection | `filters`, pagination, `product-grid` | LIVE |
| Product recommendations | `templates/product.json` -> `sections/product-recommendations.liquid` | `_product-card` -> `product-card` -> `_product-card-gallery` | `recommendations.products` or `collections.all.products` fallback | `product-recommendations.js`, `resource-list` / carousel, quick-add styles | LIVE |
| Cart recommendations | `templates/cart.json` -> `sections/product-list.liquid` | `_product-card` -> `product-card` -> `_product-card-gallery` | `collection: all` | `resource-list`, `product-grid`, cart page shell | LIVE |
| Predictive search product results | `sections/predictive-search.liquid` -> `snippets/predictive-search-products-list.liquid` | `resource-card` | predicted/recently viewed products | `predictive-search.js`, `resource-card`, predictive-search styles | LIVE |
| Collection list / featured collections | `templates/list-collections.json` -> `sections/main-collection-list.liquid` -> `snippets/collection-card.liquid` | `_collection-card` -> `collection-card` -> `_collection-card-image` | `collections` | `resource-list`, `collection-card`, `resource-image` | LIVE |
| Navigation featured products / collections | `snippets/header-drawer.liquid` and `snippets/mega-menu-list.liquid` | `resource-card` | menu-configured products/collections | `resource-card`, mega-menu CSS/JS | LIVE |

### Dependency map

```
Shopify object source
  -> collection / search / recommendations / cart / menu data
  -> page section or snippet
  -> resource-list or product-grid wrapper
  -> _product-card or resource-card
  -> product-card shell
  -> _product-card-gallery
  -> card-gallery / product image ordering
  -> product-title
  -> price
  -> badges / quick add / swatches / buttons
```

For collection-list surfaces:

```
collections
  -> main-collection-list
  -> _collection-card
  -> collection-card
  -> _collection-card-image
  -> collection-title and supporting content
```

---

## Phase 3 - Explain

### Product data flow

#### Collection object

- Homepage product list uses `section.settings.collection`
- Collection pages use the built-in `collection` object
- Search results may fall back to `settings.empty_state_collection | default: collections.all`
- Cart recommendations use `collection: all`
- Product recommendations use `recommendations.products`, and fall back to `collections.all.products` for related recommendations

#### Product object

- Product objects are passed through `closest.product`
- Collection and search list items loop over the product array and pass each product into `_product-card`
- Product recommendation loops pass `closest.product: product`

#### Featured image

- `snippets/card-gallery.liquid` sorts media so `product.featured_media.preview_image` is first
- This ensures the most relevant image appears first in product-card contexts
- If a product has no media, a placeholder title or placeholder graphic is shown instead

#### Title

- `blocks/product-title.liquid` renders `closest.product.title`
- Title links go to `closest.product.selected_or_first_available_variant.url`

#### Price

- `snippets/price.liquid` derives price from `product_resource.selected_or_first_available_variant`
- For product-card contexts, the snippet uses `product_resource.price_min` and `product_resource.price_max`
- Sale pricing is shown when `compare_at_price > price`
- Unit price and volume pricing are supported

#### URL

- Product-card links and image links use `selected_or_first_available_variant.url`
- The card is therefore variant-aware, not just product-aware

#### Badges / labels

- `snippets/card-gallery.liquid` adds badges when:
  - product is unavailable, or
  - `compare_at_price > price`
- Badge position is driven by theme settings

#### Sold-out state

- Sold-out state is inferred from `product.available == false`
- It is rendered as a badge and not just a text label

#### Variant behavior

- Product-card links resolve to the first available variant
- Card gallery respects variant-linked media
- Predictive search and navigation surfaces use `resource-card`, which is a different reusable card primitive

---

## Phase 4 - Risk Classification

| Change area | Risk | Why |
|---|---|---|
| Product card markup | High | Shared primitive reused by homepage, collection, search, cart, and recommendations |
| Collection grid layout | High | Controls product density, filters, and pagination across core browsing surfaces |
| Image ratio | Medium | Can shift card height, crop behavior, and mobile balance |
| Price display | High | Commerce-critical; incorrect pricing is a direct merchant/customer risk |
| CTA button | Medium | Usually localized but can affect conversion hierarchy |
| Product badges | Medium | Visual but tied to sale / sold-out truth |
| Mobile grid behavior | High | Strong conversion and usability impact on all list surfaces |
| Filtering / sorting | High | Can break discoverability and collection browsing |
| Pagination / infinite scroll | High | Affects data loading, accessibility, and product reach |

### Risk observations

- `_product-card` is the highest-leverage shared primitive in the theme.
- `product-grid` and `resource-list` are layout engines, so changes there can cascade into multiple pages.
- `price.liquid` is dangerous because it is shared between product page and card contexts and contains context-sensitive logic.
- `card-gallery.liquid` is a structural dependency because it determines image order, badge placement, and placeholder behavior.

---

## Phase 5 - Validation Plan

Any future product-list change should be validated on:

### Desktop
- homepage
- collection page
- search results page
- cart page recommendations
- product page recommendations

### Mobile
- grid column count
- card height
- card title wrapping
- quick add visibility
- carousel fallbacks

### Product and collection surfaces
- homepage featured products
- collection pages
- search results
- related products
- cart "You may also like"
- predictive search

### Functional checks
- product links open the correct variant URL
- featured images render first
- prices are accurate
- compare-at / sale pricing is correct
- sold-out products show the correct badge
- no broken Liquid objects or placeholder leakage
- filters and pagination still work
- infinite scroll still works when enabled

### Accessibility checks
- card links remain keyboard reachable
- hidden text remains descriptive
- list semantics stay intact
- no focus trap introduced
- no unreadable badge or overlay combinations

### Regression checks
- no console errors
- no broken section rendering
- no missing collection fallback
- no empty-state breakage
- no header or footer bleed from shared snippets

---

## Phase 6 - Knowledge Capture

### 1. Engineering Memory

Updated memory entry:

- NoKings product-list architecture is a shared product-card system reused across homepage, collection, search, cart, and recommendation surfaces.

### 2. Pattern Library

Created reusable pattern:

- collection-backed product grid reuse
- shared card primitive across all merchandising surfaces

### 3. Mission Evidence

Created evidence record:

- source-level inventory of product-list and product-card style surfaces
- no theme changes were made
- no Shopify data was modified

### 4. Competency progress notes

Advanced competencies:

- trace a visible merchandising element to section, block, snippet, and data source
- distinguish product-card primitives from layout wrappers
- identify shared versus surface-specific pricing logic
- reason about risk across product, collection, cart, search, and recommendation surfaces

Still missing or partially developed:

- product page deep-dive beyond recommendations
- safe editing of shared product-card primitives
- rollback rehearsal on list-surface changes
- mobile grid tuning under real theme preview

### Capability score change

- before: 31 / 100
- after: 38 / 100
- delta: +7

### Engineering score

- architecture trace quality: high
- source coverage: high
- reusable pattern recognition: high
- implementation safety: not exercised in this read-only mission

---

## Phase 7 - Recommended Exercise 004

Recommended next exercise:

- **Exercise 004 - Product Page Analysis**

Why:

- Exercise 003 covered product lists, collection grids, search results, cart recommendations, and recommendation surfaces.
- The largest remaining Module 4 gap is the full product detail page stack:
  - `templates/product.json`
  - `sections/product-information`
  - media gallery
  - variant picker
  - buy buttons
  - product-page recommendation interactions

Expected capability gain:

- +5 to +8 points
- improved mastery of Module 4
- better readiness for safe commerce-critical edits

---

## Reusable Patterns

1. Shared product-card primitive
   - one card primitive powers many storefront surfaces
   - highest reuse value in the theme

2. Collection-backed merchandising rail
   - source a collection, paginate products, render cards through a shared wrapper

3. Fallback product list behavior
   - when the collection is blank, render placeholders instead of breaking the page

4. Variant-aware product-card links
   - product cards resolve to the first available variant instead of the product root

5. Featured image first ordering
   - the most relevant image is surfaced first in card galleries

---

## Final Answer

Did ShopiFixer become a better Shopify engineer today?

**YES**

Evidence:

- It identified the real product-list architecture instead of guessing from the homepage alone.
- It mapped the shared card primitive across homepage, collection, search, cart, and recommendations.
- It distinguished core product surfaces from adjacent collection and navigation card surfaces.
- It extracted the price, title, image, badge, and URL data flow with variant-level detail.
- It produced a reusable pattern library entry and a competency update.
