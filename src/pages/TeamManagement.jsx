import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useDashboardStore } from '../store/dashboardStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Users, Shield, ShieldCheck, User, ChevronDown, Check, Loader2 } from 'lucide-react'

export default function TeamManagement() {
  const { store, membership: currentUserMembership } = useDashboardStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: ['team-members', store?.id, search, roleFilter],
    queryFn: async () => {
      let q = supabase
        .from('user_store_memberships')
        .select(`
          id,
          role_id,
          joined_at,
          users (id, full_name, username, photo_url, telegram_id),
          roles (*)
        `)
        .eq('store_id', store.id)
        .order('joined_at', { ascending: false })

      const { data, error } = await q
      if (error) throw error

      let filtered = data
      if (search) {
        filtered = filtered.filter(m => 
          m.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          m.users?.username?.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (roleFilter !== 'all') {
        filtered = filtered.filter(m => m.roles?.slug === roleFilter)
      }

      return filtered
    },
    enabled: !!store?.id
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => supabase.from('roles').select('*').order('name').then(r => r.data ?? [])
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, roleId }) => {
      const { error } = await supabase
        .from('user_store_memberships')
        .update({ role_id: roleId })
        .eq('id', membershipId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members'])
    }
  })

  const canManageRoles = currentUserMembership?.permissions?.manage_roles === true || currentUserMembership?.role === 'owner'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-black text-text tracking-tight">إدارة فريق العمل</h1>
          <p className="text-sm text-muted font-medium">تعديل أدوار المستخدمين ومنح الصلاحيات</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-border shadow-soft flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="البحث بالاسم أو اسم المستخدم..."
            className="w-full bg-surface border border-border rounded-2xl pr-12 pl-4 py-3 text-text font-medium placeholder-muted focus:outline-none focus:border-accent transition-colors text-right"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['all', 'owner', 'manager', 'cashier', 'client'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-accent text-white shadow-soft'
                  : 'bg-surface text-muted border border-border hover:bg-white'
              }`}
            >
              {r === 'all' ? 'الكل' : r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-[24px] md:rounded-3xl border border-border shadow-soft overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="block md:hidden divide-y divide-border">
          {isMembersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-3">
                <div className="flex items-center gap-3 justify-end">
                  <div className="h-4 w-24 bg-surface rounded" />
                  <div className="h-10 w-10 bg-surface rounded-xl" />
                </div>
                <div className="h-8 w-full bg-surface rounded-xl" />
              </div>
            ))
          ) : members?.map((m) => (
            <div key={m.id} className="p-4 space-y-4">
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <p className="text-sm font-bold text-text">{m.users?.full_name}</p>
                  <p className="text-[10px] text-muted font-medium">@{m.users?.username ?? '—'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-surface border border-border overflow-hidden flex-shrink-0">
                  {m.users?.photo_url ? (
                    <img src={m.users.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted">
                      <User size={18} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex-1">
                  {canManageRoles && m.roles?.slug !== 'owner' ? (
                    <div className="relative group">
                      <select
                        value={m.role_id || ''}
                        disabled={updateRoleMutation.isPending && updateRoleMutation.variables?.membershipId === m.id}
                        onChange={(e) => updateRoleMutation.mutate({ membershipId: m.id, roleId: e.target.value })}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-xs font-bold text-text focus:outline-none focus:border-accent appearance-none cursor-pointer"
                      >
                        <option value="">بدون دور</option>
                        {roles?.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                        {updateRoleMutation.isPending && updateRoleMutation.variables?.membershipId === m.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-2 w-fit ${
                      m.roles?.slug === 'owner' 
                        ? 'bg-accent text-white border-accent' 
                        : 'bg-surface text-text border-border'
                    }`}>
                      {m.roles?.slug === 'owner' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {m.roles?.name || 'Client'}
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-medium text-muted">انضم {new Date(m.joined_at).toLocaleDateString('ar-DZ')}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">المستخدم</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest">تاريخ الانضمام</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted uppercase tracking-widest text-left">الدور الحالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members?.map((m) => (
                <tr key={m.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <div className="text-right">
                        <p className="text-sm font-bold text-text">{m.users?.full_name}</p>
                        <p className="text-[10px] text-muted font-medium">@{m.users?.username ?? '—'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-surface border border-border overflow-hidden flex-shrink-0">
                        {m.users?.photo_url ? (
                          <img src={m.users.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted">
                            <User size={18} />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-muted">
                    {new Date(m.joined_at).toLocaleDateString('ar-DZ')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-start">
                      {canManageRoles && m.roles?.slug !== 'owner' ? (
                        <div className="relative group min-w-[140px]">
                          <select
                            value={m.role_id || ''}
                            disabled={updateRoleMutation.isPending && updateRoleMutation.variables?.membershipId === m.id}
                            onChange={(e) => updateRoleMutation.mutate({ membershipId: m.id, roleId: e.target.value })}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-xs font-bold text-text focus:outline-none focus:border-accent appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="">بدون دور</option>
                            {roles?.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                            {updateRoleMutation.isPending && updateRoleMutation.variables?.membershipId === m.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                          m.roles?.slug === 'owner' 
                            ? 'bg-accent text-white border-accent' 
                            : 'bg-surface text-text border-border'
                        }`}>
                          {m.roles?.slug === 'owner' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                          {m.roles?.name || 'Client'}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isMembersLoading && !members?.length && (
          <div className="text-center py-20">
            <Users size={48} className="text-muted opacity-20 mx-auto mb-4" />
            <p className="text-muted font-bold">لم يتم العثور على مستخدمين</p>
          </div>
        )}
      </div>

      <div className="bg-accent/5 border border-accent/10 rounded-3xl p-6">
        <div className="flex items-start gap-4 justify-end text-right">
          <div>
            <h4 className="text-accent-dark font-black text-sm mb-1">تنبيه الصلاحيات</h4>
            <p className="text-accent-dark/70 text-xs font-medium leading-relaxed">
              تغيير دور المستخدم سيؤثر فوراً على قدرته على الوصول إلى لوحة التحكم واستخدام المميزات الإدارية. 
              تأكد من مراجعة صلاحيات كل دور في صفحة "إدارة الأدوار".
            </p>
          </div>
          <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-soft">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>
    </div>
  )
}
