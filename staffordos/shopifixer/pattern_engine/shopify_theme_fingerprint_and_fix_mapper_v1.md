# SHOPIFY THEME FINGERPRINT AND FIX MAPPER V1

## Purpose

Quickly identify how a Shopify site is built, then map visible conversion problems to the smallest safe theme change.

## Core Pipeline

1. Capture desktop and mobile screenshots.
2. Pull or inspect Shopify theme source.
3. Identify theme name and theme ID.
4. Read templates/index.json.
5. Detect homepage section order.
6. Identify conversion-relevant sections.
7. Match screenshot issue to actual theme section.
8. Select fix pattern.
9. Choose minimal implementation path.
10. Capture after evidence.

## Required Output Per Store

- theme name
- theme ID
- homepage template path
- section order
- detected issue
- matched ShopiFixer pattern
- affected section ID
- affected section type
- implementation level
- files likely touched
- Shopify admin actions required
- QA checklist
- before/after proof plan

## Implementation Levels

Level 1:
Theme editor setting change.

Level 2:
Section reorder, product binding, copy, CTA, trust placement.

Level 3:
Small custom Liquid section.

Level 4:
Theme code modification across section/snippet/CSS.

Level 5:
Out of fixed-fee scope unless separately approved.

## $950 Rule

A standard $950 ShopiFixer sprint should usually be Level 2 or Level 3.

If Level 1, the proof package and strategic diagnosis must still justify the value.

If Level 4, scope must be tightly controlled.

If Level 5, escalate to custom quote.

## No Kings Example

Theme:
Horizon

Theme ID:
150895657158

Homepage template:
templates/index.json

Detected section order:
1. hero_jVaWmY
2. product_list_fa6P9H

Detected issue:
Strong brand hero, weak first buying path.

Matched pattern:
Pattern 001 - Homepage Product Value Path

Affected section:
product_list_fa6P9H

Affected section type:
product-list

Minimal implementation path:
Reconfigure product-list or insert featured-product/custom-liquid section directly after hero.

## Anti-Drift Rule

Do not propose fixes from screenshots alone.

Always connect:

visual issue
+
theme structure
+
specific implementation target

## Success Standard

ShopiFixer should be able to answer:

What is wrong?
Where is it in the theme?
What is the smallest safe fix?
How will we prove it changed?

