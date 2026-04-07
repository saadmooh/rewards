// Authentication logic for merchant dashboard
// No traditional auth - authentication via Telegram WebApp SDK

import { supabase } from './supabase'
import { getTelegramUser } from './telegram'

// Get or create user based on telegram_id
export async function resolveUser() {
  const tgUser = getTelegramUser()

  // Development mode (outside Telegram) - use super_admin
  if (!tgUser) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('is_super_admin', true)
      .single()
    return data
  }

  // Is user already exists?
  let { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', tgUser.id)
    .single()

  if (!user) {
    // Create new user
    const { data: newUser } = await supabase
      .from('users')
      .insert({
        telegram_id:   tgUser.id,
        username:      tgUser.username,
        full_name:     `${tgUser.first_name} ${tgUser.last_name ?? ''}`.trim(),
        photo_url:     tgUser.photo_url,
        language_code: tgUser.language_code,
        is_premium:    tgUser.is_premium,
        is_bot:        tgUser.is_bot,
      })
      .select()
      .single()
    user = newUser
  }

  return user
}

// Get store and user membership
export async function resolveStoreAccess(userId) {
  // 1. Look for memberships with their roles and store data
  const { data: memberships, error } = await supabase
    .from('user_store_memberships')
    .select('*, stores(*), roles(*)')
    .eq('user_id', userId)

  if (error || !memberships || memberships.length === 0) {
    return { store: null, membership: null, hasAccess: false }
  }

  // 2. Filter memberships that have dashboard access via their role permissions
  const authorizedMemberships = memberships.filter(m => 
    m.roles?.permissions?.can_access_dashboard === true
  )

  if (authorizedMemberships.length === 0) {
    return { store: null, membership: null, hasAccess: false }
  }

  // 3. If VITE_STORE_SLUG is set, try to find that specific store first
  const preferredSlug = import.meta.env.VITE_STORE_SLUG
  let activeMembership = authorizedMemberships[0]
  
  if (preferredSlug) {
    const match = authorizedMemberships.find(m => m.stores?.slug === preferredSlug)
    if (match) activeMembership = match
  }

  const { stores: store, roles: role, ...membershipData } = activeMembership
  
  // Flatten membership for backward compatibility if needed, but include role
  const membership = { 
    ...membershipData, 
    role: role?.slug,
    permissions: role?.permissions || {}
  }

  return { 
    store, 
    membership, 
    hasAccess: true 
  }
}
