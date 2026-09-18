import { supabase } from './supabaseClient'

// Langganan notifikasi pengingat jam tayang.
//
// KUNCI PUBLIK VAPID BOLEH ADA DI SINI
//
// Ini kunci publik, dan memang dirancang untuk dibagikan — peramban
// membutuhkannya untuk membuat langganan. Yang TIDAK BOLEH ada di mana pun
// di dalam folder ini adalah kunci privatnya. Kunci privat hanya hidup
// sebagai secret Edge Function; kalau ia masuk ke berkas yang dibaca Vite,
// ia ikut terkirim ke setiap pengunjung situs, dan siapa pun bisa mengirim
// notifikasi atas nama aplikasi ini.

export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BATCq6SSCYFHk3AF7tj7QmF2CiXtME7emDxwThMSj66ZB6Gd5WX0SBhtFYdrQGbiSr_dKB5WZGsNn529nvULh0w'

// Peramban meminta kunci dalam bentuk Uint8Array, sedangkan VAPID
// dituliskan sebagai base64url. Padding dan dua karakter penggantinya
// harus dikembalikan dulu sebelum bisa didekode.
function base64UrlKeUint8(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const biasa = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const mentah = atob(biasa)
  const keluaran = new Uint8Array(mentah.length)
  for (let i = 0; i < mentah.length; i++) keluaran[i] = mentah.charCodeAt(i)
  return keluaran
}

// Beberapa alasan kenapa notifikasi tidak bisa dipakai, masing-masing
// dengan penjelasan yang bisa ditindaklanjuti. "Tidak didukung" saja
// membuat orang mengira aplikasinya rusak.
export function alasanTidakBisa() {
  if (typeof window === 'undefined') return 'Belum siap.'

  if (!('serviceWorker' in navigator)) {
    return 'Peramban ini tidak mendukung notifikasi latar belakang.'
  }
  if (!('PushManager' in window)) {
    // Ini yang paling sering terjadi: Safari di iPhone, dibuka sebagai tab
    // biasa. Apple hanya mengizinkan push untuk aplikasi yang sudah
    // dipasang ke home screen.
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    return iOS
      ? 'Di iPhone, notifikasi baru bisa dinyalakan setelah aplikasi ini dipasang ke layar utama. Buka menu Bagikan di Safari, lalu pilih "Tambahkan ke Layar Utama".'
      : 'Peramban ini tidak mendukung notifikasi push.'
  }
  if (Notification.permission === 'denied') {
    return 'Izin notifikasi sedang diblokir untuk situs ini. Ubah dulu lewat pengaturan situs di peramban, karena setelah diblokir aplikasi tidak bisa memintanya lagi.'
  }
  return null
}

export function statusIzin() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'tidak-ada'
  return Notification.permission
}

// Label perangkat supaya daftar langganan tidak berupa deretan alamat acak.
function labelPerangkat() {
  const ua = navigator.userAgent
  const perangkat =
    /iPhone/.test(ua) ? 'iPhone'
    : /iPad/.test(ua) ? 'iPad'
    : /Android/.test(ua) ? 'Android'
    : /Macintosh/.test(ua) ? 'Mac'
    : /Windows/.test(ua) ? 'Windows'
    : 'Perangkat'

  const peramban =
    /Edg\//.test(ua) ? 'Edge'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari'
    : 'peramban'

  return `${perangkat} · ${peramban}`
}

export async function nyalakanPengingat(tenantId, userId) {
  const halangan = alasanTidakBisa()
  if (halangan) return { error: halangan }
  if (!supabase) return { error: 'Belum tersambung ke server.' }
  if (!tenantId || !userId) return { error: 'Workspace belum siap.' }

  const izin = await Notification.requestPermission()
  if (izin !== 'granted') {
    return { error: 'Izin notifikasi tidak diberikan, jadi pengingat tidak bisa dikirim.' }
  }

  const registrasi = await navigator.serviceWorker.ready

  // Langganan yang sudah ada dipakai ulang kalau kuncinya masih cocok.
  // Membuat langganan baru di atas yang lama membuat satu perangkat punya
  // dua alamat, dan orangnya menerima pengingat yang sama dua kali.
  let langganan = await registrasi.pushManager.getSubscription()
  if (!langganan) {
    try {
      langganan = await registrasi.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlKeUint8(VAPID_PUBLIC_KEY),
      })
    } catch (e) {
      return { error: `Peramban menolak membuat langganan: ${e.message}` }
    }
  }

  const isi = langganan.toJSON()
  if (!isi.keys?.p256dh || !isi.keys?.auth) {
    return { error: 'Langganan dari peramban tidak lengkap. Coba muat ulang halaman.' }
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      tenant_id: tenantId,
      endpoint: isi.endpoint,
      p256dh: isi.keys.p256dh,
      auth: isi.keys.auth,
      label: labelPerangkat(),
    },
    { onConflict: 'user_id,tenant_id,endpoint' }
  )

  if (error) return { error: error.message }
  return { ok: true }
}

export async function matikanPengingat(tenantId, userId) {
  if (!supabase) return { error: 'Belum tersambung ke server.' }

  const registrasi = await navigator.serviceWorker?.ready
  const langganan = await registrasi?.pushManager.getSubscription()

  if (langganan) {
    // Dihapus dari database lebih dulu. Kalau urutannya dibalik dan
    // penghapusan di server gagal, perangkatnya sudah berhenti berlangganan
    // tapi barisnya tertinggal, dan pengirim akan terus mencoba alamat mati.
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('endpoint', langganan.endpoint)

    if (error) return { error: error.message }
    await langganan.unsubscribe()
  } else {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
  }

  return { ok: true }
}

export async function sedangBerlangganan(tenantId, userId) {
  if (!supabase || !tenantId || !userId) return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const registrasi = await navigator.serviceWorker.ready
  const langganan = await registrasi.pushManager.getSubscription()
  if (!langganan) return false

  // Perangkat ini berlangganan menurut peramban — tapi yang menentukan
  // apakah pengingat benar-benar akan dikirim adalah ada tidaknya barisnya
  // di database, jadi itu yang diperiksa.
  const { count } = await supabase
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('endpoint', langganan.endpoint)

  return (count ?? 0) > 0
}
