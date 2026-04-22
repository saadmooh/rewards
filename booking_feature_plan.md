# Plan: Merchant-Defined Bookable Times Feature

## 1. Feature Title
Merchant-Defined Bookable Times (Global and Per-Product)

## 2. Objective
Enable merchants to configure global availability settings and per-product booking overrides to manage appointment scheduling effectively.

## 3. Current Status
*   **Database Schema:** Updated `supabase/schema.sql` with:
    *   `merchant_booking_settings` table for global availability.
    *   Added booking override fields (`override_booking_settings`, `specific_opening_time`, `specific_closing_time`, `specific_booking_duration`) to the `products` table.
    *   Created `bookings` table for storing appointments.
    *   Implemented RLS policies for `merchant_booking_settings`, `products`, and `bookings`.
*   **Project Context:** The feature is now ready for backend and frontend implementation.

## 4. Detailed Plan

### Phase 1: Backend Logic Implementation

*   **Availability Calculation:**
    *   Develop functions to determine available time slots by considering:
        *   Global settings (`merchant_booking_settings`): opening/closing times, default duration, available days, timezone.
        *   Product-specific overrides (`products` table).
        *   Existing bookings in the `bookings` table to prevent double-booking.
*   **Booking Management:**
    *   Implement logic for creating new bookings, validating selected slots, and ensuring sufficient duration.
    *   Handle booking status transitions (e.g., scheduled, completed, cancelled, no-show).
*   **API Endpoints/Functions:**
    *   Create Supabase Functions or Edge Functions to expose the following capabilities:
        *   `GET /stores/:storeId/availability`: Fetch available time slots for a store on a given date, considering global and product-specific settings.
        *   `POST /bookings`: Create a new booking.
        *   `GET /merchants/:merchantId/booking-settings`: Retrieve global booking settings.
        *   `PUT /merchants/:merchantId/booking-settings`: Update global booking settings.
        *   `GET /products/:productId/booking-override`: Retrieve product-specific booking override settings.
        *   `PUT /products/:productId/booking-override`: Update product-specific booking override settings.

### Phase 2: Frontend UI Implementation

*   **Merchant Dashboard:**
    *   **Global Booking Settings Page:**
        *   Create a new dedicated page/section within the merchant dashboard.
        *   Implement a form with inputs for `opening_time`, `closing_time`, `default_booking_duration`, `available_days` (e.g., using checkboxes or a multi-select component), and `time_zone` (e.g., a dropdown).
        *   Implement functionality to save these settings via the backend API.
    *   **Product Form Update (`src/pages/Products.jsx`):**
        *   Add a UI toggle (`override_booking_settings`) to enable/disable product-specific settings.
        *   Conditionally render input fields for `specific_opening_time`, `specific_closing_time`, and `specific_booking_duration` when `override_booking_settings` is enabled.
        *   Ensure these settings are sent to the backend API when saving a product.
*   **Customer Facing Interface:**
    *   **Availability Display:**
        *   Integrate a date and time picker component on product detail pages or within a booking flow.
        *   Fetch and display available time slots dynamically based on the calculated availability.
    *   **Booking Interface:**
        *   Develop a form for customers to select a desired time slot, provide necessary details (e.g., notes), and confirm the booking.

### Phase 3: Testing

*   **Unit Tests:**
    *   Write unit tests for the availability calculation logic, covering various scenarios (e.g., multiple bookings, time zones, overrides).
    *   Test backend functions for settings management and booking creation.
*   **Integration Tests:**
    *   Test the interaction between frontend UI components and backend API endpoints.
    *   Verify that booking conflicts are correctly handled.
*   **End-to-End Tests:**
    *   Simulate the full customer booking flow from viewing availability to successful booking confirmation.
    *   Test the merchant flow for configuring global and product-specific settings.
