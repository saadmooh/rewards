# Points Challenges

## Overview
Time-bound earning goals with bonus rewards on completion, encouraging concentrated engagement.

## Examples
- Earn 500 points this week → bonus 100 points
- Make 3 purchases this month → unlock exclusive offer
- Spend 10,000 DZD in 30 days → tier jump voucher

## Mechanics
- Store creates challenges with target metric, timeframe, and reward
- Active challenge displayed on Home page with progress bar
- Auto-evaluation on each transaction
- Multiple challenges can run simultaneously
- Challenges can be public (all users) or personalized (targeted tier/city)

## Implementation Notes
- New `challenges` table with challenge definitions
- `user_challenge_progress` tracking current progress per user
- Challenge status: `draft` → `active` → `completed` → `expired`
- Notification on challenge completion

## Database Changes
```sql
challenges (
  id, store_id, title, description, target_type, target_value,
  reward_type, reward_value, valid_from, valid_until,
  target_tiers, target_segment, status, created_at
)

user_challenge_progress (
  id, challenge_id, user_id, store_id, current_value, completed_at
)
```
