import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import useUserStore from './store/userStore'
import { useDashboardStore } from './store/dashboardStore'
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
import ClientOffers from './pages/ClientOffers'
import ClientProducts from './pages/ClientProducts'
import History from './pages/History'
import Profile from './pages/Profile'
import Layout from './components/Layout'
import NoAccess from './pages/NoAccess'
import Overview from './pages/Overview'
import QRGenerator from './pages/QRGenerator'
import CustomersPage from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import RolesManagement from './pages/RolesManagement'
import TeamManagement from './pages/TeamManagement'
import Bookings from './pages/Bookings'
import ClientBookings from './pages/ClientBookings'
import ClaimPoints from './pages/ClaimPoints'
import ClaimSuccess from './pages/ClaimSuccess'
import AutomatedCampaigns from './pages/AutomatedCampaigns'
import ScratchCardPage from './pages/ScratchCardPage'

const queryClient = new QueryClient()

function DashboardGuard() {
  const { loading, hasAccess, init } = useDashboardStore()

  useEffect(() => { 
    init() 
  }, [init])

  if (loading) return <SplashScreen />
  if (!hasAccess) return <NoAccess />

  return <Outlet />
}

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, initUser, init } = useUserStore()

  useEffect(() => {
    const setup = async () => {
      try {
        await init()
      } catch (err) {
        console.error('Database init failed:', err)
      }
      initTelegram()
      const tgUser = getTelegramUser()
      if (tgUser) {
        initUser(tgUser.id, tgUser)
      } else {
        initUser(123456789, {
          username: 'demo_user',
          first_name: 'Ahmed',
          last_name: 'Benali',
        })
      }
    }
    setup()
  }, [init, initUser])

  if (loading) return <SplashScreen />

  const isDashboard = location.pathname.startsWith('/dashboard')
  const showBottomNav = user?.full_name && location.pathname !== '/scan' && !isDashboard

  return (
    <div className="app-container min-h-screen bg-surface">
      <AnimatePresence mode="wait">
        <motion.div
          key={isDashboard ? 'dashboard' : 'app'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Routes>
            {/* Customer App Routes */}
            <Route path="/" element={
              <motion.div 
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pb-24"
              >
                {!user?.full_name ? <Onboarding /> : <Home />}
              </motion.div>
            } />
            <Route path="/scan" element={<Scanner />} />
            <Route path="/offers" element={<ClientOffers />} />
            <Route path="/offers/:id" element={<OfferDetail />} />
            <Route path="/products" element={<ClientProducts />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/my-bookings" element={<ClientBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/claim/:storeSlug" element={<ClaimPoints />} />
            <Route path="/claim-success" element={<ClaimSuccess />} />
            <Route path="/scratch" element={<ScratchCardPage />} />

            {/* Merchant Dashboard Routes (Guarded) */}
            <Route path="/dashboard" element={<DashboardGuard />}>
              <Route element={<Layout />}>
                <Route index element={<Overview />} />
                <Route path="overview" element={<Overview />} />
                <Route path="qr" element={<QRGenerator />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="products" element={<Products />} />
                <Route path="offers" element={<Offers />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/:memberId" element={<CustomerDetail />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="automated-campaigns" element={<AutomatedCampaigns />} />
                <Route path="settings" element={<Settings />} />
                <Route path="roles" element={<RolesManagement />} />
              </Route>
            </Route>

            <Route path="*" element={<Home />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      
      {showBottomNav && <BottomNav activePath={location.pathname} onNavigate={navigate} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/rewards">
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </BrowserRouter>
  )
}
