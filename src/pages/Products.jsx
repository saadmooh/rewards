// Products - Product management page with add/edit form
import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Edit2, Power, Trash2, X, Image as ImageIcon, Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Products() {
  const { t } = useTranslation()
  const { store } = useDashboardStore()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [catFilter, setCatFilter] = useState(t('common.all'))

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', store?.id, catFilter],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })
      if (catFilter !== t('common.all')) q = q.eq('category', catFilter)
      return q.then(r => r.data ?? [])
    },
    enabled: !!store?.id
  })

  const categories = [t('common.all'), t('products.shirts'), t('products.pants'), t('products.accessories'), t('products.abayas'), t('products.shoes'), t('products.general')]

  const toggleActiveMutation = useMutation({
    mutationFn: async (product) => {
      const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['products'])
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['products']),
    onError: (err) => {
      console.error('Delete error:', err)
      alert(t('products.delete_failed') || 'Failed to delete product: ' + err.message)
    }
  })

  const handleDelete = (id) => {
    if (confirm(t('products.delete_confirm') || t('common.confirm'))) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-black text-text tracking-tight">{t('products.title')}</h1>
          <p className="text-sm text-muted font-medium">{t('products.no_products_desc')}</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-bold shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95 order-first md:order-last"
        >
          <Plus size={20} />
          <span>{t('products.add_product_btn')}</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-border shadow-soft text-right">
        <div className="flex flex-wrap gap-2 justify-end">
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                catFilter === cat
                  ? 'bg-accent text-white shadow-soft shadow-accent/20'
                  : 'bg-surface text-muted hover:bg-white border border-border'
              }`}
              onClick={() => setCatFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {products?.map((product, i) => (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-3xl border border-border overflow-hidden shadow-soft group hover:border-accent transition-all ${!product.is_active ? 'opacity-60 grayscale' : ''}`}
            >
              <div className="aspect-square bg-surface relative overflow-hidden">
                {product.image_url
                  ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-muted/20">
                      <Package size={64} />
                    </div>
                }
                {product.is_exclusive && (
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md shadow-soft px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="text-[10px] font-black text-text tracking-tighter uppercase">{t('products.exclusive')}</span>
                    <span className="text-xs">🔒</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button 
                    onClick={() => { setEditing(product); setShowForm(true) }}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-text hover:bg-accent hover:text-white transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => toggleActiveMutation.mutate(product)}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-text hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    <Power size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-text hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="p-4 text-right">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{product.category}</p>
                <h4 className="text-text font-bold text-sm truncate mb-2">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-accent font-black text-base">{product.price?.toLocaleString()} <span className="text-[10px]">{t('products.dzd')}</span></span>
                  {product.is_exclusive && (
                    <span className="text-[10px] font-bold text-muted bg-surface px-2 py-0.5 rounded-md">
                      {t('products.tier')} {product.min_tier_to_view}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && !products?.length && (
        <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-soft">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-muted opacity-20" />
          </div>
          <p className="text-muted font-bold">{t('products.no_products')}</p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 text-accent text-sm font-black hover:underline"
          >
            {t('products.add_first')}
          </button>
        </div>
      )}

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editing}
            storeId={store.id}
            onSave={() => { setShowForm(false); queryClient.invalidateQueries(['products']) }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductForm({ product, storeId, onSave, onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name:             product?.name             ?? '',
    description:      product?.description      ?? '',
    price:            product?.price            ?? '',
    category:         product?.category         ?? t('products.general'),
    image_url:        product?.image_url        ?? '',
    is_exclusive:     product?.is_exclusive     ?? false,
    min_tier_to_view: product?.min_tier_to_view ?? 'bronze',
    is_active:        product?.is_active        ?? true,
    duration_minutes: product?.duration_minutes ?? '',
    benefits:         Array.isArray(product?.benefits) ? product.benefits.join(', ') : (product?.benefits ?? ''),
    skin_type_compatibility: product?.skin_type_compatibility ?? [],
    aftercare_tips:   product?.aftercare_tips    ?? '',
  })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const uploadImage = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${storeId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: urlData.publicUrl }))
    } catch (err) {
      console.error('Upload error:', err)
      alert(t('products.upload_failed') + err.message)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) {
      alert(t('products.enter_name_price'))
      return
    }
    
    const dataToSave = {
      ...form,
      benefits: typeof form.benefits === 'string' ? form.benefits.split(',').map(b => b.trim()).filter(Boolean) : (Array.isArray(form.benefits) ? form.benefits : []),
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
    }
    
    try {
      if (product?.id) {
        const { error } = await supabase.from('products').update({ ...dataToSave, updated_at: new Date() }).eq('id', product.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert({ ...dataToSave, store_id: storeId })
        if (error) throw error
      }
      onSave()
    } catch (err) {
      console.error('Save error:', err)
      alert(t('products.save_failed') + err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[32px] w-full max-w-lg max-h-[90vh] overflow-hidden border border-border shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
          <div>
            <h3 className="text-lg font-black text-text tracking-tight">{product ? t('products.edit_product') : t('products.add_product')}</h3>
            <p className="text-xs text-muted font-medium">{t('products.fill_details')}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted hover:text-text transition-colors shadow-soft">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-right">
          {/* Image upload */}
          <div 
            className="aspect-video bg-surface rounded-[24px] border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all overflow-hidden relative group"
            onClick={() => fileRef.current?.click()}
          >
            {form.image_url ? (
              <>
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white px-4 py-2 rounded-xl text-xs font-bold shadow-soft">{t('products.change_image')}</span>
                </div>
              </>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-soft mb-3 ${uploading ? 'animate-bounce' : ''}`}>
                  <ImageIcon size={24} className="text-accent" />
                </div>
                <p className="text-sm font-bold text-text">{uploading ? t('products.uploading') : t('products.upload_image')}</p>
                <p className="text-xs text-muted font-medium mt-1">PNG, JPG up to 5MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => uploadImage(e.target.files[0])} />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('products.price')}</label>
                <input 
                  type="number"
                  value={form.price} 
                  onChange={e => setForm(f => ({...f, price: e.target.value}))}
                  placeholder="0.00"
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('products.name')}</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  placeholder={t('products.product_name')}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
                />
              </div>
            </div>

            <div className="space-y-1.5">
<label className="text-xs font-black text-muted tracking-widest px-1">{t('products.description')}</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder={t('products.add_description')}
                  rows={3}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-medium focus:outline-none focus:border-accent transition-colors resize-none text-right"
              />
            </div>

<div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 relative text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('products.category')}</label>
                <select 
                  value={form.category}
                  onChange={e => setForm(f => ({...f, category: e.target.value}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none transition-colors text-right"
                >
                  {[t('products.general'),t('products.shirts'),t('products.pants'),t('products.accessories'),t('products.abayas'),t('products.shoes')].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
              </div>
              
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('products.product_status')}</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setForm(f => ({...f, is_active: true}))}
                    className={`flex-1 py-3 rounded-2xl font-bold text-xs border transition-all ${form.is_active ? 'bg-green-50 border-green-200 text-green-600' : 'bg-surface border-border text-muted opacity-50'}`}
                  >
                    {t('products.active')}
                  </button>
                  <button 
                    onClick={() => setForm(f => ({...f, is_active: false}))}
                    className={`flex-1 py-3 rounded-2xl font-bold text-xs border transition-all ${!form.is_active ? 'bg-red-50 border-red-200 text-red-600' : 'bg-surface border-border text-muted opacity-50'}`}
                  >
                    {t('products.inactive')}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted tracking-widest px-1">Duration (minutes)</label>
              <input 
                type="number"
                value={form.duration_minutes} 
                onChange={e => setForm(f => ({...f, duration_minutes: e.target.value}))}
                placeholder="e.g., 60"
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted tracking-widest px-1">Benefits (comma-separated)</label>
              <input 
                value={form.benefits} 
                onChange={e => setForm(f => ({...f, benefits: e.target.value}))}
                placeholder="e.g., Hydrating, Anti-aging, Soothing"
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted tracking-widest px-1">Aftercare Tips</label>
              <textarea
                value={form.aftercare_tips}
                onChange={e => setForm(f => ({...f, aftercare_tips: e.target.value}))}
                placeholder="e.g., Avoid sun exposure for 24 hours"
                rows={2}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-medium focus:outline-none focus:border-accent transition-colors resize-none text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-muted tracking-widest px-1">Skin Type Compatibility</label>
              <div className="flex flex-wrap gap-2">
                {['Dry', 'Oily', 'Sensitive', 'Combination', 'Normal'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const current = form.skin_type_compatibility || []
                      const updated = current.includes(type)
                        ? current.filter(t => t !== type)
                        : [...current, type]
                      setForm(f => ({...f, skin_type_compatibility: updated}))
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      form.skin_type_compatibility?.includes(type)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface border-border text-muted hover:border-accent'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2">
              <label className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border cursor-pointer group hover:border-accent transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${form.is_exclusive ? 'bg-accent text-white' : 'bg-white text-muted border border-border'}`}>
                    {form.is_exclusive ? <Check size={20} /> : <div className="w-2 h-2 rounded-full bg-muted/20" />}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-text block">{t('products.exclusive_product')}</span>
                    <span className="text-[10px] text-muted font-bold">{t('products.exclusive_desc')}</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={form.is_exclusive}
                  onChange={e => setForm(f => ({...f, is_exclusive: e.target.checked}))}
                  className="hidden"
                />
              </label>
            </div>

            {form.is_exclusive && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5 relative pt-2 text-right"
              >
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('products.target_tier')}</label>
                <select 
                  value={form.min_tier_to_view}
                  onChange={e => setForm(f => ({...f, min_tier_to_view: e.target.value}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none text-right"
                >
<option value="silver">{t('offers.silver_plus')}</option>
                    <option value="gold">{t('offers.gold_plus')}</option>
                    <option value="platinum">{t('offers.platinum_only')}</option>
                </select>
                <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-6 bg-surface/50 border-t border-border flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl text-muted font-black text-sm hover:bg-white transition-all active:scale-95"
          >
{t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-[2] bg-accent text-white py-4 rounded-2xl font-black text-sm shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95"
            >
              {product ? t('products.save_product') : t('products.add_to_store')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
