# Customer Segmentation

## Overview
Auto-group customers by behavior for targeted marketing, offers, and retention efforts.

## Segments
- **Churn Risk**: No visit in 30+ days, declining spend
- **VIP**: Top 10% by lifetime spend or Platinum tier
- **New Joiners**: Joined within last 7 days
- **Deal Hunters**: Only redeem offers, rarely make purchases
- **Regulars**: Consistent weekly/monthly visits
- Store can also create custom segments with filters

## Implementation Notes
- Segments computed via SQL views or materialized views, updated daily
- `customer_segments` table for custom segment definitions
- Segment badges visible in the Customers dashboard
- Segments used as targeting criteria in push campaigns
- Dashboard analytics: segment distribution, segment-to-revenue mapping

## Database Changes
```sql
customer_segments (
  id, store_id, name, description, filter_rules::jsonb,
  auto_computed boolean, created_at
)

user_segment_memberships (user_id, store_id, segment_id, assigned_at)

-- Or use a materialized view for auto-computed segments:
CREATE MATERIALIZED VIEW mv_customer_segments AS
SELECT user_id, store_id,
  CASE
    WHEN last_purchase < now() - interval '30 days' THEN 'churn_risk'
    WHEN total_spent >= (SELECT percentile_cont(0.9) WITHIN GROUP (ORDER BY total_spent) FROM user_store_memberships) THEN 'vip'
    WHEN joined_at > now() - interval '7 days' THEN 'new_joiner'
    ELSE 'regular'
  END as segment
FROM user_store_memberships;
```
