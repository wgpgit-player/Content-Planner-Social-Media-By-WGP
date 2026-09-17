// Data contoh untuk 3 modul library: CTA, Caption Formula, dan Hook.
//
// Isinya sengaja generik dan lintas industri, bukan condong ke satu jenis
// bisnis — aplikasi ini dipakai banyak brand yang berbeda, jadi contoh yang
// terlalu spesifik justru bikin bingung penggunanya. Bagian dalam kurung siku
// adalah bagian yang diisi sendiri sesuai konteks masing-masing.
//
// CATATAN: ketiga modul ini masih memakai data contoh di sini dan belum
// tersambung ke Supabase. Tabelnya belum dibuat, jadi item yang ditambahkan
// user hilang saat halaman di-reload. Ini satu-satunya modul yang tersisa
// dalam kondisi begini.

export const CTA_LIBRARY = [
  { id: 1, text: 'Klik link di bio buat lihat selengkapnya.', goal: 'Trafik' },
  { id: 2, text: 'Simpan postingan ini biar nggak lupa.', goal: 'Engagement' },
  { id: 3, text: 'Bagikan ke temanmu yang lagi butuh info ini.', goal: 'Share' },
  { id: 4, text: 'DM kami buat tanya-tanya dulu, gratis.', goal: 'Konsultasi' },
  { id: 5, text: 'Follow buat update tiap minggu.', goal: 'Follow' },
]

export const CAPTION_FORMULAS = [
  {
    id: 1,
    name: 'Problem — Agitate — Solve',
    goal: 'Edukasi',
    structure: 'Buka dengan masalah yang relate → perbesar dampaknya → tutup dengan solusi yang kamu tawarkan.',
  },
  {
    id: 2,
    name: 'Before — After — Bridge',
    goal: 'Testimoni',
    structure: 'Kondisi sebelum → kondisi sesudah → jembatani ke ajakan bertindak.',
  },
  {
    id: 3,
    name: 'List singkat + CTA',
    goal: 'Promosi',
    structure: '3-5 poin manfaat dalam bullet pendek → tutup dengan CTA yang jelas.',
  },
]

export const HOOK_LIBRARY = [
  { id: 1, text: 'Kamu tau nggak kalau [fakta mengejutkan soal topikmu]?', category: 'Edukasi' },
  { id: 2, text: 'Ini yang terjadi kalau kamu [kebiasaan kecil] tiap hari...', category: 'Edukasi' },
  { id: 3, text: 'Cerita [nama] ini bikin kamu mikir ulang soal [topik].', category: 'Cerita' },
  { id: 4, text: 'Stop scroll — ini alasan kenapa [topik] penting buat kamu.', category: 'Hiburan' },
  { id: 5, text: '3 hal yang jarang orang tau soal [topikmu].', category: 'Edukasi' },
]
