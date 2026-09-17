// Satu sumber untuk status konten, mengikuti pola config/platforms.js.
//
// Sebelumnya daftar kolom Kanban ditulis di KanbanBoard.jsx saja, sementara
// Dashboard dan Content calendar memakai string status secara langsung. Itu
// membuat label dan warnanya gampang tidak sinkron begitu ada yang diubah.
//
// Urutannya sengaja sesuai alur kerja, dari ide sampai tayang.

// Tiap tahap punya warna sendiri yang jelas berbeda satu sama lain. Versi
// sebelumnya memberi Ide dan Draft warna abu-abu yang nyaris sama, sehingga
// dua kolom pertama di papan Kanban sulit dibedakan sekilas.
//
// Warna di sini sengaja tidak mengikuti warna brand tenant. Ia menandakan
// tahap pengerjaan, bukan identitas merek, dan artinya harus tetap sama di
// semua ruang kerja.
export const STATUSES = [
  { key: 'idea', label: 'Ide', color: '#6B7280', bg: '#F1F2F4' },
  { key: 'draft', label: 'Draft', color: '#2563A8', bg: '#E7F0FA' },
  { key: 'review', label: 'Review', color: '#9A5B0E', bg: '#FDF3E4' },
  { key: 'scheduled', label: 'Terjadwal', color: '#5B44C4', bg: '#EEEBFB' },
  { key: 'published', label: 'Tayang', color: '#1F7A55', bg: '#E6F5EE' },
]

const BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]))

const FALLBACK = { key: 'unknown', label: 'Tidak diketahui', color: 'var(--text-secondary)', bg: 'var(--surface-1)' }

export function getStatus(key) {
  return BY_KEY[key] ?? FALLBACK
}

// Status yang dianggap "belum tayang", dipakai dashboard untuk menghitung
// pekerjaan yang masih berjalan.
export const ACTIVE_STATUSES = ['idea', 'draft', 'review', 'scheduled']
