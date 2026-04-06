# Points Expiry System

## Description
Implement a points expiration system to encourage users to redeem points:
- Points can have an expiry date
- Warning notifications before expiry
- Dashboard view for admins showing expiring points
- Option to extend expiry for loyal customers

## Implementation
- Add `expires_at` field to transactions table
- Create points balance tracking with expiry calculation
- Show "points expiring soon" indicator in UI
- Add admin report for expiring points

## Database Changes
```sql
ALTER TABLE transactions ADD COLUMN expires_at TIMESTAMPTZ;

CREATE INDEX idx_transactions_expires ON transactions(expires_at) WHERE expires_at IS NOT NULL;
```

## UI Elements
- Points card shows "X points expiring in Y days"
- History page highlights expiring points
- Admin dashboard: upcoming expiries chart

## Priority
High