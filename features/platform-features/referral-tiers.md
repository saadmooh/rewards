# Referral Tiers

## Overview
Escalating rewards for users who refer many friends — the more successful referrals, the higher the referral tier and bonus multiplier.

## Mechanics
- Referral levels: Bronze (1-3 refs), Silver (4-10), Gold (11-25), Platinum (25+)
- Each level increases referral bonus points (e.g., 200 → 300 → 500 → 1000)
- Referral tier badge displayed on profile
- Leaderboard for top referrers
- Milestone notifications on tier promotion

## Implementation Notes
- Track `successful_referral_count` on `users` table
- Referral reward calculated dynamically based on referrer's tier
- Referral tier config per store or platform-wide
- Anti-fraud: referral bonus only triggered on first purchase, not on signup

## Database Changes
```sql
-- Add to users:
successful_referral_count integer DEFAULT 0

-- Or a separate tracking table:
referral_tiers (
  id, store_id, tier_name, min_referrals, reward_points, created_at
)

-- Extend transactions note:
-- Existing 'referral' type transactions already exist, just need dynamic reward calculation
```
