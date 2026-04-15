# Loyalty Program Builder

## Overview
Wizard to configure points rate, tiers, welcome bonus, and referral rewards during initial store setup.

## Mechanics
- Step 1: Store details (name, logo, category, primary color)
- Step 2: Points configuration (points per DZD spent, welcome bonus amount)
- Step 3: Tier thresholds (Bronze/Silver/Gold/Platinum spend levels)
- Step 4: Referral rewards (points for referrer and referee)
- Step 5: Review and activate
- Pre-built templates for common industries (cafe, retail, restaurant, salon)

## Implementation Notes
- Extends existing onboarding flow (first user becomes owner)
- Template presets stored in `loyalty_templates` table
- Configuration saved to `stores.tier_config` and related columns
- Editable later in `/dashboard/settings`
- Validation: tier thresholds must be ascending, points rate > 0

## Database Changes
```sql
loyalty_templates (
  id, name, category, config::jsonb, created_at
)
-- config example:
-- {
--   points_rate: 1,
--   welcome_points: 100,
--   tier_config: { bronze: 0, silver: 10000, gold: 50000, platinum: 100000 },
--   referral_reward_points: 200
-- }

-- Extend stores with setup completion flag:
ALTER TABLE stores ADD COLUMN setup_completed boolean DEFAULT false;
```
