import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProduct } from '../hooks/useProducts'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { product, loading } = useProduct(id)

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted mb-4">Product not found</p>
          <button onClick={() => navigate(-1)} className="text-accent">Go back</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative"
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="h-72 overflow-hidden">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 max-w-md mx-auto -mt-8 relative z-10"
      >
        <div className="bg-white rounded-3xl p-6 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-surface rounded-full text-xs text-muted capitalize">
              {product.category}
            </span>
            {product.is_exclusive && (
              <span className="px-3 py-1 bg-accent-light text-accent-dark rounded-full text-xs font-semibold">
                Exclusive
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-text mb-3">
            {product.name}
          </h1>

          <p className="text-muted mb-6">
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-muted text-sm">Price</p>
              <p className="text-3xl font-bold text-accent">${product.price}</p>
            </div>
          </div>

          <button
            className="w-full py-4 bg-surface border border-border rounded-2xl text-muted font-semibold"
          >
            🏪 Find in Store
          </button>

          <p className="text-center text-muted text-xs mt-4">
            Available for in-store purchase only
          </p>
        </div>
      </motion.div>
    </div>
  )
}
