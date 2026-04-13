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
    const { store_id, message, image_url, target, target_tier, cta_url } = await req.json()

    if (!store_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('bot_token')
      .eq('id', store_id)
      .single()

    if (storeError || !store?.bot_token) {
      return new Response(JSON.stringify({ error: 'Bot token not configured for this store' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const BOT_TOKEN = store.bot_token

    let query = supabase
      .from('user_store_memberships')
      .select('user_id, users(telegram_id)')
      .eq('store_id', store_id)

    if (target === 'tier' && target_tier) {
      query = query.eq('tier', target_tier)
    }
    if (target === 'inactive') {
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      query = query.lt('last_purchase', sixtyDaysAgo.toISOString())
    }

    const { data: recipients, error: recipientsError } = await query

    if (recipientsError) {
      return new Response(JSON.stringify({ error: recipientsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const recipient of recipients) {
      const chatId = recipient.users?.telegram_id
      if (!chatId) {
        failedCount++
        continue
      }

      const endpoint = image_url ? 'sendPhoto' : 'sendMessage'

      const payload: Record<string, unknown> = {
        chat_id: chatId,
        parse_mode: 'Markdown',
      }

      if (cta_url) {
        payload.reply_markup = {
          inline_keyboard: [[{ text: 'افتح العرض 🎁', url: cta_url }]],
        }
      }

      if (image_url) {
        payload.photo = image_url
        payload.caption = message
      } else {
        payload.text = message
      }

      try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          successCount++
        } else {
          const errorData = await res.json()
          if (res.status === 401) {
            return new Response(JSON.stringify({ error: 'Invalid bot token. Please check configuration.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          if (res.status === 403) {
            failedCount++
          } else {
            errors.push(`Chat ${chatId}: ${errorData.description || 'Unknown error'}`)
          }
        }
      } catch (e) {
        errors.push(`Chat ${chatId}: ${e.message}`)
      }

      await new Promise((r) => setTimeout(r, 40))
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})