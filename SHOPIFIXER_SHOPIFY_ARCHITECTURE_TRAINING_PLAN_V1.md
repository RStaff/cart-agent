# SHOPIFIXER_SHOPIFY_ARCHITECTURE_TRAINING_PLAN_V1

## Executive Summary

This is the training plan for ShopiFixer using the NoKings Shopify store as the controlled practice environment.

The goal is to teach Codex and StaffordOS how to inspect, reason about, and safely improve real Shopify themes without touching production customer flows.

**Final classification: CONDITIONAL GO**

NoKings is sufficient as the first Shopify training environment because it is a live Shopify theme with real theme structure, real sections, and real file boundaries. It is not sufficient by itself for first external merchants unless the team completes repeated safe-fix practice, rollback rehearsal, and mobile/desktop verification discipline first.

## 1. Shopify Architecture at a Practical File Level

### Layout
`layout/` contains the wrapper for pages.

- `layout/theme.liquid` is the main storefront shell.
- `layout/password.liquid` is the password-gate shell.

Practical use:
- global HTML skeleton
- head tags
- header/footer inclusion
- top-level scripts and styles

### Templates
`templates/` defines the page-level entry points.

Common examples:
- `templates/index.json`
- `templates/product.json`
- `templates/collection.json`
- `templates/cart.json`
- `templates/page.json`
- `templates/search.json`
- `templates/404.json`
- `templates/blog.json`
- `templates/article.json`

Practical use:
- choose which sections render on each page type
- define page-specific section order
- store the page layout for JSON templates

### Sections
`sections/` contains the main editable storefront modules.

Practical use:
- homepage hero
- product grid
- product details
- cart summary
- header
- footer
- collection pages
- search
- announcements

### Snippets
`snippets/` contains reusable Liquid fragments.

Practical use:
- buttons
- product media
- cart summaries
- header drawer/menu pieces
- typography and spacing helpers
- swatches, badges, and icons

### Assets
`assets/` contains CSS, JavaScript, SVGs, and other static files.

Practical use:
- base styles
- component JS
- header/menu behavior
- cart behavior
- product gallery behavior
- announcement bar behavior

### Config
`config/` contains theme settings.

Practical use:
- color schemes
- typography defaults
- logo/favicon
- theme-wide settings
- section defaults

### Locales
`locales/` contains translation files.

Practical use:
- store-facing labels
- section text
- buttons
- accessibility copy
- schema content

### Liquid
Liquid is the theme templating language.

Practical use:
- render product and collection data
- conditionally show/hide blocks
- stitch settings and content together
- generate HTML from Shopify objects

### JSON Templates
JSON templates define structure rather than raw HTML.

Practical use:
- homepage composition
- section order
- block nesting
- settings for each section

### CSS/JS Assets
CSS and JS assets control the visual and interactive layer.

Practical use:
- cart interactions
- header menu opening/closing
- product gallery behavior
- announcements
- responsive behavior

## 2. NoKings Theme Inventory Plan

### Confirmed store and theme

- Store: `no-kings-athletics-dev.myshopify.com`
- Theme: `Horizon #150895657158`
- Local backup path: `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158`

### Confirmed top-level theme structure

- `layout/`
- `templates/`
- `sections/`
- `snippets/`
- `assets/`
- `config/`
- `locales/`

### Confirmed homepage structure

The NoKings homepage is simple:

1. `hero_jVaWmY` - `hero`
2. `product_list_fa6P9H` - `product-list`

This matters because ShopiFixer training should start with the actual section order, not with assumptions about a larger homepage.

### Suggested inventory steps

1. Read `templates/index.json`
2. Read `sections/header-group.json`
3. Read `sections/footer-group.json`
4. Read `templates/product.json`
5. Read `templates/collection.json`
6. Read `templates/cart.json`
7. Review `sections/header.liquid`
8. Review `sections/footer.liquid`
9. Review `sections/product-information.liquid`
10. Review `sections/main-collection.liquid`
11. Review `sections/main-cart.liquid`
12. Review `sections/product-list.liquid`
13. Review `sections/header-announcements.liquid`
14. Review key snippets:
    - `snippets/add-to-cart-button.liquid`
    - `snippets/product-media-gallery-content.liquid`
    - `snippets/cart-summary.liquid`
    - `snippets/product-card.liquid`
    - `snippets/header-drawer.liquid`
    - `snippets/mega-menu-list.liquid`
