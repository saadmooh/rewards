// CustomerDetail - Individual customer view with transaction history
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Shield, Gift, CreditCard, Tag, ChevronDown, Loader2, CheckCircle2 } from 'lucide-react'

export default function CustomerDetail() {
  const { memberId } = useParams()
  const { store, membership: userMembership } = useDashboardStore()
  const queryClient = useQueryClient()
  const [grantPts, setGrantPts] = useState('')
  const [grantNote, setGrantNote] = useState('')

  const canManageRoles = userMembership?.permissions?.manage_roles === true || userMembership?.role === 'owner'

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
    <div className="p-4 text-center text-muted">جاري التحميل...</div>
  )

  const u = membership.users
  const TIER_COLORS = { 
    bronze: 'text-[#CD7F32] bg-[#CD7F3210]', 
    silver: 'text-[#64748b] bg-[#64748b10]', 
    gold: 'text-[#D4AF37] bg-[#D4AF3710]', 
    platinum: 'text-[#1e293b] bg-[#1e293b10]' 
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-24">
      {/* Customer card */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-soft">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div className="flex items-center gap-4">
            {u?.photo_url
              ? <img src={u.photo_url} alt={u.full_name} className="w-16 h-16 rounded-2xl object-cover" />
              : <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-muted text-xl font-bold">
                  {u?.full_name?.[0] ?? '?'}
                </div>
            }
            <div className="text-right">
              <h2 className="text-xl font-black text-text">{u?.full_name}</h2>
              <p className="text-muted text-sm font-medium">@{u?.username ?? '—'}</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-black uppercase ${TIER_COLORS[membership.tier] || 'bg-surface text-muted'}`}>
                {membership.tier}
              </span>
            </div>
          </div>

          {canManageRoles && (
            <div className="text-right min-w-[160px]">
              <label className="block text-[10px] font-black text-muted tracking-widest mb-2 uppercase">تعديل دور المستخدم</label>
              <div className="relative">
                <select
                  value={membership.role_id || ''}
                  disabled={updateRoleMutation.isPending}
                  onChange={(e) => updateRoleMutation.mutate(e.target.value)}
                  className={`w-full bg-surface border rounded-2xl px-4 py-3 text-text font-bold text-sm focus:outline-none appearance-none transition-all ${
                    updateRoleMutation.isPending ? 'border-accent opacity-50' : 'border-border focus:border-accent'
                  }`}
                >
                  <option value="">بدون دور (Client)</option>
                  {roles?.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  {updateRoleMutation.isPending ? (
                    <Loader2 size={16} className="text-accent animate-spin" />
                  ) : updateRoleMutation.isSuccess ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <ChevronDown size={16} className="text-muted" />
                  )}
                </div>
              </div>
              {updateRoleMutation.isSuccess && (
                <p className="text-[10px] text-green-600 font-bold mt-1 animate-pulse">تم تحديث الدور بنجاح</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} className="text-accent" />
              <p className="text-muted text-[10px] font-black uppercase tracking-widest">النقاط</p>
            </div>
            <p className="text-2xl font-black text-accent">{(membership?.points ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} className="text-muted" />
              <p className="text-muted text-[10px] font-black uppercase tracking-widest">الإنفاق</p>
            </div>
            <p className="text-2xl font-black text-text">{(membership?.total_spent ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-muted font-bold">دج</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Tag size={16} className="text-muted" />
              <p className="text-muted text-[10px] font-black uppercase tracking-widest">الزيارات</p>
            </div>
            <p className="text-2xl font-black text-text">{membership.visit_count ?? 0}</p>
          </div>
          <div className="bg-surface rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-muted" />
              <p className="text-muted text-[10px] font-black uppercase tracking-widest">آخر شراء</p>
            </div>
            <p className="text-lg font-black text-text">
              {membership.last_purchase 
                ? formatDistanceToNow(new Date(membership.last_purchase), { locale: ar })
                : '—'}
            </p>
          </div>
        </div>

        <p className="text-muted text-sm font-medium mt-4 text-right">
          عضو منذ: {format(new Date(membership.joined_at), 'MMMM yyyy', { locale: ar })}
        </p>
      </div>

      {/* Grant points */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-soft">
        <h3 className="text-lg font-black text-text tracking-tight mb-4 text-right">منح نقاط يدوياً</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <input 
              type="number"
              value={grantPts}
              onChange={e => setGrantPts(e.target.value)}
              placeholder="عدد النقاط"
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right"
            />
            <input 
              value={grantNote}
              onChange={e => setGrantNote(e.target.value)}
              placeholder="السبب (اختياري)"
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-medium focus:outline-none focus:border-accent text-right"
            />
          </div>
          <button 
            onClick={handleGrant}
            disabled={!grantPts || Number(grantPts) <= 0}
            className="bg-accent text-white px-8 py-3 rounded-2xl font-black text-sm shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            منح النقاط
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-soft">
        <h3 className="text-lg font-black text-text tracking-tight mb-4 text-right">سجل المعاملات</h3>
        <div className="space-y-3">
          {txHistory?.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-3 rounded-2xl bg-surface border border-border">
              <div className="text-right">
                <p className="text-text text-sm font-bold">{tx.description ?? tx.type}</p>
                <p className="text-muted text-[10px] font-medium">
                  {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <p className={`text-lg font-black ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.points > 0 ? '+' : ''}{tx.points}
              </p>
            </div>
          ))}
          {!txHistory?.length && (
            <div className="text-center py-8">
              <CreditCard size={32} className="text-muted opacity-20 mx-auto mb-2" />
              <p className="text-muted text-sm font-medium">لا توجد معاملات</p>
            </div>
          )}
        </div>
      </div>

      {/* Coupons */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-soft">
        <h3 className="text-lg font-black text-text tracking-tight mb-4 text-right">الكوبونات المستخدمة</h3>
        <div className="space-y-3">
          {couponHistory?.map(r => (
            <div key={r.id} className="flex justify-between items-center p-3 rounded-2xl bg-surface border border-border">
              <div className="text-right">
                <p className="text-text text-sm font-bold">{r.offers?.title}</p>
                <p className="text-muted text-[10px] font-medium">
                  {format(new Date(r.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
              <p className="text-accent text-sm font-black">{r.points_spent} نقطة</p>
            </div>
          ))}
          {!couponHistory?.length && (
            <div className="text-center py-8">
              <Tag size={32} className="text-muted opacity-20 mx-auto mb-2" />
              <p className="text-muted text-sm font-medium">لا توجد كوبونات</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
