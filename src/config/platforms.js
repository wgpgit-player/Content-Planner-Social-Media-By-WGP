// Satu-satunya sumber daftar platform sosial media yang didukung aplikasi.
// Semua komponen (KanbanCard, Content calendar, Dashboard, Performance
// tracker, form tambah konten) baca dari sini lewat getPlatform(key) —
// jadi nambah platform baru cukup tambah 1 entri di bawah, tidak perlu
// ubah kode di banyak file/halaman.
//
// Kalau nanti Supabase connect: kolom `platform` di tabel content_items
// (fase1_skema_supabase.sql) juga perlu diperbarui check constraint-nya
// biar sinkron dengan daftar ini.

export const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: 'ti-brand-instagram', color: 'var(--accent)', bg: 'var(--accent-bg)' },
  { key: 'tiktok', label: 'TikTok', icon: 'ti-brand-tiktok', color: 'var(--pink)', bg: 'var(--pink-bg)' },
  { key: 'facebook', label: 'Facebook', icon: 'ti-brand-facebook', color: '#185FA5', bg: '#E6F1FB' },
  { key: 'youtube', label: 'YouTube', icon: 'ti-brand-youtube', color: '#A32D2D', bg: '#FCEBEB' },
  { key: 'twitter', label: 'X (Twitter)', icon: 'ti-brand-x', color: '#2C2C2A', bg: '#F1EFE8' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'ti-brand-linkedin', color: '#0C447C', bg: '#E6F1FB' },
  { key: 'threads', label: 'Threads', icon: 'ti-brand-threads', color: '#444441', bg: '#F1EFE8' },
]

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]))

// Fallback abu-abu generik kalau ada data lama pakai key platform yang
// belum terdaftar di atas — biar tidak crash, cuma tampil polos.
const FALLBACK = { key: 'other', label: 'Lainnya', icon: 'ti-share', color: 'var(--text-secondary)', bg: 'var(--surface-1)' }

export function getPlatform(key) {
  return PLATFORM_MAP[key] || FALLBACK
}
