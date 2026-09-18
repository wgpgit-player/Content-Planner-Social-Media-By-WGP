import PerpustakaanPage from '../components/PerpustakaanPage'

// Perpustakaan CTA. Seluruh isinya kini tersimpan di Supabase
// (tabel library_items, kind = 'cta'), bukan lagi data contoh di kode.
// Tampilan dan perilakunya ada di components/PerpustakaanPage.jsx, dipakai
// bersama dengan Hook library dan Caption formula.
export default function CtaLibrary() {
  return (
    <PerpustakaanPage
      kind="cta"
      title="CTA library"
      description="Ajakan bertindak siap pakai, dikelompokkan per tujuan konten."
      ikon="megaphone-outline"
      labelIsi="Teks CTA"
      placeholderIsi="Contoh: Klik link di bio buat lihat selengkapnya."
      labelKategori="Tujuan"
      placeholderKategori="Contoh: Trafik, Follow, Share"
      labelTambah="CTA baru"
    />
  )
}
