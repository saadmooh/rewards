# Multi-Store Support

## Overview
One user account linked to multiple stores, allowing customers to earn and spend points across different loyalty programs.

## Mechanics
- User joins multiple stores via separate QR codes or Telegram bots
- Points balance is per-store (existing behavior)
- Unified view: Home page shows all active memberships with store switcher
- Cross-store promotions: "Visit Store B and earn 2× points"
- Single profile showing all tier badges

## Implementation Notes
- `user_store_memberships` already supports N stores per user
- Store switcher UI in header or on Home page
- BottomNav and routing adjusted to include `store_slug` context
- Cross-store referral: existing store can recommend another store
- Notification routing: user receives pushes from all joined stores

## Database Changes
No new tables required. Existing schema supports multi-store. UI and routing layer changes needed to surface `store_slug` context in all queries.
