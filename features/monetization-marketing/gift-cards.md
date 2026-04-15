# Gift Cards

## Overview
Digital gift cards that users can purchase with points or money and send to friends.

## Mechanics
- User selects a product or fixed-value gift card
- Pays with points or cash equivalent
- Generates unique gift card code (alphanumeric)
- Recipient redeems code to receive value in their membership
- Optional: personalized message and themed card design

## Implementation Notes
- `gift_cards` table with code, value, status, sender/recipient info
- Redemption flow: enter code on `/profile` or dedicated `/redeem-gift-card` page
- Gift cards can be time-limited
- Dashboard analytics: issued, redeemed, expired counts

## Database Changes
```sql
gift_cards (
  id, store_id, sender_id, recipient_id, code, value, currency,
  message, image_url, status, issued_at, expires_at, redeemed_at
)
```
