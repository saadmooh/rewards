import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useUserStore from './store/userStore'
import { initTelegram, getTelegramUser } from './lib/telegram'

import SplashScreen from './components/SplashScreen'
import BottomNav from './components/BottomNav'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import Offers from './pages/Offers'
import OfferDetail from './pages/OfferDetail'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import History from './pages/History'
import Profile from './pages/Profile'

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, initUser, init } = useUserStore()

  useEffect(() => {
    // Initialize database
    init()
    
    // Initialize Telegram
    initTelegram()
    const tgUser = getTelegramUser()
    
    if (tgUser) {
      initUser(tgUser.id, tgUser)
    } else {
      // Demo user for testing
      initUser(123456789, {
        username: 'demo_user',
        first_name: 'Ahmed',
        last_name: 'Benali',
      })
    }
  }, [init, initUser])

  if (loading) return <SplashScreen />

  const showBottomNav = user?.full_name && location.pathname !== '/scan'

  return (
    <div className="app-container min-h-screen bg-surface">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="pb-24"
        >
          <Routes>
            <Route path="/" element={!user?.full_name ? <Onboarding /> : <Home />} />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/offers/:id" element={<OfferDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      
      {showBottomNav && <BottomNav activePath={location.pathname} onNavigate={navigate} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
