import { useState } from 'react'
import { PILLARS } from '../data/mockContentItems'
import { PLATFORMS } from '../config/platforms'

// Modal sederhana pakai normal-flow overlay (bukan position:fixed) biar
// konsisten sama pola yang aman dipakai di widget preview sebelumnya, dan
// gampang dites. Submit cuma push ke state lokal — begitu Supabase connect,
// ganti onSubmit supaya insert ke tabel content_items.
export default function NewContentModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState(PLATFORMS[0].key)
  const [pillar, setPillar] = useState(PILLARS[0])
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ title: title.trim(), platform, pillar, scheduledDate: scheduledDate || null, scheduledTime: scheduledTime || null })
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
        <p style={{ fontWeight: 500, fontSize: 14, margin: '0 0 14px' }}>Konten baru</p>

        <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Judul</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Reels tips sedekah subuh"
          style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, marginBottom: 12, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Platform</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}>
              {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Pillar</label>
            <select value={pillar} onChange={(e) => setPillar(e.target.value)} style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5 }}>
              {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Tanggal (opsional)</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Jam (opsional)</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Batal
          </button>
          <button type="submit" style={{ fontSize: 12.5, padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
            Tambah ke Ide
          </button>
        </div>
      </form>
    </div>
  )
}
