# Delivery Management

## Overview
End-to-end delivery order tracking with driver assignment, status flow, and customer notifications.

## Current State
`Deliveries` page exists but needs completion.

## Mechanics
- Order lifecycle: `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered` / `cancelled`
- Assign driver/team member to each order
- Customer receives status updates via Telegram notifications
- Delivery fee tracking (points or cash)
- Delivery zone configuration (city, distance-based pricing)

## Implementation Notes
- `deliveries` table with order details, status, assigned driver
- Real-time status polling or Supabase realtime subscriptions
- Driver view: list of assigned deliveries with map/address
- Customer view: status tracker UI (like food delivery apps)
- Integration with existing redemption flow (add delivery option)

## Database Changes
```sql
deliveries (
  id, store_id, order_id, user_id, driver_id,
  status, address, city, phone, delivery_fee,
  notes, estimated_time, actual_delivery_time,
  created_at, updated_at
)

-- Link to redemptions if delivery is for an offer:
ALTER TABLE redemptions ADD COLUMN delivery_id uuid REFERENCES deliveries(id);

-- Driver assignment:
-- driver_id references user_store_memberships(user_id) where role = 'driver' or 'cashier'
```
