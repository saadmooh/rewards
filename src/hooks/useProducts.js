import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useUserStore from '../store/userStore'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useUserStore()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        console.error('useProducts error:', err)
        // Fallback mock data
        setProducts([
          { id: '1', name: 'Premium Coffee Maker', description: 'State-of-the-art', price: 299, category: 'appliances' },
          { id: '2', name: 'Wireless Earbuds Pro', description: 'High-quality audio', price: 199, category: 'electronics' },
          { id: '3', name: 'Yoga Mat Premium', description: 'Eco-friendly', price: 49, category: 'fitness' },
          { id: '4', name: 'Smart Watch Series X', description: 'Advanced tracking', price: 349, category: 'electronics' },
          { id: '5', name: 'Designer Handbag', description: 'Elegant leather', price: 179, category: 'fashion' },
          { id: '6', name: 'Blender Set Professional', description: 'High-performance', price: 129, category: 'appliances' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, loading, error }
}

export const useProduct = (productId) => {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  return { product, loading, error }
}
