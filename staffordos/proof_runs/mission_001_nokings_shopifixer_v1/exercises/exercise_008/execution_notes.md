# Exercise 008 Execution Notes - Trust Badge Inventory

Status:
Complete

Mission ID:
mission_001

Mission:
Mission 001 - NoKings Shopify Engineering Training

Exercise ID:
exercise_008

Exercise:
Exercise 008 - Trust Badge Inventory

Product:
ShopiFixer

Merchant:
NoKings Athletics

Store:
no-kings-athletics.myshopify.com

Environment Type:
controlled_training

Authority Mode:
analysis-only

Payment Required:
false

Affected Page / Artifact:
Exercise 008 - Trust Badge Inventory execution notes

Issue:
Trust badge inventory completed from repository-backed Exercise 008 scope, baseline, archived NoKings theme source, and certified prior exercise knowledge.

Why It Matters:
Trust badges, payment icons, reassurance copy, CTA styling, and checkout-readiness source support must be distinguished from live runtime behavior, merchant policy claims, and payment authority before any later governed recommendation can be made.

Notes:
- This is an exercise-specific read-only inventory.
- No Shopify mutation occurred.
- No live Shopify inspection occurred.
- No after evidence was created.
- No proof package was created.
- No certification was created.
- No payment, completion, fulfillment, Abando, cart-agent-dev, commercial proof, or prior-exercise truth was changed.

## Authority Inputs

Reviewed Exercise 008 authority:

- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/fix_scope.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/before_evidence.md`

Reviewed repository-backed source:

- `staffordos/governance/archive/20260604_no_kings_evidence_review/theme_backup/dev_horizon_150895657158/`
- `staffordos/audits/no_kings/theme_backup/dev_horizon_150895657158/`

Reviewed carry-forward knowledge:

- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_004/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_005/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_006/mission_proof_package.md`
- `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_007/mission_proof_package.md`
- `staffordos/shopifixer/patterns/pattern_002_homepage_primary_cta_emphasis_v1.md`

Mission-root evidence files were not used as active payload authority.

## Inventory Summary

Exercise 008 identifies trust architecture as source support across four clusters:

1. Product purchase CTA and buy-button styling.
2. Product-card state badges.
3. Payment icon display support.
4. Cart and product reassurance source support.

The inventory proves source paths and render relationships only. It does not prove runtime payment methods, live trust badges, merchant policies, checkout behavior, app-provided content, metafields, conversion impact, or storefront outcomes.

## Trust Badge Entry Points

Repository-backed trust entry points:

- `templates/product.json`
- `templates/cart.json`
- `sections/product-information.liquid`
- `sections/main-cart.liquid`
- `sections/footer.liquid`
- `blocks/buy-buttons.liquid`
- `blocks/add-to-cart.liquid`
- `blocks/accelerated-checkout.liquid`
- `blocks/price.liquid`
- `blocks/payment-icons.liquid`
- `blocks/_cart-summary.liquid`
- `blocks/_product-details.liquid`
- `blocks/_product-card-gallery.liquid`
- `snippets/buy-buttons-styles.liquid`
- `snippets/button.liquid`
- `snippets/add-to-cart-button.liquid`
- `snippets/product-badges-styles.liquid`
- `snippets/cart-summary.liquid`
- `snippets/tax-info.liquid`
- `config/settings_data.json`
- `config/settings_schema.json`

Trust entry-point classification:

- Product CTA trust styling: source-proven.
- Product card sale and sold-out badges: source-proven.
- Footer payment icon block support: source-proven.
- Cart checkout-readiness and tax/shipping messaging: source-proven.
- Product shipping and returns reassurance preset support: source-proven.
- Live trust badge content: Not Yet Proven.
- Live merchant policy truth: Not Yet Proven.

## Product-Page CTA Trust Styling

Product CTA source path:

`templates/product.json`
-> product details / buy-buttons block
-> `blocks/buy-buttons.liquid`
-> static child blocks:

