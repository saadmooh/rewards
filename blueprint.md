# Project Blueprint: Rewards Dashboard

## Overview
A comprehensive loyalty and rewards platform built with React, Vite, and Supabase. The application allows store owners to manage products, offers, and customer loyalty points, while providing customers with a mobile-friendly interface to track points, claim offers, and now request product delivery.

## Core Features
- **Customer Loyalty:** Earn and redeem points based on purchases.
- **Tier System:** Bronze, Silver, Gold, and Platinum tiers with configurable thresholds.
- **Offer Management:** Create discount, gift, and points-based offers.
- **Product Catalog:** Manage store products with exclusive access for specific tiers.
- **QR System:** Scan-to-claim points and offer activation.
- **Internationalization:** Full support for English, Arabic, and French.
- **Delivery System (New):** Cash on Delivery (COD) request feature for products. Store owners can enable/disable this feature via dashboard settings.
- **Viral Referral System (New):** Unique referral links for each member. Rewarding both referrer and new member with points upon joining.

## Technical Stack
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, i18next.
- **Backend:** Supabase (PostgreSQL, Auth, Storage).
- **State Management:** Zustand.
- **Location Data:** Custom Algerian wilayas and municipalities mapping.

## Recent Changes: Delivery Feature Implementation
### Database Schema
- Created `public.deliveries` table to track order requests.
- Added `is_cod_enabled` and `referral_reward_points` columns to `public.stores`.
- Added `referred_by_id` column to `public.user_store_memberships`.
- Added Row Level Security (RLS) policies for users and store owners.
- Indexed `user_id`, `store_id`, and `status` for performance.

### Logic & State
- **`src/lib/algeria-locations.js`**: Curated list of 69 Algerian wilayas and key municipalities.
- **`src/hooks/useDeliveries.js`**: Hook for creating and fetching delivery requests.
- **`src/store/userStore.js`**: Enhanced `initUser` with automated referral detection and reward granting via Telegram `start_param`.

### UI Components
- **`src/components/DeliveryModal.jsx`**: Interactive modal for delivery details (wilaya, municipality, address, home/office selection).
- **`src/pages/Settings.jsx`**: Added COD toggle switch to manage feature availability.
- **`src/pages/ProductDetail.jsx`**: Added "Order Online (COD)" button, conditionally rendered based on store settings.
- **`src/pages/Deliveries.jsx`**: Merchant dashboard page to manage and track delivery orders with status-based filtering and updates.

### Localization
- Added `delivery` and `product_detail` translation keys in `en.json`, `ar.json`, and `fr.json`.

## Plan for Future Enhancements
1. **Delivery Tracking in History:** Add a dedicated tab or section in the History page for users to track their order status.
2. **Merchant Dashboard Updates:** Create a management view for store owners to view and update delivery statuses (pending, shipped, delivered, etc.).
3. **Telegram Notifications for Orders:** Integration with the existing Telegram bot to notify owners of new delivery requests.
