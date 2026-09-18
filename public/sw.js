/* plannersm.co — service worker.
   ============================================================================
   Tugasnya cuma satu: membuat kerangka aplikasi tetap terbuka walau jaringan
   sedang buruk atau hilang. Ini yang membedakan rasanya dengan situs biasa —
   aplikasi asli tidak menampilkan halaman "tidak ada koneksi", ia terbuka
   dulu lalu memberi tahu datanya belum masuk.

   YANG TIDAK DILAKUKAN DI SINI, DAN ALASANNYA
   --------------------------------------------------------------------------
   1. Panggilan ke Supabase tidak pernah disimpan. Isinya data per pengguna
      dan sebagian membawa token. Menyimpannya di cache peramban berarti
      data satu orang bisa terbaca oleh orang berikutnya yang memakai
      perangkat yang sama. Semua permintaan lintas-origin selain CDN ikon
      dilewatkan apa adanya.
   2. Hanya metode GET yang disentuh. POST, PATCH, dan DELETE adalah
      perubahan data; menyajikannya dari cache berarti menyembunyikan
      kegagalan penyimpanan dari pengguna.
   3. Tidak ada precache daftar berkas. Vite menempelkan hash pada nama
      berkas setiap kali build, jadi daftar yang ditulis tangan akan basi
      pada deploy berikutnya. Aset disimpan saat pertama kali diminta.
   ========================================================================== */

const VERSI = 'plannersm-v1'
const KERANGKA = '/index.html'

// Ionicons dilayani dari jsDelivr dengan nomor versi terkunci, jadi isinya
// tidak akan berubah. Tanpa menyimpannya, aplikasi yang dibuka offline muncul
// tanpa satu ikon pun, dan itu terlihat rusak.
const CDN_IKON = 'https://cdn.jsdelivr.net'

const ASET = /\.(?:js|mjs|css|woff2?|ttf|png|jpe?g|svg|webp|ico|webmanifest)$/i

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSI)
      // cache: 'reload' supaya yang tersimpan bukan versi lama dari cache HTTP.
      .then((cache) => cache.add(new Request(KERANGKA, { cache: 'reload' })))
      .catch(() => {})
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nama) => Promise.all(nama.filter((n) => n !== VERSI).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  // Dipakai halaman untuk meminta versi baru langsung dipakai tanpa
  // menunggu semua tab lama ditutup.
  if (event.data === 'pakai-versi-baru') self.skipWaiting()
})

function simpan(request, response) {
  if (!response || !response.ok) return response
  const salinan = response.clone()
  caches.open(VERSI).then((cache) => cache.put(request, salinan)).catch(() => {})
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  const sendiri = url.origin === self.location.origin

  // Ikon dari CDN: ambil dari cache kalau ada, karena versinya terkunci.
  if (!sendiri) {
    if (url.origin === CDN_IKON) {
      event.respondWith(
        caches.match(request).then((tersimpan) => tersimpan || fetch(request).then((r) => simpan(request, r)))
      )
    }
    // Supabase dan lainnya: jangan disentuh sama sekali.
    return
  }

  // Navigasi. Aplikasi ini satu halaman, jadi rute apa pun dilayani oleh
  // index.html yang sama. Jaringan didahulukan supaya versi baru langsung
  // terpakai; kalau jaringan gagal, kerangka yang tersimpan yang dipakai.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((r) => {
          if (r.ok) {
            const salinan = r.clone()
            caches.open(VERSI).then((cache) => cache.put(KERANGKA, salinan)).catch(() => {})
          }
          return r
        })
        .catch(() => caches.match(KERANGKA).then((r) => r || Response.error()))
    )
    return
  }

  if (!ASET.test(url.pathname)) return

  // Aset statis. Nama berkasnya sudah ber-hash, jadi yang tersimpan pasti
  // cocok dengan yang diminta. Disajikan dari cache lebih dulu supaya cepat,
  // sambil diperbarui di belakang untuk permintaan berikutnya.
  event.respondWith(
    caches.match(request).then((tersimpan) => {
      const jaringan = fetch(request)
        .then((r) => simpan(request, r))
        .catch(() => tersimpan || Response.error())
      return tersimpan || jaringan
    })
  )
})
