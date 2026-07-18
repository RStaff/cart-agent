# ShopiFixer Pattern Library 0001

**Mission 001 - Exercise 001: NoKings Homepage Architecture Discovery**

This is the first permanent pattern-library entry for ShopiFixer. It captures how the NoKings homepage is assembled before any modifications are made.

## Executive Summary

The NoKings homepage is intentionally small and discovery-first:

1. `hero` section for the first impression and primary CTA.
2. `product-list` section for direct merchandising and conversion.

The homepage itself is defined in `templates/index.json`. The visible page is completed by the global header and footer groups, which are not homepage sections but are part of the rendered experience on the homepage.

The main engineering characteristic of this homepage is that it is **settings-driven composition**:
- the JSON template chooses the section order
- the section schema controls content and layout behavior
- shared snippets handle spacing, overlays, cards, and media presentation
- shared assets provide interactivity and styling

## Architecture Map

### Homepage template

**File:** `templates/index.json`

**Homepage sections used**
1. `hero_jVaWmY` - type `hero`
2. `product_list_fa6P9H` - type `product-list`

### Shared shell visible on homepage

**Header group**
- `sections/header-group.json`
  - `header_announcements_9jGBFp` - type `header-announcements`
  - `header_section` - type `header`

**Footer group**
- `sections/footer-group.json`
  - `footer_m9NzUG` - type `footer`
  - `footer_utilities_jLGE8U` - type `footer-utilities`

## Homepage Section Inventory

### 1) Hero

**Source file:** `sections/hero.liquid`

**Schema and settings**
- Block types in homepage content:
  - `text`
  - `button`
- Key settings observed in the homepage instance:
  - media type selectors for desktop and mobile
  - optional custom mobile media
  - content direction and alignment
  - overlay and blurred reflection controls
  - section width and height
  - padding and color scheme

**Homepage content instance**
- Heading block: `Browse our latest products`
- Button block: `Shop all` linking to `shopify://collections/all`

**Liquid objects**
- `section.settings`
- `section.blocks`
- `request.visual_preview_mode`
- `request.design_mode`
- section-index based fetch priority

**Dependencies**
- `snippets/spacing-style.liquid`
- `snippets/overlay.liquid`
- `assets/base.css`
- global theme settings from `config/settings_schema.json`
- active values from `config/settings_data.json`
- translations from `locales/en.default.json`

**Purpose**
- First impression
- Product discovery
- Primary navigation into the catalog

**Business value**
- Establishes brand signal above the fold
- Drives the first click into merchandise
- Sets the visual tone for the store

**Modification risk**
- Medium
- Risk is mostly visual and compositional, but the section contains media fallback logic and overlay behavior that can break readability on desktop or mobile

**Validation requirements**
- Desktop render
- Mobile render
- CTA click-through
- Overlay legibility
- Media fallback behavior when image/video slots are empty

---

### 2) Product List

**Source file:** `sections/product-list.liquid`

**Schema and settings**
- Block types:
  - `@theme`
  - `@app`
  - `_divider`
- Key settings observed in the homepage instance:
  - collection source
  - layout type
  - max products
  - columns and mobile columns
  - gaps and carousel behavior
  - navigation controls for carousel variants

**Homepage content instance**
- Collection source: `all`
- Static header block:
  - title block: `{{ closest.collection.title }}`
  - button block: `View all`
- Static product card block:
  - nested product media
  - nested title, price, and action blocks through the product card composition

**Liquid objects**
- `section.settings`
- `shop.products_count`
- `collection`
- `product`
- `closest.product`
- `paginate`
- `forloop`

**Dependencies**
- `snippets/resource-list.liquid`
- `snippets/product-card.liquid`
- `snippets/product-media-gallery-content.liquid`
- `snippets/add-to-cart-button.liquid`
- `snippets/spacing-style.liquid`
- `snippets/gap-style.liquid`
- `assets/product-card.js`
- `assets/base.css`
- global theme settings from `config/settings_schema.json`
- active values from `config/settings_data.json`
- translations from `locales/en.default.json`

**Purpose**
- Merchandising
- Product discovery
- Direct conversion path from homepage to product detail and add-to-cart

