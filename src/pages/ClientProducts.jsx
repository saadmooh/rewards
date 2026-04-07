import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronRight, Zap, Crown, Tag, Lock } from 'lucide-react' // Import Tag for discount badge, Lock for exclusive
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'
import { ProductCardSkeleton } from '../components/CardSkeleton'
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
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
}

export default function ClientProducts() {
  const navigate = useNavigate()
  const { store, membership } = useUserStore()
  const [catFilter, setCatFilter] = useState('الكل')

  const handleProductClick = (path) => {
    hapticFeedback('light')
    navigate(path)
  }

  // Updated query to fetch products with associated offers and discount details
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', store?.id],
    queryFn: () => supabase
      .from('products')
      .select(`
        id, name, price, image_url, is_active, category, is_exclusive, min_tier_to_view,
        offer_products:offer_products(
          offer_id, 
          offers(id, type, discount_percent, valid_from, valid_until)
        )
      `)
      .eq('store_id', store.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(r => r.data ?? []),
    enabled: !!store?.id
  })

  const categories = ['الكل', 'قمصان', 'بناطيل', 'إكسسوارات', 'عبايات', 'أحذية', 'عام']

  const userTier = membership?.tier || 'bronze'
  const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 }
  
  // Function to determine if the user can view the product based on tier
  const canViewProduct = (product) => {
    if (!product.is_exclusive) return true
    // Ensure min_tier_to_view is valid before comparison
    const productTierOrder = tierOrder[product.min_tier_to_view] ?? -1; // Default to lowest if invalid
    return tierOrder[userTier] >= productTierOrder;
  }

  // Helper function to display price info, handling discounts from offers
  const displayProductPriceInfo = (product) => {
    const offerDetails = product.offer_products?.[0]?.offers;
    
    if (offerDetails && offerDetails.discount_percent && offerDetails.discount_percent > 0) {
      const discountAmount = product.price * (offerDetails.discount_percent / 100);
      const discountedPrice = product.price - discountAmount;
      return (
        <div className="flex items-center gap-2">
          <span className="text-red-400 line-through text-xs">{product.price?.toLocaleString()} دج</span>
          <span className="text-green-600 font-medium text-sm">{discountedPrice?.toLocaleString()} دج</span>
        </div>
      );
    } else if (product.price) {
      return <span className="text-gray-900 font-medium text-sm">{product.price?.toLocaleString()} دج</span>;
    }
    return null;
  };

  // Filter products based on category and user's tier access
  const filteredProducts = products?.filter(p =>
    (catFilter === 'الكل' || p.category === catFilter) && canViewProduct(p)
  ) || [];

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-5 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            ←
          </button>
          <h1 className="text-xl font-medium text-gray-900">المنتجات</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-end">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                catFilter === cat
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-500'
              }`}
              onClick={() => setCatFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4"
          >
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const offerDetails = product.offer_products?.[0]?.offers;
                const isActiveOfferWithDiscount = offerDetails && 
                                                 offerDetails.discount_percent && 
                                                 offerDetails.discount_percent > 0;
                
                const isExclusiveAndTierRestricted = product.is_exclusive && 
                                                     product.min_tier_to_view && 
                                                     product.min_tier_to_view.toLowerCase() !== 'basic';

                return (
                  <motion.div
                    key={product.id}
                    variants={itemVariants}
                    onClick={() => handleProductClick(`/products/${product.id}`)}
                    className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="aspect-square bg-gray-50 relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package size={32} />
                        </div>
                      )}
                      {product.is_exclusive && (
                        <div className="absolute top-2 right-2 p-1 bg-gray-900/80 rounded-md z-10">
                          <Lock size={12} className="text-white" />
                        </div>
                      )}
                      {isActiveOfferWithDiscount && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gray-900 rounded-md z-10 flex items-center">
                          <span className="text-[10px] font-medium text-white">-{offerDetails.discount_percent}%</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {isExclusiveAndTierRestricted && (
                          <div className="flex items-center gap-1 mb-1">
                            <Crown size={12} className="text-gray-400" />
                            <span className="text-[10px] font-medium text-gray-500 uppercase">{product.min_tier_to_view}</span>
                          </div>
                      )}
                      <h4 className="text-sm font-medium text-gray-900 truncate mb-1">{product.name}</h4>
                      {displayProductPriceInfo(product)}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">لا توجد منتجات</p>
          </div>
        )}
      </div>
    </div>
  )
}
