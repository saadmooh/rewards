# Automated Campaigns

## Overview
Trigger-based messaging that fires automatically based on customer behavior — welcome, win-back, birthday, churn alerts.

## Campaign Types
- **Welcome**: Sent when user joins, includes intro to program + welcome bonus
- **Win-Back**: Sent after 30 days of inactivity with incentive offer
- **Birthday**: Sent on user's birthday (or birth month)
- **Churn Alert**: Sent at 45/60/90 days inactive with escalating offers
- **Tier Upgrade**: Congratulatory message when customer reaches new tier
- **Milestone**: 10th visit, 5000 points earned, etc.

## Implementation Notes
- `automated_campaigns` table with trigger conditions and message templates
- Evaluated on schedule (daily cron) or on relevant events
- Message templates support variables: `{name}`, `{points}`, `{tier}`, `{offer_link}`
- Opt-out: user can disable automated messages in profile
- Dashboard: campaign history, open/redeem rates per trigger

## Database Changes
```sql
automated_campaigns (
  id, store_id, name, trigger_type, trigger_condition::jsonb,
  message_template::jsonb, offer_id, status, created_at
)
-- trigger_type: 'welcome', 'win_back', 'birthday', 'churn', 'tier_upgrade', 'milestone'
-- trigger_condition: { days_inactive: 30, min_points: 0, tier: 'any' }
-- message_template: { title: '...', body: '...', cta: 'Claim Now', cta_url: '/offers/...' }

campaign_logs (
  id, campaign_id, user_id, status, sent_at
)
-- status: 'sent', 'skipped', 'failed', 'opted_out'
```