15. Review key assets:
    - `assets/base.css`
    - `assets/header-menu.js`
    - `assets/product-card.js`
    - `assets/cart-items-component.js`
    - `assets/announcement-bar.js`
    - `assets/section-renderer.js`

## 3. Most Important Files for Common Merchant Fixes

### Homepage
- `templates/index.json`
- `sections/hero.liquid`
- `sections/product-list.liquid`
- `sections/custom-liquid.liquid`
- `sections/slideshow.liquid`
- `sections/featured-product.liquid`

### Product page
- `templates/product.json`
- `sections/product-information.liquid`
- `snippets/product-media-gallery-content.liquid`
- `snippets/product-media.liquid`
- `snippets/product-card.liquid`
- `snippets/add-to-cart-button.liquid`
- `snippets/variant-main-picker.liquid`
- `snippets/variant-swatches.liquid`

### Collection page
- `templates/collection.json`
- `sections/main-collection.liquid`
- `sections/collection-list.liquid`
- `sections/collection-links.liquid`
- `snippets/collection-card.liquid`
- `snippets/product-grid.liquid`

### Cart
- `templates/cart.json`
- `sections/main-cart.liquid`
- `snippets/cart-summary.liquid`
- `snippets/cart-items-component.liquid`
- `snippets/cart-bubble.liquid`
- `assets/cart-items-component.js`
- `assets/component-cart-items.js`
- `assets/component-cart-quantity-selector.js`

### Header / navigation
- `sections/header-group.json`
- `sections/header.liquid`
- `sections/header-announcements.liquid`
- `snippets/header-drawer.liquid`
- `snippets/header-actions.liquid`
- `snippets/header-row.liquid`
- `snippets/mega-menu-list.liquid`
- `assets/header-menu.js`

### Footer
- `sections/footer-group.json`
- `sections/footer.liquid`
- `sections/footer-utilities.liquid`
- `snippets/localization-form.liquid`

### Mobile menu
- `sections/header.liquid`
- `snippets/header-drawer.liquid`
- `assets/header-menu.js`
- `assets/overlay.js`

### Trust badges
- `snippets/buy-buttons-styles.liquid`
- `snippets/payment-icons.liquid`
- `snippets/product-badges-styles.liquid`
- `snippets/icon-or-image.liquid`
- `snippets/button.liquid`

### Product media
- `snippets/product-media-gallery-content.liquid`
- `snippets/product-media.liquid`
- `snippets/media.liquid`
- `snippets/card-gallery.liquid`
- `assets/zoom-dialog.js`

### CTA buttons
- `snippets/button.liquid`
- `snippets/add-to-cart-button.liquid`
- `snippets/buy-buttons-styles.liquid`
- `sections/product-information.liquid`
- `sections/hero.liquid`

### Announcement bar
- `sections/header-announcements.liquid`
- `sections/header-group.json`
- `assets/announcement-bar.js`

## 4. Safe Training Workflow

The safe sequence for every training exercise is:

1. **Backup**
   - export or snapshot the theme before touching anything
2. **Inspect**
   - locate the real file that controls the issue
3. **Propose**
   - write the smallest possible fix plan
4. **Change**
   - edit only the necessary file(s)
5. **Verify**
   - test desktop and mobile behavior
   - confirm cart and navigation behavior
6. **Rollback**
   - restore the prior state if the fix breaks layout or conversion
7. **Record lesson**
   - document the file, symptom, fix pattern, and validation outcome in StaffordOS

## 5. ShopiFixer Shopify Playbook Structure

Each playbook entry should use the same template.

### Playbook entry template

- **Problem**
  - what is broken
- **Symptoms**
  - what a merchant sees
- **Shopify files involved**
  - exact theme files
- **Safe fix pattern**
  - smallest safe change
- **Validation checklist**
  - desktop
  - mobile
  - cart behavior
  - accessibility
- **Rollback plan**
  - exact revert path
- **Before/after evidence**
  - screenshot or recorded note
- **Reusable lesson**
  - what should be remembered for the next fix

### Example playbook categories

- homepage hero/content
- collection grid and merchandising
- product page clarity
- cart clarity and trust
- navigation / menu usability
- announcement bar messaging
- mobile tap targets and spacing
- product CTA clarity
- trust badge placement
- cross-sell / upsell callouts

