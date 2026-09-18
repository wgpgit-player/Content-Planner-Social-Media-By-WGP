import PerpustakaanPage from '../components/PerpustakaanPage'

// Perpustakaan formula caption. Satu-satunya dari ketiga perpustakaan yang
// punya nama terpisah dari isinya — sebuah formula tanpa nama tidak bisa
// dibedakan satu dari yang lain di daftar, jadi namanya diwajibkan, dan
// database pun menegakkannya lewat constraint
// library_items_formula_wajib_bernama.
export default function CaptionFormulaLibrary() {
  return (
    <PerpustakaanPage
      kind="caption_formula"
      title="Caption formula"
      description="Kerangka caption yang bisa dipakai ulang, bukan caption jadi."
      ikon="chatbubble-ellipses-outline"
      pakaiNama
      labelNama="Nama formula"
      placeholderNama="Contoh: Masalah — Perbesar — Solusi"
      labelIsi="Struktur"
      placeholderIsi="Jelaskan urutannya. Contoh: buka dengan masalah yang relate → perbesar dampaknya → tutup dengan solusi."
      labelKategori="Tujuan"
      placeholderKategori="Contoh: Edukasi, Testimoni, Promosi"
      labelTambah="Formula baru"
    />
  )
}
