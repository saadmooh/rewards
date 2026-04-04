import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, ShoppingBag, Sparkles } from 'lucide-react'
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'
import ProductOfferCard from '../components/ProductOfferCard'

export default function ClientOffers() {
  const navigate = useNavigate()
  const { store } = useUserStore()

  const { data: discountedProducts, isLoading } = useQuery({
    queryKey: ['discounted-products', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id,
          offer_products (
            products (*)
          )
        `)
        .eq('store_id', store.id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Flatten and deduplicate products from all active offers
      const products = data.flatMap(o => o.offer_products.map(op => ({
        ...op.products,
        offer_id: o.id
      })));

      // Deduplicate by ID
      const uniqueProducts = [];
      const seen = new Set();
      for (const p of products) {
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
    <div className="min-h-screen bg-surface gradient-mesh pb-24">
      <div className="p-5 max-w-md mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-right">
            <h1 className="text-3xl font-black text-text tracking-tighter flex items-center gap-2 justify-end">
              <Sparkles className="text-accent" size={24} />
              صفقات اليوم
            </h1>
            <p className="text-sm text-muted font-bold mt-1">أفضل الأسعار المختارة لك بعناية</p>
          </div>
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center shadow-soft active:scale-95 transition-transform">
            ←
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-border animate-pulse" />
            ))}
          </div>
        ) : discountedProducts?.length > 0 ? (
          <div className="grid gap-4">
            <AnimatePresence>
              {discountedProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductOfferCard
                    product={product}
                    onProductClick={() => navigate(`/offers/${product.offer_id}`)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-soft border border-border">
              <Tag size={40} className="text-muted opacity-20" />
            </div>
            <h3 className="text-xl font-black text-text mb-2">لا توجد عروض حالياً</h3>
            <p className="text-sm text-muted font-bold px-10">ابقَ على اطلاع، فنحن نضيف صفقات جديدة باستمرار!</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-8 px-8 py-3 bg-accent text-white font-black rounded-2xl shadow-lg shadow-accent/20 active:scale-95 transition-all"
            >
              العودة للرئيسية
            </button>
          </div>
        )}
      </div>

      {/* Floating Category Indicator - Just for aesthetic */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md border border-border px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-text uppercase tracking-widest">مباشر: {discountedProducts?.length || 0} صفقات</span>
        </div>
      </div>
    </div>
  )
}
