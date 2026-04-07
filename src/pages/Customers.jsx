import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { subDays, format } from 'date-fns'
import { Search, Filter, User, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

const PAGE_SIZE = 20

export default function Customers() {
  const { store } = useDashboardStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['customers', store?.id, search, tierFilter, page],
    queryFn: async () => {
      let q = supabase
        .from('user_store_memberships')
        .select(`
          id, points, tier, total_spent, visit_count, last_purchase, joined_at,
          users (id, full_name, username, photo_url, telegram_id, birth_date)
        `, { count: 'exact' })
        .eq('store_id', store.id)
        .order('points', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (tierFilter !== 'all') q = q.eq('tier', tierFilter)
      if (search) q = q.ilike('users.full_name', `%${search}%`)

      return q
    },
    enabled: !!store?.id
  })

  const TIER_COLORS = { 
    bronze: 'text-[#CD7F32] bg-[#CD7F3210]', 
    silver: 'text-[#64748b] bg-[#64748b10]', 
    gold: 'text-[#D4AF37] bg-[#D4AF3710]', 
    platinum: 'text-[#1e293b] bg-[#1e293b10]' 
  }
  
  const isInactive = (m) => m.last_purchase && new Date(m.last_purchase) < subDays(new Date(), 60)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 md:pt-0">
        <div className="text-right">
          <h1 className="text-2xl font-black text-text tracking-tight">الزبائن</h1>
          <p className="text-sm text-muted font-medium">إجمالي {data?.count ?? 0} عضو مسجل</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-border shadow-soft space-y-4 text-right">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input 
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="البحث عن زبون بالاسم..."
            className="w-full bg-surface border border-border rounded-2xl pr-12 pl-4 py-3 text-text font-medium placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 justify-end">
          {['all','bronze','silver','gold','platinum'].map(t => (
            <button
              key={t}
              onClick={() => { setTierFilter(t); setPage(0) }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                tierFilter === t
                  ? 'bg-accent text-white shadow-soft shadow-accent/20'
                  : 'bg-surface text-muted hover:bg-white border border-border'
              }`}
            >
              {t === 'all' ? 'الكل' : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="grid gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-border animate-pulse" />
          ))
        ) : data?.data?.map((m, i) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/dashboard/customers/${m.id}`)}
            className={`bg-white rounded-2xl p-4 border border-border cursor-pointer hover:border-accent hover:shadow-soft transition-all group relative overflow-hidden`}
          >
            {isInactive(m) && (
              <div className="absolute top-0 right-0 w-1 h-full bg-orange-400" title="غير نشط" />
            )}
            
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                {m.users?.photo_url
                  ? <img src={m.users.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  : <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-muted">
                      <User size={24} />
                    </div>
                }
                <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${TIER_COLORS[m.tier] || 'bg-surface text-muted'}`}>
                  {m.tier}
                </div>
              </div>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-end gap-2">
                  {isInactive(m) && (
                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2 py-0.5 rounded-full">خامل</span>
                  )}
                  <h4 className="text-text font-bold truncate group-hover:text-accent transition-colors">{m.users?.full_name}</h4>
                </div>
                <p className="text-muted text-xs font-medium">
                  @{m.users?.username ?? '—'} • انضم {format(new Date(m.joined_at), 'MM/yyyy')}
                </p>
              </div>

              <div className="text-left flex-shrink-0 flex items-center gap-4">
                <div className="hidden sm:block">
                  <p className="text-accent text-sm font-black">{(m.points ?? 0).toLocaleString()} <span className="text-[10px]">نقطة</span></p>
                  <p className="text-muted text-[10px] font-bold">{(m.total_spent ?? 0).toLocaleString()} دج</p>
                </div>
                <ChevronRight className="text-muted group-hover:text-accent transition-colors" size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!isLoading && !data?.data?.length && (
        <div className="text-center py-20 bg-white rounded-3xl border border-border shadow-soft">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-muted opacity-20" />
          </div>
          <p className="text-muted font-bold">لم يتم العثور على زبائن</p>
        </div>
      )}

      {/* Pagination */}
      {data?.count > PAGE_SIZE && (
        <div className="flex justify-center items-center gap-6 mt-8">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-6 py-2 bg-white border border-border text-text font-bold rounded-xl disabled:opacity-30 transition-all hover:bg-surface"
          >
            السابق
          </button>
          <span className="text-muted font-black text-sm uppercase tracking-widest">صفحة {page + 1}</span>
          <button
            disabled={(data?.count ?? 0) <= (page + 1) * PAGE_SIZE}
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-white border border-border text-text font-bold rounded-xl disabled:opacity-30 transition-all hover:bg-surface"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  )
}
