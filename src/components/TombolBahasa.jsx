import { useBahasa } from '../lib/bahasa'

// Pemilih bahasa untuk halaman publik.
//
// Dibuat sebagai dua tombol berdampingan, bukan menu dropdown. Dengan hanya
// dua pilihan, dropdown justru menambah satu klik dan menyembunyikan pilihan
// yang tersedia; dua tombol langsung memperlihatkan keduanya sekaligus
// menandai mana yang sedang aktif.
//
// Labelnya "ID" dan "EN", bukan bendera. Bendera menandai negara, bukan
// bahasa — bahasa Inggris bukan milik satu negara, dan pengunjung dari
// Malaysia atau Singapura tidak perlu disuruh memilih bendera negara lain.

export default function TombolBahasa({ className = '' }) {
  const { bahasa, setBahasa } = useBahasa()

  return (
    <div className={`pilih-bahasa ${className}`} role="group" aria-label="Language / Bahasa">
      {[['id', 'ID', 'Bahasa Indonesia'], ['en', 'EN', 'English']].map(([kode, label, judul]) => (
        <button
          key={kode}
          type="button"
          lang={kode}
          title={judul}
          aria-pressed={bahasa === kode}
          onClick={() => setBahasa(kode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
