import { describe, it, expect } from 'vitest';
import { calculateProductPrice } from './offers';

describe('calculateProductPrice', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 100,
  };

  it('should return null if product is null', () => {
    expect(calculateProductPrice(null)).toBeNull();
  });

  it('should return original price if no offer is provided', () => {
    const result = calculateProductPrice(mockProduct);
    expect(result.price).toBe(100);
    expect(result.original_price).toBe(100);
  });

  it('should apply discount from offer', () => {
    const offer = { type: 'discount', discount_percent: 20 };
    const result = calculateProductPrice(mockProduct, offer);
    expect(result.price).toBe(80);
    expect(result.original_price).toBe(100);
    expect(result.discount_percentage).toBe(20);
  });

  it('should handle gift offer (100% discount)', () => {
    const offer = { type: 'gift' };
    const result = calculateProductPrice(mockProduct, offer);
    expect(result.price).toBe(0);
    expect(result.original_price).toBe(100);
    expect(result.discount_percentage).toBe(100);
  });

  it('should use product-level discount if no offer is provided', () => {
    const productWithDiscount = { ...mockProduct, discount_percentage: 10 };
    const result = calculateProductPrice(productWithDiscount);
    expect(result.price).toBe(90);
    expect(result.discount_percentage).toBe(10);
  });

  it('should prioritize offer discount over product discount', () => {
    const productWithDiscount = { ...mockProduct, discount_percentage: 10 };
    const offer = { type: 'discount', discount_percent: 25 };
    const result = calculateProductPrice(productWithDiscount, offer);
    expect(result.price).toBe(75);
    expect(result.discount_percentage).toBe(25);
  });
});
