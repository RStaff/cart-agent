# Exercise 006 Execution Notes - Cart Inventory

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Exercise ID:
exercise_006

Exercise:
Exercise 006 - Cart Inventory

Merchant:
NoKings Athletics

Store:
no-kings-athletics.myshopify.com

Environment Type:
controlled_training

Analysis Type:
Read-only cart inventory

Authority:
Analysis-only. No Shopify mutation. No payment. No commercial pilot execution.

Affected Page / Artifact:
Cart inventory for Exercise 006

Objective:
Map the repository-backed NoKings cart architecture from JSON template to sections, blocks, snippets, assets, cart item rendering, cart summary, quantity updates, item removal, checkout CTA, and cart drawer references.

Source Baseline:
- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/fix_scope.md
- staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/before_evidence.md
- staffordos/implementation/p11_8_exercise_006_cart_inventory_plan_v1.md
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/templates/cart.json
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/sections/main-cart.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_cart-title.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_cart-products.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/blocks/_cart-summary.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-products.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-summary.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-items-component.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/cart-bubble.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/quantity-selector.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/tax-info.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/snippets/header-actions.liquid
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/component-cart-items.js
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/component-cart-quantity-selector.js
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-discount.js
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-note.js
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-drawer.js
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/assets/cart-icon.js
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_data.json
- staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/config/settings_schema.json
- staffordos/audits/no_kings/catalog_truth/homepage.html

Inventory Summary:
- The cart template entry point is `templates/cart.json`.
- The active cart JSON template contains `cart-section` with type `main-cart`.
- The cart section defines static blocks for `_cart-title`, `_cart-products`, and `_cart-summary`.
- The cart section also defines a `product_list_NNFgcy` recommendation section headed `You may also like`; this is a cart-adjacent recommendation surface, not the primary cart item or checkout flow.
- `sections/main-cart.liquid` renders the cart page through `snippets/cart-items-component.liquid`.
- `_cart-title` owns cart title and cart count display through `snippets/cart-bubble.liquid`.
- `_cart-products` delegates item rendering to `snippets/cart-products.liquid`.
- `_cart-summary` delegates totals, discounts, tax messaging, checkout CTA, and accelerated checkout source support to `snippets/cart-summary.liquid`.
- `snippets/cart-products.liquid` owns full cart item rows, product identity, options/properties, line discounts, quantity selector placement, remove controls, item errors, line totals, empty-cart messaging, and continue-shopping behavior.
- `snippets/cart-summary.liquid` owns subtotal, cart-level discounts, cart note source support, discount-code source support, estimated total, installment source support, tax-info messaging, checkout submit button, and additional checkout button source support.
- `snippets/header-actions.liquid` proves the cart drawer source relationship when `settings.cart_type == 'drawer'` and `template.name != 'cart'`.
- `assets/component-cart-items.js` owns source-level quantity-change, line-removal, section re-render, item-count update, cart-update event, discount-update event, and page/drawer morph behavior.
- No storefront runtime behavior was inspected or inferred.

JSON Template Hierarchy:
- `templates/cart.json`
- `sections.cart-section`
- `sections.cart-section.type`: `main-cart`
- `sections.cart-section.blocks.cart-page-title`: static `_cart-title`
- `sections.cart-section.blocks.cart-page-items`: static `_cart-products`
- `sections.cart-section.blocks.cart-page-summary`: static `_cart-summary`
- `sections.product_list_NNFgcy`: `product-list` recommendation section
- `order`: cart section followed by recommendation section

Main Cart Section Hierarchy:
- `sections/main-cart.liquid`
- Captures `cart_page_more_blocks_content` from `content_for 'blocks'`.
- Captures `cart_items_children` for the cart page payload.
- Defines `<template id="empty-cart-template">` for empty cart replacement.
- Renders `_cart-title`.
- Renders `_cart-products`.
- Renders `_cart-summary` only when the cart is not empty.
- Renders additional section blocks after the cart content.
- Wraps the captured children with `{% render 'cart-items-component', children: cart_items_children, section_id: section.id %}`.
- Uses a one-column mobile layout and a two-column desktop layout with the summary in the second column.

Liquid Render Hierarchy:
- `templates/cart.json`
- `sections/main-cart.liquid`
- `blocks/_cart-title.liquid`
- `snippets/cart-bubble.liquid`
- `blocks/_cart-products.liquid`
- `snippets/cart-products.liquid`
- `snippets/quantity-selector.liquid`
- `blocks/_cart-summary.liquid`
- `snippets/cart-summary.liquid`
- `snippets/tax-info.liquid`
- `snippets/cart-items-component.liquid`
- `assets/component-cart-items.js`
- `assets/component-cart-quantity-selector.js`
- `assets/cart-discount.js`
- `assets/cart-note.js`
- `assets/cart-drawer.js`
- `assets/cart-icon.js`

