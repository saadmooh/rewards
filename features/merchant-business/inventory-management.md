# Inventory Management

## Overview
Track stock levels, set low-stock alerts, manage supplier info, and record cost pricing for products.

## Mechanics
- Each product has `stock_quantity`, `low_stock_threshold`, `cost_price`, `supplier_name`
- Auto-decrement stock on offer redemption or sale
- Alert badge in dashboard when product dips below threshold
- Supplier directory with contact info
- Stock history log (restocks, adjustments, write-offs)

## Implementation Notes
- Extend existing `products` table with inventory fields
- Dashboard alert component highlighting low-stock items
- Stock adjustment flow in product CRUD (with reason logged)
- Optional: barcode scanning for stock intake
- Supplier info stored as JSONB or separate `suppliers` table

## Database Changes
```sql
-- Extend products table:
ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 0;
ALTER TABLE products ADD COLUMN low_stock_threshold integer DEFAULT 5;
ALTER TABLE products ADD COLUMN cost_price integer;  -- in DZD
ALTER TABLE products ADD COLUMN supplier_name text;
ALTER TABLE products ADD COLUMN supplier_contact text;

-- Stock adjustment log:
stock_adjustments (
  id, product_id, store_id, user_id, adjustment_amount,
  reason, created_at
)
-- reason: 'restock', 'sale', 'write_off', 'correction', 'return'
```
