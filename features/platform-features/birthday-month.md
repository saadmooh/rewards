# Birthday Month

## Overview
Extended birthday rewards available throughout the entire birth month instead of a single day.

## Mechanics
- User sets birth date in profile (existing field)
- Birthday offer unlocked on the 1st of their birth month, expires at month end
- Store configures a special birthday offer (e.g., 2× points, free gift, exclusive discount)
- Birthday badge visible on profile during birth month
- Push notification sent on the 1st of the birth month

## Implementation Notes
- Birthday offer type: `occasion_type = 'birthday_month'` (extends existing `birthday`)
- Eligibility check: `EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM now())`
- Monthly cron job or on-login check to activate birthday offers
- Can combine with existing birthday offer for a "birthday week" super-reward

## Database Changes
```sql
-- Extend offers.occasion_type enum:
-- Existing: 'always', 'fixed', 'birthday', 'anniversary', 'win_back', 'flash'
-- Add: 'birthday_month'

-- No new tables. Existing offer validity logic extended to support month-long window.
```
