# Loyalty Subscriptions

## Overview
Premium tier membership available via monthly subscription fee, offering enhanced perks beyond the organic tier ladder.

## Mechanics
- Monthly fee (e.g., 500 DZD/month or auto-renewing Telegram payment)
- Subscribers get: bonus point multiplier, exclusive offers, free delivery, priority support
- Subscription tier separate from Bronze/Silver/Gold/Platinum
- Auto-renewal with cancellation option
- Grace period after expiry before benefits are removed

## Implementation Notes
- Telegram Stars or external payment integration for subscription billing
- `subscriptions` table tracking active/expired/cancelled status
- Subscription benefits applied as modifiers on top of regular tier benefits
- Dashboard analytics: subscriber count, MRR, churn rate

## Database Changes
```sql
subscriptions (
  id, user_id, store_id, plan_type, status, price,
  started_at, expires_at, auto_renew, cancelled_at, created_at
)

-- Add to user_store_memberships or separate:
subscription_benefits jsonb  -- { point_multiplier: 1.5, free_delivery: true, ... }
```
