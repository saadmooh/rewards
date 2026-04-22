# Booking System Enhancement Plan

## Overview
This document outlines the strategy for improving the booking logic to make it more realistic and robust. The primary goal is to prevent redundant bookings and ensure that a product remains "booked" until the session is either completed, cancelled, or manually released.

## 1. Logic Improvements

### 1.1. Single Active Booking Constraint
- **Rule:** A user cannot book the same product if they already have an active booking (`pending` or `confirmed`) for it.
- **Implementation:** 
    - In `BookingModal.jsx`, we will query the `bookings` table for any records matching `user_id`, `product_id`, and `store_id` where the `status` is in `['pending', 'confirmed']`.
    - If such a record exists, the "Confirm Booking" button will be disabled, and a message will inform the user of their existing appointment.

### 1.2. Global Product Availability (Optional/Future)
- **Rule:** If a product represents a unique resource (e.g., a specific room or therapist), it might need to be blocked globally for a specific time slot.
- **Implementation:** Check for any bookings at the same date/time for the same product, regardless of the user.

## 2. User Interface Enhancements

### 2.1. Client-Side Bookings View
- **New Page:** `src/pages/ClientBookings.jsx`
- **Functionality:** 
    - List all bookings for the current user.
    - Group by status (Upcoming, Past).
    - Allow users to see details of their appointments.
    - (Optional) Allow users to cancel a `pending` booking.

### 2.2. Bottom Navigation Integration
- Add a new "Bookings" icon to the `BottomNav`.
- Icon: `Calendar` or `Clock` from `lucide-react`.
- Path: `/my-bookings`.

## 3. Database Updates
- No schema changes required as we can leverage the existing `bookings` table.
- Ensure `bookings` table has proper indexes on `(user_id, product_id, status)` for performance.

## 4. Implementation Steps
1. **Create `ClientBookings.jsx`**: Implement the UI for users to see their appointments.
2. **Update `App.jsx`**: Add the `/my-bookings` route.
3. **Update `BottomNav.jsx`**: Add the navigation item.
4. **Modify `BookingModal.jsx`**: Add the check for existing bookings and disable the button if necessary.
5. **Update `ProductDetail.jsx`**: (Optional) Show a "You have a pending booking" badge if applicable.
