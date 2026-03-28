import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProducts } from '../hooks/useProducts'
import ProductCard from '../components/ProductCard'

export default function Products() {
  const navigate = useNavigate()
  const { products, loading } = useProducts()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'appliances', label: 'Appliances' },
    { id: 'fitness', label: 'Fitness' },
    { id: 'fashion', label: 'Fashion' },
  ]

  const filteredProducts = products?.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  }) || []

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="p-5 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-text mb-2">Products</h1>
          <p className="text-muted">Browse our collection</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 bg-white border border-border rounded-2xl text-text placeholder-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-accent text-white shadow-md'
                    : 'bg-white text-muted border border-border'
                }`}
              >
                {category.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.image_url}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-muted">No products found</p>
          </div>
        )}
      </div>
    </div>
  )
}
