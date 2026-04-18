import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function OfferPackagesSection({ storeId }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

  const { data: packages, isLoading } = useQuery({
    queryKey: ['offer_packages', storeId],
    queryFn: () => supabase.from('offer_packages').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).then(r => r.data ?? []),
    enabled: !!storeId
  })

  const [form, setForm] = useState({ title: '', description: '', icon: '🎁', reward_type: 'points', reward_value: 100, min_wait_hours: 0, status: 'active', valid_until: '' })

  const handleSave = async () => {
    if (!form.title || !storeId) return
    const payload = { ...form, store_id: storeId, valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null }
    if (editing) {
      await supabase.from('offer_packages').update({ ...payload, updated_at: new Date() }).eq('id', editing.id)
    } else {
      await supabase.from('offer_packages').insert(payload)
    }
    queryClient.invalidateQueries(['offer_packages'])
    setShowForm(false)
    setEditing(null)
    setForm({ title: '', description: '', icon: '🎁', reward_type: 'points', reward_value: 100, min_wait_hours: 0, status: 'active', valid_until: '' })
  }

  const toggleStatus = async (pkg) => {
    const newStatus = pkg.status === 'active' ? 'paused' : 'active'
    await supabase.from('offer_packages').update({ status: newStatus }).eq('id', pkg.id)
    queryClient.invalidateQueries(['offer_packages'])
  }

  const deletePackage = async (id) => {
    if (confirm(t('offers.delete_confirm'))) {
      await supabase.from('offer_packages').delete().eq('id', id)
      queryClient.invalidateQueries(['offer_packages'])
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-accent text-white rounded-xl font-bold">{t('offers.add_offer_btn')}</button>
      </div>
      {isLoading ? <div className="h-32 bg-white rounded-3xl border border-border animate-pulse" /> : packages?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-border"><Gift className="w-12 h-12 text-muted mx-auto mb-3" /><p className="text-muted font-medium">No packages yet</p></div>
      ) : packages?.map(pkg => (
        <motion.div key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-5 border border-border">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{pkg.icon}</span>
            <div className="flex-1"><h4 className="font-black text-lg">{pkg.title}</h4><p className="text-sm text-muted">{pkg.reward_type}: {pkg.reward_value}</p>{pkg.min_wait_hours > 0 && <p className="text-xs text-amber-600">Wait: {pkg.min_wait_hours}h</p>}</div>
            <div className="flex gap-2">
              <button onClick={() => toggleStatus(pkg)} className={`px-3 py-1 rounded-lg text-sm ${pkg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{pkg.status}</button>
              <button onClick={() => { setEditing(pkg); setForm(pkg); setShowForm(true) }} className="p-2 border rounded-lg">✏️</button>
              <button onClick={() => deletePackage(pkg.id)} className="p-2 border border-red-200 rounded-lg text-red-500">🗑️</button>
            </div>
          </div>
        </motion.div>
      ))}
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black mb-4">{editing ? 'Edit Package' : 'New Package'}</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-3 border rounded-xl" />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-3 border rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.reward_type} onChange={e => setForm({ ...form, reward_type: e.target.value })} className="p-3 border rounded-xl">
                  <option value="points">Points</option><option value="discount">Discount</option><option value="gift">Gift</option><option value="double_points">Double Points</option>
                </select>
                <input type="number" placeholder="Value" value={form.reward_value} onChange={e => setForm({ ...form, reward_value: parseInt(e.target.value) || 0 })} className="p-3 border rounded-xl" />
              </div>
              <input type="number" placeholder="Wait hours (0 = instant)" value={form.min_wait_hours} onChange={e => setForm({ ...form, min_wait_hours: parseInt(e.target.value) || 0 })} className="w-full p-3 border rounded-xl" />
              <button onClick={handleSave} className="w-full py-3 bg-accent text-white rounded-xl font-bold">{t('common.save')}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}