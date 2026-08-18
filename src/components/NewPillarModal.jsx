import { useState } from 'react'
import { PILLAR_COLOR_CHOICES } from '../config/pillars'

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
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.35)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }} onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 14, padding: 20, width: 360 }}
      >
        <p style={{ fontWeight: 500, fontSize: 14, margin: '0 0 14px' }}>Pillar baru</p>

        <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nama pillar</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Ajakan wakaf tunai"
          style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, marginBottom: 12, boxSizing: 'border-box' }}
        />

        <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Deskripsi singkat</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Buat apa pillar ini dipakai"
          style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, marginBottom: 12, boxSizing: 'border-box' }}
        />

        <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Warna label</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {PILLAR_COLOR_CHOICES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Pilih warna ${c}`}
              style={{
                width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
                border: color === c ? '2px solid var(--text-primary)' : '0.5px solid var(--border)',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Batal
          </button>
          <button type="submit" style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
            Tambah pillar
          </button>
        </div>
      </form>
    </div>
  )
}
