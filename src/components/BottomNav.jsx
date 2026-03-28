import { motion } from 'framer-motion'
import useUserStore from '../store/userStore'

const navItems = [
  { icon: '🏠', label: 'Home', path: '/' },
  { icon: '📷', label: '', path: '/scan', isScan: true },
  { icon: '🎁', label: 'Offers', path: '/offers' },
  { icon: '👗', label: 'Products', path: '/products' },
  { icon: '👤', label: 'Profile', path: '/profile' },
]

export default function BottomNav({ activePath = '/', onNavigate }) {
  const { user } = useUserStore()

  const handleNav = (path) => {
    if (path && onNavigate) {
      onNavigate(path)
    }
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-border z-50"
    >
      <div className="flex justify-around items-center max-w-md mx-auto px-2 py-3">
        {navItems.map((item) => {
          const isActive = activePath === item.path
          const isScan = item.isScan

          return (
            <div
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`flex flex-col items-center cursor-pointer ${
                isScan ? 'w-14' : 'flex-1'
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
                  <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      isActive ? 'text-accent' : 'text-muted'
                    }`}
                  >
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
