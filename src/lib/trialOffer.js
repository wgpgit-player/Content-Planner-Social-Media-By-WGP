export const OFFER_COOLDOWN = 7 * 24 * 60 * 60 * 1000
export function canShowTrialOffer(tenant, isAdmin, lastShown, now = Date.now()) {
  if (!isAdmin || tenant?.subscription_status !== 'trial') return false
  const time = Number(lastShown)
  return !Number.isFinite(time) || time <= 0 || now - time >= OFFER_COOLDOWN
}
export function adminContactUrl(plan = '') {
  return 'https://wa.me/6285111037992?text=' + encodeURIComponent('Halo admin plannersm.co, saya ingin mengetahui harga dan detail paket' + (plan ? ' ' + plan : ' berlangganan') + '.')
}
