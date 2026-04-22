# 🗺️ Detailed Map 5: Skin Profile & Personalization

## ✅ Status: COMPLETED

## 🎯 Objective
Empower users to share their skin type and concerns, allowing the app to provide a personalized "Beauty Routine" storefront.

## 🛠️ Implementation Steps

### 1. Database Update (`supabase/migrations/014_user_skin_profile.sql`)
**Task:** Add columns to the `users` table.
```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS skin_type TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS skin_concerns TEXT[] DEFAULT '{}';
```

### 2. Profile UI (`src/pages/Profile.jsx`)
**Task:** Create the selection card.
*   Add a "My Skin Profile" card.
*   Implement a simple `Radio Group` for **Skin Type** (Oily, Dry, Combination, etc.).
*   Implement a `Checkbox Group` for **Concerns** (Aging, Acne, Sensitivity).
*   Add a "Save Profile" button that updates the Supabase record.

### 3. Personalized Filtering (`src/pages/Home.jsx`)
**Task:** Update the "For You" query.
*   Modify the `queryFn` to check the user's `skin_type`.
*   Prioritize products where `skin_type_compatibility` contains the user's type.

### 4. Smart Recommendations
**Task:** Detail page logic.
*   In `ProductDetail.jsx`, if a treatment is *not* compatible with the user's skin type, show a friendly warning: *"Note: This treatment is usually best for Oily skin. Consult our therapist for alternatives."*

## ✅ Verification
- Change your skin type in the profile.
- Return to the Home page and ensure the "For You" section updates to show relevant treatments.
- Test saving concerns and ensure the array is updated in Supabase.
