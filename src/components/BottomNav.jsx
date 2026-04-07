import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'

const navItems = [
  { icon: '🏠', label: 'الرئيسية', path: '/' },
  { icon: '📷', label: '', path: '/scan', isScan: true },
  { icon: '🎁', label: 'العروض', path: '/offers' },
  { icon: '👗', label: 'المنتجات', path: '/products' },
  { icon: '📊', label: 'لوحة التحكم', path: '/dashboard', isDashboard: true },
  { icon: '👤', label: 'الملف الشخصي', path: '/profile' },
]

export default function BottomNav({ activePath = '/', onNavigate }) {
  const { membership } = useUserStore()

  const handleNav = (path) => {
    if (path && onNavigate) {
      onNavigate(path)
    }
  }

  // Filter items based on permissions
  const visibleItems = navItems.filter(item => {
    if (item.isDashboard) {
      // Check for permission in the nested roles object
      return membership?.roles?.permissions?.can_access_dashboard === true
    }
    return true
  })

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-border z-50"
    >
      <div className="flex justify-around items-center max-w-md mx-auto px-2 py-3">
        {visibleItems.map((item) => {
          const isActive = activePath === item.path
          const isScan = item.isScan

          return (
            <div
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`flex flex-col items-center cursor-pointer ${
                isScan ? 'w-14' : item.isDashboard ? 'flex-[1.3]' : 'flex-1'
              }`}
            >
              {isScan ? (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 -mt-6 rounded-2xl bg-accent flex items-center justify-center shadow-lg"
                >
                  <span className="text-2xl">📷</span>
                </motion.div>
              ) : (
                <>
                  <span className={`text-xl ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-accent' : 'text-muted'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
