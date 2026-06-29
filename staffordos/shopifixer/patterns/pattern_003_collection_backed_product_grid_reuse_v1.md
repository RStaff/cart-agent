# SHOPIFIXER PATTERN 003
# Collection-Backed Product Grid Reuse

## Problem

Merchandising surfaces in Shopify often look different on the surface, but they usually share the same underlying product-card primitive.

## Use When

- a homepage featured products rail exists
- a collection page uses a product grid
- search results show product cards
- cart recommendations need a product rail
- related products or recommendations need to render products

## Fix Pattern

Use one shared product-card primitive and feed it different product sources through the appropriate wrapper:

- `resource-list` for homepage-style product rails
- `product-grid` for collection and search grids
- `product-recommendations` for product-page related items
- `product-list` for cart suggestions and homepage rails

Let the wrapper handle layout. Let the shared card handle image, title, price, badges, and link behavior.

## Shopify Files Involved

- `templates/index.json`
- `sections/product-list.liquid`
- `templates/collection.json`
- `sections/main-collection.liquid`
- `snippets/product-grid.liquid`
- `templates/search.json`
- `sections/search-results.liquid`
- `templates/product.json`
- `sections/product-recommendations.liquid`
- `templates/cart.json`
- `snippets/product-card.liquid`
- `blocks/_product-card.liquid`
- `blocks/_product-card-gallery.liquid`
- `snippets/card-gallery.liquid`
- `blocks/product-title.liquid`
- `blocks/price.liquid`
- `snippets/price.liquid`

## Safe Validation Checklist

- product source is correct
- product title links to the correct variant URL
- featured image order is correct
- price reflects the correct product or variant
- sold-out badge still appears
- sale badge still appears when compare-at price is higher
- mobile grid still renders correctly
- no broken Liquid objects

## Rollback Plan

- revert the layout wrapper change
- revert any product-card override
- restore the prior collection/search/recommendation source

## Before/After Evidence

- before: source inventory of each list surface
- after: source inventory plus confirmed dependency chain
- desktop evidence when later used for a live change
- mobile evidence when later used for a live change

## Reusable Lesson

If the same product data appears in multiple places, prefer one shared card primitive plus different wrappers instead of separate implementations.

## Confidence

High

This pattern appears repeatedly across NoKings and is one of the most reusable Shopify engineering primitives in the theme.

