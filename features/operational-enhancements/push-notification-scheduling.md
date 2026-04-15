# Push Notification Scheduling

## Overview
Plan push notification campaigns in advance with smart timing and automated delivery.

## Mechanics
- Merchant creates a campaign and sets a future send date/time
- Smart send times based on customer engagement patterns (e.g., when user is most active)
- Recurring campaigns (weekly digest, monthly statement)
- Send immediately, schedule once, or set up recurring
- Queue management with pause/cancel before send

## Implementation Notes
- `promotions` table extended with `scheduled_at` and `recurrence` fields
- Background job (Supabase cron or external scheduler) processes scheduled campaigns
- Timezone-aware scheduling
- Pre-send preview and estimated reach calculation
- Dashboard calendar view showing scheduled campaigns

## Database Changes
```sql
-- Extend promotions table:
ALTER TABLE promotions ADD COLUMN scheduled_at timestamptz;
ALTER TABLE promotions ADD COLUMN recurrence text;  -- 'none', 'weekly', 'monthly'
ALTER TABLE promotions ADD COLUMN timezone text DEFAULT 'Africa/Algiers';
ALTER TABLE promotions ADD COLUMN status text DEFAULT 'draft';  -- draft, scheduled, sent, cancelled
```
