import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

const DEFAULT_PERMISSIONS = {
  can_access_dashboard: false,
  manage_products: false,
  manage_offers: false,
  manage_customers: false,
  view_stats: false,
  issue_points: false,
  redeem_points: false
}

export default function RolesManagement() {
  const queryClient = useQueryClient()
  const [editingRole, setEditingRole] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('roles').select('*').order('name')
      if (error) throw error
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (role) => {
      if (role.id) {
        const { error } = await supabase.from('roles').update(role).eq('id', role.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('roles').insert(role)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles'])
      setIsModalOpen(false)
      setEditingRole(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('roles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['roles'])
  })

  const handleEdit = (role) => {
    setEditingRole({ ...role, permissions: { ...DEFAULT_PERMISSIONS, ...role.permissions } })
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingRole({ name: '', slug: '', permissions: { ...DEFAULT_PERMISSIONS } })
    setIsModalOpen(true)
  }

  const togglePermission = (key) => {
    setEditingRole(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
    }))
  }

  if (isLoading) return <div className="p-6 text-center text-muted">Loading roles...</div>

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#f0f0f0]">إدارة الأدوار والصلاحيات</h2>
        <button
          onClick={handleAddNew}
          className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#c4a02e] transition-colors"
        >
          + دور جديد
        </button>
      </div>

      <div className="grid gap-4">
        {roles?.map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="text-[#f0f0f0] font-bold">{role.name}</h3>
              <p className="text-xs text-[#888888] font-mono">{role.slug}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(role.permissions || {})
                  .filter(([_, val]) => val)
                  .map(([key]) => (
                    <span key={key} className="text-[10px] bg-[#2a2a2a] text-[#D4AF37] px-2 py-0.5 rounded">
                      {key.replace(/_/g, ' ')}
                    </span>
                  ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(role)}
                className="p-2 text-[#888888] hover:text-[#D4AF37] transition-colors"
              >
                ✏️
              </button>
              {role.slug !== 'owner' && (
                <button
                  onClick={() => {
                    if (confirm('هل أنت متأكد من حذف هذا الدور؟')) deleteMutation.mutate(role.id)
                  }}
                  className="p-2 text-[#888888] hover:text-red-500 transition-colors"
                >
                  🗑️
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-[#f0f0f0] mb-4">
              {editingRole.id ? 'تعديل دور' : 'إضافة دور جديد'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#888888] mb-1">اسم الدور</label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#f0f0f0] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#888888] mb-1">المعرف (Slug)</label>
                <input
                  type="text"
                  value={editingRole.slug}
                  onChange={e => setEditingRole({ ...editingRole, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  disabled={!!editingRole.id}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-4 py-2 text-[#f0f0f0] focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                />
              </div>

              <div className="pt-4 border-t border-[#2a2a2a]">
                <h4 className="text-sm font-bold text-[#f0f0f0] mb-3">الصلاحيات</h4>
                <div className="space-y-2">
                  {Object.keys(DEFAULT_PERMISSIONS).map((key) => (
                    <div
                      key={key}
                      onClick={() => togglePermission(key)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                    >
                      <span className="text-sm text-[#f0f0f0]">{key.replace(/_/g, ' ')}</span>
                      <div className={`w-10 h-5 rounded-full transition-colors relative ${editingRole.permissions[key] ? 'bg-[#D4AF37]' : 'bg-[#2a2a2a]'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editingRole.permissions[key] ? 'right-1' : 'left-1'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-[#888888] font-bold hover:bg-[#2a2a2a] transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => saveMutation.mutate(editingRole)}
                  disabled={!editingRole.name || !editingRole.slug}
                  className="flex-1 bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-bold hover:bg-[#c4a02e] transition-colors disabled:opacity-50"
                >
                  حفظ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
