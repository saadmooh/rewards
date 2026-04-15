# Receipt / POS Integration

## Overview
Link to existing point-of-sale (POS) or accounting software for automatic purchase tracking, eliminating manual QR receipt entry.

## Mechanics
- POS system sends purchase data to the app via webhook or API
- Purchase matched to customer by phone number, membership code, or Telegram ID
- Points auto-credited without customer action
- Daily sync of sales data for reconciliation
- Support for common POS formats (CSV export, REST API, email receipt parsing)

## Implementation Notes
- Webhook endpoint in app (`/api/webhook/pos`) receives purchase events
- Authentication via API key or signed payload
- Purchase payload: `{ customer_id, amount, items[], timestamp, receipt_id }`
- Fallback: manual CSV upload from POS export
- Audit log of all POS-synced transactions
- Integration adapters for popular POS systems

## Database Changes
```sql
-- Extend transactions:
ALTER TABLE transactions ADD COLUMN source text DEFAULT 'qr';  -- 'qr', 'pos', 'manual', 'door_qr'
ALTER TABLE transactions ADD COLUMN external_receipt_id text;
ALTER TABLE transactions ADD COLUMN pos_data jsonb;

-- POS integration config:
pos_integrations (
  id, store_id, provider_name, api_key, webhook_url,
  is_active, last_sync_at, created_at
)
```
