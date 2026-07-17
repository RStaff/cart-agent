# SHOPIFIXER_SHOPIFY_ENGINEERING_CANON_V1

## Purpose

This document is the canonical Shopify engineering reference for ShopiFixer.

It is written for Mission 001: become a Shopify engineer before becoming a Shopify builder.

It is read-only. It does not prescribe code changes. It defines how Shopify themes are structured, how files depend on each other, what is risky to change, how to validate work, and how ShopiFixer should learn the platform.

## 1. Complete Shopify Theme Architecture

### 1.1 Top-level directories

#### `layout/`
The global wrappers for storefront pages.

Common files:
- `layout/theme.liquid`
- `layout/password.liquid`

What it does:
- defines the outer HTML shell
- loads global styles and scripts
- includes header/footer regions
- wraps page content

#### `templates/`
Page entry definitions.

Common files:
- `templates/index.json`
- `templates/product.json`
- `templates/collection.json`
- `templates/cart.json`
- `templates/page.json`
- `templates/search.json`
- `templates/article.json`
- `templates/blog.json`
- `templates/404.json`
- `templates/password.json`

What it does:
- chooses which sections render on a page
- defines page-level structure
- stores JSON section order for modern Shopify themes

#### `sections/`
Major storefront modules.

Common files:
- `sections/header.liquid`
- `sections/footer.liquid`
- `sections/product-information.liquid`
- `sections/main-collection.liquid`
- `sections/main-cart.liquid`
- `sections/product-list.liquid`
- `sections/hero.liquid`
- `sections/header-announcements.liquid`

What it does:
- renders the biggest editable page units
- owns section-specific settings
- may contain nested blocks

#### `snippets/`
Reusable Liquid fragments.

Common files:
- `snippets/button.liquid`
- `snippets/cart-summary.liquid`
- `snippets/product-media.liquid`
- `snippets/product-card.liquid`
- `snippets/header-drawer.liquid`
- `snippets/mega-menu-list.liquid`
- `snippets/add-to-cart-button.liquid`

What it does:
- shares logic across sections
- isolates reusable markup
- reduces duplication

#### `assets/`
Static front-end assets.

Common files:
- `assets/base.css`
- `assets/header-menu.js`
- `assets/product-card.js`
- `assets/cart-items-component.js`
- `assets/announcement-bar.js`
- `assets/section-renderer.js`
- SVG icons, JS helpers, CSS bundles

What it does:
- controls styling
- controls interaction
- controls browser-side behavior

#### `config/`
Theme-wide settings.

Common files:
- `config/settings_schema.json`
- `config/settings_data.json`

What it does:
- defines global theme settings schema
- stores editor-selected values
- controls colors, typography, logo, and global defaults

#### `locales/`
Translation and UI string files.

Common files:
- `locales/en.default.json`
- `locales/*.json`
- `locales/*.schema.json`

What it does:
- stores storefront copy
- supports translation
- provides schema labels and helper text

## 2. File Type Roles

### Liquid files
Use Liquid when rendering:
- conditional content
- objects from Shopify
- section and snippet composition
- loops over products, collections, and cart items

### JSON template files
Use JSON templates when defining:
- page composition
- section order
- editable block structure
- theme editor state

### CSS files
Use CSS when controlling:
- spacing
- layout
- typography
- responsive behavior
- visual hierarchy

### JS files
Use JS when controlling:
- menus
- drawers
- cart interactions
- product galleries
- search
- sliders
- announcement behavior

### Schema JSON
Use schema JSON when defining:
- theme settings
- section settings
- block settings
- editor labels

## 3. Dependency Relationships

### Layout → Templates → Sections → Blocks → Snippets → Assets

The dependency stack is:

1. **Layout**
   - global shell
2. **Templates**
   - page-level composition
3. **Sections**
   - major content regions
4. **Blocks**
   - editable sub-units inside sections
5. **Snippets**
   - reusable shared fragments
6. **Assets**
   - CSS/JS that make everything interactive and styled

### Practical dependency rules

- A template chooses which sections appear.
- A section can contain blocks.
- A section or block can include snippets.
- Snippets may depend on assets for styling or interaction.
- Assets should not assume a section exists unless the theme architecture guarantees it.

## 4. Risk Classification

### High risk files

These can affect store-wide behavior or checkout-adjacent trust:

- `layout/theme.liquid`
- `layout/password.liquid`
- `templates/cart.json`
- `sections/main-cart.liquid`
- `sections/product-information.liquid`
- `sections/header.liquid`
- `sections/footer.liquid`
- `sections/header-announcements.liquid`
- `assets/cart-items-component.js`
- `assets/header-menu.js`
- `assets/section-renderer.js`

Why high risk:
- they influence global structure, navigation, conversion, or cart behavior
- a mistake can break core storefront flow

### Medium risk files

These affect important merchandising or UX areas but are more isolated:

- `templates/index.json`
- `templates/product.json`
- `templates/collection.json`
- `sections/hero.liquid`
- `sections/product-list.liquid`
- `sections/main-collection.liquid`
- `snippets/product-card.liquid`
- `snippets/product-media.liquid`
- `snippets/add-to-cart-button.liquid`
- `snippets/cart-summary.liquid`
- `assets/product-card.js`
- `assets/announcement-bar.js`

Why medium risk:
- they affect conversion and merchandising
- changes are visible and important, but typically localized

### Low risk files

These are usually safer because they are reusable or purely presentational:

- `snippets/button.liquid`
- `snippets/price.liquid`
- `snippets/icon.liquid`
- `snippets/format-price.liquid`
- `snippets/spacing-style.liquid`
- `snippets/typography-style.liquid`
- `locales/*.json`
- many decorative SVG assets

