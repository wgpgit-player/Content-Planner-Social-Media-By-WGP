import { useState } from 'react'
import Sheet from './Sheet'
import { PLATFORMS } from '../config/platforms'

// Formulir konten baru.
//
// Isinya tidak berubah, tapi wadahnya sekarang Sheet: kotak di tengah pada
// layar lebar, panel yang naik dari bawah di ponsel. Gaya kolom dan tombol
// juga dipindah ke kelas bersama (.input, .select, .btn) dan tidak lagi
// ditulis satu per satu di sini. Selain lebih pendek, itu juga yang membuat
// kolom di ponsel otomatis berukuran 16 piksel — di bawah angka itu, papan
// ketik iOS memperbesar seluruh halaman dan tidak mengembalikannya.
//
// Daftar pillar datang dari pemanggil (halaman Kanban), bukan dari konstanta
// di kode. Ini penting sejak aplikasi jadi white-label: tiap workspace punya
// pillar-nya sendiri, jadi dropdown ini harus menampilkan milik workspace yang
// sedang aktif — bukan daftar bawaan yang sama untuk semua orang.
export default function NewContentModal({ onClose, onSubmit, pillars = [] }) {
  const pillarNames = pillars.map((p) => p.name)
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState(PLATFORMS[0].key)
  const [pillar, setPillar] = useState(pillarNames[0] ?? '')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title: title.trim(),
      platform,
      pillar: pillar || null,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
    })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Konten baru"
      description="Judulnya dulu saja. Brief lengkapnya bisa diisi setelah ini."
      lebar={400}
    >
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="konten-judul">Judul</label>
        <input
          id="konten-judul"
          className="input"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Reels tips buat pemula"
          style={{ marginBottom: 12 }}
        />

        <div className="sheet-kolom" style={{ marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="konten-platform">Platform</label>
            <select
              id="konten-platform"
              className="select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="konten-pillar">Pillar</label>
            <select
              id="konten-pillar"
              className="select"
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              disabled={pillarNames.length === 0}
            >
              {pillarNames.length === 0
                ? <option value="">Belum ada pillar</option>
                : pillarNames.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="sheet-kolom">
          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="konten-tanggal">Tanggal (opsional)</label>
            <input
              id="konten-tanggal"
              className="input"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <label className="field-label" htmlFor="konten-jam">Jam (opsional)</label>
            <input
              id="konten-jam"
              className="input"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
        </div>

        <div className="sheet-aksi">
          <button type="button" onClick={onClose} className="btn">Batal</button>
          <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
            Tambah ke Ide
          </button>
        </div>
      </form>
    </Sheet>
  )
}
