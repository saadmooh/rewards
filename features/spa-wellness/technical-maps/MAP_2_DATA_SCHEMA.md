# 🗺️ Detailed Map 2: Service Data Schema

## ✅ Status: COMPLETED

## 🎯 Objective
Expand the database to support spa-specific information like service duration and skin compatibility.

## 🛠️ Implementation Steps

### 1. Database Migration (`supabase/migrations/013_spa_schema_pivot.sql`)
**Task:** Alter the `products` table.
```sql
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skin_type_compatibility TEXT[] DEFAULT '{}';
```

### 2. Update Product Hook (`src/hooks/useProducts.js`)
**Task:** Ensure new fields are fetched.
*   Update the `.select(*)` or specific column list to include `duration_minutes`, `benefits`, and `skin_type_compatibility`.

### 3. Merchant "Add Service" Form (`src/pages/Products.jsx`)
**Task:** Add inputs for the new fields.
*   Add a `Number` input for **Duration**.
*   Add a `Multi-select` or `Tag` input for **Skin Types** (Normal, Dry, Oily, Sensitive).
*   Add a `Text Area` (or dynamic list) for **Benefits**.

### 4. Data Validation
**Task:** Update validation logic.
*   Ensure `duration_minutes` cannot be negative.
*   Default `duration_minutes` to 60 if left blank.

## ✅ Verification
- Run the migration in the Supabase SQL editor.
- Create a new "Treatment" in the dashboard and verify the fields save correctly.
- Check the Supabase table to see if arrays (`benefits`) are storing correctly.