- `quantity`
- `add-to-cart`
- `accelerated-checkout`

`templates/product.json` proves a `buy-buttons` block with `stacking: true`, `show_pickup_availability: false`, static `quantity`, static `add-to-cart`, and static `accelerated-checkout` source relationships.

CTA styling sources:

- `snippets/buy-buttons-styles.liquid`
- `snippets/button.liquid`
- `snippets/add-to-cart-button.liquid`
- `blocks/add-to-cart.liquid`
- `assets/icon-add-to-cart.svg`
- `assets/sticky-add-to-cart.js`

Repository-backed CTA findings:

- `snippets/buy-buttons-styles.liquid` defines `--buy-button-preferred-width`, `.product-form-buttons`, `.product-form-buttons--stacked`, `.add-to-cart-button`, `.quantity-label`, `.quantity-rules`, pickup availability styles, and accelerated checkout styles.
- `blocks/add-to-cart.liquid` sets `style_class` and delegates rendering to `snippets/add-to-cart-button.liquid`.
- `snippets/add-to-cart-button.liquid` renders an `add-to-cart-component`, disabled state when `can_add_to_cart` is false, dynamic button text, `icon-add-to-cart.svg`, and checkmark feedback markup.
- `snippets/button.liquid` is a generic link-style button snippet, not specific trust proof by itself.
- `sections/product-information.liquid` includes sticky add-to-cart source support and `assets/sticky-add-to-cart.js`.

Boundary:

- CTA source styling is proven.
- Runtime CTA state, runtime add-to-cart behavior, product availability in the live storefront, and conversion impact are Not Yet Proven.

## Buy-Button Flow

Repository-backed buy-button flow:

1. `templates/product.json` defines the product purchase block tree.
2. `blocks/buy-buttons.liquid` resolves product, selected variant, inventory quantity, inventory policy, and `can_add_to_cart`.
3. `blocks/buy-buttons.liquid` opens the product form and provides a hidden variant id.
4. Static child block `quantity` is injected through `content_for`.
5. Static child block `add-to-cart` is injected through `content_for`.
6. `blocks/add-to-cart.liquid` renders `snippets/add-to-cart-button.liquid`.
7. Static child block `accelerated-checkout` is injected through `content_for`.
8. `blocks/accelerated-checkout.liquid` renders `form_obj | payment_button` only when product and form context are present.
9. `snippets/buy-buttons-styles.liquid` supplies shared buy-button and accelerated checkout styling.

Interpretation:

- The product CTA flow is source-backed and compositional.
- The accelerated checkout block is source-supported, but runtime accelerated checkout availability is Not Yet Proven.
- The `payment_button` source relationship does not establish payment authority.

## Product Badge Hierarchy

Repository-backed badge hierarchy:

`blocks/_product-card-gallery.liquid`
-> `.product-badges product-badges--{{ settings.badge_position }}`
-> `.product-badges__badge product-badges__badge--rectangle`
-> `snippets/product-badges-styles.liquid`
-> `config/settings_data.json`
-> `config/settings_schema.json`

Badge source behavior:

- `blocks/_product-card-gallery.liquid` renders a product badge only when `product.available == false` or `product.compare_at_price > product.price`.
- Sold-out badges use `settings.badge_sold_out_color_scheme`.
- Sale badges use `settings.badge_sale_color_scheme`.
- Badge position comes from `settings.badge_position`.
- Badge radius comes from `settings.badge_corner_radius`.
- Badge text transform comes from `settings.badge_text_transform`.
- `snippets/product-badges-styles.liquid` defines positioning and badge visual styling.

Archived settings facts:

- `badge_position`: `top-right`
- `badge_corner_radius`: `100`
- `badge_sale_color_scheme`: `scheme-1`
- `badge_sold_out_color_scheme`: `scheme-3`
- `badge_text_transform`: `none`

Boundary:

