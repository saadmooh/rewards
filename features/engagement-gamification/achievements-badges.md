# Achievements & Badges

## Overview
Unlockable milestones that reward users for specific actions and milestones, displayed as collectible badges on their profile.

## Trigger Examples
- First purchase
- 5 store visits
- Top spender of the month
- Redeemed 10 offers
- Reached Gold tier
- Referred 3 friends

## Implementation Notes
- New `achievements` table with badge metadata (name, description, icon, trigger condition)
- `user_achievements` junction table tracking unlocked status and timestamp
- Trigger-based or application-level evaluation of conditions
- Badges displayed on `/profile` with locked/unlocked states
- Confetti animation on unlock

## Database Changes
```sql
achievements (id, store_id, name, description, icon_url, trigger_type, trigger_value, created_at)
user_achievements (id, user_id, store_id, achievement_id, unlocked_at)
```
