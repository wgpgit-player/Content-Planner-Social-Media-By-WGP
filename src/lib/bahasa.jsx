import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Dua bahasa untuk halaman publik: Indonesia dan Inggris.
//
// KENAPA TIDAK PAKAI PUSTAKA i18n
//
// react-i18next dan sejenisnya menuntut seluruh teks dipindah ke berkas
// terjemahan terpisah, dipanggil lewat kunci seperti t('hero.judul'). Cara itu
// masuk akal untuk aplikasi dengan sepuluh bahasa dan penerjemah profesional.
// Untuk dua bahasa yang ditulis orang yang sama, harganya lebih besar dari
// manfaatnya: kunci yang salah ketik tidak ketahuan sampai halamannya dibuka,
// dan orang yang menyunting naskah harus bolak-balik antara dua berkas untuk
// tahu kalimat mana yang sedang ia ubah.
//
// Jadi terjemahannya ditulis berdampingan di tempat teks itu dipakai:
//
//     t('Rencanakan konten', 'Plan your content')
//
// Konsekuensinya jelas dan disengaja: tidak mungkin ada teks yang punya versi
// Indonesia tapi lupa versi Inggrisnya, karena keduanya ditulis sekaligus.
//
// Pilihan bahasa disimpan di localStorage supaya bertahan antar kunjungan,
// dan atribut lang pada <html> ikut berubah — itu yang dipakai pembaca layar
// untuk memilih pelafalan, dan Google untuk tahu halaman ini berbahasa apa.

const KUNCI = 'plannersm-bahasa'
const KonteksBahasa = createContext(null)

function tebakBahasaAwal() {
  if (typeof window === 'undefined') return 'id'

  try {
    const tersimpan = window.localStorage.getItem(KUNCI)
    if (tersimpan === 'id' || tersimpan === 'en') return tersimpan
  } catch {
    // localStorage bisa dilarang (mode privat sebagian browser). Bukan alasan
    // untuk gagal — cukup jatuh ke penebakan di bawah.
  }

  // Pengunjung Indonesia mendapat bahasa Indonesia; selebihnya Inggris.
  // Menebak dari bahasa browser lebih baik daripada memaksa semua orang
  // memulai dari satu bahasa lalu menyuruh mereka mencari tombolnya.
  const bawaan = (navigator.languages?.[0] || navigator.language || '').toLowerCase()
  return bawaan.startsWith('id') ? 'id' : 'en'
}

export function PenyediaBahasa({ children }) {
  const [bahasa, setBahasaState] = useState(tebakBahasaAwal)

  useEffect(() => {
    document.documentElement.lang = bahasa
    try { window.localStorage.setItem(KUNCI, bahasa) } catch { /* diabaikan */ }
  }, [bahasa])

  const setBahasa = useCallback((b) => {
    if (b === 'id' || b === 'en') setBahasaState(b)
  }, [])

  // t dibungkus useCallback yang bergantung pada bahasa, supaya komponen yang
  // memakainya ikut dirender ulang saat bahasanya berganti.
  const t = useCallback((id, en) => (bahasa === 'en' ? (en ?? id) : id), [bahasa])

  const nilai = useMemo(
    () => ({ bahasa, setBahasa, t, inggris: bahasa === 'en' }),
    [bahasa, setBahasa, t],
  )

  return <KonteksBahasa.Provider value={nilai}>{children}</KonteksBahasa.Provider>
}

export function useBahasa() {
  const konteks = useContext(KonteksBahasa)

  // Komponen bisa saja dipakai di luar penyedia (misalnya saat diuji
  // tersendiri). Daripada melempar galat dan membuat halaman kosong, kembalikan
  // bahasa Indonesia apa adanya.
  if (!konteks) {
    return { bahasa: 'id', setBahasa: () => {}, inggris: false, t: (id) => id }
  }
  return konteks
}

export default useBahasa
