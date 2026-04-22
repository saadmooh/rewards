import { useState, useEffect } from 'react'

// ============================================================
// Main hook for Telegram
// ============================================================
export function useTelegram() {
  const [tg] = useState(() => window?.Telegram?.WebApp ?? null)

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()
  }, [tg])

  return tg
}

// ============================================================
// Telegram instance
// ============================================================
let telegram = null

try {
  telegram = window.Telegram?.WebApp
} catch (e) {
  console.log('Running outside Telegram')
}

export const WebApp = telegram
export const isDev = !telegram

// ============================================================
// Init Telegram
// ============================================================
export function initTelegram() {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready()
    tg.expand()
    const version = tg.version
    const supportsColorChange = version && parseFloat(version) >= 6.1
    if (supportsColorChange && tg.setHeaderColor) {
      tg.setHeaderColor('#fdfcf8')
    }
    if (supportsColorChange && tg.setBackgroundColor) {
      tg.setBackgroundColor('#fdfcf8')
    }
  }
}

// ============================================================
// Get full user data
// ============================================================
export function getTelegramUser() {
  const tg = window.Telegram?.WebApp
  const user = tg?.initDataUnsafe?.user
  if (!user) return null

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name ?? null,
    username: user.username ?? null,
    language_code: user.language_code ?? null,
    is_premium: user.is_premium ?? false,
    is_bot: user.is_bot ?? false,
    photo_url: user.photo_url ?? null,
    allows_write_to_pm: user.allows_write_to_pm ?? false,
    added_to_attachment_menu: user.added_to_attachment_menu ?? false,
  }
}

// ============================================================
// Get session data
// ============================================================
export function getSessionData() {
  const tg = window.Telegram?.WebApp
  const unsafe = tg?.initDataUnsafe
  if (!unsafe) return null

  return {
    initDataRaw: tg?.initData ?? null,
    query_id: unsafe.query_id ?? null,
    auth_date: unsafe.auth_date ?? null,
    hash: unsafe.hash ?? null,
    start_param: unsafe.start_param ?? null,
  }
}

// ============================================================
// Get chat data (if opened from group/channel)
// ============================================================
export function getChatData() {
  const tg = window.Telegram?.WebApp
  const chat = tg?.initDataUnsafe?.chat
  if (!chat) return null

  return {
    id: chat.id,
    type: chat.type ?? null,
    title: chat.title ?? null,
    username: chat.username ?? null,
    photo_url: chat.photo_url ?? null,
  }
}

// ============================================================
// Get device/environment data
// ============================================================
export function getDeviceData() {
  const tg = window.Telegram?.WebApp
  if (!tg) return null

  return {
    platform: tg.platform ?? null,
    version: tg.version ?? null,
    colorScheme: tg.colorScheme ?? null,
    isExpanded: tg.isExpanded ?? false,
    viewportHeight: tg.viewportHeight ?? null,
    viewportStableHeight: tg.viewportStableHeight ?? null,
    headerColor: tg.headerColor ?? null,
    backgroundColor: tg.backgroundColor ?? null,
  }
}

// ============================================================
// Get theme colors
// ============================================================
export function getThemeData() {
  const tg = window.Telegram?.WebApp
  const p = tg?.themeParams
  if (!p) return null

  return {
    bg_color: p.bg_color ?? null,
    text_color: p.text_color ?? null,
    hint_color: p.hint_color ?? null,
    link_color: p.link_color ?? null,
    button_color: p.button_color ?? null,
    button_text_color: p.button_text_color ?? null,
    secondary_bg_color: p.secondary_bg_color ?? null,
  }
}

// ============================================================
// Legacy helpers (kept for compatibility)
// ============================================================
export function getStartParam() {
  const tg = window.Telegram?.WebApp
  return tg?.initDataUnsafe?.start_param ?? null
}

export function ready(callback) {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready(callback)
  } else if (callback) {
    callback()
  }
}

export function expand() {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.expand()
  }
}

export function close() {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.close()
  }
}

export function showAlert(message) {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.showAlert(message)
  } else {
    console.log('[Telegram Alert]', message)
  }
}

export function hapticFeedback(style = 'light') {
  const tg = window.Telegram?.WebApp
  if (tg?.HapticFeedback) {
    const version = tg.version
    if (version && parseFloat(version) >= 6.1) {
      tg.HapticFeedback.impactOccurred(style)
    }
  }
}

export function showConfirm(message) {
  const tg = window.Telegram?.WebApp
  if (tg) {
    return tg.showConfirm(message)
  }
  console.log('[Telegram Confirm]', message)
  return true
}

export function requestPhoneNumber() {
  const tg = window.Telegram?.WebApp
  return new Promise((resolve) => {
    if (tg?.requestContact) {
      tg.requestContact((confirmed, contact) => {
        if (confirmed) {
          resolve({
            phone: contact.contact.phone_number,
            firstName: contact.contact.first_name,
            userId: contact.contact.user_id,
          })
        } else {
          resolve(null)
        }
      })
    } else {
      resolve(null)
    }
  })
}