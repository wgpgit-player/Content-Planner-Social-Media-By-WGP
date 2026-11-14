// Generator efek suara bel / dering dan getar berbasis Web Audio API
// Ringan (0 kB file aset), bebas latensi jaringan, dan kompatibel di semua browser modern.

let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// Membunyikan nada bel tunggal dengan decay eksponensial (seperti dentang lonceng)
function bunyikanNada(ctx, frekuensi, mulai, durasi, volume = 0.3) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  // Gunakan waveform sine dicampur sedikit triangle untuk karakter bel yang bersih dan jernih
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(frekuensi, mulai)

  // Envelope AD: serangan cepat (attack) lalu meluruh perlahan (decay)
  gain.gain.setValueAtTime(0.0001, mulai)
  gain.gain.exponentialRampToValueAtTime(volume, mulai + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, mulai + durasi)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(mulai)
  osc.stop(mulai + durasi)
}

/**
 * Suara Dering Alarm / Senggol Admin (Urgent Ringing Chime)
 * Pola nada: Dua dentang tegas (880Hz -> 1175Hz) diulang dua kali
 * Sangat efektif menarik perhatian staf saat admin meminta segera mengerjakan tugas.
 */
export function playRingingTone() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const t = ctx.currentTime + 0.05

    // Ronde 1: Ding-Dong!
    bunyikanNada(ctx, 880, t + 0.0, 0.22, 0.35)
    bunyikanNada(ctx, 1175, t + 0.16, 0.32, 0.4)

    // Ronde 2: Ding-Dong! (pengulangan agar terdengar jelas)
    bunyikanNada(ctx, 880, t + 0.55, 0.22, 0.35)
    bunyikanNada(ctx, 1175, t + 0.71, 0.38, 0.45)
  } catch (e) {
    console.warn('Gagal membunyikan audio ringing:', e)
  }
}

/**
 * Suara Chime Tugas Baru Masuk (Pleasant Notification)
 * Pola nada: Tiga nada berurutan naik (C5 -> E5 -> G5)
 */
export function playTaskTone() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const t = ctx.currentTime + 0.05
    bunyikanNada(ctx, 523.25, t + 0.0, 0.16, 0.25)
    bunyikanNada(ctx, 659.25, t + 0.12, 0.18, 0.28)
    bunyikanNada(ctx, 783.99, t + 0.26, 0.32, 0.32)
  } catch (e) {
    console.warn('Gagal membunyikan audio tugas baru:', e)
  }
}

/**
 * Pola Getar HP / Perangkat (Vibration API)
 */
export function vibrateDevice(pola = [250, 100, 250, 100, 400]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pola)
    }
  } catch (e) {
    console.warn('Vibrate tidak didukung:', e)
  }
}

/**
 * Memicu Notifikasi Native OS / Peramban jika diizinkan
 */
export async function showNativeNotification(judul, { body, tag, icon = '/icon-192.png', url = '/worksheet' } = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        return reg.showNotification(judul, {
          body,
          icon,
          badge: icon,
          tag: tag || 'task-alert',
          vibrate: [250, 100, 250, 100, 400],
          data: { tautan: url },
          requireInteraction: tag?.startsWith('ringing-'),
        })
      }
    }
    // Fallback jika bukan lewat service worker
    const n = new Notification(judul, {
      body,
      icon,
      tag: tag || 'task-alert',
    })
    n.onclick = () => {
      window.focus()
      if (url && window.location.pathname !== url) {
        window.location.href = url
      }
      n.close()
    }
    return true
  } catch (e) {
    console.warn('Gagal menampilkan native notification:', e)
    return false
  }
}
