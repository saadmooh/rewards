import useUserStore from '../store/userStore'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Home, Tag, QrCode, Sparkles, User, LayoutDashboard } from 'lucide-react'
import { motion as Motion } from 'framer-motion'

export default function BottomNav({ activePath = '/', onNavigate }) {
  const { user, store, membership } = useUserStore()
  const { t } = useTranslation()

  // Fetch count of unrevealed scratch cards
  const { data: scratchCount = 0 } = useQuery({
    queryKey: ['scratch-count', user?.id, store?.id],
    queryFn: async () => {
      if (!user?.id || !store?.id) return 0
      const { count, error } = await supabase
        .from('scratch_card_claims')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('store_id', store.id)
        .eq('is_revealed', false)
      if (error) return 0
      return count || 0
    },
    enabled: !!user?.id && !!store?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const navItems = [
    { icon: Home, label: t('common.home'), path: '/' },
    { icon: Tag, label: t('common.offers'), path: '/offers' },
    { icon: QrCode, label: t('nav.scan'), path: '/scan', isScan: true },
    { icon: Sparkles, label: t('nav.scratch'), path: '/scratch', badge: scratchCount },
    { icon: User, label: t('common.profile'), path: '/profile' },
  ]

  // Add Dashboard if user has access
  if (membership?.roles?.permissions?.can_access_dashboard) {
    navItems.splice(4, 0, { icon: LayoutDashboard, label: 'Dash', path: '/dashboard' })
  }

  const handleNav = (path) => {
    if (path && onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <Motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-border z-50 pb-safe"
    >
      <div className="flex justify-around items-end max-w-lg mx-auto px-2 py-2">
        {navItems.map((item) => {
          const isActive = activePath === item.path
          const isScan = item.isScan

          return (
            <div
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`flex flex-col items-center cursor-pointer flex-1 py-1 transition-all ${
                isActive ? 'text-accent' : 'text-muted'
              }`}
            >
              {isScan ? (
                <div className="flex flex-col items-center -mt-8 mb-1">
                  <Motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30 text-white"
                  >
                    <item.icon size={28} strokeWidth={2.5} />
                  </Motion.div>
                  <span className="text-[10px] mt-1 font-black uppercase tracking-tighter">
                    {item.label}
                  </span>
                </div>
              ) : (
                <>
                  <Motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`p-1 relative ${isActive ? 'bg-accent/10 rounded-xl' : ''}`}
                  >
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                        {item.badge}
                      </span>
                    )}
                  </Motion.div>
                  <span className={`text-[10px] mt-1 font-black uppercase tracking-tighter ${isActive ? 'text-accent' : 'text-muted'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </Motion.div>
  )
}
