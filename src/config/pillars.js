// Satu-satunya sumber daftar pillar konten — sama polanya dengan
// config/platforms.js. Sebelumnya nama pillar dobel-didefinisikan di
// mockContentItems.js (buat dropdown) dan mockPillarsAndMetrics.js (buat
// halaman Content Pillar), jadi rawan beda kalau salah satu diubah tanpa
// ubah yang lain. Sekarang keduanya baca dari sini.
//
// CATATAN: ini masih "initial value" statis, bukan state global — kalau
// pillar baru ditambah di halaman Content Pillar, dropdown di halaman lain
// (Bank ide, form Kanban) tidak otomatis ikut update sampai reload, sama
// seperti keterbatasan Kanban/Content-calendar yang sudah dicatat sebelumnya.
// Beres permanen begitu Supabase connect dan semua halaman baca dari tabel
// content_pillars yang sama.

export const INITIAL_PILLARS = [
  { id: 1, name: 'Edukasi', color: '#7C6FF0', description: 'Konten yang menjelaskan zakat/wakaf/sedekah secara ringkas' },
  { id: 2, name: 'Program', color: '#378ADD', description: 'Update program penyaluran dan penerima manfaat' },
  { id: 3, name: 'Campaign', color: '#EC5FA0', description: 'Konten momen khusus (Ramadhan, Qurban, dst)' },
  { id: 4, name: 'Testimoni', color: '#5DCAA5', description: 'Cerita donatur dan penerima manfaat' },
  { id: 5, name: 'Behind the scenes', color: '#EF9F27', description: 'Aktivitas tim di balik layar' },
  { id: 6, name: 'Report', color: '#B4B2A9', description: 'Laporan mingguan/bulanan penyaluran dana' },
]

export const PILLAR_NAMES = INITIAL_PILLARS.map((p) => p.name)

export const PILLAR_COLOR_CHOICES = ['#7C6FF0', '#378ADD', '#EC5FA0', '#5DCAA5', '#EF9F27', '#B4B2A9', '#D4537E', '#639922']
