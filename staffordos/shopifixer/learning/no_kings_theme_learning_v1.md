# NO KINGS THEME LEARNING V1

## Purpose

Capture what ShopiFixer learned from inspecting the actual Shopify theme source.

This prevents future work from relying only on screenshots or assumptions.

## Theme Access

Status: CONFIRMED

Store:

no-kings-athletics-dev.myshopify.com

Theme:

Horizon #150895657158

Local backup:

staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158

## Homepage Structure

Source:

staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158/templates/index.json

Confirmed section order:

1. hero_jVaWmY
   type: hero

2. product_list_fa6P9H
   type: product-list

## Key Discovery

The homepage is simpler than expected.

The ShopiFixer sprint does not require a full redesign.

The implementation target is the early product-list / product-value area immediately after the hero.

## Product List Current Configuration

Section:

product_list_fa6P9H

Type:

product-list

Settings observed:

- collection: all
- layout_type: grid
- columns: 4
- mobile_columns: 2
- max_products: 8
- section_width: page-width
- padding-block-start: 48
- padding-block-end: 48

Static blocks observed:

- product list header
- collection title
- View all button
- product card
- product image/gallery
- product title
- product price

## Implementation Implication

The sprint should not begin by creating a large custom system.

Preferred order:

1. Preserve hero.
2. Improve the product-list merchandising and copy.
3. If product-list cannot support the after-state, insert a small custom-liquid or featured-product section between hero and product-list.
4. Keep change scoped to the homepage buying path.
5. Capture after evidence.

## Reusable ShopiFixer Pattern

For future Shopify audits:

1. Capture screenshots.
2. Pull theme source.
3. Inspect templates/index.json.
4. Identify actual homepage section order.
5. Identify section type and settings.
6. Match audit finding to actual section implementation.
7. Choose minimal theme change.
8. Capture after evidence.

## Exercise 002 Note

Observed approved change:

- hero CTA style only
- from `button-secondary`
- to `button-primary`

Target file:

`staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/index.json`

Reason this is safe:

- copy unchanged
- destination unchanged
- layout unchanged
- spacing unchanged
- colors unchanged
- typography unchanged

Validation focus:

- desktop CTA appearance
- mobile CTA appearance
- same navigation target
- no homepage section regressions

## Anti-Drift Rule

Do not propose redesigns before inspecting the actual Shopify theme structure.

## Exercise 003 Note

Observed product-list architecture:

- homepage product rails use `sections/product-list.liquid`
- collection pages use `sections/main-collection.liquid` plus `snippets/product-grid.liquid`
- search results use `sections/search-results.liquid` plus `snippets/product-grid.liquid`
- product recommendations use `sections/product-recommendations.liquid`
- cart recommendations reuse the same `product-list` section pattern
- predictive search uses `snippets/predictive-search-products-list.liquid` with `resource-card`

Key lesson:

The product list surface is not one component. It is a family of surfaces that share one card primitive and several layout wrappers.

Reusable pattern:

When the question is product merchandising, inspect the shared card primitive first, then the layout wrapper, then the data source.

Exercise recommendation:

Move next to the full product detail page stack before attempting deeper styling changes on the shared card primitive.
