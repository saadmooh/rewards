# Birthday & Anniversary Rewards

## Description
Automatically reward users on special occasions:
- Birthday bonus points
- Membership anniversary rewards
- Special offers for these occasions

## Implementation
- Add `birthday` field to users table
- Track membership start date automatically
- Create scheduled job to identify upcoming birthdays
- Special offer type: 'birthday', 'anniversary'

## Database Changes
```sql
ALTER TABLE users ADD COLUMN birthday DATE;

-- Store first join date
ALTER TABLE user_store_memberships ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
```

## UI Elements
- Birthday badge on profile
- "Happy Birthday" celebration screen
- Anniversary celebration (1 year, 2 years, etc.)

## Priority
Low