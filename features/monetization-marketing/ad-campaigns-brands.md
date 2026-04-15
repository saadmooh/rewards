# Ad Campaigns for Brands

## Overview
Third-party brands can sponsor offers or products within a store's loyalty program, paying for visibility.

## Mechanics
- Brand purchases ad credits (points or money)
- Sponsored offers appear with "Sponsored" badge in the offers list
- Brand can target by tier, city, or purchase history
- Store owner approves sponsored content before it goes live
- Performance metrics: impressions, clicks, redemptions

## Implementation Notes
- `sponsored_campaigns` table with budget, targeting, and creative assets
- Offer/flag `is_sponsored` to surface in UI
- Impression tracking via analytics events table
- Dashboard section for brand campaign management
- Revenue share model: store gets a cut of ad spend

## Database Changes
```sql
sponsored_campaigns (
  id, store_id, brand_name, brand_logo, budget_spent, budget_total,
  target_tiers, target_cities, status, starts_at, ends_at, created_at
)

-- Link to existing offers:
ALTER TABLE offers ADD COLUMN is_sponsored boolean DEFAULT false;
ALTER TABLE offers ADD COLUMN sponsored_by uuid REFERENCES sponsored_campaigns(id);
```
