import { getPlatform } from '../config/platforms'

// draggable=true + onDragStart pakai HTML5 native drag-and-drop API — cukup
// buat kebutuhan kita, tidak perlu tambah dependency drag-and-drop.
export default function KanbanCard({ item, onDragStart }) {
  const platform = getPlatform(item.platform)
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
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
          <i className={`ti ${platform.icon}`} style={{ fontSize: 11, color: platform.color }} aria-hidden="true" />
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
          <i className="ti ti-calendar" style={{ fontSize: 11 }} aria-hidden="true" />
          {item.scheduledDate}
        </p>
      )}
    </div>
  )
}