**Business value**
- Converts homepage traffic into catalog browsing
- Surfaces the actual store inventory immediately
- Reuses the same product-card logic used elsewhere in the theme

**Modification risk**
- High
- Risk comes from collection binding, responsive column logic, placeholder rendering, and the fact that the product card has interactive behavior

**Validation requirements**
- Collection bound correctly
- Product cards render with real products
- Empty-state fallback behaves correctly
- Desktop and mobile grid layout
- Quick add and card interaction still work

---

## Shared Shell Inventory

### 3) Header announcement bar

**Source file:** `sections/header-announcements.liquid`

**Dependencies**
- `assets/announcement-bar.js`
- `snippets/spacing-style.liquid`
- `snippets/slideshow-arrows.liquid`
- `content_for 'blocks'`

**Purpose**
- Global announcement surface
- Top-of-page trust or promo messaging

**Business value**
- Adds global context and store-level messaging
- Can support promotions without changing the homepage template

**Modification risk**
- Medium
- Shared across the site and visible immediately on load

**Validation requirements**
- Text rotation / slide behavior
- Mobile display
- No overlay conflict with header

---

### 4) Header

**Source file:** `sections/header.liquid`

**Dependencies**
- `snippets/header-drawer.liquid`
- `snippets/mega-menu-list.liquid`
- `snippets/header-actions.liquid`
- `snippets/search.liquid`
- `snippets/localization-form.liquid`
- `snippets/header-row.liquid`
- `assets/header.js`
- `assets/header-drawer.js`
- `assets/base.css`
- `render 'predictive-search-styles'`
- `render 'slideshow-styles'`

**Purpose**
- Primary site navigation
- Search
- Localization
- Mobile drawer navigation

**Business value**
- Controls discoverability and wayfinding across the storefront
- Influences every page, including homepage

**Modification risk**
- High
- This is global navigation and affects all pages

**Validation requirements**
- Desktop menu
- Mobile drawer
- Search
- Localization selector
- Sticky header
- Transparent header modes

---

### 5) Footer

**Source file:** `sections/footer.liquid`

**Dependencies**
- `snippets/spacing-style.liquid`
- `assets/base.css`
- `content_for 'blocks'`

**Purpose**
- Trust, signup, policies, and utility links

**Business value**
- Reinforces legitimacy and adds retention / follow-up paths

**Modification risk**
- Medium
- Footer changes are less likely to break checkout, but they are still global and visible site-wide

**Validation requirements**
- Signup form
- Policy links
- Social links
- Responsive spacing

---

### 6) Footer utilities

**Source file:** `sections/footer-utilities.liquid`

**Dependencies**
- `assets/base.css`
- `content_for 'blocks'`

**Purpose**
- Copyright
- Policy links
- Social links

**Business value**
- Provides trust and compliance affordances

**Modification risk**
- Low to medium

**Validation requirements**
- Verify policy output
- Verify social links
- Verify mobile wrapping

## Dependency Map

```text
config/settings_schema.json
config/settings_data.json
locales/en.default.json
  -> templates/index.json
    -> sections/hero.liquid
      -> snippets/spacing-style.liquid
      -> snippets/overlay.liquid
      -> assets/base.css
      -> Liquid objects: section.settings, section.blocks, request.visual_preview_mode
    -> sections/product-list.liquid
      -> snippets/resource-list.liquid
      -> snippets/product-card.liquid
        -> snippets/product-media-gallery-content.liquid
        -> snippets/add-to-cart-button.liquid
        -> assets/product-card.js
        -> assets/base.css
      -> snippets/spacing-style.liquid
      -> snippets/gap-style.liquid
      -> Liquid objects: section.settings, shop.products_count, collection, product, paginate, closest.product

layout/theme.liquid (global wrapper)
  -> sections/header-group.json
    -> sections/header-announcements.liquid
      -> assets/announcement-bar.js
    -> sections/header.liquid
      -> snippets/header-drawer.liquid
      -> snippets/mega-menu-list.liquid
      -> snippets/header-actions.liquid
      -> snippets/search.liquid
      -> snippets/localization-form.liquid
      -> assets/header.js
      -> assets/header-drawer.js
      -> assets/base.css
  -> sections/footer-group.json
    -> sections/footer.liquid
    -> sections/footer-utilities.liquid
      -> assets/base.css
```

