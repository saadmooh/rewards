// Notifications - Send promotional notifications to customers
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { subDays } from 'date-fns'
import { Send, Image, Link as LinkIcon, Users, ChevronDown, Package, Tag, Search } from 'lucide-react'
import { formatCurrency } from '../lib/offers'

export default function Notifications() {
  const { t } = useTranslation()
  const { store } = useDashboardStore()
  const [form, setForm] = useState({
    message:     '',
    image_url:   '',
    target:      'all',
    target_tier: 'gold',
    cta_url:     '',
  })
  const [sending, setSending] = useState(false)
  const [result,  setResult]  = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('products') // 'products' or 'offers'

  const { data: recipientCount } = useQuery({
    queryKey: ['notif-count', store?.id, form.target, form.target_tier],
    queryFn: async () => {
      let q = supabase
        .from('user_store_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', store.id)
      if (form.target === 'tier')
        q = q.eq('tier', form.target_tier)
      if (form.target === 'inactive')
        q = q.lt('last_purchase', subDays(new Date(), 60).toISOString())
      return q.then(r => r.count ?? 0)
    },
    enabled: !!store?.id
  })

  const { data: products } = useQuery({
    queryKey: ['notif-products', store?.id],
    queryFn: () => supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true).order('name').then(r => r.data ?? []),
    enabled: !!store?.id && filterType === 'products'
  })

  const { data: offers } = useQuery({
    queryKey: ['notif-offers', store?.id],
    queryFn: () => supabase.from('offers').select('*, offer_products(product_id, products(*))').eq('store_id', store.id).eq('is_active', true).order('created_at', { ascending: false }).then(r => r.data ?? []),
    enabled: !!store?.id && filterType === 'offers'
  })

  const selectProduct = (p) => {
    setForm(f => ({
      ...f,
      message: `🛍️ *${p.name}*\n\n${p.description || ''}\n\nالسعر: ${formatCurrency(p.price)}`,
      image_url: p.image_url || '',
      cta_url: `${window.location.origin}/products/${p.id}`
    }))
  }

  const selectOffer = (o) => {
    let msg = `🎁 *${o.title}*\n\n${o.description || ''}`
    
    if (o.type === 'discount' && o.discount_percent) {
      msg += `\n\n🔥 خصم ${o.discount_percent}%!`
    }
    
    if (o.offer_products?.length) {
      msg += `\n\nالمنتجات المشمولة:\n`
      o.offer_products.forEach(op => {
        msg += `- ${op.products.name}\n`
      })
    }

    setForm(f => ({
      ...f,
      message: msg,
      image_url: o.image_url || (o.offer_products?.[0]?.products?.image_url) || '',
      cta_url: `${window.location.origin}/offers/${o.id}`
    }))
  }

  const send = async () => {
    if (!form.message) return
    setSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: { store_id: store.id, ...form }
      })
      if (error) throw error
      setResult({ success: true, ...data })
    } catch (err) {
      setResult({ error: err.message })
    }
    setSending(false)
  }

  const filteredItems = (filterType === 'products' ? products : offers)?.filter(item => 
    (item.name || item.title).toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 px-4">
      <div className="text-right">
        <h1 className="text-2xl font-black text-text tracking-tight">{t('notifications.title')}</h1>
        <p className="text-sm text-muted font-medium">{t('notifications.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Selection Panel */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-soft flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-4 flex-row-reverse">
            <h2 className="text-lg font-black text-text">{t('notifications.select_item')}</h2>
            <div className="flex bg-surface p-1 rounded-xl">
              <button 
                onClick={() => setFilterType('products')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${filterType === 'products' ? 'bg-white shadow-sm text-accent' : 'text-muted'}`}
              >
                {t('notifications.products')}
              </button>
              <button 
                onClick={() => setFilterType('offers')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${filterType === 'offers' ? 'bg-white shadow-sm text-accent' : 'text-muted'}`}
              >
                {t('notifications.offers')}
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('notifications.search_placeholder')}
              className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-sm text-right pr-10"
            />
            <Search className="absolute right-3 top-2.5 text-muted" size={16} />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => filterType === 'products' ? selectProduct(item) : selectOffer(item)}
                className="w-full bg-surface hover:bg-white border border-border hover:border-accent p-3 rounded-2xl flex items-center gap-3 text-right transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-border overflow-hidden flex-shrink-0">
                  {(item.image_url || (item.offer_products?.[0]?.products?.image_url)) ? (
                    <img src={item.image_url || item.offer_products?.[0]?.products?.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      {filterType === 'products' ? <Package size={20} /> : <Tag size={20} />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-text truncate">{item.name || item.title}</h4>
                  <p className="text-[10px] text-muted font-bold truncate">
                    {filterType === 'products' ? formatCurrency(item.price) : item.type}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Panel */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-soft space-y-5 h-fit">
          {/* Message */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-muted tracking-widest px-1">{t('notifications.message')}</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({...f, message: e.target.value}))}
              placeholder={t('notifications.message_placeholder')}
              rows={6}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium placeholder-muted focus:outline-none focus:border-accent resize-none text-right"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-muted tracking-widest px-1 flex items-center justify-end gap-2">
              {t('notifications.image_url')}
              <Image size={14} />
            </label>
            <input
              value={form.image_url}
              onChange={e => setForm(f => ({...f, image_url: e.target.value}))}
              placeholder="https://..."
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium placeholder-muted focus:outline-none focus:border-accent text-right"
            />
          </div>

          {/* Target audience */}
          <div className="space-y-3 text-right">
            <label className="text-xs font-black text-muted tracking-widest px-1 flex items-center justify-end gap-2">
              {t('notifications.target_audience')}
              <Users size={14} />
            </label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'all',      label: t('notifications.all_members') },
                { value: 'tier',     label: t('notifications.specific_tier') },
                { value: 'inactive', label: t('notifications.inactive_60') },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center justify-end gap-3 cursor-pointer p-3 rounded-2xl border transition-all ${form.target === opt.value ? 'border-accent bg-accent/5' : 'border-border hover:border-accent hover:bg-surface'}`}>
                  <span className={`text-sm font-bold ${form.target === opt.value ? 'text-accent' : 'text-text'}`}>{opt.label}</span>
                  <input 
                    type="radio" 
                    value={opt.value}
                    checked={form.target === opt.value}
                    onChange={() => setForm(f => ({...f, target: opt.value}))}
                    className="accent-accent"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Tier selector */}
          {form.target === 'tier' && (
            <div className="space-y-2 text-right relative">
              <label className="text-xs font-black text-muted tracking-widest px-1">{t('notifications.select_tier')}</label>
              <select 
                value={form.target_tier}
                onChange={e => setForm(f => ({...f, target_tier: e.target.value}))}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent appearance-none text-right"
              >
                {['bronze','silver','gold','platinum'].map(t => (
                  <option key={t} value={t}>{t.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute left-4 bottom-4 text-muted pointer-events-none" size={16} />
            </div>
          )}

          {/* CTA URL */}
          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-muted tracking-widest px-1 flex items-center justify-end gap-2">
              {t('notifications.cta_url')}
              <LinkIcon size={14} />
            </label>
            <input
              value={form.cta_url}
              onChange={e => setForm(f => ({...f, cta_url: e.target.value}))}
              placeholder={t('notifications.cta_url_placeholder')}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium placeholder-muted focus:outline-none focus:border-accent text-right"
            />
          </div>

          {/* Summary */}
          <div className="bg-surface rounded-2xl p-4 text-center border border-border">
            <p className="text-muted text-sm font-medium">
              {t('notifications.recipients')}: <strong className="text-accent font-black">{recipientCount ?? '...'}</strong> {recipientCount === 1 ? t('notifications.member') : t('notifications.members')}
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-2xl p-4 text-right ${
              result.error ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-green-50 border border-green-100 text-green-600'
            }`}>
              {result.error 
                ? `${t('notifications.failed')}: ${result.error}`
                : `${t('notifications.success')} ${result.sent} ${t('notifications.members')}${result.failed ? ` (${result.failed} ${t('notifications.failed_count')})` : ''}`
              }
            </div>
          )}

          {/* Send button */}
          <button 
            className="w-full bg-accent text-white py-4 rounded-2xl font-black text-sm shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={send}
            disabled={!form.message || sending}
          >
            {sending ? (
              t('notifications.sending')
            ) : (
              <>
                <Send size={18} />
                {t('notifications.send_button')} {recipientCount ?? '...'} {recipientCount === 1 ? t('notifications.member') : t('notifications.members')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}