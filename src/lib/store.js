export const getStoreSlug = () => {
  // From env var (highest priority)
  if (import.meta.env.VITE_STORE_SLUG) return import.meta.env.VITE_STORE_SLUG

  // From query param (dev/testing)
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('store')
  if (fromQuery) return fromQuery

  // From subdomain: store-alpha.rewards.app → store-alpha
  const host = window.location.hostname
  const parts = host.split('.')
  if (parts.length > 2) return parts[0]

  // Default fallback
  return 'store-alpha'
}

export const getStoreName = () => {
  return import.meta.env.VITE_STORE_NAME || getStoreSlug().replace(/-/g, ' ')
}

export const getStartParam = () => {
  // Telegram WebApp start param (for referrals)
  const tg = window.Telegram?.WebApp
  if (tg?.initDataUnsafe?.start_param) {
    return tg.initDataUnsafe.start_param
  }

  // From URL hash (fallback)
  const hash = window.location.hash
  if (hash.includes('tgWebAppStartParam=')) {
    const match = hash.match(/tgWebAppStartParam=([^&]+)/)
    return match ? decodeURIComponent(match[1]) : null
  }

  return null
}
