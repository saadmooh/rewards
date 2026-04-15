import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const TRIGGER_TYPES = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'win_back', label: 'Win Back' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'churn', label: 'Churn Alert' },
  { value: 'milestone', label: 'Milestone' },
]

const TRIGGER_CONFIGS = {
  welcome: { days_since_join_max: 7 },
  win_back: { days_inactive_min: 30 },
  birthday: {},
  churn: { days_inactive_min: 45 },
  milestone: { min_visits: 0, min_points: 0 },
}

export const TRIGGER_LABELS = Object.fromEntries(TRIGGER_TYPES.map(t => [t.value, t.label]))

export function useCampaigns(storeId) {
  const queryClient = useQueryClient()

  const campaigns = useQuery({
    queryKey: ['campaigns', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*, offers(title)')
        .eq('store_id', storeId)
        .neq('trigger_type', 'manual')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!storeId,
  })

  const createCampaign = useMutation({
    mutationFn: async (campaign) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert({
          store_id: storeId,
          title: campaign.title,
          body: campaign.body,
          trigger_type: campaign.trigger_type,
          trigger_condition: campaign.trigger_condition || {},
          status: campaign.status || 'draft',
          message_template: campaign.message_template || { body: campaign.body },
          image_url: campaign.image_url || null,
          cta_label: campaign.cta_label || 'افتح العرض',
          cta_url: campaign.cta_url || null,
          offer_id: campaign.offer_id || null,
          target_tiers: campaign.target_tiers || ['bronze', 'silver', 'gold', 'platinum'],
          ends_at: campaign.ends_at || null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', storeId] })
    },
  })

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id)
        .eq('store_id', storeId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', storeId] })
    },
  })

  const deleteCampaign = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', storeId] })
    },
  })

  const runCampaignNow = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase.functions.invoke('process-automated-campaigns', {
        body: { promotion_id: id },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', storeId] })
      queryClient.invalidateQueries({ queryKey: ['campaign-logs', storeId] })
    },
  })

  return {
    campaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    runCampaignNow,
    TRIGGER_TYPES,
    TRIGGER_CONFIGS,
  }
}

export function useCampaignLogs(storeId, promotionId) {
  return useQuery({
    queryKey: ['campaign-logs', storeId, promotionId],
    queryFn: async () => {
      let q = supabase
        .from('campaign_logs')
        .select('*, users(full_name, username)')
        .eq('store_id', storeId)
        .order('sent_at', { ascending: false })
        .limit(100)
      if (promotionId) q = q.eq('promotion_id', promotionId)
      const { data, error } = await q
      if (error) throw error
      return data
    },
    enabled: !!storeId,
  })
}

export function useCampaignEligibleCount(storeId, triggerType) {
  return useQuery({
    queryKey: ['campaign-eligible-count', storeId, triggerType],
    queryFn: async () => {
      const now = new Date()
      const month = now.getMonth() + 1
      const day = now.getDate()

      let q = supabase
        .from('user_store_memberships')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)

      if (triggerType === 'welcome') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        q = q.gte('joined_at', weekAgo.toISOString())
      } else if (triggerType === 'win_back') {
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        q = q.or(`last_purchase.lt.${thirtyDaysAgo.toISOString()},last_purchase.is.null`)
      } else if (triggerType === 'birthday') {
        // Rough estimate: 1/365 of users
        const { count: total } = await supabase
          .from('user_store_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
        return Math.ceil((total || 0) / 365)
      } else if (triggerType === 'churn') {
        const fortyFiveDaysAgo = new Date(now)
        fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)
        q = q.or(`last_purchase.lt.${fortyFiveDaysAgo.toISOString()},last_purchase.is.null`)
      } else if (triggerType === 'milestone') {
        const { count: total } = await supabase
          .from('user_store_memberships')
          .select('id', { count: 'exact', head: true })
          .eq('store_id', storeId)
        return Math.ceil((total || 0) * 0.1)
      }

      const { count, error } = await q
      if (error) return 0
      return count || 0
    },
    enabled: !!storeId && !!triggerType,
  })
}
