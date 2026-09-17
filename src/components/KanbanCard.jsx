import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlatform } from '../config/platforms'
import Icon from './Icon'
import Avatar from './Avatar'

// Kartu konten di papan Kanban.
//
// Kartu punya dua perilaku pada gerakan mouse yang mirip: digeser untuk pindah
// kolom, dan diklik untuk membuka briefnya. Keduanya dibedakan lewat jarak
// gerak kursor antara tombol ditekan dan dilepas. Klik nyaris tidak menggeser
// kursor, sedangkan menggeser pasti berpindah jauh.
//
// Posisi awal disimpan di useRef, bukan variabel biasa. Variabel biasa akan
// hilang setiap kali komponen dirender ulang, dan render bisa terjadi di
// tengah gerakan, sehingga kliknya kadang tidak terbaca.
//
// Garis berwarna di sisi kiri mengikuti warna kolom tempat kartu berada, agar
// kartu tetap terbaca milik tahap mana meski papannya sedang penuh.
export default function KanbanCard({ item, onDragStart, onDragEnd, warnaStatus, sedangDigeser, anggota }) {
  const platform = getPlatform(item.platform)
  const navigate = useNavigate()
  const posisiAwal = useRef(null)

  function selesaiKlik(e) {
    const awal = posisiAwal.current
    posisiAwal.current = null
    if (!awal) return
    const jarak = Math.abs(e.clientX - awal.x) + Math.abs(e.clientY - awal.y)
    if (jarak < 5) navigate(`/content/${item.id}`)
  }

  const adaBrief = Boolean(item.brief && item.brief.trim() !== '')

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragEnd={onDragEnd}
      onMouseDown={(e) => { posisiAwal.current = { x: e.clientX, y: e.clientY } }}
      onMouseUp={selesaiKlik}
      title="Geser untuk pindah kolom, klik untuk membuka brief"
      style={{
        background: 'var(--surface-2)',
        borderRadius: 10,
        padding: '10px 11px',
        marginBottom: 8,
        cursor: 'grab',
        border: '0.5px solid var(--border)',
        borderLeft: `3px solid ${warnaStatus}`,
        boxShadow: 'var(--shadow-sm)',
        opacity: sedangDigeser ? 0.4 : 1,
        transition: 'opacity 0.12s ease, box-shadow 0.12s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        <div
          style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: platform.bg,
          }}
        >
          <Icon name={platform.icon} size={11} color={platform.color} />
        </div>
        {item.pillar && (
          <span
            style={{
              fontSize: 10, color: 'var(--text-secondary)', background: 'var(--surface-1)',
              border: '0.5px solid var(--border)', padding: '1px 6px', borderRadius: 5,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110,
            }}
          >
            {item.pillar}
          </span>
        )}
        {!adaBrief && (
          <span
            title="Brief belum diisi"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}
          >
            <Icon name="alert-circle-outline" size={13} color="var(--warning)" />
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, marginBottom: item.scheduledDate ? 5 : 0, lineHeight: 1.4 }}>
        {item.title}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        {item.scheduledDate && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="calendar-outline" size={11} />
            {item.scheduledDate}
          </p>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex' }}>
          <Avatar anggota={anggota} size={20} />
        </span>
      </div>
    </div>
  )
}