- Product sale and sold-out badge source support is proven.
- Active runtime badge display depends on live product availability and pricing state and remains Not Yet Proven.
- These badges are product-state signals, not merchant trust claims.

## Payment Icon Implementation

Repository-backed payment icon path:

`sections/footer.liquid`
-> footer block type `payment-icons`
-> `blocks/payment-icons.liquid`
-> `shop.enabled_payment_types`
-> `payment_type_svg_tag`

Payment icon source behavior:

- `sections/footer.liquid` supports a `payment-icons` block type.
- `blocks/payment-icons.liquid` renders a visually hidden payment-methods label.
- `blocks/payment-icons.liquid` iterates `shop.enabled_payment_types`.
- Each payment type is rendered with `payment_type_svg_tag`.
- Icon layout is controlled by block settings for horizontal alignment, gap, and padding.

Boundary:

- Payment icon display support is proven.
- Runtime enabled payment methods are Not Yet Proven.
- Live footer payment icon rendering is Not Yet Proven.
- Payment icons do not prove payment acceptance, settlement, Stripe truth, merchant payment status, or completion authority.

## Shipping Reassurance

Repository-backed shipping source support:

- `blocks/_product-details.liquid`
- `blocks/icon.liquid`
- `blocks/_inline-text.liquid`
- `blocks/accordion.liquid`
- `blocks/_accordion-row.liquid`
- `blocks/popup-link.liquid`
- `sections/section.liquid`
- `snippets/tax-info.liquid`
- `blocks/price.liquid`
- `snippets/cart-summary.liquid`

Product reassurance support:

- `blocks/_product-details.liquid` contains default preset group source with `icon: truck` and text `t:html_defaults.free_shipping_over`.
- P11.22 recorded that the active `templates/product.json` reviewed there does not include that default reassurance group in the active product detail block order.

Tax/shipping source support:

- `blocks/price.liquid` can render tax and shipping policy copy when `show_tax_info` is enabled.
- `snippets/tax-info.liquid` chooses shipping-at-checkout copy based on cart duty/tax state, `shop.shipping_policy.body`, and discount-code setting.
- `snippets/cart-summary.liquid` renders `tax-info` inside cart totals.

Boundary:

- Shipping reassurance source support is proven.
- Current live shipping assurance copy is Not Yet Proven.
- Live shipping policy content and shipping calculation are Not Yet Proven.

## Tax Messaging

Tax messaging path:

`snippets/cart-summary.liquid`
-> cart totals container
-> `snippets/tax-info.liquid`
-> translation keys selected from cart and shipping-policy state

Repository-backed findings:

- `snippets/cart-summary.liquid` renders tax-note content through `{% render 'tax-info', has_discounts_enabled: settings.show_add_discount_code %}`.
- `snippets/tax-info.liquid` branches on `cart.duties_included`, `cart.taxes_included`, `shop.shipping_policy.body`, and `has_discounts_enabled`.
- `config/settings_data.json` proves `show_add_discount_code: true` in the archived settings.
- `templates/product.json` and `templates/cart.json` include `show_tax_info: false` for reviewed price blocks, while the tax-info snippet still supports cart summary tax messaging.

Boundary:

- Tax/shipping messaging source support is proven.
- Runtime tax, duty, and shipping states are Not Yet Proven.
- Live policy link behavior is Not Yet Proven.

## Returns And Guarantee Messaging

Repository-backed return and guarantee source support:

- `blocks/_product-details.liquid`
- `blocks/icon.liquid`
- `blocks/accordion.liquid`
- `blocks/_accordion-row.liquid`
- `blocks/popup-link.liquid`
- `blocks/_inline-text.liquid`
- `sections/section.liquid`

Findings:

- `blocks/_product-details.liquid` contains default preset group source with `icon: return` and text `t:html_defaults.free_returns`.
- Accordion and popup-link blocks provide source support for return-policy or shipping-related content surfaces.
- Generic section and inline text blocks provide source support for configurable reassurance copy.

