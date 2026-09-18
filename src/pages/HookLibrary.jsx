import PerpustakaanPage from '../components/PerpustakaanPage'

// Perpustakaan hook, yaitu kalimat pembuka yang menahan orang dari
// menggulir. Tersimpan di Supabase (library_items, kind = 'hook').
export default function HookLibrary() {
  return (
    <PerpustakaanPage
      kind="hook"
      title="Hook library"
      description="Kalimat pembuka yang menahan orang dari menggulir lewat."
      ikon="fish-outline"
      labelIsi="Teks hook"
      placeholderIsi="Contoh: Kamu tau nggak kalau [fakta mengejutkan soal topikmu]?"
      labelKategori="Kategori"
      placeholderKategori="Contoh: Edukasi, Cerita, Hiburan"
      labelTambah="Hook baru"
    />
  )
}
