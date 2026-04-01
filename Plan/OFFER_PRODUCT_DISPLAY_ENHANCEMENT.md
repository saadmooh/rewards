
# Plan: Enhance Product Display within Offer Detail

The strategy is to refine the visual presentation of products listed under an offer in the `OfferDetail.jsx` page to align with existing component patterns and improve clarity.

1.  **Analyze Existing UI Patterns:**
    *   Review `src/components/ProductCard.jsx` and `src/components/OfferCard.jsx` to understand their structure, styling (shadows, borders, spacing), and animation patterns.
2.  **Implement Product Card Structure:**
    *   In `src/pages/OfferDetail.jsx`, modify the rendering of associated products. Each product will be enclosed in a container styled with `bg-white rounded-2xl overflow-hidden shadow-card`.
3.  **Refine Image and Text Layout:**
    *   Ensure product images (or placeholders) are consistently sized and styled within a dedicated section of the card.
    *   The product name will be displayed prominently, using clear typography.
4.  **Optimize Pricing and Discount Display:**
    *   Clearly present the pricing information. If discount details (`original_price`, `discount_percentage`) are available, display the original price with a strikethrough, followed by the prominent discounted price and the discount percentage.
    *   If only the final price is available, display it clearly.
5.  **Consistent Placeholders:** Ensure the placeholder for missing product images is visually appealing and fits the card design.
6.  **Add Interactivity Cues:** Apply `cursor-pointer` to the product cards to indicate they are interactive elements.
7.  **Ensure Visual Consistency:** Use consistent padding, margins, and font treatments across all elements within the product card to maintain a cohesive look and feel.
