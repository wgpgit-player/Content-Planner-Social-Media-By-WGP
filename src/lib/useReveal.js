import { useEffect } from 'react'

// Transisi masuk dan keluar untuk tiap bagian halaman saat di-scroll.
//
// KENAPA TANPA PUSTAKA ANIMASI
//
// Framer Motion dan GSAP menambah 40-100 KB JavaScript demi efek yang
// sebenarnya bisa dikerjakan browser sendiri. Untuk halaman jualan, berat itu
// mahal: tiap 1 detik tambahan waktu muat memangkas konversi sekitar 7%.
// IntersectionObserver sudah ada di semua browser, tidak perlu diunduh, dan
// tidak menjalankan apa pun saat halaman sedang diam.
//
// DUA ARAH, DAN KENAPA AMBANGNYA TIDAK SIMETRIS
//
// Bagian yang masuk layar memudar naik; yang ditinggalkan memudar turun lagi,
// jadi halaman terasa hidup ke dua arah saat di-scroll bolak-balik.
//
// Masalahnya, efek dua arah gampang berubah jadi menyebalkan: kalau ambang
// masuk dan keluar sama persis, bagian yang berhenti tepat di perbatasan akan
// berkedip-kedip mengikuti getaran scroll. Karena itu dipakai dua ambang
// berbeda — muncul saat 12% bagian terlihat, menghilang baru setelah tinggal
// di bawah 2%. Jarak di antaranya membuat keadaannya mantap.
//
// Yang juga dijaga:
//
//   - Bagian paling atas halaman tidak pernah disembunyikan. Hero yang
//     memudar saat halaman baru dibuka terlihat seperti aplikasi gagal muat.
//   - Kalau IntersectionObserver tidak ada, semuanya langsung ditampilkan.
//   - prefers-reduced-motion dihormati di CSS, jadi isinya tetap terlihat dan
//     hanya perpindahannya yang hilang.

const AMBANG_MASUK = 0.12
const AMBANG_KELUAR = 0.02

export function useReveal(deps = []) {
  useEffect(() => {
    const elemen = Array.from(document.querySelectorAll('.reveal'))
    if (elemen.length === 0) return

    if (typeof IntersectionObserver === 'undefined') {
      elemen.forEach((el) => el.classList.add('tampil'))
      return
    }

    const pengamat = new IntersectionObserver(
      (entri) => {
        entri.forEach((e) => {
          const rasio = e.intersectionRatio

          if (e.isIntersecting && rasio >= AMBANG_MASUK) {
            e.target.classList.add('tampil')
            // Arah datangnya dicatat supaya bagian yang ditinggalkan ke bawah
            // menghilang ke bawah pula, bukan melompat ke arah berlawanan.
            e.target.classList.remove('dari-atas')
          } else if (!e.isIntersecting || rasio <= AMBANG_KELUAR) {
            // Bagian yang sudah lewat di atas layar disembunyikan ke atas;
            // yang belum sampai, ke bawah.
            const lewatDiAtas = e.boundingClientRect.top < 0
            e.target.classList.toggle('dari-atas', lewatDiAtas)
            e.target.classList.remove('tampil')
          }
        })
      },
      { threshold: [0, AMBANG_KELUAR, AMBANG_MASUK, 0.3] },
    )

    elemen.forEach((el) => {
      // Apa pun yang sudah terlihat saat halaman dibuka langsung ditampilkan,
      // tanpa menunggu scroll pertama.
      const kotak = el.getBoundingClientRect()
      if (kotak.top < window.innerHeight * 0.9) el.classList.add('tampil')
      pengamat.observe(el)
    })

    return () => pengamat.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

export default useReveal
