// Satu sumber untuk status konten, mengikuti pola config/platforms.js.
//
// Sebelumnya daftar kolom Kanban ditulis di KanbanBoard.jsx saja, sementara
// Dashboard dan Content calendar memakai string status secara langsung. Itu
// membuat label dan warnanya gampang tidak sinkron begitu ada yang diubah.
//
// Urutannya sengaja sesuai alur kerja, dari ide sampai tayang.

export const STATUSES = [
  { key: 'idea', label: 'Ide', color: '#8A8A96', bg: '#F1F1F4' },
  { key: 'draft', label: 'Draft', color: '#6E6E7A', bg: '#F1F1F4' },
  { key: 'review', label: 'Review', color: '#8A5A12', bg: '#FDF4E6' },
  { key: 'scheduled', label: 'Terjadwal', color: '#4B3FBF', bg: '#EFEDFC' },
  { key: 'published', label: 'Tayang', color: '#2F7D5B', bg: '#EAF6F0' },
]

const BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]))

const FALLBACK = { key: 'unknown', label: 'Tidak diketahui', color: 'var(--text-secondary)', bg: 'var(--surface-1)' }

export function getStatus(key) {
  return BY_KEY[key] ?? FALLBACK
}

// Status yang dianggap "belum tayang", dipakai dashboard untuk menghitung
// pekerjaan yang masih berjalan.
export const ACTIVE_STATUSES = ['idea', 'draft', 'review', 'scheduled']
