# Franchise / White-Label

## Overview
Custom domain, branded bot name, custom colors/logo, and removal of platform branding for enterprise merchants.

## Mechanics
- Custom Telegram bot username (e.g., `@MyBrandLoyalty` instead of `@PlatformBot`)
- Custom domain for web app (`loyalty.mybrand.com`)
- Full color/theme customization beyond primary color
- Remove "Powered by" footer branding
- Custom email/Sender name for notifications

## Implementation Notes
- `white_label_config` table per store/merchant
- Custom domain requires DNS verification (TXT record)
- Telegram Bot API: merchant creates their own bot, provides token to app
- Theme engine: CSS custom properties driven by merchant config
- Premium tier feature — gated by `stores.plan = 'enterprise'` or separate flag

## Database Changes
```sql
white_label_config (
  id, store_id, custom_domain, domain_verified,
  bot_token, bot_username, bot_verified,
  theme_overrides::jsonb,  -- { primary: '#...', secondary: '#...', fonts: [...], logo_url: '...' }
  remove_branding boolean,
  custom_sender_name text,
  created_at, verified_at
)

-- Extend stores:
ALTER TABLE stores ADD COLUMN plan text DEFAULT 'basic';  -- 'basic', 'premium', 'enterprise'
```
