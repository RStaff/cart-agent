# NO KINGS REVENUE IMPACT SCORE V1

## Purpose

Apply the ShopiFixer Revenue Impact Scoring Model to the No Kings discovery findings.

## Source Evidence

- before screenshots
- theme fingerprint
- homepage template
- storefront product JSON
- product count check
- catalog truth discovery

## Finding 0

Finding:

Catalog is not commercially ready.

Evidence:

- product count: 1
- product: No Kings Athletics AirL Fabric Tee
- price: $0.00
- images: 0
- homepage links only to this product

Revenue Impact:
10

Confidence:
10

Proofability:
10

Implementation Effort:
3

Risk:
2

Priority:
CRITICAL

Reason:

A homepage cannot meaningfully convert if the product catalog has no commercial price, no product images, and only one available product.

## Finding 1

Finding:

Homepage product discovery and value clarity are weak.

Evidence:

- hero is followed by product-list section
- product-list is tied to collection all
- product presentation is limited by catalog quality

Revenue Impact:
7

Confidence:
8

Proofability:
9

Implementation Effort:
4

Risk:
3

Priority:
HIGH

Reason:

This is still a valid ShopiFixer pattern, but it depends on having a real product, price, and image to promote.

## Finding 2

Finding:

Trust support is not close enough to the buying decision.

Evidence:

- current homepage structure is hero plus product-list
- no verified trust microcopy has been confirmed for the immediate product decision area

Revenue Impact:
6

Confidence:
7

Proofability:
8

Implementation Effort:
3

Risk:
2

Priority:
MEDIUM

Reason:

Trust placement can improve confidence, but catalog readiness must come first.

## Sprint Selection Decision

Selected Priority:

Catalog Readiness

Reason:

The highest-impact blocker is not layout.

The store must first have a real product presentation:

- valid price
- real image
- product description
- working product URL
- basic trust support

## Revised ShopiFixer Recommendation

Do not execute the homepage Product Value Path mutation until catalog readiness is corrected or confirmed as a dev-store limitation.

## ShopiFixer Learning

Product truth must be checked before selecting a homepage mutation sprint.

