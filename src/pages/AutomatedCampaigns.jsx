import { useState } from 'react'
import { useDashboardStore } from '../store/dashboardStore'
import { useCampaigns, useCampaignEligibleCount, TRIGGER_LABELS } from '../hooks/useCampaigns'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import {
  Plus, Send, Calendar, Users, Clock, PauseCircle, PlayCircle,
  Trash2, Edit3, ChevronDown, Tag, Gift, TrendingUp, AlertTriangle,
  PartyPopper, ArrowLeft, Eye,
} from 'lucide-react'

const TRIGGER_ICONS = {
  welcome: PartyPopper,
  win_back: TrendingUp,
  birthday: Gift,
  churn: AlertTriangle,
  milestone: Tag,
}

const TRIGGER_COLORS = {
  welcome: '#10b981',
  win_back: '#f59e0b',
  birthday: '#ec4899',
  churn: '#ef4444',
  milestone: '#8b5cf6',
}

const STATUS_COLORS = {
  draft: '#64748b',
  active: '#10b981',
  paused: '#f59e0b',
  completed: '#6366f1',
}

export default function AutomatedCampaigns() {
  const { t } = useTranslation()
  const { store } = useDashboardStore()
  const { campaigns, createCampaign, updateCampaign, deleteCampaign, runCampaignNow, TRIGGER_TYPES } = useCampaigns(store?.id)
  const [view, setView] = useState('list') // 'list', 'create', 'edit', 'logs'
  const [selected, setSelected] = useState(null)
  const [logsOpen, setLogsOpen] = useState(null)

  // Fetch offers for CTA linking
  const { data: offers } = useQuery({
    queryKey: ['campaign-offers', store?.id],
    queryFn: () => supabase.from('offers').select('id, title').eq('store_id', store.id).eq('is_active', true).then(r => r.data ?? []),
    enabled: !!store?.id,
  })

  const triggerIcons = TRIGGER_ICONS
  const triggerColors = TRIGGER_COLORS

  if (view === 'create') {
    return (
      <CampaignForm
        store={store}
        offers={offers}
        onSave={async (data) => {
          await createCampaign.mutateAsync(data)
          setView('list')
        }}
        onCancel={() => setView('list')}
        t={t}
        TRIGGER_TYPES={TRIGGER_TYPES}
      />
    )
  }

  if (view === 'edit' && selected) {
    return (
      <CampaignForm
        store={store}
        offers={offers}
        campaign={selected}
        onSave={async (data) => {
          await updateCampaign.mutateAsync({ id: selected.id, ...data })
          setView('list')
          setSelected(null)
        }}
        onCancel={() => { setView('list'); setSelected(null) }}
        t={t}
        TRIGGER_TYPES={TRIGGER_TYPES}
      />
    )
  }

  if (view === 'logs' && logsOpen) {
    return (
      <CampaignLogs
        store={store}
        promotionId={logsOpen}
        onBack={() => { setView('list'); setLogsOpen(null) }}
        t={t}
      />
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 px-4">
      {/* Header */}
      <div className="flex items-center justify-between text-right">
        <div>
          <h1 className="text-2xl font-black text-text tracking-tight">{t('campaigns.title')}</h1>
          <p className="text-sm text-muted font-medium">{t('campaigns.subtitle')}</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="bg-accent text-white px-4 py-2.5 rounded-2xl font-black text-sm shadow-soft flex items-center gap-2 hover:bg-accent-dark transition-all active:scale-95"
        >
          <Plus size={16} />
          {t('campaigns.new_campaign')}
        </button>
      </div>

      {/* Campaign List */}
      {campaigns.isLoading && (
        <div className="text-center py-12 text-muted">{t('common.loading')}</div>
      )}

      {!campaigns.isLoading && campaigns.data?.length === 0 && (
        <div className="bg-white rounded-3xl border border-border shadow-soft p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-black text-text mb-2">{t('campaigns.no_campaigns')}</h3>
          <p className="text-sm text-muted mb-6">{t('campaigns.no_campaigns_desc')}</p>
          <button
            onClick={() => setView('create')}
            className="bg-accent text-white px-6 py-3 rounded-2xl font-black text-sm shadow-soft hover:bg-accent-dark transition-all"
          >
            {t('campaigns.new_campaign')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.data?.map(campaign => {
          const Icon = triggerIcons[campaign.trigger_type] || Tag
          return (
            <div
              key={campaign.id}
              className="bg-white rounded-3xl border border-border shadow-soft p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: triggerColors[campaign.trigger_type] + '20' }}
                >
                  <Icon size={22} style={{ color: triggerColors[campaign.trigger_type] }} />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <h3 className="text-base font-black text-text truncate">{campaign.title}</h3>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: STATUS_COLORS[campaign.status] + '20',
                        color: STATUS_COLORS[campaign.status],
                      }}
                    >
                      {t(`campaigns.status_${campaign.status}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted justify-end">
                    <span className="flex items-center gap-1">
                      <Send size={12} />
                      {TRIGGER_LABELS[campaign.trigger_type] || campaign.trigger_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {campaign.send_count || 0} {t('common.members')}
                    </span>
                    {campaign.last_run_at && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(campaign.last_run_at).toLocaleDateString('ar-DZ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 justify-end border-t border-border pt-3">
                <button
                  onClick={() => { setLogsOpen(campaign.id); setView('logs') }}
                  className="text-xs font-bold text-muted hover:text-accent flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-accent/5 transition-all"
                >
                  <Eye size={12} />
                  {t('campaigns.view_logs')}
                </button>
                {campaign.status === 'draft' && (
                  <button
                    onClick={() => updateCampaign.mutate({ id: campaign.id, status: 'active' })}
                    className="text-xs font-bold text-green-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-green-50 transition-all"
                  >
                    <PlayCircle size={12} />
                    {t('campaigns.activate')}
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    onClick={() => updateCampaign.mutate({ id: campaign.id, status: 'paused' })}
                    className="text-xs font-bold text-amber-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-amber-50 transition-all"
                  >
                    <PauseCircle size={12} />
                    {t('campaigns.pause')}
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <button
                    onClick={() => updateCampaign.mutate({ id: campaign.id, status: 'active' })}
                    className="text-xs font-bold text-green-600 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-green-50 transition-all"
                  >
                    <PlayCircle size={12} />
                    {t('campaigns.activate')}
                  </button>
                )}
                <button
                  onClick={() => runCampaignNow.mutate(campaign.id)}
                  className="text-xs font-bold text-accent flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-accent/5 transition-all"
                >
                  <Send size={12} />
                  {t('campaigns.run_now')}
                </button>
                <button
                  onClick={() => { setSelected(campaign); setView('edit') }}
                  className="text-xs font-bold text-muted hover:text-accent flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-accent/5 transition-all"
                >
                  <Edit3 size={12} />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => { if (confirm(t('campaigns.delete_confirm'))) deleteCampaign.mutate(campaign.id) }}
                  className="text-xs font-bold text-red-500 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CampaignForm({ store, offers, campaign, onSave, onCancel, t, TRIGGER_TYPES }) {
  const [form, setForm] = useState(campaign ? {
    title: campaign.title || '',
    body: campaign.body || '',
    trigger_type: campaign.trigger_type || 'welcome',
    trigger_condition: campaign.trigger_condition || {},
    status: campaign.status || 'draft',
    message_template: campaign.message_template || {},
    image_url: campaign.image_url || '',
    cta_label: campaign.cta_label || 'افتح العرض',
    cta_url: campaign.cta_url || '',
    offer_id: campaign.offer_id || '',
    target_tiers: campaign.target_tiers || ['bronze', 'silver', 'gold', 'platinum'],
    ends_at: campaign.ends_at ? campaign.ends_at.slice(0, 16) : '',
  } : {
    title: '',
    body: '',
    trigger_type: 'welcome',
    trigger_condition: {},
    status: 'draft',
    message_template: {},
    image_url: '',
    cta_label: 'افتح العرض',
    cta_url: '',
    offer_id: '',
    target_tiers: ['bronze', 'silver', 'gold', 'platinum'],
    ends_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const { data: eligibleCount } = useCampaignEligibleCount(store?.id, form.trigger_type)

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const handleTriggerCondition = (key, value) => {
    setForm(f => ({
      ...f,
      trigger_condition: { ...f.trigger_condition, [key]: value },
    }))
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError(t('campaigns.error_title_body'))
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        body: form.body.trim(),
        message_template: { body: form.body.trim(), ...(form.message_template || {}) },
        offer_id: form.offer_id || null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      })
    } catch (err) {
      setError(err.message || t('campaigns.error_save'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-24 px-4">
      {/* Back button */}
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-sm font-bold text-muted hover:text-accent transition-all"
      >
        <ArrowLeft size={16} />
        {t('common.back')}
      </button>

      <div className="text-right">
        <h1 className="text-2xl font-black text-text tracking-tight">
          {campaign ? t('campaigns.edit_campaign') : t('campaigns.new_campaign')}
        </h1>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-soft p-6 space-y-5">
        {/* Title */}
        <div className="space-y-2 text-right">
          <label className="text-xs font-black text-muted tracking-widest">{t('campaigns.campaign_name')}</label>
          <input
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder={t('campaigns.campaign_name_placeholder')}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium placeholder-muted focus:outline-none focus:border-accent text-right"
          />
        </div>

        {/* Trigger Type */}
        <div className="space-y-2 text-right">
          <label className="text-xs font-black text-muted tracking-widest">{t('campaigns.trigger_type')}</label>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGER_TYPES.map(opt => {
              const Icon = TRIGGER_ICONS[opt.value]
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange('trigger_type', opt.value)}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2 ${
                    form.trigger_type === opt.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent'
                  }`}
                >
                  <Icon size={16} style={{ color: TRIGGER_COLORS[opt.value] }} />
                  <span className={`text-xs font-black ${form.trigger_type === opt.value ? 'text-accent' : 'text-text'}`}>
                    {t(`campaigns.trigger_${opt.value}`)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Trigger-specific conditions */}
        {form.trigger_type === 'churn' && (
          <div className="space-y-2 text-right bg-surface rounded-2xl p-4">
            <label className="text-xs font-black text-muted">{t('campaigns.days_inactive')}</label>
            <input
              type="number"
              value={form.trigger_condition.days_inactive_min || 45}
              onChange={e => handleTriggerCondition('days_inactive_min', parseInt(e.target.value))}
              className="w-full bg-white border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-accent text-right"
            />
          </div>
        )}
        {form.trigger_type === 'milestone' && (
          <div className="space-y-2 text-right bg-surface rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-black text-muted">{t('campaigns.min_visits')}</label>
              <input
                type="number"
                value={form.trigger_condition.min_visits || 0}
                onChange={e => handleTriggerCondition('min_visits', parseInt(e.target.value))}
                className="w-full bg-white border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-accent text-right"
              />
            </div>
            <div>
              <label className="text-xs font-black text-muted">{t('campaigns.min_points')}</label>
              <input
                type="number"
                value={form.trigger_condition.min_points || 0}
                onChange={e => handleTriggerCondition('min_points', parseInt(e.target.value))}
                className="w-full bg-white border border-border rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-accent text-right"
              />
            </div>
          </div>
        )}

        {/* Eligible count */}
        <div className="bg-surface rounded-2xl p-4 text-center border border-border">
          <p className="text-muted text-sm font-medium">
            {t('campaigns.estimated_recipients')}: <strong className="text-accent font-black">{eligibleCount ?? '...'}</strong>
          </p>
        </div>

        {/* Message */}
        <div className="space-y-2 text-right">
          <label className="text-xs font-black text-muted tracking-widest">{t('campaigns.message')}</label>
          <p className="text-[10px] text-muted">{t('campaigns.message_hint')}</p>
          <textarea
            value={form.body}
            onChange={e => handleChange('body', e.target.value)}
            placeholder={t('campaigns.message_placeholder')}
            rows={5}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium placeholder-muted focus:outline-none focus:border-accent resize-none text-right"
          />
        </div>

        {/* Image URL */}
        <div className="space-y-2 text-right">
          <label className="text-xs font-black text-muted tracking-widest">{t('campaigns.image_url')}</label>
          <input
            value={form.image_url}
            onChange={e => handleChange('image_url', e.target.value)}
            placeholder="https://..."
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium placeholder-muted focus:outline-none focus:border-accent text-right"
          />
        </div>

        {/* CTA Label & URL */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-muted">{t('campaigns.cta_label')}</label>
            <input
              value={form.cta_label}
              onChange={e => handleChange('cta_label', e.target.value)}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium focus:outline-none focus:border-accent text-right"
            />
          </div>
          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-muted">{t('campaigns.cta_url')}</label>
            <input
              value={form.cta_url}
              onChange={e => handleChange('cta_url', e.target.value)}
              placeholder="/offers/..."
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium placeholder-muted focus:outline-none focus:border-accent text-right"
            />
          </div>
        </div>

        {/* Link to offer */}
        {offers?.length > 0 && (
          <div className="space-y-2 text-right">
            <label className="text-xs font-black text-muted">{t('campaigns.link_offer')}</label>
            <select
              value={form.offer_id || ''}
              onChange={e => handleChange('offer_id', e.target.value || '')}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium focus:outline-none focus:border-accent appearance-none text-right"
            >
              <option value="">{t('campaigns.no_offer')}</option>
              {offers.map(o => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* End date */}
        <div className="space-y-2 text-right">
          <label className="text-xs font-black text-muted flex items-center justify-end gap-1">
            {t('campaigns.ends_at')}
            <Calendar size={12} />
          </label>
          <input
            type="datetime-local"
            value={form.ends_at}
            onChange={e => handleChange('ends_at', e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text font-medium focus:outline-none focus:border-accent text-right"
          />
        </div>

        {/* Status */}
        <div className="space-y-2 text-right">
          <label className="text-xs font-black text-muted">{t('campaigns.status')}</label>
          <div className="flex gap-2 justify-end">
            {[
              { value: 'draft', label: t('campaigns.status_draft') },
              { value: 'active', label: t('campaigns.status_active') },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => handleChange('status', s.value)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  form.status === s.value ? 'bg-accent text-white' : 'bg-surface text-muted border border-border'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 bg-surface border border-border text-text py-4 rounded-2xl font-black text-sm hover:bg-white transition-all disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || (!form.title.trim() && !form.body.trim())}
          className="flex-1 bg-accent text-white py-4 rounded-2xl font-black text-sm shadow-soft shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            t('campaigns.saving')
          ) : (
            <>
              <Send size={16} />
              {campaign ? t('common.save') : t('campaigns.create')}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function CampaignLogs({ store, promotionId, onBack, t }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['campaign-logs', store?.id, promotionId],
    queryFn: async () => {
      let q = supabase
        .from('campaign_logs')
        .select('*, users(full_name, username)')
        .eq('store_id', store.id)
        .order('sent_at', { ascending: false })
        .limit(100)
      if (promotionId) q = q.eq('promotion_id', promotionId)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !!store?.id,
  })

  const statusColors = {
    sent: 'bg-green-100 text-green-700',
    skipped: 'bg-gray-100 text-gray-600',
    failed: 'bg-red-100 text-red-700',
    opted_out: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 px-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-muted hover:text-accent transition-all"
      >
        <ArrowLeft size={16} />
        {t('common.back')}
      </button>

      <div className="text-right">
        <h1 className="text-2xl font-black text-text tracking-tight">{t('campaigns.logs_title')}</h1>
      </div>

      {isLoading && <div className="text-center py-12 text-muted">{t('common.loading')}</div>}

      {!isLoading && logs?.length === 0 && (
        <div className="bg-white rounded-3xl border border-border shadow-soft p-12 text-center">
          <p className="text-muted">{t('campaigns.no_logs')}</p>
        </div>
      )}

      <div className="space-y-2">
        {logs?.map(log => (
          <div key={log.id} className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-text">{log.users?.full_name || log.users?.username || '—'}</p>
              <p className="text-xs text-muted">{new Date(log.sent_at).toLocaleString('ar-DZ')}</p>
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${statusColors[log.status]}`}>
              {log.status}
            </span>
            {log.error_message && (
              <p className="text-xs text-red-500 max-w-[200px] truncate">{log.error_message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
