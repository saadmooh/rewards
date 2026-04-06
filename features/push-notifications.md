# Push Notifications

## Description
Enable Telegram push notifications for:
- New offers available
- Points earned from purchase
- Points expiring soon
- Exclusive offers for user's tier
- Offer redemption reminders

## Implementation
- Use Telegram Bot API for push notifications
- Add `notification_preferences` table in database
- Create notification settings UI in Profile page
- Store user's Telegram chat_id for messaging
- Add Supabase Edge Function for sending notifications

## Database Schema
```sql
CREATE TABLE notification_preferences (
  user_id UUID REFERENCES users(id),
  new_offers BOOLEAN DEFAULT true,
  points_earned BOOLEAN DEFAULT true,
  points_expiring BOOLEAN DEFAULT true,
  exclusive_offers BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Priority
Medium