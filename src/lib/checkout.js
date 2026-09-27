export function checkoutUrl(plan, period, quantities = {}) {
  const addons = Object.fromEntries(Object.entries(quantities).filter(([, n]) => Number.isInteger(n) && n > 0 && n <= 10))
  return '/bayar?' + new URLSearchParams({ paket: plan, periode: period === 'yearly' ? 'tahunan' : 'bulanan', addons: JSON.stringify(addons) })
}

export function readAddons(value) {
  try {
    const parsed = JSON.parse(value || '{}')
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {}
    return Object.fromEntries(Object.entries(parsed).filter(([, n]) => Number.isInteger(n) && n > 0 && n <= 10))
  } catch { return {} }
}

export function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n]/.test(value) ? value : '/dashboard'
}
