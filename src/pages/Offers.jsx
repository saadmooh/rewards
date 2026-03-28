import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useOffers } from '../hooks/useOffers'
import OfferCard from '../components/OfferCard'

export default function Offers() {
  const navigate = useNavigate()
  const { offers, loading } = useOffers()
  const [activeTab, setActiveTab] = useState('all')

  const filteredOffers = activeTab === 'all'
    ? offers
    : offers?.filter((offer) => offer.type?.toLowerCase() === activeTab) || []

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="p-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 hover:bg-white rounded-xl transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-text">Offers</h1>
          </div>
          <p className="text-muted">Discover rewards and exclusive deals</p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {['all', 'discount', 'bonus', 'gift', 'exclusive'].map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(category)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === category
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-white text-muted border border-border'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <OfferCard
                  id={offer.id}
                  title={offer.title}
                  description={offer.description}
                  points={offer.points_cost}
                  expiresAt={offer.valid_until}
                  category={offer.type}
                  onClick={() => navigate(`/offers/${offer.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {filteredOffers.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🎁</p>
            <p className="text-muted">No offers available</p>
          </div>
        )}
      </div>
    </div>
  )
}
