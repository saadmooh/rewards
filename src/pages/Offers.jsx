// Offers - Offer management with create/edit form
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Edit2, Power, Trash2, X, Check, ChevronDown, Clock, Users, Gift, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { calculateProductPrice, formatCurrency } from '../lib/offers'
import { useTranslation } from 'react-i18next'
import OfferPackages from './OfferPackages'

export default function Offers() {
  const { t, i18n } = useTranslation()
  const { store } = useDashboardStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('regular') // 'regular' or 'scratch'
  const [showForm, setShowForm] = useState(false)
  const [showScratchForm, setShowScratchForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [editingScratch, setEditingScratch] = useState(null)

  // Regular Offers Query
  const { data: offers, isLoading: isOffersLoading } = useQuery({
    queryKey: ['offers', store?.id],
    queryFn: () => supabase
      .from('offers')
      .select('*, redemptions(id)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .then(r => r.data ?? []),
    enabled: !!store?.id
  })

  // Scratch Cards Query
  const { data: scratchCards, isLoading: isScratchLoading } = useQuery({
    queryKey: ['scratch_cards', store?.id],
    queryFn: () => supabase
      .from('scratch_cards')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .then(r => r.data ?? []),
    enabled: !!store?.id
  })

  // Packages for Scratch Form
  const { data: packages } = useQuery({
    queryKey: ['offer_packages', store?.id],
    queryFn: () => supabase
      .from('offer_packages')
      .select('id, title')
      .eq('store_id', store.id)
      .eq('status', 'active')
      .then(r => r.data ?? []),
    enabled: !!store?.id
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async (offer) => {
      const { error } = await supabase.from('offers').update({ is_active: !offer.is_active }).eq('id', offer.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['offers'])
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('offers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['offers'])
  })

  const toggleScratchStatusMutation = useMutation({
    mutationFn: async (card) => {
      const newStatus = card.status === 'active' ? 'paused' : 'active'
      const { error } = await supabase.from('scratch_cards').update({ status: newStatus }).eq('id', card.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['scratch_cards'])
  })

  const deleteScratchMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('scratch_cards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['scratch_cards'])
  })

  const OCCASION_LABELS = {
    always: t('offers.always'), fixed: t('offers.fixed_date'), birthday: t('offers.customer_birthday'),
    anniversary: t('offers.customer_anniversary'), win_back: t('offers.win_back'), flash: t('offers.flash')
  }
  const TYPE_LABELS = {
    discount: t('offers.discount'), gift: t('offers.gift'), double_points: t('offers.double_points'),
    flash: t('offers.flash'), exclusive: t('offers.exclusive')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex bg-white p-1 rounded-2xl border border-border shadow-soft w-full md:w-fit ml-auto">
        <button
          onClick={() => setActiveTab('scratch')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === 'scratch' ? 'bg-accent text-white shadow-soft' : 'text-muted hover:bg-surface'
          }`}
        >
          {t('scratch_card.title')}
        </button>
        <button
          onClick={() => setActiveTab('regular')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === 'regular' ? 'bg-accent text-white shadow-soft' : 'text-muted hover:bg-surface'
          }`}
        >
          {t('offers.title')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-right">
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight">
            {activeTab === 'regular' ? t('offers.title') : t('scratch_card.title')}
          </h1>
          <p className="text-sm text-muted font-medium">
            {activeTab === 'regular' ? t('offers.no_offers_desc') : 'Create gamified scratch-to-win campaigns'}
          </p>
        </div>
        <button 
          onClick={() => { 
            if (activeTab === 'regular') {
              setEditing(null); setShowForm(true)
            } else {
              setEditingScratch(null); setShowScratchForm(true)
            }
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-bold shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95 order-first md:order-last"
        >
          <Plus size={20} />
          <span>{t('offers.add_offer_btn')}</span>
        </button>
      </div>

      <div className="grid gap-4">
        {activeTab === 'regular' ? (
          <>
            {isOffersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-3xl border border-border animate-pulse" />
              ))
            ) : offers?.map((offer, i) => (
              <motion.div 
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-3xl p-5 border border-border shadow-soft flex flex-col md:flex-row gap-4 relative overflow-hidden ${!offer.is_active ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    {offer.type === 'flash' && <Zap size={14} className="text-orange-500 fill-orange-500" />}
                    <h4 className="text-text font-black text-lg">{offer.title}</h4>
                  </div>
                  <p className="text-muted text-sm font-medium mb-4 line-clamp-2">{offer.description || t('common.no_description')}</p>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className="bg-surface text-text text-[10px] font-black px-3 py-1.5 rounded-xl border border-border uppercase">
                      {TYPE_LABELS[offer.type] || offer.type}
                    </span>
                    <span className="bg-surface text-text text-[10px] font-black px-3 py-1.5 rounded-xl border border-border">
                      {OCCASION_LABELS[offer.occasion_type] || offer.occasion_type}
                    </span>
                    <span className="bg-accent/10 text-accent text-[10px] font-black px-3 py-1.5 rounded-xl border border-accent/20 uppercase tracking-tighter">
                      {t('offers.tier')} {offer.min_tier}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col justify-between items-center md:items-end border-t md:border-t-0 md:border-r border-border pt-4 md:pt-0 md:pr-6 gap-4 min-w-[140px]">
                  <div className="text-right">
                    <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-0.5">{t('offers.usage')}</p>
                    <p className="text-text font-black text-xl">{offer.redemptions?.length ?? 0}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditing(offer); setShowForm(true) }}
                      className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-text hover:bg-white border border-border hover:border-accent transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => toggleActiveMutation.mutate(offer)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        offer.is_active 
                          ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                          : 'bg-green-50 text-green-600 border border-green-100'
                      }`}
                    >
                      <Power size={18} />
                    </button>
                    <button
                      onClick={() => { if (confirm(t('offers.delete_confirm'))) deleteMutation.mutate(offer.id) }}
                      className="w-10 h-10 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {!isOffersLoading && !offers?.length && (
              <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-soft">
                <Tag size={32} className="text-muted opacity-20 mx-auto mb-4" />
                <p className="text-muted font-bold">{t('offers.no_offers')}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {isScratchLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-3xl border border-border animate-pulse" />
              ))
            ) : scratchCards?.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-soft">
                <Gift className="w-12 h-12 text-muted mx-auto mb-4 opacity-20" />
                <p className="text-muted font-bold">No scratch campaigns yet</p>
              </div>
            ) : scratchCards?.map((card, i) => (
              <motion.div 
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-3xl p-5 border border-border shadow-soft flex flex-col md:flex-row gap-4 relative overflow-hidden ${card.status !== 'active' ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <Zap size={14} className="text-amber-500" />
                    <h4 className="text-text font-black text-lg">{card.title}</h4>
                  </div>
                  <p className="text-muted text-sm font-medium mb-4 line-clamp-2">{card.description || t('common.no_description')}</p>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-3 py-1.5 rounded-xl border border-amber-200 uppercase">
                      {card.reward_type}
                    </span>
                    <span className="bg-surface text-text text-[10px] font-black px-3 py-1.5 rounded-xl border border-border uppercase">
                      {card.reward_type === 'package' ? (card.reward_metadata?.packageTitle || 'Package') : card.reward_value}
                    </span>
                    <span className="bg-surface text-text text-[10px] font-black px-3 py-1.5 rounded-xl border border-border uppercase">
                      {card.trigger_type}
                    </span>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-r border-border pt-4 md:pt-0 md:pr-6 min-w-[140px]">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => { setEditingScratch(card); setShowScratchForm(true) }}
                      className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-text border border-border hover:border-accent"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => toggleScratchStatusMutation.mutate(card)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        card.status === 'active' 
                          ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                          : 'bg-green-50 text-green-600 border border-green-100'
                      }`}
                    >
                      <Power size={18} />
                    </button>
                    <button
                      onClick={() => { if (confirm(t('offers.delete_confirm'))) deleteScratchMutation.mutate(card.id) }}
                      className="w-10 h-10 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>

      {/* Offer Form Modal */}
      <AnimatePresence>
        {showForm && (
          <OfferForm
            offer={editing}
            storeId={store.id}
            onSave={() => { setShowForm(false); queryClient.invalidateQueries(['offers']) }}
            onClose={() => setShowForm(false)}
          />
        )}
        {showScratchForm && (
          <ScratchForm
            card={editingScratch}
            storeId={store.id}
            packages={packages}
            onSave={() => { setShowScratchForm(false); queryClient.invalidateQueries(['scratch_cards']) }}
            onClose={() => setShowScratchForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ScratchForm({ card, storeId, packages, onSave, onClose }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    title: card?.title || '',
    description: card?.description || '',
    reward_type: card?.reward_type || 'points',
    reward_value: card?.reward_value || 100,
    reward_metadata: card?.reward_metadata || {},
    package_id: card?.package_id || '',
    trigger_type: card?.trigger_type || 'manual',
    surface_color: card?.surface_color || '#D4AF37',
    status: card?.status || 'active',
    valid_until: card?.valid_until ? card.valid_until.split('T')[0] : '',
  })

  const REWARD_TYPES = [
    { value: 'points', label: t('scratch_card.points') },
    { value: 'discount', label: t('scratch_card.discount') },
    { value: 'gift', label: t('scratch_card.gift') },
    { value: 'double_points', label: t('scratch_card.double_points') },
    { value: 'package', label: 'Package' },
  ]

  const TRIGGER_TYPES = [
    { value: 'manual', label: t('offers.always') },
    { value: 'birthday', label: t('campaigns.trigger_birthday') },
    { value: 'tier_upgrade', label: 'Tier Upgrade' },
    { value: 'welcome', label: t('campaigns.trigger_welcome') },
  ]

  const handleSave = async (e) => {
    e.preventDefault()
    const selectedPackage = form.reward_type === 'package' ? packages?.find(p => p.id === form.package_id) : null
    const payload = {
      ...form,
      store_id: storeId,
      reward_metadata: {
        ...(form.reward_metadata || {}),
        ...(selectedPackage ? { packageTitle: selectedPackage.title } : {})
      },
      package_id: form.reward_type === 'package' ? form.package_id : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    }

    if (card?.id) {
      const { error } = await supabase.from('scratch_cards').update(payload).eq('id', card.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('scratch_cards').insert(payload)
      if (error) throw error
    }
    onSave()
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
          <div className="text-right flex-1">
            <h3 className="text-lg font-black text-text tracking-tight">
              {card ? 'Edit Scratch Card' : 'New Scratch Card'}
            </h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted hover:text-text shadow-soft">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.offer_title')} *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right"
              placeholder="e.g., Surprise Birthday Gift!"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.description')}</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-medium focus:outline-none focus:border-accent resize-none text-right"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 relative text-right">
              <label className="text-xs font-black text-muted tracking-widest px-1">Reward Type *</label>
              <select
                required
                value={form.reward_type}
                onChange={e => setForm({ ...form, reward_type: e.target.value })}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none text-right"
              >
                {REWARD_TYPES.map(rt => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
            </div>

            {form.reward_type === 'package' ? (
              <div className="space-y-1.5 relative text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1">Select Package *</label>
                <select
                  required
                  value={form.package_id}
                  onChange={e => setForm({ ...form, package_id: e.target.value })}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none text-right"
                >
                  <option value="">Select a package</option>
                  {packages?.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
              </div>
            ) : (
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1">Reward Value *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.reward_value}
                  onChange={e => setForm({ ...form, reward_value: parseInt(e.target.value) })}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 relative text-right">
              <label className="text-xs font-black text-muted tracking-widest px-1">Trigger</label>
              <select
                value={form.trigger_type}
                onChange={e => setForm({ ...form, trigger_type: e.target.value })}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none text-right"
              >
                {TRIGGER_TYPES.map(tt => (
                  <option key={tt.value} value={tt.value}>{tt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-black text-muted tracking-widest px-1">Surface Color</label>
              <div className="flex items-center justify-end gap-3">
                <span className="text-muted text-xs font-bold">{form.surface_color}</span>
                <input
                  type="color"
                  value={form.surface_color}
                  onChange={e => setForm({ ...form, surface_color: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-transparent overflow-hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.valid_until')}</label>
            <input
              type="date"
              value={form.valid_until}
              onChange={e => setForm({ ...form, valid_until: e.target.value })}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl text-muted font-black text-sm hover:bg-surface transition-all"
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit"
              className="flex-[2] bg-accent text-white py-4 rounded-2xl font-black text-sm shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function OfferForm({ offer, storeId, onSave, onClose }) {
  const { t, i18n } = useTranslation()
  const { store } = useDashboardStore()
  const [form, setForm] = useState({
    title:            offer?.title            ?? '',
    description:      offer?.description      ?? '',
    type:             offer?.type             ?? 'discount',
    target_type:      offer?.target_type      ?? 'all',
    discount_percent: offer?.discount_percent ?? '',
    points_cost:      offer?.points_cost      ?? 0,
    min_tier:         offer?.min_tier         ?? 'bronze',
    occasion_type:    offer?.occasion_type    ?? 'always',
    occasion_date:    offer?.occasion_date    ?? '',
    valid_from:       offer?.valid_from       ?? '',
    valid_until:      offer?.valid_until      ?? '',
    usage_limit:      offer?.usage_limit      ?? '',
    is_active:        offer?.is_active        ?? true,
  })
  const [selectedProducts, setSelectedProducts] = useState([])

  const { data: products } = useQuery({
    queryKey: ['products', storeId],
    queryFn: () => supabase.from('products').select('*').eq('store_id', storeId).order('name').then(r => r.data ?? []),
    enabled: !!storeId
  })

  const { data: offerProducts } = useQuery({
    queryKey: ['offer_products', offer?.id],
    queryFn: () => supabase.from('offer_products').select('product_id').eq('offer_id', offer.id).then(r => r.data?.map(p => p.product_id) ?? []),
    enabled: !!offer?.id
  })

  useEffect(() => {
    if (offerProducts?.length) setSelectedProducts(offerProducts)
  }, [offerProducts])

  const [sendNotification, setSendNotification] = useState(true)

  const handleSave = async () => {
    if (!form.title) return
    const payload = {
      ...form,
      discount_percent: form.discount_percent || null,
      usage_limit:      form.usage_limit      || null,
      occasion_date:    form.occasion_date    || null,
      valid_from:       form.valid_from       || null,
      valid_until:      form.valid_until      || null,
    }
    let offerId = offer?.id
    let isNew = !offerId
    if (offerId) {
      await supabase.from('offers').update({ ...payload, updated_at: new Date() }).eq('id', offerId)
    } else {
      const { data, error } = await supabase.from('offers').insert({ ...payload, store_id: storeId }).select().single()
      if (error) throw error
      offerId = data.id
    }
    if (form.target_type === 'products' && selectedProducts.length) {
      await supabase.from('offer_products').delete().eq('offer_id', offerId)
      const inserts = selectedProducts.map(productId => ({ offer_id: offerId, product_id: productId }))
      await supabase.from('offer_products').insert(inserts)
    }

    // Send notification if it's a new offer and the option is enabled
    if (isNew && sendNotification) {
      try {
        let msg = `🎁 *عرض جديد: ${form.title}*\n\n${form.description || ''}`
        if (form.type === 'discount' && form.discount_percent) {
          msg += `\n\n🔥 خصم ${form.discount_percent}% لفترة محدودة!`
        }
        
        const { data: prods } = await supabase.from('products').select('*').in('id', selectedProducts)
        if (prods?.length) {
          msg += `\n\nالمنتجات المشمولة:\n`
          prods.forEach(p => {
            const discounted = calculateProductPrice(p, form)
            msg += `- ${p.name}: ${formatCurrency(discounted.price)}${form.type === 'discount' ? ` (بدلاً من ${formatCurrency(p.price)})` : ''}\n`
          })
        }

        await supabase.functions.invoke('send-notification', {
          body: {
            store_id: storeId,
            message: msg,
            target: 'tier',
            target_tier: form.min_tier,
            cta_url: `${window.location.origin}/offers/${offerId}`,
            image_url: prods?.[0]?.image_url || ''
          }
        })
      } catch (err) {
        console.error('Failed to send auto-notification:', err)
      }
    }

    onSave()
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
          <div className="text-right flex-1">
            <h3 className="text-lg font-black text-text tracking-tight">{offer ? t('offers.edit_offer') : t('offers.new_offer')}</h3>
            <p className="text-xs text-muted font-medium">{t('offers.offer_details')}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center text-muted hover:text-text transition-colors shadow-soft">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-right">
          {!offer && (
            <label className="flex items-center justify-end gap-3 p-4 bg-accent/5 border border-accent/20 rounded-2xl cursor-pointer">
              <div className="text-right">
                <p className="text-sm font-black text-accent">{t('offers.send_notification')}</p>
                <p className="text-[10px] text-accent/60 font-bold">{t('offers.send_notification_desc')}</p>
              </div>
              <input 
                type="checkbox" 
                checked={sendNotification}
                onChange={e => setSendNotification(e.target.checked)}
                className="w-5 h-5 accent-accent"
              />
            </label>
          )}
          <div className="space-y-4">
            <div className="space-y-1.5 text-right">
              <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.offer_title')}</label>
              <input 
                value={form.title} 
                onChange={e => setForm(f => ({...f, title: e.target.value}))}
                placeholder={t('offers.offer_title')}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.description')}</label>
              <textarea 
                value={form.description} 
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder={t('offers.description')}
                rows={2}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-medium focus:outline-none focus:border-accent transition-colors resize-none text-right"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 relative text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1 text-right">{t('offers.offer_type')}</label>
                <select 
                  value={form.type}
                  onChange={e => setForm(f => ({...f, type: e.target.value}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none transition-colors text-right"
                >
                  <option value="discount">{t('offers.discount')}</option>
                  <option value="gift">{t('offers.gift')}</option>
                  <option value="double_points">{t('offers.double_points')}</option>
                  <option value="flash">{t('offers.flash')}</option>
                  <option value="exclusive">{t('offers.exclusive')}</option>
                </select>
                <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
              </div>

              <div className="space-y-1.5 relative text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.apply_to')}</label>
                <select 
                  value={form.target_type}
                  onChange={e => setForm(f => ({...f, target_type: e.target.value}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none transition-colors text-right"
                >
                  <option value="all">{t('offers.all_products')}</option>
                  <option value="products">{t('offers.specific_products')}</option>
                </select>
                <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
              </div>
            </div>

            {form.target_type === 'products' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2 text-right"
              >
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.select_products')}</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-surface rounded-2xl border border-border">
                  {(products || []).map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 bg-white rounded-xl cursor-pointer hover:bg-accent/5">
                      <input 
                        type="checkbox"
                        checked={selectedProducts.includes(p.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedProducts(ps => [...ps, p.id])
                          } else {
                            setSelectedProducts(ps => ps.filter(id => id !== p.id))
                          }
                        }}
                        className="w-4 h-4 accent-accent"
                      />
                      <span className="text-xs font-medium truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            <div>
              {form.type === 'discount' ? (
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.discount_percent')}</label>
                  <input 
                    type="number"
                    value={form.discount_percent}
                    onChange={e => setForm(f => ({...f, discount_percent: e.target.value}))}
                    placeholder="0"
                    min={1}
                    max={100}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 opacity-50 pointer-events-none text-right">
                  <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.points_cost')}</label>
                  <div className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-muted font-bold text-right">{t('common.free')}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.points_cost')}</label>
                <input 
                  type="number"
                  value={form.points_cost}
                  onChange={e => setForm(f => ({...f, points_cost: Number(e.target.value)}))}
                  min={0}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
                />
              </div>
              <div className="space-y-1.5 relative text-right">
                <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.eligible_tier')}</label>
                <select 
                  value={form.min_tier}
                  onChange={e => setForm(f => ({...f, min_tier: e.target.value}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none transition-colors text-right"
                >
                  <option value="bronze">{t('offers.all_tiers')}</option>
                  <option value="silver">{t('offers.silver_plus')}</option>
                  <option value="gold">{t('offers.gold_plus')}</option>
                  <option value="platinum">{t('offers.platinum_only')}</option>
                </select>
                <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
              </div>
            </div>

            <div className="space-y-1.5 relative text-right">
              <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.occasion')}</label>
              <select 
                value={form.occasion_type}
                onChange={e => setForm(f => ({...f, occasion_type: e.target.value}))}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none transition-colors text-right"
              >
                <option value="always">{t('offers.always')}</option>
                <option value="fixed">{t('offers.fixed_date')}</option>
                <option value="birthday">{t('offers.customer_birthday')}</option>
                <option value="anniversary">{t('offers.customer_anniversary')}</option>
                <option value="win_back">{t('offers.win_back')}</option>
                <option value="flash">{t('offers.flash_sale')}</option>
              </select>
              <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
            </div>

            {(form.occasion_type === 'flash' || form.occasion_type === 'fixed') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-2 gap-4 text-right"
              >
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-black text-muted tracking-widest px-1">{t('offers.valid_until')}</label>
                  <input 
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({...f, valid_until: e.target.value}))}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold text-xs focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-black text-muted tracking-widest px-1 text-right">{t('offers.valid_from')}</label>
                  <input 
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={e => setForm(f => ({...f, valid_from: e.target.value}))}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold text-xs focus:outline-none focus:border-accent transition-colors text-right"
                  />
                </div>
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
            {offer ? t('offers.save_changes') : t('offers.add_offer')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}