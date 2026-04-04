import { useState, useEffect } from 'react';
import { supabase} from '../lib/supabase';
import useUserStore from '../store/userStore';

export const useOfferWithProducts = (offerId) => {
  const [offer, setOffer] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { store } = useUserStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!offerId) {
        setOffer(null);
        setProducts([]);
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
        setOffer(offerData);

        // Fetch linked products
        if (offerData) {
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select(`
              id, name, price, image_url,
              original_price, discount_percentage,
              is_exclusive, min_tier_to_view
            `)
            .neq('id', null)
            .or(`id.in.(SELECT product_id FROM offer_products WHERE offer_id='${offerId}')`);
          
          if (productError) throw productError;

          // Calculate discounted prices based on offer type and discount_percent
          const productsWithCalculatedPrices = (productData || []).map(product => {
            const updatedProduct = { ...product };
            
            if (offerData.type === 'gift') {
              updatedProduct.original_price = product.price;
              updatedProduct.discount_percentage = 100;
              updatedProduct.price = 0;
            } else if (offerData.discount_percent && offerData.discount_percent > 0) {
              const discountAmount = Math.round(product.price * (offerData.discount_percent / 100));
              updatedProduct.original_price = product.price;
              updatedProduct.discount_percentage = offerData.discount_percent;
              updatedProduct.price = product.price - discountAmount;
            } else if (product.discount_percentage && product.discount_percentage > 0) {
              // Use product's own discount if no offer discount
              const discountAmount = Math.round(product.price * (product.discount_percentage / 100));
              if (!updatedProduct.original_price) {
                updatedProduct.original_price = product.price;
              }
              updatedProduct.price = product.price - discountAmount;
            }
            
            return updatedProduct;
          });
          
          setProducts(productsWithCalculatedPrices);
        }
      } catch (err) {
        console.error('Error fetching offer with products:', err);
        setError(err.message);
        setOffer(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [offerId, store?.id]);

  return { offer, products, loading, error };
};
