# A/B Testing Dashboard

## Overview
Test offer types, point costs, messaging, and campaign strategies to optimize engagement.

## Mechanics
- Merchant creates two variants (A and B) of an offer or notification
- Users randomly split into test groups
- Metrics tracked: redemption rate, click-through rate, points earned
- Statistical significance indicator (p-value, confidence interval)
- Winner declared automatically or manually

## Use Cases
- Test offer title copy
- Test point cost (50 vs 75 points for same offer)
- Test notification send time (morning vs evening)
- Test offer image style

## Implementation Notes
- `ab_tests` table with variant definitions and traffic allocation
- `ab_test_results` tracking user actions per variant
- Dashboard UI: test creation, live results chart, winner declaration
- Minimum sample size calculation before significance check

## Database Changes
```sql
ab_tests (
  id, store_id, name, description, test_type,
  status, created_at, started_at, ended_at
)

ab_test_variants (
  id, test_id, label, configuration::jsonb, traffic_percent
)

ab_test_results (
  id, test_id, variant_id, user_id, action, created_at
)
-- action: 'viewed', 'clicked', 'redeemed', 'dismissed'
```
