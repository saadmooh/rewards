/**
 * Centralized utility for offer and discount logic
 */

/**
 * Calculates the discounted price for a product based on an optional offer
 * @param {Object} product - The product object
 * @param {Object} offer - Optional offer object
 * @returns {Object} - Product with calculated price, original_price, and discount_percentage
 */
export const calculateProductPrice = (product, offer = null) => {
  if (!product) return null;
  
  const result = { ...product };
  
  // Save original price if not already set
  if (result.original_price === undefined || result.original_price === null) {
    result.original_price = result.price;
  }

  if (offer) {
    if (offer.type === 'gift') {
      result.discount_percentage = 100;
      result.price = 0;
    } else if (offer.discount_percent && offer.discount_percent > 0) {
      const discountAmount = Math.round(result.original_price * (offer.discount_percent / 100));
      result.discount_percentage = offer.discount_percent;
      result.price = result.original_price - discountAmount;
    } else if (result.discount_percentage && result.discount_percentage > 0) {
      // Fallback to product's own discount if offer doesn't specify one
      const discountAmount = Math.round(result.original_price * (result.discount_percentage / 100));
      result.price = result.original_price - discountAmount;
    }
  } else if (result.discount_percentage && result.discount_percentage > 0) {
    // Product-level discount (if applicable)
    const discountAmount = Math.round(result.original_price * (result.discount_percentage / 100));
    result.price = result.original_price - discountAmount;
  }
  
  return result;
};

/**
 * Formats a currency value to Arabic AED (D.E)
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 دج';
  return `${amount.toLocaleString()} دج`;
};
