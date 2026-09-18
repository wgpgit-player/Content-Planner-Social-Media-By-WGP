// Pendaftaran service worker dan pengenalan mode terpasang.
//
// Hanya dijalankan pada build produksi. Di mode pengembangan, service worker
// akan menyimpan kerangka aplikasi dan membuat perubahan kode tidak langsung
// terlihat — gejalanya membingungkan dan sulit dilacak, jadi lebih baik tidak
// dinyalakan sama sekali di sana.

export function daftarkanServiceWorker() {
  if (!import.meta.env.PROD) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registrasi) => {
        // Versi baru langsung dipakai tanpa menunggu semua tab lama ditutup.
        // Tanpa ini, orang yang membiarkan aplikasinya terbuka berhari-hari
        // bisa tertinggal pada versi lama tanpa tahu.
        registrasi.addEventListener('updatefound', () => {
          const baru = registrasi.installing
          if (!baru) return
          baru.addEventListener('statechange', () => {
            if (baru.state === 'installed' && navigator.serviceWorker.controller) {
              baru.postMessage('pakai-versi-baru')
            }
          })
        })
      },
      () => {
        // Pendaftaran gagal bukan alasan untuk mengganggu pengguna. Tanpa
        // service worker aplikasi tetap jalan penuh, hanya tidak bisa dibuka
        // saat offline.
      }
    )
  })
}

// Benar kalau aplikasi sedang berjalan sebagai aplikasi terpasang, bukan di
// dalam tab peramban. Dipakai untuk hal-hal yang hanya masuk akal di sana,
// misalnya menyembunyikan ajakan "pasang ke home screen".
export function sedangTerpasang() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS memakai properti miliknya sendiri, bukan display-mode.
    window.navigator.standalone === true
  )
}
