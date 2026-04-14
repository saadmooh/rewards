// Settings - Store configuration page
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Store, Palette, Coins, BarChart, Check, Save, Phone, MapPin, Info, Bot, Send, AlertCircle, ExternalLink, Users, Shield, ShieldCheck, ChevronDown, Clock, Gift, Play, Languages } from 'lucide-react'

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { store, refreshStore } = useDashboardStore()
  const navigate = useNavigate()
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  const [form, setForm] = useState({
    name:                 store?.name ?? '',
    description:          store?.description ?? '',
    category:             store?.category ?? '',
    city:                 store?.city ?? '',
    phone:                store?.phone ?? '',
    primary_color:        store?.primary_color ?? '#10b981',
    points_rate:          store?.points_rate ?? 1,
    welcome_points:       store?.welcome_points ?? 100,
    tier_config:          store?.tier_config ?? { bronze: 0, silver: 10000, gold: 50000, platinum: 100000 },
    bot_token:            store?.bot_token ?? '',
    bot_username:         store?.bot_username ?? '',
    points_expiry_enabled: store?.points_expiry_enabled ?? false,
    points_expiry_months:  store?.points_expiry_months ?? 12,
    is_cod_enabled:       store?.is_cod_enabled ?? true,
    referral_reward_points: store?.referral_reward_points ?? 200,
  })
  const [saved, setSaved] = useState(false)
  const [testingBot, setTestingBot] = useState(false)
  const [botTestResult, setBotTestResult] = useState(null)
  const [runningBirthdayBot, setRunningBirthdayBot] = useState(false)
  const [birthdayBotResult, setBirthdayBotResult] = useState(null)

  const handleSave = async () => {
    document.documentElement.style.setProperty('--accent', form.primary_color)
    await supabase.from('stores').update({ ...form, updated_at: new Date() }).eq('id', store.id)
    await refreshStore()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const runBirthdayBot = async () => {
    setRunningBirthdayBot(true)
    setBirthdayBotResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('birthday-bot')
      if (error) throw error
      setBirthdayBotResult(data)
    } catch (err) {
      setBirthdayBotResult({ error: err.message })
    }
    setRunningBirthdayBot(false)
  }

  const testBot = async () => {
    if (!form.bot_token) return
    setTestingBot(true)
    setBotTestResult(null)
    try {
      const res = await fetch(`https://api.telegram.org/bot${form.bot_token}/getMe`)
      const data = await res.json()
      if (data.ok) {
        setBotTestResult({ success: true, username: data.result.username, name: data.result.first_name })
      } else {
        setBotTestResult({ error: data.description })
      }
    } catch (err) {
      setBotTestResult({ error: err.message })
    }
    setTestingBot(false)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-32 px-4 md:px-0">
      <div className={`pt-4 md:pt-0 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
        <h1 className="text-2xl font-black text-text tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted font-medium">{t('settings.select_language')}</p>
      </div>

      <div className="grid gap-6">
        {/* Language Selection */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className={`flex items-center gap-3 mb-6 ${i18n.language === 'ar' ? 'justify-end' : 'justify-start'}`}>
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.language')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Languages size={20} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { code: 'en', label: t('settings.english') },
              { code: 'fr', label: t('settings.french') },
              { code: 'ar', label: t('settings.arabic') }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`py-3 px-2 rounded-2xl border-2 font-black text-sm transition-all ${
                  i18n.language === lang.code 
                    ? 'border-accent bg-accent/5 text-accent' 
                    : 'border-transparent bg-surface text-muted hover:border-border'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </section>

        {/* Store info */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.store_info')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Store size={20} />
            </div>
          </div>
          
          <div className="space-y-5 text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t('settings.store_name')}</label>
              <input 
                value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder={t('settings.store_name')}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t('settings.description')}</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder={t('settings.description')}
                rows={3}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-medium focus:outline-none focus:border-accent transition-colors resize-none text-right"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">{t('settings.city')} <MapPin size={10} /></label>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({...f, city: e.target.value}))}
                  placeholder={t('settings.city')}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">{t('settings.category')} <Info size={10} /></label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right appearance-none"
                  >
                    <option value="">{t('common.filter')}</option>
                    {['men','women','kids','general'].map(c => (
                      <option key={c} value={c}>{t(`settings.${c}`)}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">{t('settings.phone')} <Phone size={10} /></label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                placeholder="05 XX XX XX XX"
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right"
              />
            </div>
          </div>
        </section>

        {/* Visual identity */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.visual_identity')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Palette size={20} />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4 bg-surface rounded-2xl border border-border">
            <div className="text-center sm:text-right order-2 sm:order-1">
              <p className="text-text font-black text-sm">{t('settings.primary_color')}</p>
              <p className="text-muted text-xs font-mono font-bold">{form.primary_color.toUpperCase()}</p>
            </div>
            <input 
              type="color"
              value={form.primary_color}
              onChange={e => setForm(f => ({...f, primary_color: e.target.value}))}
              className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl cursor-pointer border-4 border-white shadow-soft p-0 overflow-hidden order-1 sm:order-2"
            />
          </div>
        </section>

        {/* Points system */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.points_system')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Coins size={20} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t('settings.points_per_10')}</label>
              <div className="relative">
                <input 
                  type="number"
                  value={form.points_rate}
                  min={1}
                  max={10}
                  onChange={e => setForm(f => ({...f, points_rate: Number(e.target.value)}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-black focus:outline-none focus:border-accent text-right"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">{t('common.points')}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t('settings.welcome_points')}</label>
              <div className="relative">
                <input 
                  type="number"
                  value={form.welcome_points}
                  onChange={e => setForm(f => ({...f, welcome_points: Number(e.target.value)}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-black focus:outline-none focus:border-accent text-right"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">{t('common.points')}</span>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t('settings.referral_points')}</label>
              <div className="relative">
                <input 
                  type="number"
                  value={form.referral_reward_points}
                  onChange={e => setForm(f => ({...f, referral_reward_points: Number(e.target.value)}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-black focus:outline-none focus:border-accent text-right"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">{t('common.points')}</span>
              </div>
              <p className="text-muted text-[10px] font-bold px-1 mt-1">
                {t('settings.referral_desc')}
              </p>
            </div>
          </div>
        </section>

        {/* Tier thresholds */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft text-right">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.tier_thresholds')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <BarChart size={20} />
            </div>
          </div>
          
          <div className="space-y-3">
            {['silver','gold','platinum'].map(tier => (
              <div key={tier} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 p-3 bg-surface rounded-2xl border border-border group hover:border-accent transition-colors">
                <div className="flex items-center justify-between flex-1 gap-4">
                  <span className="text-muted text-[10px] font-black uppercase tracking-widest order-last sm:w-20">{t('common.point')}</span>
                  <input 
                    type="number"
                    value={form.tier_config?.[tier] ?? 0}
                    onChange={e => setForm(f => ({
                      ...f,
                      tier_config: { ...f.tier_config, [tier]: Number(e.target.value) }
                    }))}
                    className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-text font-black focus:outline-none focus:border-accent text-right"
                  />
                </div>
                <span className={`text-sm font-black capitalize text-right sm:w-24 ${tier === 'silver' ? 'text-slate-400' : tier === 'gold' ? 'text-[#D4AF37]' : 'text-slate-900'}`}>{tier}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Points Expiry System */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.expiry_system')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Clock size={20} />
            </div>
          </div>
          
          <div className="space-y-4 text-right">
            <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="points_expiry_enabled"
                  checked={form.points_expiry_enabled}
                  onChange={e => setForm(f => ({...f, points_expiry_enabled: e.target.checked}))}
                  className="w-5 h-5 rounded text-accent focus:ring-accent"
                />
              </div>
              <label htmlFor="points_expiry_enabled" className="text-sm font-black text-text cursor-pointer">
                {t('settings.expiry_enabled')}
              </label>
            </div>

            {form.points_expiry_enabled && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">{t('settings.expiry_duration')}</label>
                <div className="relative">
                  <select
                    value={form.points_expiry_months}
                    onChange={e => setForm(f => ({...f, points_expiry_months: Number(e.target.value)}))}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right appearance-none"
                  >
                    <option value={6}>6 {t('common.months')}</option>
                    <option value={12}>12 {t('common.months')}</option>
                    <option value={18}>18 {t('common.months')}</option>
                    <option value={24}>24 {t('common.months')}</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={16} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Delivery / COD System */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.delivery_system')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Send size={20} />
            </div>
          </div>
          
          <div className="space-y-4 text-right">
            <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="is_cod_enabled"
                  checked={form.is_cod_enabled}
                  onChange={e => setForm(f => ({...f, is_cod_enabled: e.target.checked}))}
                  className="w-5 h-5 rounded text-accent focus:ring-accent"
                />
              </div>
              <label htmlFor="is_cod_enabled" className="text-sm font-black text-text cursor-pointer">
                {t('settings.cod_enabled')}
              </label>
            </div>
            <p className="text-muted text-[10px] font-bold px-1">
              {t('settings.cod_desc')}
            </p>
          </div>
        </section>

        {/* Bot configuration */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent order-last md:order-first">
                <Bot size={20} />
              </div>
              <h3 className="text-lg font-black text-text tracking-tight">{t('settings.bot_settings')}</h3>
            </div>
            <a 
              href="https://t.me/BotFather" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent text-xs font-bold flex items-center gap-1 hover:underline"
            >
              {t('settings.create_bot')} <ExternalLink size={12} />
            </a>
          </div>
          
          <div className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">{t('settings.bot_token')} <Bot size={10} /></label>
              <div className="relative">
                <input 
                  type="password"
                  value={form.bot_token}
                  onChange={e => setForm(f => ({...f, bot_token: e.target.value}))}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-mono text-xs md:text-sm focus:outline-none focus:border-accent transition-colors text-left"
                />
              </div>
              <p className="text-muted text-[10px] font-medium">{t('settings.bot_token_desc')}</p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={testBot}
                disabled={!form.bot_token || testingBot}
                className="px-6 py-2.5 bg-surface border border-border rounded-xl text-sm font-bold text-text hover:border-accent transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {testingBot ? t('settings.running') : t('settings.test_bot')}
              </button>
              
              {botTestResult && (
                botTestResult.success 
                  ? <span className="text-green-600 text-[10px] md:text-xs font-bold flex items-center gap-1">
                      <Check size={14} /> @{botTestResult.username} {t('settings.bot_connected')}
                    </span>
                  : <span className="text-red-500 text-[10px] md:text-xs font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> {botTestResult.error}
                    </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">{t('settings.bot_username')} <Send size={10} /></label>
              <input 
                value={form.bot_username}
                onChange={e => setForm(f => ({...f, bot_username: e.target.value}))}
                placeholder="store_Loyalty_bot"
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-mono text-xs md:text-sm focus:outline-none focus:border-accent transition-colors text-left"
              />
              <p className="text-muted text-[10px] font-medium">{t('settings.bot_username_desc')}</p>
            </div>
          </div>
        </section>

        {/* Team Management */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.team_settings')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Users size={20} />
            </div>
          </div>
          
          <p className="text-muted text-sm mb-4 text-right">{t('settings.team_settings_desc')}</p>
          
          <button 
            onClick={() => navigate('/dashboard/team')}
            className="w-full py-4 bg-surface border border-border rounded-2xl text-text font-bold flex items-center justify-between px-6 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-accent" />
              <span>{t('settings.team_settings')}</span>
            </div>
            <span className="text-muted">→</span>
          </button>
        </section>

        {/* Roles & Permissions */}
        <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">{t('settings.roles_permissions')}</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Shield size={20} />
            </div>
          </div>
          
          <p className="text-muted text-sm mb-4 text-right">{t('settings.roles_permissions_desc')}</p>
          
          <button 
            onClick={() => navigate('/dashboard/roles')}
            className="w-full py-4 bg-surface border border-border rounded-2xl text-text font-bold flex items-center justify-between px-6 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-accent" />
              <span>{t('roles.title')}</span>
            </div>
            <span className="text-muted">→</span>
          </button>
        </section>

        {/* System Tools */}
        {store?.plan === 'premium' || true && (
          <section className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 border border-border shadow-soft">
            <div className="flex items-center justify-end gap-3 mb-6">
              <h3 className="text-lg font-black text-text tracking-tight">{t('settings.system_tools')}</h3>
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
                <Play size={20} />
              </div>
            </div>
            
            <div className="space-y-4 text-right">
              <div className="p-4 bg-surface rounded-2xl border border-border flex flex-col md:flex-row items-center justify-between gap-4">
                <button 
                  onClick={runBirthdayBot}
                  disabled={runningBirthdayBot}
                  className="w-full md:w-auto px-6 py-3 bg-white border border-border rounded-xl text-sm font-black text-text hover:border-accent transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {runningBirthdayBot ? t('settings.running') : (
                    <>
                      <Gift size={18} className="text-accent" />
                      {t('settings.run_birthday_bot')}
                    </>
                  )}
                </button>
                <div className="text-right flex-1">
                  <p className="text-sm font-black text-text">{t('settings.birthday_alerts')}</p>
                  <p className="text-[10px] text-muted font-bold">{t('settings.birthday_alerts_desc')}</p>
                </div>
              </div>

              {birthdayBotResult && (
                <div className={`p-4 rounded-2xl text-xs font-bold text-right ${birthdayBotResult.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {birthdayBotResult.error ? `❌ ${birthdayBotResult.error}` : (
                    <>
                      ✅ {birthdayBotResult.users_with_birthday} {t('customers.title')}.
                      {birthdayBotResult.notifications_sent} {t('notifications.success')}
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="sticky bottom-4 left-0 right-0 z-20 md:static">
          <button 
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-2 shadow-soft transition-all active:scale-95 ${
              saved 
                ? 'bg-green-500 text-white shadow-green-200' 
                : 'bg-accent text-white shadow-accent/20 hover:bg-accent-dark'
            }`}
          >
            {saved ? <Check size={20} /> : <Save size={20} />}
            <span>{saved ? t('settings.saved_success') : t('settings.save_settings')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
