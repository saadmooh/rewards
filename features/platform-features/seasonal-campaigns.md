# Seasonal Campaigns

## Overview
Holiday-specific themes and limited-time events that create urgency and cultural relevance.

## Examples
- Ramadan: nightly Taraweeh check-in bonuses, Eid mega-offer
- Summer: double points weekends, vacation-themed exclusive products
- Back to School: student-tier bonus, family bundle offers
- New Year: resolution challenges, year-in-review summary

## Mechanics
- Store activates a seasonal theme that reskins the app (colors, banners, copy)
- Time-limited offers and bonuses tied to the season
- Countdown timer on Home page
- Seasonal badge and progress tracker

## Implementation Notes
- `seasonal_campaigns` table with theme config, date range, and creative assets
- CSS custom properties updated for seasonal color palette
- Campaign content served as special offers tagged with `campaign_id`
- Pre-built campaign templates for common holidays
- Dashboard: campaign activation, performance analytics

## Database Changes
```sql
seasonal_campaigns (
  id, store_id, name, theme_name, color_palette::jsonb,
  banner_url, countdown_target, valid_from, valid_until,
  is_active, created_at
)

-- Link to offers:
ALTER TABLE offers ADD COLUMN campaign_id uuid REFERENCES seasonal_campaigns(id);
```
