import { PILLAR_NAMES } from '../config/pillars'

// Sumber data bersama dipakai Kanban, Content calendar, dan halaman lain
// yang butuh daftar konten yang sama — biar tidak ada 3 versi mock data
// yang saling beda begitu ada 3 halaman. Field-nya mengikuti kolom
// content_items di fase1_skema_supabase.sql, jadi begitu Supabase connect,
// tinggal ganti file ini dengan hasil query, struktur pemakainya sama.

export const CONTENT_ITEMS = [
  { id: 1, title: 'Ide donasi Jumat berkah', platform: 'instagram', pillar: 'Edukasi', status: 'idea', scheduledDate: null },
  { id: 2, title: 'Reels tips zakat', platform: 'instagram', pillar: 'Edukasi', status: 'draft', scheduledDate: null },
  { id: 3, title: 'Carousel wakaf produktif', platform: 'instagram', pillar: 'Program', status: 'draft', scheduledDate: null },
  { id: 4, title: 'Caption ramadhan', platform: 'instagram', pillar: 'Campaign', status: 'review', scheduledDate: '2026-08-18' },
  { id: 5, title: 'TikTok testimoni donatur', platform: 'tiktok', pillar: 'Testimoni', status: 'scheduled', scheduledDate: '2026-08-19' },
  { id: 6, title: 'Behind the scenes tim', platform: 'tiktok', pillar: 'Behind the scenes', status: 'scheduled', scheduledDate: '2026-08-20' },
  { id: 7, title: 'Laporan mingguan donatur', platform: 'instagram', pillar: 'Report', status: 'published', scheduledDate: '2026-08-11' },
]

export const CONTENT_BANK_ITEMS = [
  { id: 101, ideaText: 'Reels "3 cara sedekah dari rumah"', pillar: 'Edukasi', status: 'open' },
  { id: 102, ideaText: 'Carousel testimoni penerima manfaat Q3', pillar: 'Testimoni', status: 'open' },
  { id: 103, ideaText: 'Infografis laporan penyaluran bulanan', pillar: 'Report', status: 'used' },
  { id: 104, ideaText: 'TikTok tantangan #SedekahHarian', pillar: 'Campaign', status: 'open' },
  { id: 105, ideaText: 'Q&A seputar zakat penghasilan', pillar: 'Edukasi', status: 'archived' },
]

// Re-export biar file yang sudah import { PILLARS } dari sini tetap jalan
// tanpa perlu ubah semua import — sumber aslinya tetap config/pillars.js.
export const PILLARS = PILLAR_NAMES
