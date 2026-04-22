-- Seed file: Delete and reseed products and offers for skincare center
-- Run this file to clear existing products/offers and add new skincare data

DO $$
DECLARE
  v_store_id UUID;
BEGIN
  -- Get the store ID
  SELECT id INTO v_store_id FROM stores LIMIT 1;

  -- Delete existing offer_products first (foreign key dependency)
  DELETE FROM offer_products;
  
  -- Delete existing offers
  DELETE FROM offers;
  
  -- Delete existing products
  DELETE FROM products;

  -- Insert new Products for Skincare Center
  INSERT INTO public.products (store_id, name, description, price, category, image_url, is_exclusive, min_tier_to_view, is_active)
  VALUES
    -- Facial Treatments
    (v_store_id, 'Hydra Facial', 'Deep cleansing and hydration facial treatment for glowing skin', 3500, 'Facial', 'https://images.unsplash.com/photo-1570172619640-3c0c4d5a2d1b?w=400', false, 'bronze', true),
    (v_store_id, 'Anti-Aging Facial', 'Premium treatment with collagen boosting formulas', 4500, 'Facial', 'https://images.unsplash.com/photo-1512291313931-d429904c7a4c?w=400', false, 'bronze', true),
    (v_store_id, 'Oxygen Facial', 'Restore skins natural radiance with oxygen therapy', 4000, 'Facial', 'https://images.unsplash.com/photo-1522337660859-02fb71ba92cd?w=400', false, 'silver', true),
    (v_store_id, 'Gentle Oat Facial', 'Soothing treatment for sensitive skin types', 3000, 'Facial', 'https://images.unsplash.com/photo-1616394584738-fc6c612d8f87?w=400', false, 'bronze', true),
    (v_store_id, 'Vitamin C Facial', 'Brightening treatment rich in antioxidants', 3800, 'Facial', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400', false, 'bronze', true),
    (v_store_id, 'LED Light Therapy', 'Advanced skin rejuvenation using LED lights', 4200, 'Facial', 'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?w=400', false, 'silver', true),
    
    -- Body Treatments
    (v_store_id, 'Full Body Massage', '60-minute relaxing full body massage', 5000, 'Body', 'https://images.unsplash.com/photo-1544161515-4d1e600f0902?w=400', false, 'bronze', true),
    (v_store_id, 'Hot Stone Therapy', 'Deep tissue massage with heated stones', 6000, 'Body', 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400', false, 'silver', true),
    (v_store_id, 'Aromatherapy Massage', 'Scented oil massage for ultimate relaxation', 5500, 'Body', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400', false, 'bronze', true),
    (v_store_id, 'Body Scrub & Wrap', 'Exfoliation and mud wrap treatment', 4500, 'Body', 'https://images.unsplash.com/photo-1540555700478-4be289fbec03?w=400', false, 'silver', true),
    
    -- Hair & Scalp Treatments
    (v_store_id, 'Scalp & Hair Treatment', 'Revitalizing scalp massage with hair mask', 2500, 'Scalp', 'https://images.unsplash.com/photo-1580618672591-8521801b1a98?w=400', false, 'bronze', true),
    (v_store_id, 'Keratin Hair Treatment', 'Straightening and smoothing treatment', 8000, 'Hair', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400', false, 'silver', true),
    (v_store_id, 'Hair Spa Treatment', 'Deep conditioning and nourishment', 3500, 'Hair', 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400', false, 'bronze', true),
    
    -- Specialized Treatments
    (v_store_id, 'Eye Delight Treatment', 'Targeted care for delicate eye area', 2000, 'Face', 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', false, 'bronze', true),
    (v_store_id, 'Lip Treatment', 'Nourishing lip care and hydration', 1200, 'Face', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400', false, 'bronze', true),
    (v_store_id, 'Nail Care & Spa', 'Manicure and pedicure complete care', 2800, 'Nails', 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400', false, 'bronze', true),
    
    -- Premium/VIP Treatments
    (v_store_id, 'Zen Master Ritual', 'Full day wellness journey - exclusive', 12000, 'Premium', 'https://images.unsplash.com/photo-1540555700478-4be289fbec03?w=400', true, 'gold', true),
    (v_store_id, 'Diamond Glow Package', 'Ultimate pampering experience', 15000, 'Premium', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400', true, 'platinum', true),
    (v_store_id, 'Royal Gold Facial', '24K gold infusion for youthful glow', 9000, 'Facial', 'https://images.unsplash.com/photo-1512291313931-d429904c7a4c?w=400', true, 'gold', true),

    -- Skincare Products (retail)
    (v_store_id, 'Hydrating Serum', 'Deep hydration serum with hyaluronic acid', 450, 'Retail', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', false, 'bronze', true),
    (v_store_id, 'Anti-Aging Cream', 'Premium collagen cream for mature skin', 680, 'Retail', 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', false, 'bronze', true),
    (v_store_id, 'Sunscreen SPF 50', 'Broad spectrum sun protection', 280, 'Retail', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', false, 'bronze', true),
    (v_store_id, 'Cleansing Foam', 'Gentle daily cleansing foam', 180, 'Retail', 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=400', false, 'bronze', true),
    (v_store_id, 'Moisturizing Mask', 'Weekly deep hydration mask', 320, 'Retail', 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400', false, 'bronze', true);

  -- Insert new Offers for Skincare Center
  INSERT INTO public.offers (store_id, title, description, type, target_type, discount_percent, points_cost, min_tier, occasion_type, valid_until, usage_limit, image_url, is_active)
  VALUES
    -- Welcome Offers
    (v_store_id, 'Welcome Offer 20% Off', '20% discount on your first facial treatment', 'discount', 'all', 20, 0, 'bronze', 'always', NOW() + INTERVAL '90 days', NULL, 'https://images.unsplash.com/photo-1570172619640-3c0c4d5a2d1b?w=600', true),
    (v_store_id, 'Free Skin Analysis', 'Get a free skin analysis consultation', 'gift', 'all', 0, 0, 'bronze', 'always', NOW() + INTERVAL '30 days', 100, 'https://images.unsplash.com/photo-1512291313931-d429904c7a4c?w=600', true),
    
    -- Birthday Offers
    (v_store_id, 'Birthday Gift - Free Treatment', 'Happy Birthday! Choose any free treatment', 'gift', 'all', 0, 0, 'bronze', 'fixed', NOW() + INTERVAL '7 days', 1, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600', true),
    (v_store_id, 'Birthday Special 30% Off', '30% off on your birthday month', 'discount', 'all', 30, 0, 'bronze', 'fixed', NOW() + INTERVAL '30 days', 1, 'https://images.unsplash.com/photo-1540555700478-4be289fbec03?w=600', true),
    
    -- Points-based Offers
    (v_store_id, 'Redeem: Free Facial', 'Redeem 5000 points for any facial', 'gift', 'all', 0, 5000, 'bronze', 'always', NOW() + INTERVAL '180 days', 10, 'https://images.unsplash.com/photo-1570172619640-3c0c4d5a2d1b?w=600', true),
    (v_store_id, 'Redeem: Massage', 'Redeem 7000 points for full body massage', 'gift', 'all', 0, 7000, 'silver', 'always', NOW() + INTERVAL '180 days', 5, 'https://images.unsplash.com/photo-1544161515-4d1e600f0902?w=600', true),
    (v_store_id, 'Double Points Tuesday', 'Earn double points every Tuesday', 'double_points', 'all', 0, 0, 'bronze', 'always', NOW() + INTERVAL '90 days', NULL, 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=600', true),
    
    -- Flash Offers
    (v_store_id, 'Flash Sale: 50% Off Massages', 'Limited time 50% off all body massages', 'flash', 'products', 50, 0, 'bronze', 'flash', NOW() + INTERVAL '2 days', 20, 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600', true),
    (v_store_id, 'Weekend Special: Buy 1 Get 1', 'Buy one treatment, get one free', 'discount', 'products', 50, 0, 'bronze', 'always', NOW() + INTERVAL '5 days', 30, 'https://images.unsplash.com/photo-1540555700478-4be289fbec03?w=600', true),
    
    -- Tier-based Offers
    (v_store_id, 'Silver Member: 15% Off', 'Exclusive discount for Silver members', 'discount', 'all', 15, 0, 'silver', 'always', NOW() + INTERVAL '90 days', NULL, 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=600', true),
    (v_store_id, 'Gold Member: 25% Off', 'Exclusive discount for Gold members', 'discount', 'all', 25, 0, 'gold', 'always', NOW() + INTERVAL '90 days', NULL, 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=600', true),
    (v_store_id, 'Platinum VIP: 35% Off + Free Products', 'VIP exclusive package deal', 'discount', 'all', 35, 0, 'platinum', 'always', NOW() + INTERVAL '90 days', NULL, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600', true);

  -- Link specific offers to specific products
  INSERT INTO public.offer_products (offer_id, product_id)
  SELECT o.id, p.id 
  FROM offers o, products p
  WHERE o.title = 'Redeem: Free Facial' 
    AND p.category = 'Facial';

  INSERT INTO public.offer_products (offer_id, product_id)
  SELECT o.id, p.id 
  FROM offers o, products p
  WHERE o.title = 'Redeem: Massage' 
    AND p.category IN ('Body', 'Massage');

  INSERT INTO public.offer_products (offer_id, product_id)
  SELECT o.id, p.id 
  FROM offers o, products p
  WHERE o.title = 'Flash Sale: 50% Off Massages' 
    AND p.category = 'Body';

  INSERT INTO public.offer_products (offer_id, product_id)
  SELECT o.id, p.id 
  FROM offers o, products p
  WHERE o.title = 'Weekend Special: Buy 1 Get 1' 
    AND p.category IN ('Facial', 'Body');

  RAISE NOTICE 'Successfully seeded skincare products and offers for store: %', v_store_id;
END $$;