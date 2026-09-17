import { inisial, namaAnggota, warnaAnggota } from '../lib/useTenantMembers'

// Lingkaran berinisial untuk menandai siapa penanggung jawab sebuah konten.
//
// Warnanya diturunkan dari id anggota, jadi satu orang selalu tampil dengan
// warna yang sama di kartu Kanban, daftar jadwal, dan ringkasan beban kerja.
// Itu membuat orang bisa dikenali sekilas tanpa harus membaca namanya.
export default function Avatar({ anggota, size = 22, kosongJikaTanpaOrang = false }) {
  if (!anggota) {
    if (kosongJikaTanpaOrang) return null
    return (
      <div
        title="Belum ditugaskan"
        style={{
          width: size, height: size, borderRadius: '50%', flexShrink: 0,
          border: '1px dashed var(--border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.5, color: 'var(--text-muted)', lineHeight: 1,
        }}
      >
        ?
      </div>
    )
  }

  return (
    <div
      title={namaAnggota(anggota)}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: warnaAnggota(anggota.user_id),
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.44, fontWeight: 600, lineHeight: 1,
      }}
    >
      {inisial(anggota)}
    </div>
  )
}
