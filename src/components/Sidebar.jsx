import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Struktur sidebar hasil riset kompetitor TripleOne Studio/CreatorOS (Bab 5
// dokumen roadmap + diskusi Fase 2). Dikelompokkan per kategori, bukan daftar
// datar, biar gampang nambah modul baru (Caption formula, Hook library, CTA
// library) tanpa bikin sidebar berantakan.
//
// `path: null` berarti halamannya belum dibangun — item tetap tampil (biar
// kelihatan roadmap lengkapnya) tapi tidak bisa diklik dan diberi opacity redup.

const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard', path: '/' },
      { icon: 'ti-layout-kanban', label: 'Project tracker', path: '/kanban' },
      { icon: 'ti-calendar', label: 'Content calendar', path: '/content-calendar' },
    ],
  },
  {
    label: 'Konten',
    items: [
      { icon: 'ti-bulb', label: 'Bank ide konten', path: '/content-bank' },
      { icon: 'ti-stack-2', label: 'Content pillar', path: '/content-pillar' },
      { icon: 'ti-message-2', label: 'Caption formula', path: '/caption-formula', badge: 'baru' },
      { icon: 'ti-fishhook', label: 'Hook library', path: '/hook-library', badge: 'baru' },
      { icon: 'ti-click', label: 'CTA library', path: '/cta-library', badge: 'baru' },
    ],
  },
  {
    label: 'Analitik',
    items: [
      { icon: 'ti-chart-bar', label: 'Performance tracker', path: '/performance-tracker' },
      { icon: 'ti-target-arrow', label: 'KPI', path: '/kpi' },
    ],
  },
  {
    label: 'AI Asisten',
    items: [
      { icon: 'ti-message-chatbot', label: 'Chat asisten', path: null, badge: 'Fase 5', badgeTone: 'accent' },
    ],
  },
]

function Badge({ text, tone }) {
  const bg = tone === 'accent' ? 'var(--accent-bg)' : 'var(--warning-bg)'
  const color = tone === 'accent' ? 'var(--accent)' : 'var(--warning)'
  return <span className="badge" style={{ background: bg, color }}>{text}</span>
}

export default function Sidebar() {
  const { user, signOut, isMock } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '16px 12px', width: 190, height: 'fit-content', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '0 4px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#7C6FF0,#EC5FA0)' }} />
        <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>Content Planner</span>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="sidebar-group-label">{group.label.toUpperCase()}</p>
          {group.items.map((item) =>
            item.path ? (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
              >
                <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && <Badge text={item.badge} tone={item.badgeTone} />}
              </NavLink>
            ) : (
              <span key={item.label} className="sidebar-item" style={{ opacity: 0.45, cursor: 'default' }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge && <Badge text={item.badge} tone={item.badgeTone} />}
              </span>
            )
          )}
        </div>
      ))}

      {user && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', marginBottom: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 500, flexShrink: 0,
            }}>
              {(user.name || user.email || '?')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 11.5, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
              {isMock && <p style={{ fontSize: 9.5, margin: 0, color: 'var(--text-muted)' }}>Mode preview</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-item"
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <i className="ti ti-logout" style={{ fontSize: 15 }} aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </div>
  )
}
