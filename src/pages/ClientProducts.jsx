import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronRight, Zap, Crown, Tag, Lock } from 'lucide-react' // Import Tag for discount badge, Lock for exclusive
import useUserStore from '../store/userStore'
import { supabase} from '../lib/supabase'

export default function ClientProducts() {
  const navigate = useNavigate()
  const { store, membership } = useUserStore()
  const [catFilter, setCatFilter] = useState('الكل')

  // Updated query to fetch products with associated offers and discount details
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', store?.id],
    queryFn: () => supabase
      .from('products')
      .select(`
        id, name, price, image_url, is_active, category, is_exclusive, min_tier_to_view,
        offer_products:offer_products( // Alias for clarity
          offer_id, 
          offers(id, discount_percentage, original_price, valid_until, type) // Fetch offer details
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
    const offerDetails = product.offer_products?.[0]?.offers; // Accessing the first offer for simplicity
    
    // Check if an offer with a discount percentage is available
    if (offerDetails && offerDetails.discount_percentage !== null && offerDetails.discount_percentage !== undefined && offerDetails.discount_percentage > 0) {
      const discountAmount = offerDetails.original_price * (offerDetails.discount_percentage / 100);
      const discountedPrice = offerDetails.original_price - discountAmount;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted line-through text-sm">{offerDetails.original_price?.toLocaleString()} دج</span>
          <span className="text-accent font-black text-base">{discountedPrice?.toLocaleString()} دج</span>
          <span className="text-xs text-green-600 font-bold">-{offerDetails.discount_percentage}%</span>
        </div>
      );
    } else if (product.price) {
      // Fallback to just displaying price if no explicit discount fields from an offer
      return <span className="text-accent font-black text-sm">{product.price?.toLocaleString()} <span className="text-[10px]">دج</span></span>;
    }
    return null; // No price info to display
  };

  // Filter products based on category and user's tier access
  const filteredProducts = products?.filter(p =>
    (catFilter === 'الكل' || p.category === catFilter) && canViewProduct(p)
  ) || [];

  return (
    <div className="min-h-screen bg-surface gradient-mesh pb-24">
      <div className="p-5 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
            ←
          </button>
          <h1 className="text-2xl font-black text-text">المنتجات</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 justify-end">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                catFilter === cat
                  ? 'bg-accent text-white'
                  : 'bg-white text-muted border border-border'
              }`}
              onClick={() => setCatFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredProducts.map((product, i) => {
                // Determine if there's an active offer with discount
                const isActiveOfferWithDiscount = product.offer_products?.[0]?.offers && 
                                                 product.offer_products[0].offers.discount_percentage !== null && 
                                                 product.offer_products[0].offers.discount_percentage !== undefined &&
                                                 product.offer_products[0].offers.discount_percentage > 0;
                
                // Determine if the product is exclusive and requires a specific tier
                const isExclusiveAndTierRestricted = product.is_exclusive && 
                                                     product.min_tier_to_view && 
                                                     product.min_tier_to_view.toLowerCase() !== 'basic';

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ 
                      y: -6, // Slight upward movement
                      scale: 1.02, // Slight scale up
                      shadow: '0 12px 24px -4px rgb(0 0 0 / 0.15)', // Enhance shadow
                      borderColor: '#D4AF37' // Add accent border on hover
                    }}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="bg-white rounded-3xl overflow-hidden border border-border shadow-soft cursor-pointer active:scale-[0.98] transition-transform hover:shadow-xl hover:border-accent" // Added hover effects and accent border
                  >
                    <div className="aspect-square bg-surface relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted/20">
                          <Package size={48} />
                        </div>
                      )}
                      {/* Exclusive Badge (Lock icon) */}
                      {product.is_exclusive && (
                        <div className="absolute top-1 right-1 p-1 bg-yellow-400/80 backdrop-blur-sm rounded-md z-10">
                          <Lock size={14} className="text-white" />
                        </div>
                      )}
                      {/* Discount Badge - Positioned top-right as per plan */}
                      {isActiveOfferWithDiscount && (
                        <div className="absolute top-1 right-1 p-1 bg-red-600/80 backdrop-blur-sm rounded-md z-10 flex items-center"> {/* Positioned top-right, red background */}
                          <Tag size={14} className="text-white" />
                          <span className="text-[10px] font-bold text-white ml-0.5">-{product.offer_products[0].offers.discount_percentage}%</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {/* Tier Indicator (Crown icon) */}
                      {isExclusiveAndTierRestricted && (
                          <div className="flex items-center gap-1 mb-1">
                            <Crown size={12} className="text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-600 uppercase">{product.min_tier_to_view}</span>
                          </div>
                      )}
                      <h4 className="text-sm font-black text-text truncate mb-1">{product.name}</h4>
                      
                      {/* Price Display with Discount Logic */}
                      {displayProductPriceInfo(product)}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-muted opacity-20" />
            </div>
            <p className="text-muted font-bold">لا توجد منتجات</p>
          </div>
        )}
      </div>
    </div>
  )
}
