import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import useUserStore from '../store/userStore'
import { supabase } from '../lib/supabase'
import { useProducts } from '../hooks/useProducts'
import PointsCard from '../components/PointsCard'
import ProductCard from '../components/ProductCard'
import ProductOfferCard from '../components/ProductOfferCard'

export default function Home() {
  const navigate = useNavigate()
  const { user, store } = useUserStore()
  const { products } = useProducts()
  const [scanning, setScanning] = useState(false)

  const { data: offersWithProducts, isLoading: isOffersLoading } = useQuery({
    queryKey: ['discounted-products-home', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('offers')
        .select(`
          id,
          type,
          discount_percent,
          offer_products (
            products (*)
          )
        `)
        .eq('store_id', store.id)
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Flatten and add offer type + calculate prices to each product
      const productsWithTypes = (data || []).flatMap(o => 
        (o.offer_products || []).map(op => {
          if (!op.products) return null;
          const product = { ...op.products };
          
          if (o.type === 'gift') {
            product.original_price = product.price;
            product.discount_percentage = 100;
            product.price = 0;
          } else if (o.discount_percent && o.discount_percent > 0) {
            const discountAmount = Math.round(product.price * (o.discount_percent / 100));
            product.original_price = product.price;
            product.discount_percentage = o.discount_percent;
            product.price = product.price - discountAmount;
          }
          
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
      return uniqueProducts.slice(0, 6); // Just top 6 for home
    },
    enabled: !!store?.id
  })

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      navigate('/scan')
    }, 500)
  }

  const latestProducts = products?.slice(0, 6) || []

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

        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">For You</h2>
            <button
              onClick={() => navigate('/offers')}
              className="text-gray-500 font-medium text-sm"
            >
              See All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
            {isOffersLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="min-w-[280px] h-32 bg-gray-100 rounded-2xl animate-pulse" />
              ))
            ) : offersWithProducts?.length > 0 ? (
              offersWithProducts.map((product) => (
                <div key={product.id} className="min-w-[280px]">
                  <ProductOfferCard
                    product={product}
                    offerType={product.offer_type}
                    onProductClick={() => navigate(`/offers/${product.offer_id}`)}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 w-full">
                <p>No special offers today</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">New Arrivals</h2>
            <button
              onClick={() => navigate('/products')}
              className="text-gray-500 font-medium text-sm"
            >
              See All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
            {latestProducts.length > 0 ? latestProducts.map((product) => (
              <div key={product.id} className="min-w-[160px]">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.image_url}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400 w-full">
                <p>Loading products...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
