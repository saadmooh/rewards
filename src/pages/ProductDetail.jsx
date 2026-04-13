import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useProduct } from '../hooks/useProducts'

export default function ProductDetail() {
  const { t } = useTranslation()
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
          <p className="text-muted mb-4">{t('product_detail.not_found')}</p>
          <button onClick={() => navigate(-1)} className="text-accent">{t('product_detail.return')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-5xl mx-auto px-5 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white/90 backdrop-blur rounded-2xl flex items-center justify-center shadow-soft border border-border mb-8 transition-all hover:bg-white active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2.5rem] overflow-hidden shadow-2xl bg-white aspect-square md:aspect-auto md:h-[600px] border-8 border-white"
          >
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-8 text-right"
          >
            <div className="bg-white rounded-[2rem] p-8 shadow-soft border border-border">
              <div className="flex items-center justify-end gap-3 mb-6">
                {product.is_exclusive && (
                  <span className="px-4 py-1.5 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-soft shadow-accent/20">
                    {t('product_detail.exclusive')}
                  </span>
                )}
                <span className="px-4 py-1.5 bg-surface rounded-xl text-[10px] font-black text-muted uppercase tracking-widest border border-border">
                  {product.category || t('products.general')}
                </span>
              </div>

              <h1 className="text-4xl font-black text-text mb-4 tracking-tight">
                {product.name}
              </h1>

              <p className="text-muted text-lg font-medium leading-relaxed mb-8">
                {product.description || t('product_detail.no_description')}
              </p>

              <div className="flex items-center justify-between p-6 bg-surface rounded-2xl border border-border mb-8">
                <div className="text-left">
                  <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-1">{t('product_detail.current_price')}</p>
                  <p className="text-4xl font-black text-accent">{product.price?.toLocaleString()} <span className="text-sm">{t('products.dzd')}</span></p>
                </div>
                <div className="text-right">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-soft">
                      <span className="text-2xl">🏷️</span>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-gray-200 transition-all hover:bg-black active:scale-[0.98]"
                >
                  🏪 {t('product_detail.available_in_store')}
                </button>

                <div className="flex items-center justify-center gap-2 text-muted">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                   <p className="text-xs font-bold uppercase tracking-widest">{t('product_detail.ensure_availability')}</p>
                </div>
              </div>
            </div>

            <div className="bg-accent/5 rounded-3xl p-6 border border-accent/10">
               <div className="flex items-center justify-end gap-3">
                  <div className="text-right">
<p className="text-accent-dark font-black text-sm">{t('product_detail.earn_points')}</p>
                      <p className="text-accent-dark/60 text-xs font-medium">{t('product_detail.points_detail')}</p>
                  </div>
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-soft">
                     <span className="text-xl">✨</span>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
