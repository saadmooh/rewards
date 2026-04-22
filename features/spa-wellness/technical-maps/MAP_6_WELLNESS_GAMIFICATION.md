# 🗺️ Detailed Map 6: Wellness Gamification

## ✅ Status: COMPLETED

## 🎯 Objective
Redesign rewards and loyalty triggers to feel like self-care gifts rather than transactional coupons.

## 🛠️ Implementation Steps

### 1. Scratch Card Aesthetic (`src/components/ScratchCard.jsx`)
**Task:** Update visuals.
*   Change the `surfaceColor` to a soothing Lavender or Sage gradient.
*   Change the revealed background to an image of a spa or a drop of essential oil.

### 2. Add-on Rewards (Merchant Dashboard)
**Task:** Create specific reward types.
*   Instead of just "% Discount," encourage merchants to create "Service Add-ons."
*   Reward examples: "Free 15m Eye Mask," "Complimentary Hand Massage with any Facial."

### 3. Service Frequency Trigger (`supabase/functions/...`)
**Task:** Logic for the "3rd Visit Reward."
*   Update the transaction logic: When a merchant logs a "Verified Treatment" (a purchase in a specific category), increment a visit counter.
*   Once the counter reaches 3, automatically insert a record into `scratch_card_claims`.

### 4. Mystery Rituals (Mystery Boxes)
**Task:** Framing.
*   Rename "Offer Package" to **"Mystery Ritual Box."**
*   Add a logic that ensures a "Mystery Box" contains at least one "Limited Edition" or "Off-Menu" service.

## ✅ Verification
- Scratch a card and ensure the "Zen" aesthetic is applied.
- Test the frequency trigger by logging 3 transactions and checking if a scratch card appears.
- Ensure the Mystery Box opens with the correct "Self-Care" bundle.
