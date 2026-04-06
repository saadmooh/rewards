# Advanced Tier Benefits

## Description
Enhance the tier system with more benefits:
- Tier-specific exclusive products
- Tier-specific discount rates
- Tier升级 rewards (bonus points on upgrade)
- Tier retention protection (grace period)
- Custom tier names per store

## Implementation
- Add tier_benefits configuration table
- Track tier upgrade history
- Implement grace period logic

## Database Schema
```sql
CREATE TABLE tier_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  tier TEXT NOT NULL, -- bronze, silver, gold, platinum
  discount_percent INTEGER DEFAULT 0,
  points_multiplier DECIMAL(2,1) DEFAULT 1.0, -- e.g., 1.5 = 1.5x points
  min_purchase_for_upgrade INTEGER,
  bonus_points_on_upgrade INTEGER,
  UNIQUE(store_id, tier)
);

-- Track tier changes
CREATE TABLE tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  from_tier TEXT,
  to_tier TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);
```

## UI Elements
- Tier benefits comparison on Profile
- "Earn X more points to next tier" indicator
- Tier upgrade celebration screen

## Priority
Medium