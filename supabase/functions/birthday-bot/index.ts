/// <reference lib="deno.ns" />

import { createClient } from 'supabase'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Helper to safely unwrap Supabase joined relations.
 * Sometimes related data is returned as a single object, 
 * sometimes as a single-item array depending on the query/schema.
 */
function unwrap<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get today's month and day (MM-DD)
    const today = new Date()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    const monthDay = `${month}-${day}`

    // 1. Find users with birthday today
    const { data: targetUsers, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, telegram_id, birth_date')
      .not('birth_date', 'is', null)
      .ilike('birth_date', `%-${monthDay}`)

    if (usersError) throw usersError

    if (!targetUsers || targetUsers.length === 0) {
      return new Response(JSON.stringify({ message: 'No birthdays today', success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let successCount = 0
    let totalAttempts = 0

    // 2. Process each user
    for (const user of targetUsers) {
      if (!user.telegram_id) continue

      // Get memberships and related store data
      const { data: memberships, error: memError } = await supabase
        .from('user_store_memberships')
        .select('store_id, stores(*)')
        .eq('user_id', user.id)

      if (memError || !memberships) continue

      for (const membership of memberships) {
        // Safely unwrap the store relation
        const store = unwrap(membership.stores as any)
        if (!store || !store.bot_token) continue

        // Find active birthday offers for this store
        const { data: birthdayOffers, error: offersError } = await supabase
          .from('offers')
          .select('*, offer_products(product_id, products(*))')
          .eq('store_id', store.id)
          .eq('occasion_type', 'birthday')
          .eq('is_active', true)
          .limit(1)

        if (offersError || !birthdayOffers || birthdayOffers.length === 0) continue

        const offer = birthdayOffers[0]
        const BOT_TOKEN = store.bot_token
        const chatId = user.telegram_id

        totalAttempts++

        let msg = `🎂 *عيد ميلاد سعيد يا ${user.full_name || 'صديقنا'}!* 🎈\n\nنحتفل معك اليوم ونقدم لك هذا العرض الخاص:\n\n🎁 *${offer.title}*\n\n${offer.description || ''}`
        
        if (offer.type === 'discount' && offer.discount_percent) {
          msg += `\n\n🔥 خصم ${offer.discount_percent}% بمناسبة عيد ميلادك!`
        }

        if (offer.offer_products && offer.offer_products.length > 0) {
          msg += `\n\nالمنتجات المشمولة:\n`
          for (const op of offer.offer_products) {
            // Safely unwrap the product relation
            const product = unwrap(op.products as any)
            if (product) {
              msg += `- ${product.name}\n`
            }
          }
        }

        // Determine the best image URL to send
        const firstProduct = unwrap(offer.offer_products?.[0]?.products as any)
        const imageUrl = offer.image_url || firstProduct?.image_url || null

        const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage'
        const payload: Record<string, any> = {
          chat_id: chatId,
          parse_mode: 'Markdown',
        }

        if (imageUrl) {
          payload.photo = imageUrl
          payload.caption = msg
        } else {
          payload.text = msg
        }

        // Add CTA button
        const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || ''
        payload.reply_markup = {
          inline_keyboard: [[{ 
            text: 'احصل على هديتك 🎁', 
            url: siteUrl ? `${siteUrl}/offers/${offer.id}` : `https://t.me/${store.bot_username || ''}`
          }]],
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
            const errData = await res.json()
            console.error(`Telegram API Error for ${chatId}:`, errData)
          }
        } catch (e) {
          console.error(`Fetch Error for ${chatId}:`, e)
        }
        
        // Anti-spam delay
        await new Promise(r => setTimeout(r, 50))
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_with_birthday: targetUsers.length,
        notifications_sent: successCount,
        total_attempts: totalAttempts
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