## 6. Phased Training Roadmap

### Phase 1: Shopify file-system literacy
Learn:
- theme folder structure
- Liquid basics
- JSON templates
- the difference between sections and snippets

### Phase 2: NoKings theme inventory
Learn:
- actual homepage section order
- product page structure
- collection page structure
- cart structure
- header/footer groups

### Phase 3: Safe visual edits
Learn:
- typography tweaks
- spacing adjustments
- CTA placement
- banner text changes

### Phase 4: Conversion-focused edits
Learn:
- hero clarity
- product value proposition
- trust badge placement
- cart friction reduction

### Phase 5: Cart and checkout-adjacent improvements
Learn:
- cart visibility
- add-to-cart clarity
- shipping / policy clarity
- reminder / reassurance behavior

### Phase 6: Mobile UX improvements
Learn:
- menu usability
- tap target sizing
- stacked section behavior
- media handling on small screens

### Phase 7: Repeatable ShopiFixer playbook
Learn:
- write fix templates
- capture before/after evidence
- record rollback plans
- standardize validation

### Phase 8: Readiness for first external merchant
Learn:
- consistent delivery
- predictable rollback
- repeatable evidence capture
- operator confidence under live pressure

## 7. Readiness Criteria Before Contacting Real Merchants

### Minimum readiness checklist

- at least 10 successful NoKings fixes completed
- at least 3 rollback drills completed without confusion
- desktop validation passed for every fix
- mobile validation passed for every fix
- no broken cart behavior introduced in practice
- documented playbook patterns for common fix types
- evidence captured in StaffordOS for each training exercise
- operator can identify the exact file to change before editing
- operator can explain the risk before making the change
- operator can verify the result after the change

### Operational readiness standard

NoKings is ready for external merchants only when:

- the fix path is repeatable
- rollback is boring
- the most common theme issues have playbook entries
- the operator can work from evidence instead of guesswork

## 8. First 10 Training Exercises

1. Map the homepage section order from `templates/index.json`.
2. Identify the files that control the hero section.
3. Identify the files that control the product-list section.
4. Inspect the product page file stack.
5. Inspect the collection page file stack.
6. Inspect the cart page file stack.
7. Inspect the header/menu file stack.
8. Inspect the footer file stack.
9. Trace a CTA button from Liquid to rendered storefront behavior.
10. Trace a mobile navigation issue from layout through assets.

## 9. Safe Execution Rules

- Start with inventory, not edits.
- Change the smallest file set possible.
- Do not redesign the theme before understanding the actual structure.
- Verify desktop and mobile before considering a fix complete.
- Keep a rollback path for every change.
- Record the lesson in StaffordOS after each training exercise.
- Do not move from NoKings to a real merchant until the playbook is stable.

## 10. NoKings Inventory Summary

### Confirmed theme shape

- `layout/`
- `templates/`
- `sections/`
- `snippets/`
- `assets/`
- `config/`
- `locales/`

### Confirmed homepage order

1. hero
2. product-list

### Confirmed high-signal files

- `templates/index.json`
- `templates/product.json`
- `templates/collection.json`
- `templates/cart.json`
- `sections/header-group.json`
- `sections/footer-group.json`
- `sections/header.liquid`
- `sections/footer.liquid`
- `sections/header-announcements.liquid`
- `sections/product-information.liquid`
- `sections/main-collection.liquid`
- `sections/main-cart.liquid`
- `sections/product-list.liquid`
- `snippets/product-media-gallery-content.liquid`
- `snippets/cart-summary.liquid`
- `snippets/add-to-cart-button.liquid`
- `snippets/header-drawer.liquid`
- `snippets/mega-menu-list.liquid`
- `assets/base.css`
- `assets/header-menu.js`
- `assets/product-card.js`
- `assets/cart-items-component.js`
- `assets/announcement-bar.js`
- `locales/en.default.json`
- `config/settings_schema.json`
- `config/settings_data.json`

## Final Answer

**CONDITIONAL GO**

NoKings is a suitable first ShopiFixer training environment because it exposes the real Shopify theme file model in a controlled store. It is not enough by itself to approach real merchants unless the training plan completes the roadmap above and proves repeated safe fixes, rollback confidence, and mobile/desktop validation discipline.
