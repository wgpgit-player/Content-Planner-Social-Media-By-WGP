import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlatform } from '../config/platforms'
import { useTenantContext } from '../context/TenantContext'
import { useTaskNotification } from '../context/NotificationContext'
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
  const { isAdmin } = useTenantContext()
  const { sendAdminRing } = useTaskNotification()
  const [rung, setRung] = useState(false)

  async function handleSenggol(e) {
    e.stopPropagation()
    if (rung || !item.assigneeId) return
    setRung(true)
    await sendAdminRing({
      taskId: item.id,
      taskTitle: item.title,
      assigneeId: item.assigneeId,
    })
    setTimeout(() => setRung(false), 20000)
  }

  function selesaiKlik(e) {
    const awal = posisiAwal.current
    posisiAwal.current = null
    if (!awal) return
    const jarak = Math.abs(e.clientX - awal.x) + Math.abs(e.clientY - awal.y)
    if (jarak < 5) navigate(`/worksheet?id=${item.id}`)
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {isAdmin && item.assigneeId && item.status !== 'published' && item.status !== 'archived' && (
            <button
              type="button"
              onClick={handleSenggol}
              disabled={rung}
              title={rung ? 'Tersenggol!' : `Senggol ${anggota ? (anggota.full_name || anggota.email) : 'staf'}`}
              style={{
                border: 'none',
                background: rung ? '#e2e8f0' : 'rgba(245, 158, 11, 0.15)',
                color: rung ? '#94a3b8' : '#d97706',
                borderRadius: 6,
                padding: '2px 5px',
                cursor: rung ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 1,
              }}
            >
              <Icon name="notifications" size={11} />
            </button>
          )}
          <Avatar anggota={anggota} size={20} />
        </div>
      </div>
    </div>
  )
}
