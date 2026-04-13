// Layout - Unified with main app design
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, QrCode, Package,
  Tag, Users, Bell, Settings, ArrowLeft, Home, ShieldCheck
} from 'lucide-react'

export default function Layout() {
  const { t } = useTranslation()
  const { store, user } = useDashboardStore()
  const navigate = useNavigate()
  const location = useLocation()

  const NAV = [
    { to: '/dashboard/overview',       label: t('dashboard.home'),  icon: LayoutDashboard },
    { to: '/dashboard/qr',             label: t('dashboard.qr'),    icon: QrCode },
    { to: '/dashboard/products',       label: t('dashboard.products'),  icon: Package },
    { to: '/dashboard/offers',        label: t('dashboard.offers'),     icon: Tag },
    { to: '/dashboard/customers',      label: t('dashboard.customers'),   icon: Users },
    { to: '/dashboard/team',           label: t('dashboard.team'),      icon: ShieldCheck },
    { to: '/dashboard/notifications',  label: t('dashboard.notifications'), icon: Bell },
    { to: '/dashboard/settings',       label: t('dashboard.settings'),  icon: Settings },
  ]

  return (
    <div className="layout min-h-screen bg-surface font-display text-text">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-64 bg-white fixed inset-y-0 left-0 border-r border-border z-40">
        <div className="flex items-center gap-3 p-6 border-b border-border text-left">
          {store?.logo_url
            ? <img src={store.logo_url} alt={store.name} className="w-10 h-10 rounded-xl object-cover" />
            : <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-lg">
                {store?.name?.[0] ?? 'S'}
              </div>
          }
          <div className="overflow-hidden">
            <h1 className="text-text font-bold text-sm truncate">{store?.name}</h1>
            <p className="text-xs text-muted">{t('common.dashboard')}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-soft shadow-accent/20'
                    : 'text-muted hover:bg-surface hover:text-text'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted hover:bg-surface hover:text-text transition-all text-left"
          >
            <Home size={18} />
            <span>{t('dashboard.return_to_app')}</span>
          </button>
          
          <div className="flex items-center gap-3 p-2 bg-surface rounded-xl">
            {user?.photo_url
              ? <img src={user.photo_url} alt={user.full_name} className="w-8 h-8 rounded-lg object-cover" />
              : <div className="w-8 h-8 rounded-lg bg-white border border-border flex items-center justify-center text-muted text-xs font-bold">
                  {user?.full_name?.[0] ?? '?'}
                </div>
            }
            <div className="overflow-hidden text-left">
              <p className="text-text text-xs font-bold truncate">{user?.full_name}</p>
              <p className="text-muted text-[10px] truncate">@{user?.username ?? '—'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 pb-24">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-xl border-b border-border z-30 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-text border border-border transition-colors hover:bg-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center overflow-hidden flex-1 px-4">
            <h2 className="text-sm font-black text-text truncate uppercase tracking-tight">
              {NAV.find(n => n.to === location.pathname)?.label || t('common.dashboard')}
            </h2>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-text border border-border transition-colors hover:bg-white"
          >
            <Home size={20} />
          </button>
        </header>

        <main className="p-4 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </main>
      </div>

      {/* Bottom Tab Bar — mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-border z-50">
        <div className="flex justify-around items-center max-w-md mx-auto px-2 py-3">
          {NAV.slice(0, 7).map(item => {
            const isActive = location.pathname === item.to || (item.to === '/dashboard/overview' && location.pathname === '/dashboard')
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 flex-1 transition-all ${
                  isActive ? 'text-accent scale-110' : 'text-muted'
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
