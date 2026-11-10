// Smart Social Media Dispatcher.
//
// Solusi praktis & aman untuk menerbitkan konten ke media sosial:
// 1. Menyalin naskah caption lengkap, CTA, dan hashtag ke clipboard secara otomatis.
// 2. Membuka studio penerbitan resmi platform tujuan di tab baru.
// 3. Menghindari risiko pemblokiran akun akibat bot pihak ketiga yang belum diverifikasi.

export const STUDIO_URLS = {
  instagram: 'https://www.instagram.com/',
  tiktok: 'https://www.tiktok.com/creator-center/upload',
  facebook: 'https://business.facebook.com/latest/composer',
  youtube: 'https://studio.youtube.com/',
  twitter: 'https://x.com/compose/post',
  linkedin: 'https://www.linkedin.com/feed/',
  threads: 'https://www.threads.net/',
  article: 'https://ctarsa.or.id',
}

/**
 * Menyusun naskah lengkap yang siap dipaste ke media sosial.
 */
export function susunNaskahLengkap(item) {
  if (!item) return ''
  const bagian = []

  if (item.caption && item.caption.trim()) {
    bagian.push(item.caption.trim())
  }

  if (item.cta && item.cta.trim()) {
    bagian.push(`\n${item.cta.trim()}`)
  }

  if (item.hashtags && item.hashtags.trim()) {
    bagian.push(`\n\n${item.hashtags.trim()}`)
  }

  return bagian.join('').trim()
}

/**
 * Menghasilkan URL tujuan studio platform.
 */
export function getStudioUrl(platform, naskah = '', targetUrl = null) {
  if (platform === 'article') {
    return targetUrl && targetUrl !== '#' ? targetUrl : STUDIO_URLS.article
  }

  if (platform === 'twitter' && naskah) {
    // X / Twitter mendukung prefill teks via query parameter
    const cuplikan = naskah.length > 270 ? naskah.slice(0, 270) + '...' : naskah
    return `https://x.com/compose/post?text=${encodeURIComponent(cuplikan)}`
  }

  return STUDIO_URLS[platform] || 'https://www.google.com'
}

/**
 * Eksekusi Smart Dispatch:
 * 1. Salin naskah ke clipboard.
 * 2. Buka studio platform di tab baru.
 */
export async function jalankanSmartDispatch(item, targetUrl = null) {
  const naskah = susunNaskahLengkap(item)
  let berhasilSalin = false

  if (typeof navigator !== 'undefined' && navigator.clipboard && naskah) {
    try {
      await navigator.clipboard.writeText(naskah)
      berhasilSalin = true
    } catch (err) {
      console.warn('Gagal menyalin otomatis:', err)
    }
  }

  const urlTujuan = getStudioUrl(item?.platform, naskah, targetUrl)
  if (typeof window !== 'undefined') {
    window.open(urlTujuan, '_blank', 'noopener,noreferrer')
  }

  return {
    berhasilSalin,
    naskah,
    urlTujuan,
  }
}
