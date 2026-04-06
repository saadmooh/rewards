// Overview - Main dashboard page with stats
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { subDays, format, startOfDay } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'
import { Shield, AlertTriangle, ArrowRight } from 'lucide-react'

export default function Overview() {
  const { store, membership } = useDashboardStore()
  const navigate = useNavigate()
  const isOwner = membership?.role === 'owner'

  // Summary stats query
  const { data: stats } = useQuery({
    queryKey: ['overview-stats', store?.id],
    queryFn: async () => {
      if (!store?.id) return null
      
      const today = startOfDay(new Date())
      const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

      const [totalMembers, todayTx, monthTx, activeOffers, inactiveCount] = await Promise.all([
        supabase.from('user_store_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id),
          
        supabase.from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('type', 'earn')
          .gte('created_at', today.toISOString()),

        supabase.from('transactions')
          .select('amount')
          .eq('store_id', store.id)
          .eq('type', 'earn')
          .gte('created_at', thisMonth.toISOString()),

        supabase.from('redemptions')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .gte('created_at', subDays(new Date(), 7).toISOString()),

        supabase.from('user_store_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .lt('last_purchase', subDays(new Date(), 60).toISOString()),
      ])

      const monthTotal = (monthTx.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)

      return {
        totalMembers: totalMembers.count ?? 0,
        todayCount:   todayTx.count ?? 0,
        monthTotal,
        activeOffers: activeOffers.count ?? 0,
        inactiveCount: inactiveCount.count ?? 0,
      }
    },
    enabled: !!store?.id,
    refetchInterval: 60_000
  })

  // Chart data - last 14 days
  const { data: chartData } = useQuery({
    queryKey: ['chart-14d', store?.id],
    queryFn: async () => {
      if (!store?.id) return []
      
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = subDays(new Date(), 13 - i)
        return { 
          date: format(d, 'MM/dd'), 
          from: startOfDay(d).toISOString(), 
          to: startOfDay(subDays(d, -1)).toISOString() 
        }
      })

      const results = await Promise.all(days.map(async day => {
        const { count } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', store.id)
          .eq('type', 'earn')
          .gte('created_at', day.from)
          .lt('created_at', day.to)
        return { date: day.date, transactions: count ?? 0 }
      }))

      return results
    },
    enabled: !!store?.id
  })

  // Tier distribution
  const { data: tierData } = useQuery({
    queryKey: ['tiers', store?.id],
    queryFn: async () => {
      if (!store?.id) return []
      
      const { data } = await supabase
        .from('user_store_memberships')
        .select('tier')
        .eq('store_id', store.id)

      const counts = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
      data?.forEach(m => { if (counts[m.tier] !== undefined) counts[m.tier]++ })
      
      return [
        { name: 'Bronze',   value: counts.bronze,   color: '#CD7F32' },
        { name: 'Silver',   value: counts.silver,   color: '#64748b' },
        { name: 'Gold',     value: counts.gold,     color: '#D4AF37' },
        { name: 'Platinum', value: counts.platinum, color: '#1e293b' },
      ]
    },
    enabled: !!store?.id
  })

  // Recent transactions
  const { data: recentTx } = useQuery({
    queryKey: ['recent-tx', store?.id],
    queryFn: () => supabase
      .from('transactions')
      .select('*, users(full_name, photo_url)')
      .eq('store_id', store.id)
      .eq('type', 'earn')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(r => r.data),
    enabled: !!store?.id
  })

  // Offer performance query
  const { data: offerPerformance } = useQuery({
    queryKey: ['offer-performance', store?.id],
    queryFn: async () => {
      if (!store?.id) return []
      
      const { data: offers } = await supabase
        .from('offers')
        .select('id, title')
        .eq('store_id', store.id)

      const { data: redemptions } = await supabase
        .from('redemptions')
        .select('offer_id')
        .eq('store_id', store.id)

      const counts = {}
      redemptions?.forEach(r => {
        counts[r.offer_id] = (counts[r.offer_id] || 0) + 1
      })

      return offers?.map(o => ({
        title: o.title,
        redemptions: counts[o.id] || 0
      })).sort((a, b) => b.redemptions - a.redemptions).slice(0, 5)
    },
    enabled: !!store?.id
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight">مرحباً، {store?.name}</h1>
          <p className="text-sm text-muted font-medium">{format(new Date(), 'EEEE، d MMMM yyyy')}</p>
        </div>
        
        {isOwner && (
          <button
            onClick={() => navigate('/dashboard/roles')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border rounded-2xl text-sm font-bold text-text shadow-soft hover:bg-surface transition-all active:scale-95"
          >
            <Shield size={18} className="text-accent" />
            إدارة الصلاحيات
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي الأعضاء" value={stats?.totalMembers?.toLocaleString() ?? '—'} icon="👥" />
        <StatCard label="عمليات اليوم"   value={stats?.todayCount ?? '—'} icon="📊" />
        <StatCard label="مبيعات الشهر"   value={`${(stats?.monthTotal ?? 0).toLocaleString()} دج`} icon="💰" />
        <StatCard label="عروض مستخدمة"  value={stats?.activeOffers ?? '—'} icon="🎁" />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-text tracking-tight">المعاملات — آخر 14 يوم</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-muted bg-surface px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            تحديث تلقائي
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent, #10b981)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent, #10b981)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="transactions" 
              stroke="var(--accent, #10b981)" 
              fill="url(#areaGrad)" 
              strokeWidth={3} 
              dot={{ r: 4, fill: 'var(--accent, #10b981)', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
            <YAxis hide={true} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: 16, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px', display: 'block' }}
              itemStyle={{ color: 'var(--accent, #10b981)', fontWeight: 800, padding: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tier distribution */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-soft lg:col-span-1 text-center">
          <h3 className="text-lg font-black text-text tracking-tight mb-6 text-right">توزيع الفئات</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie 
                  data={tierData} 
                  dataKey="value" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                >
                  {tierData?.map((entry, i) => <Cell key={i} fill={entry.color} cornerRadius={4} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {tierData?.map(t => (
              <div key={t.name} className="flex items-center justify-between text-xs font-bold text-muted">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </div>
                <span className="text-text">{t.value} عضو</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">آخر العمليات</h3>
            <button onClick={() => navigate('/dashboard/customers')} className="text-accent text-xs font-bold flex items-center gap-1 hover:underline">
              عرض الكل <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentTx?.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface transition-colors border border-transparent hover:border-border group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {tx.users?.photo_url
                      ? <img src={tx.users.photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      : <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-muted text-sm font-bold border border-border">
                          {tx.users?.full_name?.[0] ?? '?'}
                        </div>
                    }
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="text-right">
                    <p className="text-text text-sm font-bold">{tx.users?.full_name ?? 'زبون جديد'}</p>
                    <p className="text-muted text-[10px] font-medium">{format(new Date(tx.created_at), 'HH:mm')} • {tx.amount} دج</p>
                  </div>
                </div>
                <div className="text-left bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-black">
                  +{tx.points}
                </div>
              </div>
            ))}
            {!recentTx?.length && (
              <div className="text-center py-10">
                <p className="text-muted text-sm font-medium">لا توجد عمليات بعد</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inactive customers warning */}
      {stats?.inactiveCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 rounded-3xl p-5 border border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <AlertTriangle size={24} />
            </div>
            <div className="text-right">
              <p className="text-orange-900 font-bold">فرصة لإعادة التفاعل</p>
              <p className="text-orange-700 text-sm font-medium">
                {stats.inactiveCount} زبون لم يشتروا منذ أكثر من 60 يوماً. أرسل لهم عرضاً مخصصاً الآن!
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard/notifications')}
            className="bg-orange-600 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-soft hover:bg-orange-700 transition-all active:scale-95 whitespace-nowrap"
          >
            إرسال تنبيه
          </button>
        </motion.div>
      )}

      {/* Offer Performance */}
      <div className="bg-white rounded-3xl p-6 border border-border shadow-soft">
        <h3 className="text-lg font-black text-text tracking-tight mb-6">أداء العروض</h3>
        <div className="space-y-4">
          {offerPerformance?.map(o => (
            <div key={o.title} className="space-y-1">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-text">{o.title}</span>
                <span className="text-muted">{o.redemptions} استخدام</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, (o.redemptions / (stats?.activeOffers || 1)) * 100)}%` }}
                  className="h-full bg-accent"
                />
              </div>
            </div>
          ))}
          {!offerPerformance?.length && (
            <p className="text-center text-muted py-4 font-medium">لا توجد بيانات للعروض بعد</p>
          )}
        </div>
      </div>
    </div>
  )
}
