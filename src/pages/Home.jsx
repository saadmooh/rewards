import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'
import { useOffers } from '../hooks/useOffers'
import { useProducts } from '../hooks/useProducts'
import PointsCard from '../components/PointsCard'
import ProductCard from '../components/ProductCard'
import OfferCard from '../components/OfferCard'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { offers } = useOffers()
  const { products } = useProducts()
  const [scanning, setScanning] = useState(false)

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      navigate('/scan')
    }, 500)
  }

  const latestProducts = products?.slice(0, 4) || []
  const personalizedOffers = offers?.slice(0, 3) || []

  return (
    <div className="min-h-screen bg-surface gradient-mesh pb-24">
      <div className="p-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-muted text-sm">Good morning</p>
              <h1 className="text-2xl font-bold text-text">
                {user?.first_name || 'there'}! 👋
              </h1>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-accent-light flex items-center justify-center overflow-hidden shadow-soft">
              {user?.photo_url ? (
                <img src={user.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>
          </div>
        </motion.div>

        <section className="mb-6">
          <PointsCard points={user?.points || 0} tier={user?.tier || 'bronze'} />
        </section>

        <section className="mb-6">
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScan}
            disabled={scanning}
            className="w-full py-5 bg-accent text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-card hover:shadow-card-hover transition-all"
          >
            <span className="text-xl">📷</span>
            {scanning ? 'Opening...' : 'Scan Receipt'}
          </motion.button>
        </section>

        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text">For You</h2>
            <button
              onClick={() => navigate('/offers')}
              className="text-accent font-semibold text-sm"
            >
              See All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5">
            {personalizedOffers.length > 0 ? personalizedOffers.map((offer) => (
              <div key={offer.id} className="min-w-[280px]">
                <OfferCard
                  id={offer.id}
                  title={offer.title}
                  description={offer.description}
                  points={offer.points_cost}
                  expiresAt={offer.valid_until}
                  category={offer.type}
                  onClick={() => navigate(`/offers/${offer.id}`)}
                />
              </div>
            )) : (
              <div className="text-center py-8 text-muted w-full">
                <p>Loading offers...</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-text">New Arrivals</h2>
            <button
              onClick={() => navigate('/products')}
              className="text-accent font-semibold text-sm"
            >
              See All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {latestProducts.length > 0 ? latestProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                imageUrl={product.image_url}
                onClick={() => navigate(`/products/${product.id}`)}
              />
            )) : (
              <div className="col-span-2 text-center py-8 text-muted">
                <p>Loading products...</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
