// Settings - Store configuration page
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboardStore } from '../store/dashboardStore'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'
import { Store, Palette, Coins, BarChart, Check, Save, Phone, MapPin, Info, Bot, Send, AlertCircle, ExternalLink, Users, Shield, ShieldCheck } from 'lucide-react'

export default function Settings() {
  const { store, refreshStore } = useDashboardStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name:           store?.name ?? '',
    description:    store?.description ?? '',
    category:       store?.category ?? '',
    city:           store?.city ?? '',
    phone:          store?.phone ?? '',
    primary_color:  store?.primary_color ?? '#10b981',
    points_rate:    store?.points_rate ?? 1,
    welcome_points: store?.welcome_points ?? 100,
    tier_config:    store?.tier_config ?? { bronze: 0, silver: 10000, gold: 50000, platinum: 100000 },
    bot_token:      store?.bot_token ?? '',
    bot_username:   store?.bot_username ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [testingBot, setTestingBot] = useState(false)
  const [botTestResult, setBotTestResult] = useState(null)

  const handleSave = async () => {
    document.documentElement.style.setProperty('--accent', form.primary_color)
    await supabase.from('stores').update({ ...form, updated_at: new Date() }).eq('id', store.id)
    await refreshStore()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
    <div className="space-y-6 max-w-3xl mx-auto pb-24">
      <div className="text-right">
        <h1 className="text-2xl font-black text-text tracking-tight">إعدادات المتجر</h1>
        <p className="text-sm text-muted font-medium">تخصيص الهوية ونظام النقاط والولاء</p>
      </div>

      <div className="grid gap-6">
        {/* Store info */}
        <section className="bg-white rounded-[32px] p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">معلومات المتجر</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Store size={20} />
            </div>
          </div>
          
          <div className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">اسم المتجر</label>
              <input 
                value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="أدخل اسم المتجر"
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent transition-colors text-right"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">الوصف</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                placeholder="وصف مختصر يظهر للزبائن..."
                rows={2}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-medium focus:outline-none focus:border-accent transition-colors resize-none text-right"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">المدينة <MapPin size={10} /></label>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({...f, city: e.target.value}))}
                  placeholder="الجزائر العاصمة"
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">الفئة <Info size={10} /></label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({...f, category: e.target.value}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-bold focus:outline-none focus:border-accent text-right appearance-none"
                >
                  <option value="">اختر الفئة</option>
                  {['ملابس رجالية','ملابس نسائية','ملابس أطفال','عام'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">رقم الهاتف <Phone size={10} /></label>
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
        <section className="bg-white rounded-[32px] p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">الهوية البصرية</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Palette size={20} />
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-4 p-4 bg-surface rounded-2xl border border-border">
            <div className="text-right">
              <p className="text-text font-black text-sm">لون المتجر الرئيسي</p>
              <p className="text-muted text-xs font-mono font-bold">{form.primary_color.toUpperCase()}</p>
            </div>
            <input 
              type="color"
              value={form.primary_color}
              onChange={e => setForm(f => ({...f, primary_color: e.target.value}))}
              className="w-14 h-14 rounded-xl cursor-pointer border-4 border-white shadow-soft p-0 overflow-hidden"
            />
          </div>
        </section>

        {/* Points system */}
        <section className="bg-white rounded-[32px] p-6 border border-border shadow-soft">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">نظام النقاط</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <Coins size={20} />
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">نقاط لكل 10 دج</label>
              <div className="relative">
                <input 
                  type="number"
                  value={form.points_rate}
                  min={1}
                  max={10}
                  onChange={e => setForm(f => ({...f, points_rate: Number(e.target.value)}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-black focus:outline-none focus:border-accent text-right"
                />
                <span className="absolute left-4 top-3 text-xs font-bold text-muted">نقطة</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">نقاط الترحيب</label>
              <div className="relative">
                <input 
                  type="number"
                  value={form.welcome_points}
                  onChange={e => setForm(f => ({...f, welcome_points: Number(e.target.value)}))}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-black focus:outline-none focus:border-accent text-right"
                />
                <span className="absolute left-4 top-3 text-xs font-bold text-muted">نقطة</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tier thresholds */}
        <section className="bg-white rounded-[32px] p-6 border border-border shadow-soft text-right">
          <div className="flex items-center justify-end gap-3 mb-6">
            <h3 className="text-lg font-black text-text tracking-tight">حدود الفئات (نقاط)</h3>
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
              <BarChart size={20} />
            </div>
          </div>
          
          <div className="space-y-3">
            {['silver','gold','platinum'].map(tier => (
              <div key={tier} className="flex items-center gap-4 p-3 bg-surface rounded-2xl border border-border group hover:border-accent transition-colors">
                <span className="text-muted text-[10px] font-black uppercase tracking-widest order-last w-20">نقطة</span>
                <input 
                  type="number"
                  value={form.tier_config?.[tier] ?? 0}
                  onChange={e => setForm(f => ({
                    ...f,
                    tier_config: { ...f.tier_config, [tier]: Number(e.target.value) }
                  }))}
                  className="flex-1 bg-white border border-border rounded-xl px-4 py-2 text-text font-black focus:outline-none focus:border-accent text-right"
                />
                <span className={`w-24 text-sm font-black capitalize text-right ${tier === 'silver' ? 'text-slate-400' : tier === 'gold' ? 'text-[#D4AF37]' : 'text-slate-900'}`}>{tier}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Bot configuration */}
        <section className="bg-white rounded-[32px] p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-text tracking-tight">إعدادات البوت</h3>
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
                <Bot size={20} />
              </div>
            </div>
            <a 
              href="https://t.me/BotFather" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent text-xs font-bold flex items-center gap-1 hover:underline"
            >
              أنشئ بوت <ExternalLink size={12} />
            </a>
          </div>
          
          <div className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">توكن البوت <Bot size={10} /></label>
              <div className="relative">
                <input 
                  type="password"
                  value={form.bot_token}
                  onChange={e => setForm(f => ({...f, bot_token: e.target.value}))}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-mono text-sm focus:outline-none focus:border-accent transition-colors text-left"
                />
              </div>
              <p className="text-muted text-[10px] font-medium">احصل على التوكن من @BotFather</p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={testBot}
                disabled={!form.bot_token || testingBot}
                className="px-4 py-2 bg-surface border border-border rounded-xl text-sm font-bold text-text hover:border-accent transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {testingBot ? '...' : 'تحقق'}
              </button>
              
              {botTestResult && (
                botTestResult.success 
                  ? <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                      <Check size={14} /> @{botTestResult.username} متصل
                    </span>
                  : <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                      <AlertCircle size={14} /> {botTestResult.error}
                    </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1 flex items-center justify-end gap-1">اسم المستخدم <Send size={10} /></label>
              <input 
                value={form.bot_username}
                onChange={e => setForm(f => ({...f, bot_username: e.target.value}))}
                placeholder="store_Loyalty_bot"
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text font-mono text-sm focus:outline-none focus:border-accent transition-colors text-left"
              />
              <p className="text-muted text-[10px] font-medium">مثل: @store_Loyalty_bot</p>
            </div>
          </div>
        </section>

        {/* Team Management */}
        <section className="bg-white rounded-[32px] p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-text tracking-tight">إدارة الفريق</h3>
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
                <Users size={20} />
              </div>
            </div>
          </div>
          
          <p className="text-muted text-sm mb-4 text-right">إدارة أعضاء الفريق وتعديل أدوارهم</p>
          
          <button 
            onClick={() => navigate('/dashboard/team')}
            className="w-full py-4 bg-surface border border-border rounded-2xl text-text font-bold flex items-center justify-between px-6 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-accent" />
              <span>إدارة الفريق</span>
            </div>
            <span className="text-muted">→</span>
          </button>
        </section>

        {/* Roles & Permissions */}
        <section className="bg-white rounded-[32px] p-6 border border-border shadow-soft">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-text tracking-tight">الأدوار والصلاحيات</h3>
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent">
                <Shield size={20} />
              </div>
            </div>
          </div>
          
          <p className="text-muted text-sm mb-4 text-right">إدارة أدوار المستخدمين وصلاحياتهم</p>
          
          <button 
            onClick={() => navigate('/dashboard/roles')}
            className="w-full py-4 bg-surface border border-border rounded-2xl text-text font-bold flex items-center justify-between px-6 hover:border-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users size={20} className="text-accent" />
              <span>إدارة الأدوار</span>
            </div>
            <span className="text-muted">→</span>
          </button>
        </section>

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
          <span>{saved ? 'تم حفظ التعديلات بنجاح' : 'حفظ إعدادات المتجر'}</span>
        </button>
      </div>
    </div>
  )
}
