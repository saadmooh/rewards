# Blueprint for Rewards Project

## 1. Overview
This project aims to build a comprehensive loyalty and rewards platform for merchants, enabling them to manage customer engagement, offers, and bookings.

## 2. Project Outline
*   **Initial Version:** Basic product management, store configurations, user roles.
*   **Current Version:** Enhanced product management with advanced attributes, integrated booking system for merchants and products.

## 3. Current Change: Implementing Bookable Times
*   **Goal:** Allow merchants to define global and per-product bookable time slots to manage appointments and service availability.
*   **Steps Executed:**
    *   **Database Schema Update:**
        *   Created `merchant_booking_settings` table for global availability (opening/closing times, duration, days, timezone).
        *   Modified `products` table to include `override_booking_settings`, `specific_opening_time`, `specific_closing_time`, and `specific_booking_duration` for product-level overrides.
        *   Created `bookings` table to store appointment details.
        *   Added/updated Row Level Security (RLS) policies for `merchant_booking_settings`, `products`, and `bookings` tables to manage access control.
    *   **Schema File Updated:** `supabase/schema.sql` was modified to include these changes.
*   **Remaining Steps:**
    *   Develop backend logic for availability calculation and booking creation/management.
    *   Implement frontend UI for merchants to manage global and product-specific booking settings.
    *   Implement frontend UI for customers to view availability and book appointments.
    *   Add unit and integration tests for booking functionality.