## Engineering Observations

1. The homepage is not a marketing maze. It is a minimal discovery surface with a single hero and a single merchandise grid.
2. The homepage uses **static block orchestration** inside the product list. That is the key reusable pattern: the template defines the container, the section defines the settings, and static nested blocks define the rendered content.
3. The product list is collection-backed, so content quality depends more on collection assignment than on page copy.
4. The hero section is media-driven and has explicit desktop/mobile fallback logic. That makes it powerful but more fragile than it looks.
5. The global header and footer are shared shell components. They are not homepage-specific, but they materially shape homepage trust and navigation.
6. `product-card` is the highest-leverage reusable merchandising primitive in the theme. It carries quick add, media, and transition behavior across multiple surfaces.
7. The theme uses shared utility snippets (`spacing-style`, `gap-style`, `overlay`) to keep layout behavior consistent across sections.
8. Empty-state behavior is intentional and should be tested. The theme prefers placeholders over missing DOM.

## Reusable Patterns Discovered

### Pattern Library Entry 0001

**Pattern name:** Discovery homepage with one hero and one collection-backed product grid

**Pattern summary**
- Use a single hero for brand signal and primary CTA.
- Follow it with a collection-backed product list.
- Keep the section count low.
- Let theme settings drive spacing, color, and layout instead of custom page logic.

**Why this pattern is reusable**
- It is simple.
- It is low maintenance.
- It works for small storefronts and controlled training stores.
- It is easy to validate visually.
- It keeps business logic in the collection and product-card system, not in page-specific hacks.

**Reusable engineering patterns inside the page**
- Section schema as the source of UI configuration
- Static nested blocks for repeatable homepage content
- Collection-backed product discovery
- Media fallback for responsive hero rendering
- Global utility snippets for spacing and overlay consistency
- Shared product-card primitive for catalog surfaces

## Risks

1. **High risk:** product-list changes can alter catalog visibility and conversion behavior.
2. **High risk:** header changes are global and can affect every page.
3. **Medium risk:** hero overlay and media logic can make text unreadable on one viewport.
4. **Medium risk:** footer changes affect trust and compliance surfaces site-wide.
5. **Medium risk:** static block IDs and nested block composition can break if copied or edited carelessly.
6. **Medium risk:** placeholder behavior can hide that a collection or media asset is not actually set.

## Validation Checklist

Before any future change to this homepage pattern, verify:

- `templates/index.json` still renders `hero` first and `product-list` second.
- Hero CTA still resolves to the intended collection.
- Hero text remains readable on desktop and mobile.
- Hero image / video fallback still works if a media slot is removed.
- Product list still binds to the correct collection.
- Product cards still render real products.
- Quick add still works where enabled.
- Header search and mobile drawer still work.
- Footer policy and social links still render.
- No new overlap or clipping appears on narrow screens.

## Rollback Considerations

- Fastest rollback surface: `templates/index.json` if homepage composition changes.
- Higher-risk rollback surface: `sections/product-list.liquid` and `snippets/product-card.liquid`, because they are shared merchandising primitives.
- Global shell rollback: `sections/header.liquid`, `sections/header-announcements.liquid`, `sections/footer.liquid`, and `sections/footer-utilities.liquid`.
- Theme-wide fallback: revert `config/settings_data.json` if the issue is configuration, not code.
- If a future experiment changes only visuals, prefer reverting the section JSON settings before touching shared snippets.

## Unanswered Questions

1. Should the homepage remain generic or become brand-specific for NoKings?
2. Is `collection: all` the correct long-term merchandising choice for the homepage?
3. Are the current hero media settings intentional, or should they be replaced with a stronger brand asset later?
4. Is the default announcement bar text meant to remain in production?
5. Should quick add remain enabled on homepage product cards for this training environment?

## Recommended Safe Visual Change for Exercise 002

**Change:** Promote the hero CTA from `button-secondary` to the theme's primary button style while keeping the label and link unchanged.

**Why this is safe**
- It changes visual emphasis only.
- It does not alter routes, collection logic, or product behavior.
- It is easy to validate with a before/after screenshot.
- It preserves the current homepage structure.
