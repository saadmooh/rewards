# Revenue & ROI Tracking

## Overview
Track points issued vs redeemed, calculate program cost, and measure the return on investment of the loyalty program.

## Mechanics
- Dashboard panel showing: total points issued, total points redeemed, unredeemed liability
- Cost per point configured by merchant (e.g., 1 point = 1 DZD equivalent cost)
- ROI calculation: revenue from loyalty members vs program cost
- Breakdown by: offer type, time period, customer segment
- Trend charts showing program cost over time

## Implementation Notes
- Aggregate from `transactions` table (type = 'earn' vs 'redeem')
- `revenue_tracking` config on `stores` to set point-to-cost ratio
- Dashboard page under `/dashboard/analytics` or new `/dashboard/revenue`
- Exportable as CSV for accounting purposes
- Unredeemed points = liability on balance sheet

## Database Changes
```sql
-- Add to stores:
revenue_config jsonb  -- { point_cost: 1.0, currency: 'DZD', tracking_enabled: true }

-- Or computed view:
CREATE VIEW v_program_roi AS
SELECT
  store_id,
  SUM(CASE WHEN type = 'redeem' THEN points ELSE 0 END) as total_redeemed,
  SUM(CASE WHEN type = 'earn' THEN points ELSE 0 END) as total_issued,
  total_issued - total_redeemed as outstanding_liability
FROM transactions
GROUP BY store_id;
```
