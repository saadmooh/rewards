let telegram = null

try {
  telegram = window.Telegram?.WebApp
} catch (e) {
  console.log('Running outside Telegram')
}

export const WebApp = telegram

export const isDev = !telegram

export function initTelegram() {
  if (telegram) {
    telegram.ready()
    telegram.expand()
    if (telegram.setHeaderColor) {
      telegram.setHeaderColor('#0a0a0a')
    }
    if (telegram.setBackgroundColor) {
      telegram.setBackgroundColor('#0a0a0a')
    }
  }
}

export function getTelegramUser() {
  return telegram?.initDataUnsafe?.user || null
}

export function getStartParam() {
  return telegram?.initDataUnsafe?.start_param || null
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
