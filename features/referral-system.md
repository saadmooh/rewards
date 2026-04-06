# Referral System

## Description
Allow users to invite friends and earn bonus points:
- Unique referral code per user
- Track referrals and reward both referrer and new user
- Show referral stats in profile
- Leaderboard for top referrers

## Implementation
- Add `referral_code` to users table
- Add `referred_by` field to track referrer
- Create referral rewards configuration
- Add referral stats to Profile page

## Database Changes
```sql
ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN referred_by UUID REFERENCES users(id);

CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_points INTEGER NOT NULL,
  referee_points INTEGER NOT NULL,
  min_purchase_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## UI Elements
- "Invite Friends" section in Profile
- Share referral link via Telegram
- Referral stats: count, points earned
- Referral leaderboard (optional)

## Priority
Medium