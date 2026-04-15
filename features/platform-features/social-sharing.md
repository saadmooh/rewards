# Social Sharing

## Overview
Share achievements, redeemed offers, or tier promotions on social media or messaging apps to drive organic acquisition.

## Mechanics
- Share buttons on: offer redemption success, tier upgrade, achievement unlock
- Generates a shareable image/card with user's name, offer/store, and QR code to join
- Telegram, WhatsApp, Instagram Stories integration
- Referral code embedded in shared link
- Optional: bonus points for successful shares that lead to sign-ups

## Implementation Notes
- Use `html2canvas` or pre-rendered image templates for share cards
- Telegram: use `Telegram.WebApp.shareToStory()` or `share` intent
- WhatsApp: `https://wa.me/?text={message}` deep link
- Instagram Stories: share as image with store handle
- Share tracking: log share events and attribution

## Database Changes
```sql
share_events (
  id, user_id, store_id, share_type, platform, shared_content_type,
  shared_content_id, created_at
)
-- share_type: 'offer_redeemed', 'tier_upgraded', 'achievement_unlocked'
-- shared_content_id: reference to the offer/achievement that was shared
```