Boundary:

- Returns reassurance source support is proven.
- Live returns policy, guarantee content, and merchant claims are Not Yet Proven.
- No guarantee implementation was proven beyond generic theme support and source-level reassurance surfaces.

## Cart Reassurance Surfaces

Repository-backed cart reassurance path:

`templates/cart.json`
-> `sections/main-cart.liquid`
-> `blocks/_cart-summary.liquid`
-> `snippets/cart-summary.liquid`
-> checkout CTA, cart totals, installments, tax info, discount support, additional checkout buttons

Cart source findings:

- `snippets/cart-summary.liquid` contains subtotal, discount rows, discount-code entry support, estimated total, optional installments, tax/shipping messaging, checkout CTA, and additional checkout buttons.
- Checkout CTA is rendered as `button#checkout.cart__checkout-button.button`.
- Additional checkout buttons render when `additional_checkout_buttons` and `settings.show_accelerated_checkout_buttons` are true.
- `config/settings_schema.json` defines settings for `show_add_discount_code`, `show_installments`, and `show_accelerated_checkout_buttons`.
- `config/settings_data.json` proves `show_add_discount_code: true` and `cart_type: drawer` in the archived settings.

Boundary:

- Cart reassurance and checkout-readiness source support is proven.
- Runtime checkout behavior, active accelerated checkout buttons, active discounts, cart drawer runtime behavior, and payment availability are Not Yet Proven.

## Footer Payment Icon Support

Footer payment icon support:

- `sections/footer.liquid` allows a `payment-icons` block.
- `blocks/payment-icons.liquid` owns the actual icon rendering logic.

Interpretation:

- Footer-level payment icon placement is source-supported.
- Whether the footer currently renders that block in live Shopify is Not Yet Proven.
- Which payment icons appear depends on runtime `shop.enabled_payment_types`.

## Product-Information Trust Surfaces

Repository-backed product-information trust surfaces:

- `sections/product-information.liquid`
- `assets/sticky-add-to-cart.js`
- `templates/product.json`
- `blocks/price.liquid`
- `blocks/buy-buttons.liquid`
- `blocks/add-to-cart.liquid`
- `blocks/accelerated-checkout.liquid`

Findings:

- Product information source includes sticky add-to-cart support.
- Product price blocks can support payment terms and tax/shipping messaging through block settings.
- Active product template source reviewed in this exercise shows `show_installments: false` and `show_tax_info: false` for price blocks.
- Buy-button source composes the product form, add-to-cart button, quantity, and accelerated checkout block.

Boundary:

- Product-information trust surfaces are source-supported.
- Active runtime sticky add-to-cart behavior, live installments, and live tax/shipping product-page copy are Not Yet Proven.

## Theme Settings Affecting Trust

Trust-relevant settings:

- `badge_position`
- `badge_corner_radius`
- `badge_sale_color_scheme`
- `badge_sold_out_color_scheme`
- `badge_text_transform`
- `primary_button_border_width`
- `button_border_radius_primary`
- `secondary_button_border_width`
- `button_border_radius_secondary`
- `cart_type`
- `show_cart_note`
- `show_add_discount_code`
- `show_installments`
- `show_accelerated_checkout_buttons`
- `currency_code_enabled_product_pages`
- `currency_code_enabled_product_cards`
- `currency_code_enabled_cart_items`

Repository-backed archived settings:

- `badge_position`: `top-right`
- `badge_corner_radius`: `100`
- `badge_sale_color_scheme`: `scheme-1`
- `badge_sold_out_color_scheme`: `scheme-3`
- `badge_text_transform`: `none`
- `button_border_radius_primary`: `14`
- `button_border_radius_secondary`: `14`
- `cart_type`: `drawer`
- `show_cart_note`: `false`
- `show_add_discount_code`: `true`
- `currency_code_enabled_product_pages`: `false`
- `currency_code_enabled_product_cards`: `false`
- `currency_code_enabled_cart_items`: `false`

