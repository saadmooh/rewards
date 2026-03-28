let telegram = null

try {
  telegram = window.Telegram?.WebApp
} catch (e) {
  console.log('Running outside Telegram')
}

export function getWebApp() {
  return window.Telegram?.WebApp || null
}
export const WebApp = null // Deprecated, use getWebApp()

export const isDev = !telegram

export function initTelegram() {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready()
    tg.expand()
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#0a0a0a')
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#0a0a0a')
    }
  }
}

export function getTelegramUser() {
  const tg = window.Telegram?.WebApp
  return tg?.initDataUnsafe?.user || null
}

export function getStartParam() {
  const tg = window.Telegram?.WebApp
  return tg?.initDataUnsafe?.start_param || null
}

export function ready(callback) {
  if (telegram) {
    telegram.ready(callback)
  } else if (callback) {
    callback()
  }
}

export function expand() {
  if (telegram) {
    telegram.expand()
  }
}

export function close() {
  if (telegram) {
    telegram.close()
  }
}

export function showAlert(message) {
  if (telegram) {
    telegram.showAlert(message)
  } else {
    console.log('[Telegram Alert]', message)
  }
}

export function showConfirm(message) {
  if (telegram) {
    return telegram.showConfirm(message)
  }
  console.log('[Telegram Confirm]', message)
  return true
}