Cart Entry Point:
- `templates/cart.json` is the cart page entry point.
- The entry point selects `sections/main-cart.liquid` through the `main-cart` section type.
- The template is marked as auto-generated by Shopify and may be overwritten by the Shopify admin theme editor.

Cart Item Rendering Flow:
- `snippets/cart-products.liquid` renders an empty state when `cart.empty?` or `force_empty` is true.
- The empty state can display a customer login prompt when customer accounts are enabled and the customer is not logged in.
- The empty state renders a continue-shopping link using `settings.empty_cart_button_link` with fallback to `routes.all_products_collection_url`.
- Non-empty cart rendering uses `<form action="{{ routes.cart_url }}" id="cart-form" method="post">`.
- Cart rows are produced by looping over `cart.items`.
- Each row stores `data-parent-key` and `data-key`, allowing nested/bundle line relationships to be represented.
- Product identity includes image, product title link, optional vendor, bundle component titles, variants, visible line item properties, selling plan allocation, line-level discounts, unit price, and line price.
- Item-level line totals use `item.final_line_price`, with optional currency-code formatting controlled by `settings.currency_code_enabled_cart_items`.

Cart Product Row Dependencies:
- `item.image`
- `item.url`
- `item.product.title`
- `item.product.vendor`
- `item.item_components`
- `item.options_with_values`
- `item.properties`
- `item.selling_plan_allocation`
- `item.line_level_discount_allocations`
- `item.original_price`
- `item.final_price`
- `item.variant.compare_at_price`
- `item.unit_price`
- `item.unit_price_measurement`
- `item.instructions.can_update_quantity`
- `item.instructions.can_remove`
- `settings.cart_thumbnail_border_*`
- `settings.currency_code_enabled_cart_items`

Quantity Update Flow:
- `snippets/cart-products.liquid` renders `snippets/quantity-selector.liquid` for each cart item.
- For cart lines, `quantity-selector.liquid` uses `cart-quantity-selector-component`.
- Cart line inputs use `name="updates[]"`, `data-cart-line="{{ line_index | plus: 1 }}"`, `data-cart-quantity`, min, max, and step metadata.
- Quantity controls call `/decreaseQuantity`, `/increaseQuantity`, and `/setQuantity`.
- `assets/component-cart-quantity-selector.js` defines `cart-quantity-selector-component` and adjusts plus/minus disabled states from the cart-line min/max values.
- `assets/component-cart-items.js` listens for `ThemeEvents.quantitySelectorUpdate`, debounces changes, and calls `updateQuantity`.
- Quantity zero is routed to `onLineItemRemove`.
- Quantity changes call `Theme.routes.cart_change_url` with line, quantity, sections, and `sections_url`.
- Updated section HTML is parsed, quantity selectors are updated, a `CartUpdateEvent` is dispatched, and the section is morphed.

Item Removal Flow:
- The remove button in `snippets/cart-products.liquid` calls `/onLineItemRemove/{{ item.index | plus: 1 }}`.
- Remove visibility respects `item.instructions.can_remove`.
- `assets/component-cart-items.js` sends a quantity zero update to `Theme.routes.cart_change_url`.
- The source removes the selected row and nested child rows.
- If all rows are removed, it imports `empty-cart-template` and starts a view transition.
- The transition type differs for drawer and page contexts: `empty-cart-drawer` or `empty-cart-page`.

Cart Totals And Subtotal Flow:
- `snippets/cart-summary.liquid` renders `cart.items_subtotal_price` when cart-level discounts are present.
- It renders `cart.cart_level_discount_applications` as discount rows.
- It computes total display from `cart.total_price`.
- It uses `money_with_currency` when `settings.currency_code_enabled_cart_total` is true; otherwise it uses `money`.
- The cart total is rendered in a `text-component` with `data-cart-subtotal` and `data-testid="cart-total-value"`.

Discount Presentation And Handling:
- `snippets/cart-summary.liquid` shows cart-level discount rows when `cart.cart_level_discount_applications.size > 0`.
- If `settings.show_add_discount_code` is enabled, it renders `cart-discount-component`.
- The archived settings data explicitly sets `show_add_discount_code` to true.
- `cart-discount-component` reads existing cart-level and line-level discount codes from rendered pills.
- `assets/cart-discount.js` applies or removes discount codes through `Theme.routes.cart_update_url`.
- Discount updates dispatch `DiscountUpdateEvent` and morph the relevant section.
- Active discounts and runtime discount applicability are Not Yet Proven.