Boundary:

- Archived setting values are repository-backed.
- Current live setting values are Not Yet Proven.

## Related Snippets

Repository-backed related snippets:

- `snippets/buy-buttons-styles.liquid`
- `snippets/button.liquid`
- `snippets/add-to-cart-button.liquid`
- `snippets/product-badges-styles.liquid`
- `snippets/cart-summary.liquid`
- `snippets/tax-info.liquid`
- `snippets/card-gallery.liquid`
- `snippets/quick-add-modal-styles.liquid`
- `snippets/scripts.liquid`

Snippet roles:

- CTA and buy-button styling: `buy-buttons-styles`, `button`, `add-to-cart-button`.
- Product badge styling: `product-badges-styles`.
- Badge placement wrapper: `card-gallery`.
- Cart reassurance and checkout readiness: `cart-summary`, `tax-info`.
- Runtime asset inclusion support: `scripts`.

## Related Blocks

Repository-backed related blocks:

- `blocks/buy-buttons.liquid`
- `blocks/add-to-cart.liquid`
- `blocks/accelerated-checkout.liquid`
- `blocks/price.liquid`
- `blocks/payment-icons.liquid`
- `blocks/_product-card-gallery.liquid`
- `blocks/_product-details.liquid`
- `blocks/_cart-summary.liquid`
- `blocks/icon.liquid`
- `blocks/accordion.liquid`
- `blocks/_accordion-row.liquid`
- `blocks/popup-link.liquid`
- `blocks/_inline-text.liquid`

Block roles:

- Product purchase flow: `buy-buttons`, `add-to-cart`, `accelerated-checkout`.
- Payment terms and tax/shipping product-page support: `price`.
- Footer payment display: `payment-icons`.
- Product-state badges: `_product-card-gallery`.
- Reassurance presets and policy content support: `_product-details`, `icon`, `accordion`, `_accordion-row`, `popup-link`, `_inline-text`.
- Cart summary and checkout readiness: `_cart-summary`.

## Related Assets

Repository-backed related assets:

- `assets/sticky-add-to-cart.js`
- `assets/icon-add-to-cart.svg`
- `assets/icon-checkmark-burst.svg`
- `assets/cart-discount.js`
- `assets/cart-drawer.js`
- `assets/fly-to-cart.js`
- `assets/cart-icon.js`

Asset roles:

- Sticky product CTA support: `sticky-add-to-cart.js`.
- Add-to-cart visual support: `icon-add-to-cart.svg`, `icon-checkmark-burst.svg`.
- Cart reassurance and discount support: `cart-discount.js`.
- Cart drawer and add-to-cart flow adjacency: `cart-drawer.js`, `fly-to-cart.js`, `cart-icon.js`.

Runtime behavior for these assets remains Not Yet Proven.

## Dependency Graph

Product CTA and buy-button graph:

- `templates/product.json`
  - `sections/product-information.liquid`
  - `blocks/price.liquid`
  - `blocks/buy-buttons.liquid`
    - `quantity` static block
    - `blocks/add-to-cart.liquid`
      - `snippets/add-to-cart-button.liquid`
      - `assets/icon-add-to-cart.svg`
    - `blocks/accelerated-checkout.liquid`
      - `form_obj | payment_button`
    - `snippets/buy-buttons-styles.liquid`
  - `assets/sticky-add-to-cart.js`

Product badge graph:

- Product card source
  - `blocks/_product-card-gallery.liquid`
  - `snippets/card-gallery.liquid`
  - `snippets/product-badges-styles.liquid`
  - `config/settings_data.json`
  - `config/settings_schema.json`

Payment icon graph:

- `sections/footer.liquid`
  - block type `payment-icons`
  - `blocks/payment-icons.liquid`
    - `shop.enabled_payment_types`
    - `payment_type_svg_tag`

