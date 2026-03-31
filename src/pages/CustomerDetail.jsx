// CustomerDetail - Individual customer view with transaction history
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function CustomerDetail() {
  const { memberId } = useParams()
  const { store } = useDashboardStore()
  const queryClient = useQueryClient()
  const [grantPts, setGrantPts] = useState('')
  const [grantNote, setGrantNote] = useState('')

  const { data: membership, refetch } = useQuery({
    queryKey: ['membership-detail', memberId],
    queryFn: () => supabase
      .from('user_store_memberships')
      .select('*, users(*), roles(*)')
      .eq('id', memberId)
      .single()
      .then(r => r.data),
    enabled: !!memberId
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => supabase.from('roles').select('*').order('name').then(r => r.data)
  })

  const updateRoleMutation = useMutation({
    mutationFn: async (roleId) => {
      const { error } = await supabase
        .from('user_store_memberships')
        .update({ role_id: roleId })
        .eq('id', memberId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membership-detail', memberId])
      alert('تم تحديث الدور بنجاح')
    }
  })

  const { data: txHistory } = useQuery({
    queryKey: ['tx-history', memberId, membership?.user_id],
    queryFn: () => supabase
      .from('transactions')
      .select('*')
      .eq('store_id', store.id)
      .eq('user_id', membership?.user_id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(r => r.data ?? []),
    enabled: !!store?.id && !!membership?.user_id
  })

  const { data: couponHistory } = useQuery({
    queryKey: ['coupons', memberId, membership?.user_id],
    queryFn: () => supabase
      .from('redemptions')
      .select('*, offers(title, discount_percent)')
      .eq('store_id', store.id)
      .eq('user_id', membership?.user_id)
      .order('created_at', { ascending: false })
      .then(r => r.data ?? []),
    enabled: !!store?.id && !!membership?.user_id
  })

  const handleGrant = async () => {
    const pts = Number(grantPts)
    if (!pts || pts <= 0 || !membership) return

    await supabase.from('transactions').insert({
      user_id:     membership.user_id,
      store_id:    store.id,
      type:        'adjust',
      points:      pts,
      description: grantNote || 'نقاط يدوية من التاجر',
    })

    await supabase.from('user_store_memberships')
      .update({ points: membership.points + pts, updated_at: new Date() })
      .eq('id', memberId)

    setGrantPts('')
    setGrantNote('')
    refetch()
  }

  if (!membership) return (
    <div className="p-4 text-center text-[#888888]">جاري التحميل...</div>
  )

  const u = membership.users
  const TIER_COLORS = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E8E8E8' }

  return (
    <div className="page p-4 lg:p-6 max-w-3xl mx-auto pb-24">
      {/* Customer card */}
      <div className="bg-[#1e1e1e] rounded-xl p-6 border border-[#2a2a2a] mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            {u?.photo_url
              ? <img src={u.photo_url} alt={u.full_name} className="w-16 h-16 rounded-full object-cover" />
              : <div className="w-16 h-16 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#888888] text-xl">
                  {u?.full_name?.[0] ?? '?'}
                </div>
            }
            <div>
              <h2 className="text-xl font-bold text-[#f0f0f0]">{u?.full_name}</h2>
              <p className="text-[#888888]">@{u?.username ?? '—'}</p>
              <p className="text-lg font-bold" style={{ color: TIER_COLORS[membership.tier] }}>
                {membership.tier}
              </p>
            </div>
          </div>

          <div className="text-left">
            <label className="block text-[10px] text-[#888888] mb-1">الدور الحالي</label>
            <select
              value={membership.role_id || ''}
              onChange={(e) => updateRoleMutation.mutate(e.target.value)}
              className="bg-[#2a2a2a] text-[#f0f0f0] text-sm rounded-lg px-2 py-1 border border-[#3a3a3a] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="" disabled>اختر دوراً</option>
              {roles?.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#161616] rounded-lg p-3">
            <p className="text-[#888888] text-xs">النقاط</p>
            <p className="text-[#D4AF37] text-xl font-bold">{(membership?.points ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-[#161616] rounded-lg p-3">
            <p className="text-[#888888] text-xs">إجمالي الإنفاق</p>
            <p className="text-[#f0f0f0] text-xl font-bold">{(membership?.total_spent ?? 0).toLocaleString()} دج</p>
          </div>
          <div className="bg-[#161616] rounded-lg p-3">
            <p className="text-[#888888] text-xs">عدد الزيارات</p>
            <p className="text-[#f0f0f0] text-xl font-bold">{membership.visit_count ?? 0}</p>
          </div>
          <div className="bg-[#161616] rounded-lg p-3">
            <p className="text-[#888888] text-xs">آخر شراء</p>
            <p className="text-[#f0f0f0] text-sm">
              {membership.last_purchase 
                ? formatDistanceToNow(new Date(membership.last_purchase), { locale: ar })
                : 'لا يوجد'}
            </p>
          </div>
        </div>

        <p className="text-[#888888] text-sm">
          عضو منذ: {format(new Date(membership.joined_at), 'MMMM yyyy', { locale: ar })}
        </p>
      </div>

      {/* Grant points */}
      <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a] mb-6">
        <h3 className="text-[#f0f0f0] font-semibold mb-4">منح نقاط يدوياً</h3>
        <div className="flex gap-2">
          <input 
            type="number"
            value={grantPts}
            onChange={e => setGrantPts(e.target.value)}
            placeholder="عدد النقاط"
            className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#f0f0f0] placeholder-[#888888] focus:outline-none focus:border-[#D4AF37]"
          />
          <input 
            value={grantNote}
            onChange={e => setGrantNote(e.target.value)}
            placeholder="السبب"
            className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#f0f0f0] placeholder-[#888888] focus:outline-none focus:border-[#D4AF37]"
          />
          <button 
            onClick={handleGrant}
            disabled={!grantPts || Number(grantPts) <= 0}
            className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            منح
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a] mb-6">
        <h3 className="text-[#f0f0f0] font-semibold mb-4">سجل المعاملات</h3>
        <div className="space-y-2">
          {txHistory?.map(tx => (
            <div key={tx.id} className="flex justify-between items-center py-2 border-b border-[#2a2a2a] last:border-0">
              <div>
                <p className="text-[#f0f0f0] text-sm">{tx.description ?? tx.type}</p>
                <p className="text-[#888888] text-xs">
                  {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <p className={tx.points > 0 ? 'text-[#22c55e] font-medium' : 'text-[#ef4444] font-medium'}>
                {tx.points > 0 ? '+' : ''}{tx.points}
              </p>
            </div>
          ))}
          {!txHistory?.length && (
            <p className="text-[#888888] text-center py-4">لا توجد معاملات</p>
          )}
        </div>
      </div>

      {/* Coupons */}
      <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a]">
        <h3 className="text-[#f0f0f0] font-semibold mb-4">الكوبونات</h3>
        <div className="space-y-2">
          {couponHistory?.map(r => (
            <div key={r.id} className="flex justify-between items-center py-2 border-b border-[#2a2a2a] last:border-0">
              <div>
                <p className="text-[#f0f0f0] text-sm">{r.offers?.title}</p>
                <p className="text-[#888888] text-xs">
                  {format(new Date(r.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
              <p className="text-[#D4AF37] text-sm">{r.points_spent} نقطة</p>
            </div>
          ))}
          {!couponHistory?.length && (
            <p className="text-[#888888] text-center py-4">لا توجد كوبونات</p>
          )}
        </div>
      </div>
    </div>
  )
}