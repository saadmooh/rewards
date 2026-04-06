import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'
import { useProducts } from '../hooks/useProducts'
import PointsCard from '../components/PointsCard'
import ProductCard from '../components/ProductCard'
import ProductOfferCard from '../components/ProductOfferCard'
import { calculateProductPrice } from '../lib/offers'
import { ProductCardSkeleton, OfferCardSkeleton } from '../components/CardSkeleton'
import { hapticFeedback } from '../lib/telegram'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function Home() {
  const navigate = useNavigate()
  const { user, store, membership } = useUserStore()
  const { products, isLoading: isProductsLoading } = useProducts()
  const [scanning, setScanning] = useState(false)

  const { data: offersWithProducts, isLoading: isOffersLoading } = useQuery({
    queryKey: ['discounted-products-home', store?.id, user?.id, membership?.points],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id,
          type,
          discount_percent,
          points_cost,
          offer_products (
            products (*)
          )
        `)
        .eq('store_id', store.id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const productsWithTypes = (data || []).flatMap(o => 
        (o.offer_products || []).map(op => {
          if (!op.products) return null;
          const product = calculateProductPrice(op.products, o);
          
          return {
            ...product,
            offer_id: o.id,
            offer_type: o.type,
            points_cost: o.points_cost || 0
          };
        }).filter(Boolean)
      );

      const uniqueProducts = [];
      const seen = new Set();
      for (const p of productsWithTypes) {
        if (!seen.has(p.id)) {
          uniqueProducts.push(p);
          seen.add(p.id);
        }
      }

      const userPoints = membership?.points || 0;
      const affordable = uniqueProducts.filter(p => p.points_cost <= userPoints);
      const expensive = uniqueProducts.filter(p => p.points_cost > userPoints);

      const shuffle = (array) => {
        if (!user?.id) return array;
        const seed = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return [...array].sort((a, b) => {
          const valA = (a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + seed) % 100;
          const valB = (b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + seed) % 100;
          return valA - valB;
        });
      };

      const result = [...shuffle(affordable), ...shuffle(expensive)];
      return result.slice(0, 8);
    },
    enabled: !!store?.id
  })

  // Trending Products Query
  const { data: trendingProducts, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['trending-products', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      
      // Get counts from redemptions
      const { data: redemptions, error: redError } = await supabase
        .from('redemptions')
        .select('products')
        .eq('store_id', store.id)
        .limit(100);

      if (redError) throw redError;

      // Count occurrences of each product ID
      const counts = {};
      redemptions.forEach(r => {
        const productIds = r.products || [];
        productIds.forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
        });
      });

      // Sort by count and get top 6
      const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 6);
      
      if (sortedIds.length === 0) return [];

      const { data: productsData, error: prodError } = await supabase
        .from('products')
        .select('*')
        .in('id', sortedIds)
        .eq('is_active', true);

      if (prodError) throw prodError;

      return productsData.map(p => calculateProductPrice(p));
    },
    enabled: !!store?.id
  })

  const productToOfferMap = useMemo(() => {
    const map = new Map();
    if (!offersWithProducts) return map;
    offersWithProducts.forEach(p => {
      map.set(p.id, { type: p.offer_type, discount_percent: p.discount_percentage });
    });
    return map;
  }, [offersWithProducts]);

  const handleScan = () => {
    hapticFeedback('medium')
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      navigate('/scan')
    }, 500)
  }

  const handleCardClick = (path) => {
    hapticFeedback('light')
    navigate(path)
  }

  const latestProducts = useMemo(() => {
    const forYouIds = new Set(offersWithProducts?.map(p => p.id) || []);
    const trendingIds = new Set(trendingProducts?.map(p => p.id) || []);
    
    return products
      ?.filter(p => !forYouIds.has(p.id) && !trendingIds.has(p.id))
      .slice(0, 8)
      .map(p => {
        const offer = productToOfferMap.get(p.id);
        return calculateProductPrice(p, offer);
      }) || [];
  }, [products, offersWithProducts, trendingProducts, productToOfferMap]);

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-gray-400 text-sm">Good morning</p>
              <h1 className="text-2xl font-medium text-gray-900">
                {user?.first_name || 'there'}
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">👤</span>
              )}
            </div>
          </div>
        </motion.div>

        <section className="mb-8">
          <PointsCard />
        </section>

        <section className="mb-8">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleScan}
            disabled={scanning}
            className="w-full py-4 bg-gray-900 text-white font-medium rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            <span className="text-lg">📷</span>
            {scanning ? 'Opening...' : 'Scan Receipt'}
          </motion.button>
        </section>

        {/* For You Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">For You</h2>
            <button
              onClick={() => handleCardClick('/offers')}
              className="text-gray-500 font-medium text-sm"
            >
              See All
            </button>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide"
          >
            {isOffersLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="min-w-[280px]">
                  <OfferCardSkeleton />
                </div>
              ))
            ) : offersWithProducts?.length > 0 ? (
              offersWithProducts.map((product) => (
                <motion.div 
                  key={product.id} 
                  variants={itemVariants}
                  className="min-w-[280px]"
                >
                  <ProductOfferCard
                    product={product}
                    offerType={product.offer_type}
                    onProductClick={() => handleCardClick(`/offers/${product.offer_id}`)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 w-full">
                <p>No special offers today</p>
              </div>
            )}
          </motion.div>
        </section>

        {/* Trending Section */}
        {trendingProducts?.length > 0 && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-accent" />
                <h2 className="text-lg font-medium text-gray-900">Trending Now</h2>
              </div>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide"
            >
              {trendingProducts.map((product) => (
                <motion.div 
                  key={product.id} 
                  variants={itemVariants}
                  className="min-w-[160px]"
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    original_price={product.original_price}
                    imageUrl={product.image_url}
                    onClick={() => handleCardClick(`/products/${product.id}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* New Arrivals Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">New Arrivals</h2>
            <button
              onClick={() => handleCardClick('/products')}
              className="text-gray-500 font-medium text-sm"
            >
              See All
            </button>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide"
          >
            {isProductsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="min-w-[160px]">
                  <ProductCardSkeleton />
                </div>
              ))
            ) : latestProducts.length > 0 ? latestProducts.map((product) => (
              <motion.div 
                key={product.id} 
                variants={itemVariants}
                className="min-w-[160px]"
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  original_price={product.original_price}
                  imageUrl={product.image_url}
                  showOriginalPrice={false}
                  onClick={() => handleCardClick(`/products/${product.id}`)}
                />
              </motion.div>
            )) : (
              <div className="text-center py-8 text-gray-400 w-full">
                <p>Loading products...</p>
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </div>
  )
}
