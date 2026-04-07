import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag } from 'lucide-react'
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'
import ProductOfferCard from '../components/ProductOfferCard'
import { calculateProductPrice } from '../lib/offers'
import { OfferCardSkeleton } from '../components/CardSkeleton'
import { hapticFeedback } from '../lib/telegram'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
}

export default function ClientOffers() {
  const navigate = useNavigate()
  const { store, membership } = useUserStore()

  const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 }
  const userTierLevel = tierOrder[membership?.tier ?? 'bronze'] ?? 0

  const handleProductClick = (path) => {
    hapticFeedback('light')
    navigate(path)
  }

  const { data: offersWithProducts, isLoading } = useQuery({
    queryKey: ['discounted-products', store?.id, membership?.tier],
    queryFn: async () => {
      const { data: allOffers, error } = await supabase
        .from('offers')
        .select(`
          id,
          type,
          min_tier,
          discount_percent,
          offer_products (
            products (*)
          )
        `)
        .eq('store_id', store.id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
      const userTierLevel = tierOrder[membership?.tier ?? 'bronze'] ?? 0;
      
      const filteredOffers = (allOffers || []).filter(offer => {
        const offerTierLevel = tierOrder[offer.min_tier ?? 'bronze'] ?? 0;
        return userTierLevel >= offerTierLevel;
      });
      
      // Flatten and add offer type + calculate prices to each product
      const productsWithTypes = filteredOffers.flatMap(o => 
        (o.offer_products || []).map(op => {
          if (!op.products) return null;
          const product = calculateProductPrice(op.products, o);
          
          return {
            ...product,
            offer_id: o.id,
            offer_type: o.type
          };
        }).filter(Boolean)
      );

      // Deduplicate by ID
      const uniqueProducts = [];
      const seen = new Set();
      for (const p of productsWithTypes) {
        if (!seen.has(p.id)) {
          uniqueProducts.push(p);
          seen.add(p.id);
        }
      }
      return uniqueProducts;
    },
    enabled: !!store?.id
  })

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-5 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-right">
            <h1 className="text-2xl font-medium text-gray-900">صفقات اليوم</h1>
            <p className="text-sm text-gray-400 mt-1">أفضل الأسعار المختارة لك</p>
          </div>
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 transition-colors hover:bg-gray-200">
            ←
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <OfferCardSkeleton key={i} />
            ))}
          </div>
        ) : offersWithProducts?.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {offersWithProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                >
                  <ProductOfferCard
                    product={product}
                    offerType={product.offer_type}
                    onProductClick={() => handleProductClick(`/offers/${product.offer_id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-24">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tag size={24} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عروض حالياً</h3>
            <p className="text-sm text-gray-400 px-10 max-w-md mx-auto">ابقَ على اطلاع، فنحن نضيف صفقات جديدة باستمرار!</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-8 px-8 py-3 bg-gray-900 text-white font-medium rounded-xl transition-all active:scale-95"
            >
              العودة للرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
