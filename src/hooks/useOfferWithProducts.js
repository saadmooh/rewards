import { useState, useEffect } from 'react';
import { supabase} from '../lib/supabase';
import useUserStore from '../store/userStore';
import { calculateProductPrice } from '../lib/offers';

export const useOfferWithProducts = (offerId) => {
  const [offer, setOffer] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeRedemption, setActiveRedemption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { store, user, membership } = useUserStore();

  const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
  const userTierLevel = tierOrder[membership?.tier ?? 'bronze'] ?? 0;

  useEffect(() => {
    const fetchData = async () => {
      if (!offerId) {
        setOffer(null);
        setProducts([]);
        setActiveRedemption(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch offer details filtered by store
        const query = supabase
          .from('offers')
          .select('*')
          .eq('id', offerId);
        
        // If store is available, filter by it to ensure we only get offers from user's store
        if (store?.id) {
          query.eq('store_id', store.id);
        }
        
        const { data: offerData, error: offerError } = await query.single();

        if (offerError) throw offerError;
        if (!offerData) throw new Error('Offer not found');
        
        const offerTierLevel = tierOrder[offerData.min_tier ?? 'bronze'] ?? 0;
        if (userTierLevel < offerTierLevel) {
          setOffer({ ...offerData, tier_restricted: true, required_tier: offerData.min_tier });
          setProducts([]);
          setLoading(false);
          return;
        }
        
        setOffer(offerData);

        // Fetch active redemption if user exists
        if (user?.id) {
          const { data: redemptionData } = await supabase
            .from('redemptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('offer_id', offerId)
            .gt('coupon_code_expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (redemptionData) {
            setActiveRedemption(redemptionData);
          }
        }

        // Fetch linked products via offer_products junction
        if (offerData) {
          const { data: offerProductData, error: offerProductError } = await supabase
            .from('offer_products')
            .select('product_id')
            .eq('offer_id', offerId);
          
          if (offerProductError) throw offerProductError;

          const productIds = offerProductData.map(op => op.product_id);
          
          if (productIds.length === 0) {
            setProducts([]);
            return;
          }

          const { data: productData, error: productError } = await supabase
            .from('products')
            .select(`
              id, name, price, image_url,
              original_price, discount_percentage,
              is_exclusive, min_tier_to_view
            `)
            .in('id', productIds);
          
          if (productError) throw productError;

          // Calculate discounted prices based on offer type and discount_percent
          const productsWithCalculatedPrices = (productData || []).map(product => {
            return calculateProductPrice(product, offerData);
          });
          
          setProducts(productsWithCalculatedPrices);
        }
      } catch (err) {
        console.error('Error fetching offer with products:', err);
        setError(err.message);
        setOffer(null);
        setProducts([]);
        setActiveRedemption(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [offerId, store?.id, user?.id, membership?.tier]);

  return { offer, products, activeRedemption, loading, error, userTierLevel };
};
