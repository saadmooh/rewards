import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { subDays } from 'date-fns'

const PAGE_SIZE = 20

export default function Customers() {
  const { store } = useDashboardStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [page, setPage] = useState(0)

  const { data } = useQuery({
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

  const TIER_COLORS = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E8E8E8' }
  const isInactive = (m) => m.last_purchase && new Date(m.last_purchase) < subDays(new Date(), 60)

  return (
    <div className="page p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="page-header mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f0]">الزبائن ({data?.count ?? 0})</h1>
      </div>

      {/* Search and filters */}
      <div className="space-y-4 mb-6">
        <input 
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="بحث بالاسم..."
          className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#f0f0f0] placeholder-[#888888] focus:outline-none focus:border-[#D4AF37]"
        />
        
        <div className="flex flex-wrap gap-2">
          {['all','bronze','silver','gold','platinum'].map(t => (
            <button
              key={t}
              onClick={() => { setTierFilter(t); setPage(0) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                tierFilter === t
                  ? 'bg-[#D4AF37] text-black'
                  : 'bg-[#1e1e1e] text-[#888888] hover:text-[#f0f0f0] border border-[#2a2a2a]'
              }`}
            >
              {t === 'all' ? 'الكل' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="space-y-2">
        {data?.data?.map(m => (
          <div 
            key={m.id}
            onClick={() => navigate(`/dashboard/customers/${m.id}`)}
            className={`bg-[#1e1e1e] rounded-xl p-4 border border-[#2a2a2a] cursor-pointer hover:border-[#D4AF37] transition-colors ${
              isInactive(m) ? 'border-l-4 border-l-[#f59e0b]' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {m.users?.photo_url
                  ? <img src={m.users.photo_url} alt={m.users.full_name} className="w-12 h-12 rounded-full object-cover" />
                  : <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#888888]">
                      {m.users?.full_name?.[0] ?? '?'}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-[#f0f0f0] font-semibold truncate">{m.users?.full_name}</h4>
                  {isInactive(m) && (
                    <span className="bg-[#f59e0b] text-black text-xs px-2 py-0.5 rounded-full">غائب</span>
                  )}
                </div>
                <p className="text-[#888888] text-sm">@{m.users?.username ?? '—'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[#f0f0f0] font-bold" style={{ color: TIER_COLORS[m.tier] }}>
                  {m.tier}
                </p>
                <p className="text-[#D4AF37] text-sm font-medium">{(m.points ?? 0).toLocaleString()} نقطة</p>
                <p className="text-[#888888] text-xs">{(m.total_spent ?? 0).toLocaleString()} دج</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!data?.data?.length && (
        <div className="text-center py-12 text-[#888888]">
          لا توجد زبائن بعد
        </div>
      )}

      {/* Pagination */}
      {data?.count > PAGE_SIZE && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="bg-[#1e1e1e] text-[#f0f0f0] px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          <span className="text-[#888888] py-2">صفحة {page + 1}</span>
          <button
            disabled={(data?.count ?? 0) <= (page + 1) * PAGE_SIZE}
            onClick={() => setPage(p => p + 1)}
            className="bg-[#1e1e1e] text-[#f0f0f0] px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  )
}
