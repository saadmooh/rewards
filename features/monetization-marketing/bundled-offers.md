# Bundled Offers

## Overview
Multi-reward packages sold at a discount — e.g., "Redeem 3 offers for the price of 2."

## Mechanics
- Store bundles 2-5 existing offers into a package
- Bundle costs fewer points than individual redemptions combined
- User purchases bundle, receives individual coupon codes for each component
- Bundle can be time-limited or quantity-limited
- Displayed as a special card type in the offers list

## Implementation Notes
- `offer_bundles` table linking multiple offers
- Redemption flow: deduct bundle cost, create individual `redemptions` records
- Bundle progress indicator (e.g., 2/5 redeemed)
- Dashboard: bundle creation, performance analytics

## Database Changes
```sql
offer_bundles (
  id, store_id, title, description, image_url,
  points_cost, original_cost, valid_from, valid_until,
  usage_limit, used_count, is_active, created_at
)

offer_bundle_items (bundle_id, offer_id)

user_bundle_redemptions (
  id, user_id, bundle_id, redemption_ids[], purchased_at
)
```