Cart reassurance graph:

- `templates/cart.json`
  - `sections/main-cart.liquid`
  - `blocks/_cart-summary.liquid`
  - `snippets/cart-summary.liquid`
    - discount rows
    - discount entry
    - cart totals
    - optional installments
    - `snippets/tax-info.liquid`
    - checkout CTA
    - additional checkout buttons

Shipping and returns reassurance graph:

- `blocks/_product-details.liquid`
  - `blocks/icon.liquid`
  - `blocks/_inline-text.liquid`
  - `blocks/accordion.liquid`
  - `blocks/_accordion-row.liquid`
  - `blocks/popup-link.liquid`
  - `sections/section.liquid`

## Reusable ShopiFixer Patterns

- Trust source support is not the same as live trust content.
- Product-state badges must be classified separately from merchant trust claims.
- Payment icon display must be classified separately from payment authority.
- Checkout CTA source support must be classified separately from checkout runtime behavior.
- Tax and shipping copy source support depends on cart state and policy state, both of which may be runtime-dependent.
- Accelerated checkout source support does not prove runtime accelerated checkout availability.
- Theme settings can define visual trust affordances without proving live storefront behavior.
- Archived theme source is usable for source inventory, but not sufficient to prove current live Shopify state.

## Risks

- Treating payment icons as payment truth would create a payment-authority error.
- Treating source-supported shipping or returns copy as merchant policy truth would overstate evidence.
- Treating archived settings as live runtime state could create stale governance.
- Treating product-state badges as trust badges could confuse sale/sold-out state with reassurance.
- Treating accelerated checkout source support as live wallet availability would overclaim checkout behavior.
- Trust content may also be app-provided or metafield-driven; this inventory did not prove those paths.

## Remaining Unknowns

- Runtime payment methods: Not Yet Proven
- Runtime trust badges: Not Yet Proven
- Merchant policy content: Not Yet Proven
- Checkout runtime behavior: Not Yet Proven
- Runtime accelerated checkout availability: Not Yet Proven
- App-provided trust content: Not Yet Proven
- Metafield-driven trust content: Not Yet Proven
- Live payment icons: Not Yet Proven
- Source hashes: Not Yet Proven
- Current theme identity: Not Yet Proven
- Current theme name: Not Yet Proven
- Current theme ID: Not Yet Proven
- Current theme version: Not Yet Proven
- Current live footer payment-icon rendering: Not Yet Proven
- Current live product-page reassurance group: Not Yet Proven
- Current live cart reassurance copy: Not Yet Proven
- Current live shipping, returns, guarantee, tax, and duty messaging: Not Yet Proven

## Rollback Implications

Shopify rollback required:

- No

Reason:

- Exercise 008 inventory performed no Shopify mutation.

Repository rollback:

- Restore or remove `staffordos/proof_runs/mission_001_nokings_shopifixer_v1/exercises/exercise_008/execution_notes.md`.
- Do not alter Exercise 008 scope or baseline.
- Do not alter Exercises 004-007.
- Do not alter mission-root index/deprecation files.

## Recommendation For Exercise 008 After Evidence

Next governed step:

- Capture Exercise 008 After Evidence.

The after-evidence artifact should confirm:

- Trust Badge Inventory completed.
- Product CTA trust styling source was identified.
- Product-state badge hierarchy was identified.
- Payment icon implementation was identified.
- Cart reassurance and tax/shipping source support were identified.
- Shipping, returns, and guarantee source support was classified as source support only.
- Runtime payment, policy, app, metafield, and checkout behavior unknowns remain explicit.
- No Shopify mutation occurred.

## Inventory Decision

CONDITIONAL GO.

Repository-backed justification:

- Exercise 008 scope is complete.
- Exercise 008 baseline is complete.
- Repository-backed trust and reassurance source inventory is complete.
- Remaining runtime and merchant-policy unknowns are explicit.
- No Shopify mutation occurred.
