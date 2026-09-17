import { useNavigate } from 'react-router-dom'
import { getPlatform } from '../config/platforms'
import Icon from './Icon'

// draggable=true + onDragStart pakai HTML5 native drag-and-drop API — cukup
// buat kebutuhan kita, tidak perlu tambah dependency drag-and-drop.
export default function KanbanCard({ item, onDragStart }) {
  const platform = getPlatform(item.platform)
  const navigate = useNavigate()

  // Drag untuk memindah kolom, klik untuk membuka briefnya. Dibedakan lewat
  // jarak geser: klik biasa hampir tidak menggeser kursor, sedangkan drag
  // pasti bergerak jauh. Tanpa ini, setiap kali kartu di-drag halaman ikut
  // berpindah ke detail begitu tombol dilepas.
  let mulai = null
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onMouseDown={(e) => { mulai = { x: e.clientX, y: e.clientY } }}
      onMouseUp={(e) => {
        if (!mulai) return
        const geser = Math.abs(e.clientX - mulai.x) + Math.abs(e.clientY - mulai.y)
        mulai = null
        if (geser < 5) navigate(`/content/${item.id}`)
      }}
      title="Klik untuk membuka brief"
      style={{
        background: 'var(--surface-1)', borderRadius: 10, padding: 10, marginBottom: 8,
        cursor: 'grab', border: '0.5px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: platform.bg,
        }}>
          <Icon name={platform.icon} size={11} color={platform.color} />
        </div>
        {item.pillar && (
          <span style={{ fontSize: 10, color: 'var(--text-secondary)', background: '#fff', border: '0.5px solid var(--border)', padding: '1px 6px', borderRadius: 5 }}>
            {item.pillar}
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, margin: '0 0 4px', color: 'var(--text-primary)' }}>{item.title}</p>
      {item.scheduledDate && (
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="calendar-outline" size={11} />
          {item.scheduledDate}
        </p>
      )}
    </div>
  )
}
