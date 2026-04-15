# Receipt OCR

## Overview
Auto-extract purchase data from receipt photos using optical character recognition, eliminating the need for QR-only receipt entry.

## Mechanics
- User takes a photo of their paper receipt
- OCR service extracts: store name, date, total amount, line items
- Matched against the store's point rules to calculate earned points
- User reviews and confirms extracted data before points are credited
- Fallback to manual entry if OCR fails

## Implementation Notes
- Use Tesseract.js (client-side) or a cloud OCR API (Google Vision, AWS Textract)
- Store receipt images in Supabase Storage
- Extracted data saved as JSON in `transactions` for audit trail
- Confidence score threshold — below threshold, prompt manual review
- Fraud prevention: image hashing to detect duplicate receipts

## Database Changes
```sql
-- Add to transactions:
receipt_image_url text
ocr_data jsonb  -- { line_items: [...], total: 1500, confidence: 0.92 }
```
