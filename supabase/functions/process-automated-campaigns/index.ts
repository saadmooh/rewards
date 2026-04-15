/// <reference lib="deno.ns" />

import { createClient } from 'supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { promotion_id, store_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch the campaign
    let campaignQuery = supabase
      .from('promotions')
      .select('*, stores(bot_token, name)')
      .eq('trigger_type', 'welcome')  // only automated
      .eq('status', 'active')

    if (promotion_id) {
      campaignQuery = campaignQuery.eq('id', promotion_id)
    }

    const { data: campaigns, error: campaignError } = await campaignQuery

    if (campaignError) {
      return new Response(JSON.stringify({ error: campaignError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No active campaigns to process' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let totalSent = 0
    let totalFailed = 0
    let totalSkipped = 0
    const results: Record<string, unknown>[] = []

    for (const campaign of campaigns) {
      const botToken = campaign.stores?.bot_token
      if (!botToken) {
        results.push({ campaign_id: campaign.id, error: 'No bot token configured' })
        continue
      }

      // Build recipient query based on trigger_type
      let membershipQuery = supabase
        .from('user_store_memberships')
        .select('id, user_id, tier, points, total_spent, last_purchase, joined_at, users(telegram_id, full_name, birth_date)')
        .eq('store_id', campaign.store_id)

      // Apply trigger-specific filters
      const triggerType = campaign.trigger_type
      const now = new Date()

      if (triggerType === 'welcome') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        membershipQuery = membershipQuery.gte('joined_at', weekAgo.toISOString())
      } else if (triggerType === 'win_back') {
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        membershipQuery = membershipQuery.or(`last_purchase.lt.${thirtyDaysAgo.toISOString()},last_purchase.is.null`)
      } else if (triggerType === 'birthday') {
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        // Query users whose birth_date matches today's month-day
        membershipQuery = membershipQuery.not('users.birth_date', 'is', null)
        const { data: members, error: membersError } = await membershipQuery
        if (membersError) {
          results.push({ campaign_id: campaign.id, error: membersError.message })
          continue
        }
        // Filter in JS for birthday match
        const todayStr = `-${month}-${day}`
        const birthdayMembers = members.filter((m: any) => {
          const bd = m.users?.birth_date
          if (!bd) return false
          return bd.endsWith(todayStr)
        })
        // Process birthday members
        const campaignResult = await processRecipients(campaign, birthdayMembers, botToken, supabase)
        totalSent += campaignResult.sent
        totalFailed += campaignResult.failed
        totalSkipped += campaignResult.skipped
        results.push({ campaign_id: campaign.id, ...campaignResult })

        // Update last_run_at
        await supabase
          .from('promotions')
          .update({ last_run_at: new Date().toISOString(), send_count: campaign.send_count + campaignResult.sent })
          .eq('id', campaign.id)
        continue
      } else if (triggerType === 'churn') {
        const daysInactive = campaign.trigger_condition?.days_inactive_min || 45
        const churnDate = new Date(now)
        churnDate.setDate(churnDate.getDate() - daysInactive)
        membershipQuery = membershipQuery.or(`last_purchase.lt.${churnDate.toISOString()},last_purchase.is.null`)
      } else if (triggerType === 'milestone') {
        // Fetch all and filter in JS
        const { data: members, error: membersError } = await membershipQuery
        if (membersError) {
          results.push({ campaign_id: campaign.id, error: membersError.message })
          continue
        }
        const minVisits = campaign.trigger_condition?.min_visits || 0
        const minPoints = campaign.trigger_condition?.min_points || 0
        const milestoneMembers = members.filter((m: any) =>
          m.visit_count >= minVisits || m.points >= minPoints
        )
        const campaignResult = await processRecipients(campaign, milestoneMembers, botToken, supabase)
        totalSent += campaignResult.sent
        totalFailed += campaignResult.failed
        totalSkipped += campaignResult.skipped
        results.push({ campaign_id: campaign.id, ...campaignResult })

        await supabase
          .from('promotions')
          .update({ last_run_at: new Date().toISOString(), send_count: campaign.send_count + campaignResult.sent })
          .eq('id', campaign.id)
        continue
      }

      const { data: members, error: membersError } = await membershipQuery

      if (membersError) {
        results.push({ campaign_id: campaign.id, error: membersError.message })
        continue
      }

      // Filter out recently notified users (last 24h)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      const { data: recentLogs } = await supabase
        .from('campaign_logs')
        .select('user_id')
        .eq('promotion_id', campaign.id)
        .gte('sent_at', oneDayAgo)

      const recentUserIds = new Set((recentLogs || []).map((l: any) => l.user_id))
      const eligibleMembers = (members || []).filter((m: any) => !recentUserIds.has(m.user_id))

      const campaignResult = await processRecipients(campaign, eligibleMembers, botToken, supabase)
      totalSent += campaignResult.sent
      totalFailed += campaignResult.failed
      totalSkipped += campaignResult.skipped
      results.push({ campaign_id: campaign.id, ...campaignResult })

      // Update last_run_at and send_count
      await supabase
        .from('promotions')
        .update({ last_run_at: new Date().toISOString(), send_count: campaign.send_count + campaignResult.sent })
        .eq('id', campaign.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_sent: totalSent,
        total_failed: totalFailed,
        total_skipped: totalSkipped,
        campaigns: results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processRecipients(
  campaign: Record<string, unknown>,
  members: any[],
  botToken: string,
  supabase: any
) {
  let sent = 0
  let failed = 0
  let skipped = 0

  for (const member of members) {
    const telegramId = member.users?.telegram_id
    if (!telegramId) {
      skipped++
      await supabase.from('campaign_logs').insert({
        store_id: campaign.store_id,
        promotion_id: campaign.id,
        user_id: member.user_id,
        status: 'skipped',
      })
      continue
    }

    // Build message
    let message = campaign.message_template?.body || campaign.body || ''
    const fullName = member.users?.full_name || 'customer'
    message = message.replaceAll('{name}', fullName)

    const imageUrl = campaign.image_url as string | null
    const ctaUrl = campaign.cta_url as string | null
    const ctaLabel = campaign.cta_label as string || 'Open'

    const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage'
    const payload: Record<string, unknown> = {
      chat_id: telegramId,
      parse_mode: 'Markdown',
    }

    if (imageUrl) {
      payload.photo = imageUrl
      payload.caption = message
    } else {
      payload.text = message
    }

    if (ctaUrl) {
      payload.reply_markup = {
        inline_keyboard: [[{ text: ctaLabel, url: ctaUrl }]],
      }
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        sent++
        await supabase.from('campaign_logs').insert({
          store_id: campaign.store_id,
          promotion_id: campaign.id,
          user_id: member.user_id,
          status: 'sent',
        })
      } else {
        const errorData = await res.json()
        failed++
        await supabase.from('campaign_logs').insert({
          store_id: campaign.store_id,
          promotion_id: campaign.id,
          user_id: member.user_id,
          status: 'failed',
          error_message: errorData?.description || 'Unknown error',
        })
      }
    } catch (e: any) {
      failed++
      await supabase.from('campaign_logs').insert({
        store_id: campaign.store_id,
        promotion_id: campaign.id,
        user_id: member.user_id,
        status: 'failed',
        error_message: e.message,
      })
    }

    // Anti-spam delay
    await new Promise((r) => setTimeout(r, 40))
  }

  return { sent, failed, skipped }
}
