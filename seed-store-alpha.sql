-- Seed data for Store Alpha with attractive products and offers
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
    v_store_id UUID;
        prod_id1 UUID;
            prod_id2 UUID;
                prod_id3 UUID;
                    prod_id4 UUID;
                        prod_id5 UUID;
                            offer_id1 UUID;
                                offer_id2 UUID;
                                    offer_id3 UUID;
                                    BEGIN
                                        -- Ensure columns exist in products table
                                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='original_price') THEN
                                                    ALTER TABLE public.products ADD COLUMN original_price INTEGER;
                                                        END IF;
                                                            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='discount_percentage') THEN
                                                                    ALTER TABLE public.products ADD COLUMN discount_percentage INTEGER;
                                                                        END IF;

                                                                            -- 1. Ensure Store Alpha exists (handling potential slug conflict)
                                                                                INSERT INTO public.stores (id, slug, name, owner_email, owner_username, category, points_rate, welcome_points, primary_color, plan, is_active)
                                                                                    VALUES ('11111111-1111-1111-1111-111111111111', 'store-alpha', 'Alpha Fashion', 'saad@example.com', 'saad_admin', 'ملابس وموضة', 1, 100, '#10b981', 'premium', true)
                                                                                        ON CONFLICT (slug) DO UPDATE SET 
                                                                                                name = EXCLUDED.name, 
                                                                                                        category = EXCLUDED.category,
                                                                                                                primary_color = EXCLUDED.primary_color
                                                                                                                    RETURNING id INTO v_store_id;

                                                                                                                        -- 2. Clear existing demo products for this store to avoid clutter
                                                                                                                            -- Use v_store_id variable to avoid column name ambiguity
                                                                                                                                DELETE FROM public.offer_products WHERE offer_id IN (SELECT id FROM public.offers WHERE store_id = v_store_id);
                                                                                                                                    DELETE FROM public.offers WHERE store_id = v_store_id;
                                                                                                                                        DELETE FROM public.products WHERE store_id = v_store_id;

                                                                                                                                            -- 3. Insert Attractive Products
                                                                                                                                                -- Product 1: White T-Shirt
                                                                                                                                                    INSERT INTO public.products (store_id, name, description, price, original_price, discount_percentage, category, image_url)
                                                                                                                                                        VALUES (v_store_id, 'قميص قطني فاخر - أبيض', 'قميص قطني 100% بتصميم عصري وأنيق', 3600, 4800, 25, 'قمصان', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800')
                                                                                                                                                            RETURNING id INTO prod_id1;

                                                                                                                                                                -- Product 2: Blue Jeans
                                                                                                                                                                    INSERT INTO public.products (store_id, name, description, price, original_price, discount_percentage, category, image_url)
                                                                                                                                                                        VALUES (v_store_id, 'سروال جينز كلاسيكي', 'جينز متين بجودة عالية ولون أزرق غامق', 5950, 7000, 15, 'بناطيل', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800')
                                                                                                                                                                            RETURNING id INTO prod_id2;

                                                                                                                                                                                -- Product 3: Red Sneakers
                                                                                                                                                                                    INSERT INTO public.products (store_id, name, description, price, original_price, discount_percentage, category, image_url)
                                                                                                                                                                                        VALUES (v_store_id, 'حذاء رياضي خفيف', 'حذاء مريح للمشي والجري بتصميم جذاب', 8400, 10500, 20, 'أحذية', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800')
                                                                                                                                                                                            RETURNING id INTO prod_id3;

                                                                                                                                                                                                -- Product 4: Leather Watch
                                                                                                                                                                                                    INSERT INTO public.products (store_id, name, description, price, original_price, discount_percentage, category, image_url)
                                                                                                                                                                                                        VALUES (v_store_id, 'ساعة يد جلدية فاخرة', 'ساعة كلاسيكية مع حزام جلدي طبيعي', 11000, 13750, 20, 'إكسسوارات', 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800')
                                                                                                                                                                                                            RETURNING id INTO prod_id4;

                                                                                                                                                                                                                -- Product 5: Sunglasses
                                                                                                                                                                                                                    INSERT INTO public.products (store_id, name, description, price, original_price, discount_percentage, category, image_url, is_exclusive, min_tier_to_view)
                                                                                                                                                                                                                        VALUES (v_store_id, 'نظارات شمسية عصرية', 'حماية كاملة من الأشعة فوق البنفسجية بتصميم مميز', 4200, 6000, 30, 'إكسسوارات', 'https://images.unsplash.com/photo-1511499767390-91f197030007?w=800', true, 'silver')
                                                                                                                                                                                                                            RETURNING id INTO prod_id5;

                                                                                                                                                                                                                                -- 4. Insert Attractive Offers
                                                                                                                                                                                                                                    -- Offer 1: Season Sale
                                                                                                                                                                                                                                        INSERT INTO public.offers (store_id, title, description, type, target_type, discount_percent, points_cost, image_url)
                                                                                                                                                                                                                                            VALUES (v_store_id, 'تخفيضات الموسم الكبرى', 'احصل على أفضل الأسعار على تشكيلة الملابس المختارة', 'discount', 'products', 25, 0, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800')
                                                                                                                                                                                                                                                RETURNING id INTO offer_id1;

                                                                                                                                                                                                                                                    -- Offer 2: Flash Deal
                                                                                                                                                                                                                                                        INSERT INTO public.offers (store_id, title, description, type, target_type, discount_percent, points_cost, occasion_type, valid_until)
                                                                                                                                                                                                                                                            VALUES (v_store_id, 'عرض فلاش للأحذية', 'خصم خاص لفترة محدودة على أرقى الأحذية الرياضية', 'flash', 'products', 20, 500, 'flash', NOW() + INTERVAL '24 hours')
                                                                                                                                                                                                                                                                RETURNING id INTO offer_id2;

                                                                                                                                                                                                                                                                    -- Offer 3: Accessories Gift
                                                                                                                                                                                                                                                                        INSERT INTO public.offers (store_id, title, description, type, target_type, points_cost)
                                                                                                                                                                                                                                                                            VALUES (v_store_id, 'هدية الإكسسوارات', 'استبدل نقاطك بساعة يد فاخرة أو نظارات شمسية', 'gift', 'products', 2000)
                                                                                                                                                                                                                                                                                RETURNING id INTO offer_id3;

                                                                                                                                                                                                                                                                                    -- 5. Link Products to Offers
                                                                                                                                                                                                                                                                                        -- Offer 1 links to Shirts and Pants
                                                                                                                                                                                                                                                                                            INSERT INTO public.offer_products (offer_id, product_id) VALUES (offer_id1, prod_id1);
                                                                                                                                                                                                                                                                                                INSERT INTO public.offer_products (offer_id, product_id) VALUES (offer_id1, prod_id2);

                                                                                                                                                                                                                                                                                                    -- Offer 2 links to Shoes
                                                                                                                                                                                                                                                                                                        INSERT INTO public.offer_products (offer_id, product_id) VALUES (offer_id2, prod_id3);

                                                                                                                                                                                                                                                                                                            -- Offer 3 links to Accessories
                                                                                                                                                                                                                                                                                                                INSERT INTO public.offer_products (offer_id, product_id) VALUES (offer_id3, prod_id4);
                                                                                                                                                                                                                                                                                                                    INSERT INTO public.offer_products (offer_id, product_id) VALUES (offer_id3, prod_id5);

                                                                                                                                                                                                                                                                                                                    END $$;
                                                                                                                                                                                                                                                                                                                    