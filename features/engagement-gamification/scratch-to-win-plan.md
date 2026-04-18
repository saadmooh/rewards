# 🎫 Scratch-to-Win (اخدش واربح) — Detailed Implementation Plan

## 1. Overview & Objectives
Transform standard loyalty offers into an engaging gamified experience. By hiding rewards behind a "scratchable" layer, we leverage the **Curiosity Gap** and **Variable Rewards** psychology to increase engagement by up to 300%.

### Key Goals:
- **Interactive UI**: High-performance Canvas-based scratch effect.
- **Urgency**: Post-reveal countdown timers to drive immediate action.
- **Automated Triggers**: Cards assigned on birthdays, tier upgrades, or milestones.
- **Security**: Server-side reward validation via Supabase RLS and Functions.

---

## 2. Database Schema (Supabase)

### `public.scratch_cards` (Campaign Configuration)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `store_id` | uuid | REFERENCES stores(id) ON DELETE CASCADE |
| `title` | text | NOT NULL (e.g., "Surprise Birthday Gift!") |
| `description` | text | |
| `reward_type` | text | ENUM: 'points', 'discount', 'gift', 'double_points' |
| `reward_value` | int | Amount of points, % discount, etc. |
| `reward_metadata` | jsonb | Extra info (e.g., product_id, min_purchase) |
| `trigger_type` | text | ENUM: 'manual', 'birthday', 'tier_upgrade', 'welcome' |
| `surface_color` | text | Hex code (Default: #D4AF37 - Gold) |
| `status` | text | ENUM: 'active', 'paused', 'expired' (Default: 'active') |
| `valid_until` | timestamptz | Expiry of the campaign itself |

### `public.scratch_card_claims` (User Instances)
| Column | Type | Constraints |
| :--- | :--- | :--- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `card_id` | uuid | REFERENCES scratch_cards(id) |
| `user_id` | uuid | REFERENCES auth.users(id) |
| `store_id` | uuid | REFERENCES stores(id) |
| `is_revealed` | boolean | DEFAULT false |
| `is_redeemed` | boolean | DEFAULT false |
| `revealed_at` | timestamptz | |
| `expires_at` | timestamptz | 24 hours after reveal (Dynamic) |

---

## 3. UI/UX Design & Components

### 3.1 `ScratchCard.jsx` (The Core Interaction)
A reusable component using the **HTML5 Canvas API**.
- **Logic**: 
    1. Draw the "Surface" (gold/silver) on the canvas.
    2. Use `globalCompositeOperation = 'destination-out'` to "erase" pixels on touch/mouse drag.
    3. Periodically check transparency percentage.
    4. When > 50% is cleared, trigger `onReveal` event and auto-clear the rest.
- **Animation**: Use `framer-motion` for the "Reveal" transition and `canvas-confetti` for the win effect.

### 3.2 `ScratchCardPage.jsx` (Customer View)
- Fetches active claims from `scratch_card_claims`.
- Displays the `ScratchCard` component.
- **Post-Reveal State**: Shows the reward details, a countdown timer (using `react-countdown`), and a "Redeem Now" button.

---

## 4. Business Logic & Hooks

### `useScratchCards.js`
- **`fetchAvailable()`**: Get un-revealed cards for the current user.
- **`revealMutation()`**: Updates `is_revealed = true` and sets `revealed_at` via Supabase.
- **`redeemMutation()`**: Finalizes the claim, updates `is_redeemed = true`, and grants the actual reward (points or coupon).

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Database & i18n)
1. Run migration SQL to create tables and RLS policies.
2. Add translation keys for `scratch_card` namespace in `en.json`, `ar.json`, `fr.json`.

### Phase 2: Interactive Component
1. Build `ScratchCard.jsx` with Canvas API.
2. Implement "Brush" size and "Transparency Detection" logic.
3. Integrate `canvas-confetti`.

### Phase 3: Application Integration
1. Create `ScratchCardPage.jsx` and add route `/scratch`.
2. Update `BottomNav.jsx` with a new "Gift/Scratch" icon.
3. Add `scratch` methods to `userStore.js`.

### Phase 4: Merchant Dashboard
1. Add "Scratch Campaigns" section to the store owner dashboard.
2. Implement basic CRUD for `scratch_cards`.

---

## 6. Security & Fairness
- **RLS**: Users can only see their own `scratch_card_claims`.
- **Validation**: Server-side check ensures a card can only be redeemed once and before its `expires_at` date.
- **Cheat Prevention**: The reward value is fetched from the DB *after* the reveal event is confirmed by the server, or masked until revealed.

---

## 7. Success Metrics
- **Conversion Rate**: Increase in offer redemptions compared to static coupons.
- **Engagement**: Average time spent on the "Scratch" page.
- **Retention**: Repeat visits triggered by scratch notifications.
