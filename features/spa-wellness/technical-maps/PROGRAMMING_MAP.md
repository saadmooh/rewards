# 🗺️ Spa & Wellness Programming Map

## ✅ Status: ALL PHASES COMPLETED

This document outlines the technical steps required to pivot the application from Retail to a Premium Spa/Skin Care business, ordered by implementation priority.

---

## 🟢 Phase 1: Brand Identity & Global Terminology (High Importance)
*Objective: Change the "Feel" and "Language" of the app immediately.*

1.  **Global Style Pivot (`tailwind.config.js` & `src/index.css`)**:
    *   Update `colors` to include `sage`, `lavender`, and `rose-quartz`.
    *   Change the `accent` variable from Gold to a softer Champagne tone.
    *   Import a Serif font (Playfair Display) for `h1`, `h2`, and `h3`.
2.  **Terminology Overhaul (`src/locales/*.json`)**:
    *   `common.products` → "Treatments"
    *   `common.offers` → "Rituals"
    *   `home.scan_receipt` → "Log Your Treatment"
    *   Update Tiers: Bronze/Silver/Gold → Glow/Radiant/Zen.

---

## 🟡 Phase 2: Service Data Schema (Foundation)
*Objective: Enable the "Product" table to handle Spa-specific data.*

1.  **Database Migration (`supabase/migrations/013_spa_schema_pivot.sql`)**:
    *   Add `duration_minutes` (INT) to `public.products`.
    *   Add `benefits` (TEXT[]) to `public.products`.
    *   Add `skin_type_compatibility` (TEXT[]) to `public.products`.
2.  **Merchant UI Update (`src/pages/Products.jsx`)**:
    *   Update the "Add Product" form to include inputs for Duration and Benefits.

---

## 🟠 Phase 3: The "Treatment Menu" UI (User Experience)
*Objective: Transform the catalog into a luxury service menu.*

1.  **Card Enhancement (`src/components/ProductCard.jsx`)**:
    *   Add a "time" badge (e.g., "⏱️ 60 min").
    *   Change "Buy" aesthetics to a "View Treatment" flow.
2.  **Detail Page Pivot (`src/pages/ProductDetail.jsx`)**:
    *   Display "Benefits" as a bulleted list with icons.
    *   Display "Skin Type" compatibility tags prominently.

---

## 🔴 Phase 4: Appointment & Booking Flow (Core Functionality)
*Objective: Replace e-commerce "Delivery" with service-based "Booking".*

1.  **Booking Integration (`src/components/BookingModal.jsx`)**:
    *   Create a copy of `DeliveryModal.jsx` renamed to `BookingModal.jsx`.
    *   Logic: Instead of address, ask for "Preferred Date/Time".
2.  **WhatsApp/Telegram Linkage (`src/lib/booking.js`)**:
    *   Helper to generate a URI: `wa.me/number?text=I want to book [Service]...`.
    *   Replace the "Order Online" button in `ProductDetail.jsx` with "Book Now".

---

## 🟣 Phase 5: Personalization (Premium Feature)
*Objective: Collect skin data to drive automated loyalty.*

1.  **Skin Profile UI (`src/pages/Profile.jsx`)**:
    *   Add a "My Skin Profile" card.
    *   Implement a simple selection: Dry, Oily, Sensitive, etc.
2.  **Personalized Storefront (`src/pages/Home.jsx`)**:
    *   Update the "For You" query to prioritize treatments matching the user's skin type.

---

## 💠 Phase 6: Wellness Gamification (Engagement)
*Objective: Make rewards feel like "Self-Care" gifts.*

1.  **Mystery Rituals (`src/components/ScratchCard.jsx`)**:
    *   Update graphics to use "Zen" gradients.
    *   Reward types: "Free 15m Scalp Massage", "Sample Glow Kit".
2.  **Frequency Triggers (`supabase/functions/...`)**:
    *   Create a trigger that awards a Scratch Card every 3 "Verified Treatments" (transactions with specific category).
