# NO KINGS PROOF STORE CORRECTION PLAN V1

## Purpose

Define the minimum corrections needed before ShopiFixer can execute a meaningful proof sprint on No Kings.

## Current Blocker

No Kings currently has:

- 1 product
- $0.00 price
- 0 product images
- weak product description

This prevents the homepage mutation from proving real commercial value.

## Decision

Treat No Kings as a proof/dev store unless merchant confirms otherwise.

## Minimum Correction Required

Before homepage mutation, create or correct one product so it has:

- real title
- real price
- real image
- real description
- working product URL
- available inventory or purchasable status

## Preferred Proof Product

Current product:

No Kings Athletics AirL Fabric Tee

Required corrections:

- price must not be $0.00
- image must exist
- description must explain product value
- product page must look commercially credible

## Then Execute

After product correction:

1. recapture product JSON
2. confirm product title
3. confirm product price
4. confirm image count
5. confirm product URL
6. insert or configure featured-product section
7. capture after screenshots
8. QA
9. build proof package

## Success Standard

The proof sprint is valid only if the after state shows:

- real product
- real price
- real image
- clearer buying path
- visible improvement over before state

## Anti-Drift Rule

Do not mutate the homepage until product truth is corrected or a different real store is selected.