Why low risk:
- they are smaller in scope
- they often change copy, labels, or reusable presentation

## 5. Safe Modification Patterns

### Pattern 1: Change the smallest file that owns the problem
Do not edit layout if a section or snippet can solve the issue.

### Pattern 2: Prefer section settings before markup changes
If the theme editor can solve it, use settings rather than rewriting markup.

### Pattern 3: Use snippet extraction for repeatable UI
If the same UI appears in multiple places, isolate it into a snippet.

### Pattern 4: Keep changes local to the page type
Homepage issues should stay in homepage templates/sections unless the issue spans shared components.

### Pattern 5: Preserve cart and checkout integrity
Any edit touching cart, header, or global shell must be validated against navigation and add-to-cart behavior.

### Pattern 6: Avoid broad refactors
Do not redesign the theme when the issue is a text, spacing, or one-block composition problem.

### Pattern 7: Leave the theme editor model intact
Do not break editable settings unless there is a compelling reason and a rollback plan.

## 6. Rollback Strategy by File Type

### Layout rollback
- restore the previous `layout/*.liquid`
- verify global shell, header, footer, and scripts

### Template rollback
- restore the prior JSON template structure
- verify section order and page composition

### Section rollback
- restore the previous section file
- verify the section renders correctly in the target page type

### Snippet rollback
- restore the snippet and verify every caller that depends on it

### Asset rollback
- restore the CSS or JS file
- verify responsive behavior, interaction, and cart/header functionality

### Config rollback
- restore the prior theme settings file
- verify editor-driven settings still match the store state

### Locale rollback
- restore the prior translation file
- verify labels and text render correctly in the storefront

## 7. Validation Strategy

Every Shopify change should be validated in layers.

### Baseline validation
- capture before screenshots
- record the affected file list
- record the current storefront behavior

### Functional validation
- verify the page loads
- verify the target section or component renders
- verify buttons, menus, or cart actions still work

### Responsive validation
- verify desktop
- verify mobile
- verify the specific breakpoints that matter for the change

### Conversion validation
- confirm CTA visibility
- confirm trust signal visibility
- confirm cart behavior is not broken

### Reversion validation
- prove the rollback restores the baseline safely

### Evidence validation
- save before/after screenshots
- save notes about what changed
- save the file paths and validation outcome

## 8. Canonical Shopify Glossary

- **Theme**
  - the full storefront presentation package
- **Layout**
  - global wrapper around page content
- **Template**
  - page-level composition file
- **Section**
  - major editable storefront module
- **Block**
  - editable component inside a section
- **Snippet**
  - reusable Liquid fragment
- **Asset**
  - CSS, JS, SVG, or supporting static file
- **Schema**
  - JSON definition of settings and editor controls
- **Liquid**
  - Shopify templating language
- **JSON template**
  - structured page definition used by modern themes
- **Theme editor**
  - Shopify admin interface for editing section settings
- **Merchant conversion**
  - getting visitors to take the desired action
- **Trust signal**
  - design or copy element that reduces hesitation
- **CTA**
  - call to action
- **Rollback**
  - restoring a known good theme state
- **Evidence**
  - before/after proof of a change
- **Playbook**
  - repeatable fix pattern with validation and rollback steps

## 9. Recommended Learning Order

1. Learn the overall folder structure.
2. Learn `layout/` and how it wraps the storefront.
3. Learn `templates/` and how page types are composed.
4. Learn `sections/` and section settings.
5. Learn `snippets/` and reuse patterns.
6. Learn `assets/` and interaction dependencies.
7. Learn `config/` and the theme editor model.
8. Learn `locales/` and copy/label ownership.
9. Learn risk classification and rollback strategy.
10. Learn how to validate changes on desktop and mobile.
11. Learn how to capture evidence and write playbook entries.
12. Learn how to reuse the pattern library for future missions.

## 10. Mastery Criteria by Module

### Module 1: Theme structure
Mastery when the learner can explain the purpose of every top-level directory.

### Module 2: Layout and templates
Mastery when the learner can trace a storefront page from layout to template to rendered sections.

### Module 3: Sections and blocks
Mastery when the learner can identify which section or block controls a specific piece of page content.

### Module 4: Snippets
Mastery when the learner can choose a snippet instead of duplicating markup.

### Module 5: Assets
Mastery when the learner can identify which JS or CSS file controls a visible behavior.

### Module 6: Config and locales
Mastery when the learner can distinguish between editable theme settings and translatable copy.

### Module 7: Risk and rollback
Mastery when the learner can rank files by risk and define a safe rollback.

### Module 8: Validation and evidence
Mastery when the learner can prove a change with screenshots and behavior checks.

### Module 9: ShopiFixer playbook creation
Mastery when the learner can convert a fix into a reusable documented pattern.

## 11. NoKings Reference

The NoKings Horizon theme is the current controlled practice environment for ShopiFixer.

Observed NoKings homepage structure:

- `templates/index.json`
  - `hero_jVaWmY`
  - `product_list_fa6P9H`

Observed high-value NoKings files:

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
- `sections/hero.liquid`
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
- `config/settings_schema.json`
- `config/settings_data.json`
- `locales/en.default.json`

## 12. Engineering Rule for Future ShopiFixer Missions

Before any fix:

1. identify the page type
2. identify the section or snippet that owns the symptom
3. classify the file risk
4. choose the smallest safe modification
5. define rollback
6. define validation
7. capture evidence
8. promote the lesson into the playbook

## Conclusion

This canon should govern all future ShopiFixer training missions.

It makes the engineer think in files, dependencies, risk, rollback, and proof rather than in vague “theme changes.”
