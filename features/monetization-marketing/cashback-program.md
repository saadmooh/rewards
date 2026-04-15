# Cashback Program

## Overview
Percentage of spend returned as points on the customer's next visit, creating a self-reinforcing loyalty loop.

## Mechanics
- Store configures cashback rate (e.g., 5% of purchase amount → points)
- Cashback points credited after purchase verification
- Optional: delayed cashback (credited on next visit to encourage return)
- Tier-based multipliers (Gold gets 1.5× cashback rate)

## Implementation Notes
- Config stored in `stores.cashback_config` JSONB
- Cashback transactions recorded in `transactions` with type `cashback`
- Dashboard setting for store owners to toggle and adjust rate
- Cashback points can have separate expiry from regular points

## Database Changes
```sql
-- Add to stores:
cashback_config jsonb  -- { rate_percent: 5, tier_multipliers: { gold: 1.5, platinum: 2.0 }, expiry_days: 30 }

-- Or new table for more flexibility:
cashback_rules (id, store_id, rate_percent, min_purchase, tier_multipliers::jsonb, expires_in_days, is_active)
```