Tax And Shipping Messaging:
- `snippets/cart-summary.liquid` renders `snippets/tax-info.liquid`.
- `tax-info.liquid` selects message text from `cart.duties_included`, `cart.taxes_included`, `shop.shipping_policy.body`, and whether discount-code entry is enabled.
- The source supports duty/tax/shipping-at-checkout messaging variants.
- Runtime tax, duty, and shipping message configuration is Not Yet Proven.

Checkout CTA Flow:
- `snippets/cart-summary.liquid` renders the checkout CTA as a submit button.
- The button uses `id="checkout"`, `name="checkout"`, `form="cart-form"`, and the label `content.checkout`.
- The button is disabled when the cart is empty.
- This maps the source-level cart-to-checkout handoff only; checkout runtime behavior was not tested.

Accelerated Checkout Presence:
- `snippets/cart-summary.liquid` contains the additional checkout button source path.
- Additional checkout buttons render only when `additional_checkout_buttons` and `settings.show_accelerated_checkout_buttons` are truthy.
- `settings_schema.json` defines a `show_accelerated_checkout_buttons` setting, but runtime accelerated checkout availability is Not Yet Proven.

Empty-Cart State:
- `sections/main-cart.liquid` defines the page empty-cart template.
- `snippets/cart-products.liquid` renders empty-cart login and continue-shopping controls.
- `snippets/header-actions.liquid` defines an empty cart drawer template when drawer mode is enabled.
- `assets/component-cart-items.js` swaps to empty-cart content when the final row is removed.
- Archived homepage catalog truth proves an empty cart drawer was rendered at the time of capture.

Cart Bubble And Count Behavior:
- `_cart-title.liquid` can render `snippets/cart-bubble.liquid` when `show_count` is true.
- `cart-bubble.liquid` renders `cart.item_count` and hides the bubble when the cart is empty.
- `assets/cart-icon.js` listens for cart update events, updates visible count, toggles hidden and has-cart classes, stores the count in session storage, and reconciles recent count on pageshow.
- Archived homepage catalog truth proves rendered cart icon and cart bubble markup existed at capture time.

Cart Drawer Architecture:
- `config/settings_data.json` explicitly sets `cart_type` to `drawer`.
- `snippets/header-actions.liquid` renders `cart-drawer-component` when cart type is drawer and the current template is not the cart page.
- The drawer loads `assets/cart-drawer.js`.
- The drawer captures empty and non-empty cart children and passes them through `snippets/cart-items-component.liquid` with `is_drawer: true`.
- The non-empty drawer path reuses `snippets/cart-products.liquid` and `snippets/cart-summary.liquid`.
- `assets/cart-drawer.js` opens the drawer on cart-add events when `auto-open` is present, maintains mobile history state, announces count changes to a live region, closes on installment CTA click, and updates sticky summary state.
- A dedicated cart drawer section path is Not Yet Proven; the drawer source is proven through `snippets/header-actions.liquid` and `assets/cart-drawer.js`.
- Runtime drawer behavior is Not Yet Proven.

Cart-Related Scripts And Assets:
- `assets/component-cart-items.js`: cart line quantity updates, item removal, section morphing, cart update dispatch, discount update handling, and empty-cart transition.
- `assets/component-cart-quantity-selector.js`: cart quantity selector button state behavior.
- `assets/cart-discount.js`: discount apply/remove source flow.
- `assets/cart-note.js`: cart note update source flow when cart notes are enabled.
- `assets/cart-drawer.js`: cart drawer dialog source behavior.
- `assets/cart-icon.js`: cart icon and bubble count source behavior.
- `assets/fly-to-cart.js`: proven as a cart-related source asset, but runtime use in this exercise is Not Yet Proven.
- `assets/sticky-add-to-cart.js`: proven as a cart-related source asset, but runtime use in this exercise is Not Yet Proven.
- `assets/header-drawer.js`: proven as a drawer-related asset, but cart-specific runtime use in this exercise is Not Yet Proven.

