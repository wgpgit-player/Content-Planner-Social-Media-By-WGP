// Template content pillar yang ditawarkan saat onboarding workspace baru.
//
// Sebelumnya aplikasi ini nge-seed 6 pillar khas lembaga ZISWAF langsung ke
// setiap tenant. Begitu produknya jadi white-label dan dipakai siapa saja,
// itu jadi asumsi yang salah — agency e-commerce tidak butuh pillar "Program
// penyaluran". Jadi sekarang pillar awal dipilih user di wizard onboarding,
// dan tetap bisa diedit/dihapus kapan saja di halaman Content pillar.
//
// Isi array ini dikirim apa adanya sebagai argumen p_pillars ke RPC
// create_tenant_for_current_user() di Supabase.

export const PILLAR_COLOR_CHOICES = [
  '#6B5EE0', '#378ADD', '#EC5FA0', '#5DCAA5', '#EF9F27', '#B4B2A9', '#D4537E', '#639922',
]

export const PILLAR_TEMPLATES = [
  {
    key: 'blank',
    label: 'Mulai kosong',
    description: 'Atur sendiri pillar dari nol.',
    icon: 'ellipse-outline',
    pillars: [],
  },
  {
    key: 'general',
    label: 'Umum',
    description: 'Kerangka dasar yang cocok untuk hampir semua brand.',
    icon: 'grid-outline',
    pillars: [
      { name: 'Edukasi', color: '#6B5EE0', description: 'Konten yang mengajarkan sesuatu ke audiens' },
      { name: 'Promosi', color: '#EC5FA0', description: 'Penawaran, produk, dan ajakan membeli' },
      { name: 'Cerita', color: '#5DCAA5', description: 'Kisah pelanggan, tim, atau perjalanan brand' },
      { name: 'Hiburan', color: '#EF9F27', description: 'Konten ringan untuk menjaga engagement' },
    ],
  },
  {
    key: 'ecommerce',
    label: 'E-commerce / Retail',
    description: 'Fokus ke katalog produk, promo, dan bukti sosial.',
    icon: 'bag-handle-outline',
    pillars: [
      { name: 'Produk', color: '#6B5EE0', description: 'Sorotan produk, fitur, dan varian' },
      { name: 'Promo', color: '#EC5FA0', description: 'Diskon, bundling, dan campaign musiman' },
      { name: 'Ulasan pelanggan', color: '#5DCAA5', description: 'Testimoni dan user generated content' },
      { name: 'Tips pakai', color: '#378ADD', description: 'Cara pakai, perawatan, dan inspirasi' },
      { name: 'Behind the scenes', color: '#EF9F27', description: 'Proses produksi dan aktivitas tim' },
    ],
  },
  {
    key: 'nonprofit',
    label: 'Lembaga sosial / Nonprofit',
    description: 'Untuk lembaga zakat, yayasan, dan penggalangan dana.',
    icon: 'heart-outline',
    pillars: [
      { name: 'Edukasi', color: '#6B5EE0', description: 'Penjelasan ringkas soal isu dan program' },
      { name: 'Program', color: '#378ADD', description: 'Update penyaluran dan penerima manfaat' },
      { name: 'Campaign', color: '#EC5FA0', description: 'Konten momen khusus dan penggalangan dana' },
      { name: 'Testimoni', color: '#5DCAA5', description: 'Cerita donatur dan penerima manfaat' },
      { name: 'Behind the scenes', color: '#EF9F27', description: 'Aktivitas tim di balik layar' },
      { name: 'Laporan', color: '#B4B2A9', description: 'Laporan berkala dan transparansi dana' },
    ],
  },
  {
    key: 'personal',
    label: 'Personal brand / Kreator',
    description: 'Untuk kreator, konsultan, dan profesional independen.',
    icon: 'person-outline',
    pillars: [
      { name: 'Insight', color: '#6B5EE0', description: 'Pemikiran dan sudut pandang di bidangmu' },
      { name: 'Perjalanan', color: '#5DCAA5', description: 'Proses, kegagalan, dan pelajaran pribadi' },
      { name: 'Tips praktis', color: '#378ADD', description: 'Langkah konkret yang bisa langsung dipakai' },
      { name: 'Penawaran', color: '#EC5FA0', description: 'Jasa, produk digital, dan kolaborasi' },
    ],
  },
  {
    key: 'agency',
    label: 'Agency / B2B',
    description: 'Untuk agensi dan bisnis yang menjual jasa ke bisnis lain.',
    icon: 'briefcase-outline',
    pillars: [
      { name: 'Studi kasus', color: '#6B5EE0', description: 'Hasil nyata dari pekerjaan untuk klien' },
      { name: 'Keahlian', color: '#378ADD', description: 'Demonstrasi kapabilitas dan metode kerja' },
      { name: 'Tren industri', color: '#EF9F27', description: 'Pembacaan pasar dan perubahan platform' },
      { name: 'Budaya tim', color: '#5DCAA5', description: 'Orang di balik agensi dan cara kerjanya' },
      { name: 'Penawaran', color: '#EC5FA0', description: 'Layanan, paket, dan ajakan konsultasi' },
    ],
  },
]

export function getPillarTemplate(key) {
  return PILLAR_TEMPLATES.find((t) => t.key === key) ?? PILLAR_TEMPLATES[0]
}
