# Plan: Offer Products Display with Discount Info & Coupon Redemption

## Overview

This plan outlines the implementation of displaying products linked to offers with discount information, and providing a 4-digit code + QR code for redeemed offers to show at checkout.

## Current State Analysis

### Existing Components
- **OfferCard.jsx**: Displays offer title, description, points, expiry date, image
- **CouponSheet.jsx**: Unused component with QR code display functionality
- **OfferDetail.jsx**: Shows offer details, handles redemption, displays coupon code as text only
- **ClientProducts.jsx**: Displays products in a 2-column grid
- **useOffers.js**: Hooks for fetching offers

### Existing Data Structures
- **offers**: id, title, description, type, discount_percent, points_cost, valid_until
- **products**: id, name, description, price, category, image_url
- **offer_products**: Linking table (offer_id, product_id)
- **redemptions**: id, user_id, offer_id, coupon_code, products (JSONB)

### Gap Analysis
1. Products linked to offers are not displayed on offer detail pages
2. Discount calculations (new price with old price crossed) not implemented
3. Coupon code displayed as plain text only - no 4-digit code format
4. No QR code generation for coupon redemption
5. Products with active offers not highlighted in ClientProducts

---

## Implementation Plan

### Phase 1: Database & Backend Changes

#### 1.1 Create Migration for Coupon Code Generation
- Add function to generate 4-digit numeric coupon codes
- Add index on coupon_code for fast lookups

#### 1.2 Update userStore.redeemOffer Method
- Generate 4-digit coupon code on redemption
- Store linked product IDs in redemption record
- Set coupon expiry (24 hours default)
- Return coupon_code in redemption object

---

### Phase 2: Hooks & Data Fetching

#### 2.1 Create useOfferWithProducts Hook
```javascript
export const useOfferWithProducts = (offerId) => {
  // Fetch offer details
  // Fetch linked products from offer_products table
  // Calculate discounted prices
  // Return combined data
}
```

#### 2.2 Create useRedemption Hook
```javascript
export const useRedemption = (offerId) => {
  // Check if user has redeemed this offer
  // Return redemption data including coupon_code
}
```

---

### Phase 3: UI Components

#### 3.1 Create ProductOfferCard Component
- Display product image, name, original price
- Show discounted price with original price struck through (red line)
- Display discount badge (e.g., "-20%")
- Show "Offer Applied" indicator

#### 3.2 Create CouponDisplay Component (Enhanced CouponSheet)
- Display 4-digit coupon code in large font
- Display QR code (using qrcode.react)
- Show countdown timer for expiry
- Add "Copy Code" functionality

#### 3.3 Create OfferProductList Component
- Grid or list view of products associated with an offer
- Each product shows discount info
- Visual indicator for products with applied offers

---

### Phase 4: Page Implementations

#### 4.1 Update OfferDetail.jsx
- Fetch and display linked products with discount info
- Show "Redeemed" state with 4-digit code + QR code
- Use CouponDisplay component for redeemed offers

#### 4.2 Update ClientProducts.jsx
- Filter/highlight products with active offers
- Show discount badge on products with offers

---

### Phase 5: UI/UX Enhancements

#### 5.1 Visual Design for Offers on Products
- **Discount Badge**: Red background, white text, positioned top-right
- **Price Display**: New price in bold, original price with strikethrough (red line)
- **Offer Indicator**: Subtle glow or border highlight for products with offers

#### 5.2 Coupon Display Design
- **Code Display**: Large, monospace font, 4-digit format (e.g., "4521")
- **QR Code**: 200x200px, centered, with margin
- **Timer**: Countdown showing time remaining
- **Action Buttons**: Copy code, share, close

---

## File Structure Changes

### New Files to Create
1. `src/hooks/useOfferWithProducts.js` - Fetch offer with products
2. `src/hooks/useRedemption.js` - Fetch user's redemption
3. `src/components/ProductOfferCard.jsx` - Product with discount display
4. `src/components/CouponDisplay.jsx` - 4-digit code + QR display
5. `src/components/OfferProductList.jsx` - List of products for offer

### Files to Modify
1. `src/store/userStore.js` - Update redeemOffer method
2. `src/pages/OfferDetail.jsx` - Add product display & coupon display
3. `src/pages/ClientProducts.jsx` - Highlight products with offers

---

## Acceptance Criteria

### Products Display
- [ ] Products linked to offer display on offer detail page
- [ ] Original price shown with strikethrough (red line)
- [ ] Discounted price shown prominently
- [ ] Discount percentage badge visible

### Coupon Redemption
- [ ] 4-digit numeric coupon code generated on redemption
- [ ] QR code generated from coupon code
- [ ] Both code and QR displayed in modal
- [ ] Copy functionality works
- [ ] Expiry countdown shown (24 hours)

### UI/UX
- [ ] Responsive design works on mobile
- [ ] Animations smooth
- [ ] Loading states during data fetch
- [ ] Consistent with app design language

---

## Implementation Priority

1. **P0 - Critical**: Update userStore.redeemOffer for coupon code generation
2. **P0 - Critical**: Enhance OfferDetail with product display
3. **P1 - High**: Implement CouponDisplay with 4-digit code + QR
4. **P2 - Medium**: Update ClientProducts to highlight offer products
5. **P3 - Low**: Add animations and polish
