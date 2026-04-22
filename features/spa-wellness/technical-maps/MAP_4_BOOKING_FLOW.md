# 🗺️ Detailed Map 4: Appointment & Booking Flow

## ✅ Status: COMPLETED

## 🎯 Objective
Replace the physical delivery logic with an internal booking system.

## 🛠️ Implementation Steps

### 1. Database (`supabase/migrations/017_create_bookings.sql`)
**Task:** Create bookings table.
*   Stores: store_id, user_id, product_id, preferred_date, preferred_time, notes, status.
*   RLS policies for user/owner access.

### 2. Booking Component (`src/components/BookingModal.jsx`)
**Task:** Internal booking form.
*   Date/time picker.
*   Notes field.
*   Saves directly to database (no WhatsApp).

### 3. Dashboard Bookings Page (`src/pages/Bookings.jsx`)
**Task:** Manage appointments.
*   List all bookings.
*   Filter by status.
*   Update status actions (Confirm/Complete/Cancel).

### 4. Product Detail (`src/pages/ProductDetail.jsx`)
**Task:** "Book Treatment" button.
*   Opens BookingModal.
*   Shows booking confirmation.

## ✅ Verification
- Book a treatment and verify it appears in dashboard.
- Update booking status in dashboard.
- Check that status updates reflect in the UI.
