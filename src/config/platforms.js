// Satu-satunya sumber daftar platform sosial media yang didukung aplikasi.
// Semua komponen (KanbanCard, Content calendar, Dashboard, Performance
// tracker, form tambah konten) baca dari sini lewat getPlatform(key) —
// jadi nambah platform baru cukup tambah 1 entri di bawah, tidak perlu
// ubah kode di banyak file/halaman.
//
// Nama ikon memakai penamaan Ionicons v7 (https://ionic.io/ionicons).
// Catatan: Ionicons tidak punya logo resmi untuk Threads, jadi dipakai
// 'at-circle-outline' yang bentuknya paling mendekati.
//
// Kalau nambah platform di sini, check constraint kolom `platform` di tabel
// content_items juga perlu diperbarui biar sinkron.

export const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: 'var(--accent)', bg: 'var(--accent-bg)' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: 'var(--pink)', bg: 'var(--pink-bg)' },
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook', color: '#185FA5', bg: '#E6F1FB' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#A32D2D', bg: '#FCEBEB' },
  { key: 'twitter', label: 'X (Twitter)', icon: 'logo-twitter', color: '#2C2C2A', bg: '#F1EFE8' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin', color: '#0C447C', bg: '#E6F1FB' },
  { key: 'threads', label: 'Threads', icon: 'at-circle-outline', color: '#444441', bg: '#F1EFE8' },
]

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.key, p]))

// Fallback abu-abu generik kalau ada data lama pakai key platform yang
// belum terdaftar di atas — biar tidak crash, cuma tampil polos.
const FALLBACK = { key: 'other', label: 'Lainnya', icon: 'share-social-outline', color: 'var(--text-secondary)', bg: 'var(--surface-1)' }

export function getPlatform(key) {
  return PLATFORM_MAP[key] || FALLBACK
}
