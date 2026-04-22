# 🗺️ Detailed Map 1: Brand Identity & Terminology

## ✅ Status: COMPLETED

## 🎯 Objective
Transform the app's "voice" and "look" into a premium wellness experience.

## 🛠️ Implementation Steps

### 1. Global CSS Variables (`src/index.css`)
**Task:** Replace retail colors with the "Zen" palette.
*   Update `--accent` to Champagne Gold (#D4AF37).
*   Add `--sage`, `--lavender`, and `--rose-quartz` variables.
*   Update `--surface` to a very light cream/off-white.

### 2. Tailwind Configuration (`tailwind.config.js`)
**Task:** Extend the theme.
*   Add the new colors to the `theme.extend.colors` object.
*   Register "Playfair Display" (Serif) as the primary heading font.
*   Register "Montserrat" (Sans) as the primary body font.

### 3. Terminology Overhaul (`src/locales/en.json`, `ar.json`, `fr.json`)
**Task:** Edit JSON files to replace standard retail words.
*   **Common Section:**
    *   `products` ➡️ `Treatments`
    *   `offers` ➡️ `Rituals`
    *   `buy` ➡️ `Book`
    *   `delivery` ➡️ `Appointment`
*   **Home Section:**
    *   `scan_receipt` ➡️ `Log Your Glow`
*   **Tiers Section:**
    *   `bronze` ➡️ `Glow`
    *   `silver` ➡️ `Radiant`
    *   `gold` ➡️ `Zen Master`
    *   `platinum` ➡️ `Wellness Elite`

### 4. Global Layout Adjustments (`src/components/Layout.jsx`)
**Task:** Soften the UI.
*   Add a subtle grain texture overlay to the `main` container.
*   Apply `backdrop-blur-xl` to the `BottomNav` and top headers.

## ✅ Verification
- Check all screens for consistency in terminology.
- Ensure headings use the Serif font and body text remains clear.
- Validate that the accent color matches the premium aesthetic.