App Block, Metafield, And Cart Attribute Dependencies:
- `sections/main-cart.liquid` permits `@app` blocks in its schema.
- The active `templates/cart.json` cart section contains only the static cart title, products, and summary blocks.
- Active cart app blocks are Not Yet Proven.
- Cart metafield dependencies are Not Yet Proven.
- Cart attribute dependencies are Not Yet Proven.
- Line item properties are supported in cart item rendering, but actual cart attributes or merchant-configured properties are Not Yet Proven.

Trust And Checkout-Readiness Surfaces:
- `snippets/cart-summary.liquid` concentrates checkout-readiness surfaces: subtotal, discounts, note source support, discount code source support, total, installments source support, tax/shipping messaging, checkout CTA, and accelerated checkout source support.
- `snippets/cart-products.liquid` supports item-level trust surfaces: visible item details, variants, properties, selling plans, line discounts, unit pricing, quantity constraints, remove availability, and line errors.
- `snippets/tax-info.liquid` is the primary source-level trust message for tax, duty, and shipping-at-checkout copy.
- Source-level checkout readiness is mapped; live checkout readiness is Not Yet Proven.

Settings Observed In Archived Source:
- `settings_data.json` explicitly sets `cart_type` to `drawer`.
- `settings_data.json` explicitly sets `show_cart_note` to false.
- `settings_data.json` explicitly sets `show_add_discount_code` to true.
- `settings_data.json` explicitly sets `currency_code_enabled_cart_items` to false.
- `settings_schema.json` defines `show_installments`, `show_accelerated_checkout_buttons`, `currency_code_enabled_cart_total`, and other cart settings.
- Runtime resolved values for settings not explicitly present in archived `settings_data.json` are Not Yet Proven.

Rollback Implications:
- This exercise performed no Shopify mutation.
- Shopify rollback is not required.
- Repository rollback is restoring or removing this exercise-specific `execution_notes.md`.
- Future implementation must preserve separation between full cart page, cart drawer, cart summary, and cart item rendering surfaces.
- Future implementation must not overwrite Exercise 004 or Exercise 005 artifacts.

Reusable ShopiFixer Patterns:
- Start cart analysis at the JSON template, then trace static cart blocks into their Liquid blocks and snippets.
- Separate page cart authority from drawer cart authority; this theme reuses cart products and cart summary in both contexts through `cart-items-component`.
- Treat cart summary as checkout-adjacent authority because it concentrates discounts, totals, tax/shipping copy, checkout CTA, installments, and accelerated checkout source support.
- Treat quantity update and removal behavior as JavaScript authority, not just Liquid markup.
- Keep source support separate from runtime proof; discount, tax, shipping, installment, accelerated checkout, drawer, and app-block behavior require runtime evidence before claims.
- Maintain exercise-specific artifact paths so future exercises cannot overwrite certified Exercise 004 or Exercise 005 evidence.

Risks:
- Cart and checkout-adjacent source paths are high impact and should remain read-only until governed implementation authority exists.
- A future cart change could affect both full cart page and drawer because both reuse shared cart products, cart summary, and cart item component paths.
- Discount, tax, installment, accelerated checkout, and drawer behavior cannot be certified from source presence alone.
- Cart item properties and selling plan handling can expose merchant-specific details; future analysis should avoid fabricating runtime examples.

Unknowns:
- Live runtime cart behavior: Not Yet Proven
- Active app blocks: Not Yet Proven
- Active discounts: Not Yet Proven
- Live shipping or tax calculations: Not Yet Proven
- Checkout performance: Not Yet Proven
- Runtime accelerated-checkout state: Not Yet Proven
- Runtime cart drawer behavior: Not Yet Proven
- Dedicated cart drawer section path: Not Yet Proven
- Cart metafield dependencies: Not Yet Proven
- Cart attribute dependencies: Not Yet Proven
- Current theme name: Not Yet Proven
- Current theme ID: Not Yet Proven
- Current theme version: Not Yet Proven
- Source hashes for cart files: Not Yet Proven

Unsupported Claims Explicitly Excluded:
- No storefront improvement is claimed.
- No UX improvement is claimed.
- No conversion improvement is claimed.
- No revenue impact is claimed.
- No merchant outcome is claimed.
- No production deployment is claimed.
- No payment event is claimed.
- No commercial completion is claimed.
- No live runtime behavior is claimed.

Governance Confirmation:
- Exercise-specific authority only.
- Mission-root payload files were not used as active authority.
- `fix_scope.md` was not modified.
- `before_evidence.md` was not modified.
- `after_evidence.md` was not written.
- No proof package was created.
- No Shopify mutation occurred.
- No payment, fulfillment, completion, Abando, cart-agent-dev, or commercial ShopiFixer truth was changed.
