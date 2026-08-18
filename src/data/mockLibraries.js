// Data contoh untuk 3 modul baru hasil riset kompetitor TripleOne
// Studio/CreatorOS (Bab 5.3 roadmap): CTA Library, Caption Formula Library,
// Hook Library. Isinya masih placeholder generik — nanti diisi ulang sesuai
// gaya bahasa ZISWAF CTARSA yang sebenarnya begitu ada waktu riset konten.

export const CTA_LIBRARY = [
  { id: 1, text: 'Yuk, sisihkan sebagian rezeki hari ini — klik link di bio.', goal: 'Donasi' },
  { id: 2, text: 'Simpan postingan ini biar nggak lupa jadwalnya.', goal: 'Engagement' },
  { id: 3, text: 'Bagikan ke temanmu yang butuh info ini.', goal: 'Share' },
  { id: 4, text: 'DM kami buat konsultasi program yang cocok buatmu.', goal: 'Konsultasi' },
  { id: 5, text: 'Follow buat update program mingguan.', goal: 'Follow' },
]

export const CAPTION_FORMULAS = [
  {
    id: 1,
    name: 'Problem — Agitate — Solve',
    goal: 'Edukasi',
    structure: 'Buka dengan masalah yang relate → perbesar dampaknya → tutup dengan solusi program kita.',
  },
  {
    id: 2,
    name: 'Before — After — Bridge',
    goal: 'Testimoni',
    structure: 'Kondisi sebelum dibantu → kondisi sesudah → jembatani ke ajakan donasi/dukungan.',
  },
  {
    id: 3,
    name: 'List singkat + CTA',
    goal: 'Program',
    structure: '3-5 poin manfaat program dalam bullet pendek → tutup CTA jelas.',
  },
]

export const HOOK_LIBRARY = [
  { id: 1, text: 'Kamu tau nggak kalau [fakta mengejutkan tentang zakat]?', category: 'Edukasi' },
  { id: 2, text: 'Ini yang terjadi kalau kamu sedekah [nominal] tiap hari...', category: 'Campaign' },
  { id: 3, text: 'Cerita [nama penerima manfaat] ini bikin kamu mikir ulang soal...', category: 'Testimoni' },
  { id: 4, text: 'Stop scroll — ini alasan kenapa [topik] penting buat kamu.', category: 'Edukasi' },
  { id: 5, text: '3 hal yang jarang orang tau soal wakaf produktif.', category: 'Program' },
]
