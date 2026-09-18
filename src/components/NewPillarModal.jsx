import { useState } from 'react'
import Sheet from './Sheet'
import { PILLAR_COLOR_CHOICES } from '../config/pillars'

// Formulir pillar baru. Wadahnya Sheet, alasannya sama seperti di
// NewContentModal.jsx.
export default function NewPillarModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PILLAR_COLOR_CHOICES[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim(), color })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Pillar baru"
      description="Pillar adalah tema besar yang jadi payung konten-konten kamu."
      lebar={400}
    >
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="pillar-nama">Nama pillar</label>
        <input
          id="pillar-nama"
          className="input"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Edukasi produk"
          style={{ marginBottom: 12 }}
        />

        <label className="field-label" htmlFor="pillar-deskripsi">Deskripsi singkat</label>
        <input
          id="pillar-deskripsi"
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Buat apa pillar ini dipakai"
          style={{ marginBottom: 14 }}
        />

        <p className="field-label">Warna label</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PILLAR_COLOR_CHOICES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Pilih warna ${c}`}
              aria-pressed={color === c}
              style={{
                // Kotak ketuknya 34 piksel walau bulatan warnanya lebih
                // kecil. Titik 22 piksel terlalu kecil untuk dibidik jempol,
                // dan itu jenis kegagalan yang orang salahkan pada dirinya
                // sendiri, bukan pada aplikasinya.
                width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', padding: 0,
                border: color === c ? `2px solid ${c}` : '0.5px solid var(--border)',
              }}
            >
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: c, display: 'block' }} />
            </button>
          ))}
        </div>

        <div className="sheet-aksi">
          <button type="button" onClick={onClose} className="btn">Batal</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Tambah pillar
          </button>
        </div>
      </form>
    </Sheet>
  )
}
