// Pillar contoh untuk mode preview (saat aplikasi belum tersambung ke
// Supabase). Begitu tersambung, semua halaman membaca pillar asli dari tabel
// content_pillars milik workspace yang sedang aktif — daftar di bawah tidak
// dipakai lagi.
//
// Isinya sengaja generik: aplikasi ini white-label, jadi contoh yang condong
// ke satu jenis bisnis akan menyesatkan. Pillar awal yang sesungguhnya dipilih
// user di wizard onboarding, lihat config/pillarTemplates.js.

export { PILLAR_COLOR_CHOICES } from './pillarTemplates'

export const INITIAL_PILLARS = [
  { id: 1, name: 'Edukasi', color: '#6B5EE0', description: 'Konten yang mengajarkan sesuatu ke audiens' },
  { id: 2, name: 'Promosi', color: '#EC5FA0', description: 'Penawaran, produk, dan ajakan membeli' },
  { id: 3, name: 'Cerita', color: '#5DCAA5', description: 'Kisah pelanggan, tim, atau perjalanan brand' },
  { id: 4, name: 'Hiburan', color: '#EF9F27', description: 'Konten ringan untuk menjaga engagement' },
]

export const PILLAR_NAMES = INITIAL_PILLARS.map((p) => p.name)
