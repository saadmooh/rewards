// Overview - Main dashboard page with stats
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { subDays, format, startOfDay } from 'date-fns'
import { AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import StatCard from '../components/StatCard'

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
        { name: 'Silver',   value: counts.silver,   color: '#C0C0C0' },
        { name: 'Gold',     value: counts.gold,     color: '#FFD700' },
        { name: 'Platinum', value: counts.platinum, color: '#E8E8E8' },
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

  return (
    <div className="page p-4 lg:p-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="page-header mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#f0f0f0]">مرحباً، {store?.name}</h1>
          <p className="text-sm text-[#888888]">{format(new Date(), 'EEEE، d MMMM yyyy')}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => navigate('/dashboard/roles')}
            className="bg-[#2a2a2a] text-[#D4AF37] border border-[#3a3a3a] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#333] transition-colors flex items-center gap-2"
          >
            <span>🛡️</span>
            إدارة الصلاحيات
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="إجمالي الأعضاء" value={stats?.totalMembers?.toLocaleString() ?? '—'} icon="👥" />
        <StatCard label="عمليات اليوم"   value={stats?.todayCount ?? '—'} icon="📊" />
        <StatCard label="مبيعات الشهر"   value={`${(stats?.monthTotal ?? 0).toLocaleString()} دج`} icon="💰" />
        <StatCard label="عروض مستخدمة"  value={stats?.activeOffers ?? '—'} icon="🎁" />
      </div>

      {/* Chart */}
      <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a] mb-6">
        <h3 className="text-[#f0f0f0] font-semibold mb-4">المعاملات — آخر 14 يوم</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent, #D4AF37)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent, #D4AF37)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="transactions" 
              stroke="var(--accent, #D4AF37)" 
              fill="url(#areaGrad)" 
              strokeWidth={2} 
            />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888888' }} />
            <YAxis tick={{ fontSize: 11, fill: '#888888' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8 }}
              labelStyle={{ color: '#f0f0f0' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Tier distribution */}
        <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a]">
          <h3 className="text-[#f0f0f0] font-semibold mb-4">توزيع الفئات</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie 
                data={tierData} 
                dataKey="value" 
                cx="50%" 
                cy="50%" 
                outerRadius={60}
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {tierData?.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8 }}
                formatter={(v, n) => [v + ' عضو', n]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {tierData?.map(t => (
              <div key={t.name} className="flex items-center gap-1 text-xs text-[#888888]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}: {t.value}
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a]">
          <h3 className="text-[#f0f0f0] font-semibold mb-4">آخر العمليات</h3>
          <div className="space-y-3">
            {recentTx?.map(tx => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tx.users?.photo_url
                    ? <img src={tx.users.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    : <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#888888] text-xs">
                        {tx.users?.full_name?.[0] ?? '?'}
                      </div>
                  }
                  <span className="text-[#f0f0f0] text-sm">{tx.users?.full_name ?? 'غير معروف'}</span>
                </div>
                <div className="text-left">
                  <p className="text-[#22c55e] text-sm font-medium">+{tx.points} نقطة</p>
                  <p className="text-[#888888] text-xs">{(tx.amount ?? 0).toLocaleString()} دج</p>
                </div>
              </div>
            ))}
            {!recentTx?.length && (
              <p className="text-[#888888] text-center py-4">لا توجد عمليات بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Inactive customers warning */}
      {stats?.inactiveCount > 0 && (
        <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#f59e0b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-[#f0f0f0]">
              {stats.inactiveCount} زبون لم يشترِ منذ أكثر من 60 يوماً
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard/notifications')}
            className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c4a02e] transition-colors"
          >
            إرسال عرض "نفتقدك"
          </button>
        </div>
      )}
    </div>
  )
}
