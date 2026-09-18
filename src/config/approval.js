// Status persetujuan, terpusat di satu tempat seperti config/statuses.js.
//
// Persetujuan sengaja dipisah dari status pengerjaan (idea..published).
// Keduanya menjawab pertanyaan yang berbeda: status menjawab "sudah sampai
// mana", persetujuan menjawab "sudah boleh tayang atau belum". Sebuah konten
// bisa berstatus review sambil belum diajukan, sudah diajukan, sudah
// disetujui, atau diminta revisi. Kalau keempatnya dijejalkan ke kolom
// status, jumlah kolom Kanban berlipat dan papannya jadi tidak terbaca.
//
// Warnanya dipilih supaya tetap lolos kontras WCAG AA di atas latar putih,
// sama seperti warna status.

export const APPROVAL_STATES = [
  {
    key: 'none',
    label: 'Belum diajukan',
    short: 'Draf',
    color: '#6B7280',
    bg: '#F3F4F6',
    icon: 'ellipse-outline',
  },
  {
    key: 'pending',
    label: 'Menunggu persetujuan',
    short: 'Menunggu',
    color: '#9A5B0E',
    bg: '#FDF4E6',
    icon: 'time-outline',
  },
  {
    key: 'approved',
    label: 'Disetujui',
    short: 'Disetujui',
    color: '#1F7A55',
    bg: '#EAF6F0',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'changes_requested',
    label: 'Diminta revisi',
    short: 'Revisi',
    color: '#A33333',
    bg: '#FBEDED',
    icon: 'arrow-undo-outline',
  },
]

const PETA = Object.fromEntries(APPROVAL_STATES.map((s) => [s.key, s]))

export function getApproval(key) {
  return PETA[key] ?? PETA.none
}

// Label keputusan untuk riwayat. Dipisah dari status karena "submitted"
// adalah kejadian, bukan keadaan — ia muncul di riwayat tapi tidak pernah
// jadi nilai approval_state.
export const KEPUTUSAN_LABEL = {
  submitted: 'Diajukan untuk ditinjau',
  approved: 'Disetujui',
  changes_requested: 'Diminta revisi',
}
