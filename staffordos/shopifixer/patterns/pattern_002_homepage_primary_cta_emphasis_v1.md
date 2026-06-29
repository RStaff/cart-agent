# SHOPIFIXER PATTERN 002
# Homepage Primary CTA Emphasis

## Problem

The homepage hero already establishes the store, but the primary action is visually under-emphasized because it uses the secondary button style.

## Use When

- the hero is correct
- the CTA destination is already correct
- the goal is to increase first-action visibility
- no layout change is needed
- no copy change is needed

## Fix Pattern

Promote the homepage hero CTA from secondary button styling to primary button styling.

Do not change:

- button text
- destination
- spacing
- layout
- typography
- surrounding section order

## Shopify Files Involved

- `templates/index.json`
- `sections/hero.liquid`
- theme button styles in shared assets and settings

## Safe Validation Checklist

- CTA text unchanged
- CTA destination unchanged
- button appears as primary style on desktop
- button appears as primary style on mobile
- homepage section order unchanged
- no console errors

## Rollback Plan

Revert the CTA style setting from `button-primary` back to `button-secondary`.

## Before/After Evidence

- before screenshot of homepage hero CTA
- after screenshot of homepage hero CTA
- desktop comparison
- mobile comparison

## Reusable Lesson

When the issue is emphasis, not structure, the safest change is usually a styling override on the existing CTA rather than a new element.

## Confidence

High

This is a small, low-risk visual emphasis pattern with a narrow blast radius.
