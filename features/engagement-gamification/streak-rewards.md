# Streak Rewards

## Overview
Consecutive day/week visit bonuses to drive customer retention and habit formation.

## Mechanics
- Track last purchase/visit date per membership
- Streak increments when user scans/claims on consecutive days or weeks
- Milestone rewards at 3, 7, 14, 30 day streaks
- Streak resets if gap exceeds threshold (e.g., 2 days for daily, 2 weeks for weekly)
- Visual streak indicator with fire icon on Home page

## Implementation Notes
- Add `last_visit_date` and `streak_count` to `user_store_memberships`
- Streak bonus points configured per store in `tier_config` or new `streak_config` JSONB column
- Daily cron job or on-login check for streak expiry
- Notification reminder when streak is about to break

## Database Changes
```sql
-- Add to user_store_memberships:
last_visit_date  timestamptz
streak_count     integer  default 0

-- Or store in existing config column:
streak_config  jsonb  -- { daily: { 3: 50, 7: 100, 14: 200 }, weekly: { 4: 100 } }
```
