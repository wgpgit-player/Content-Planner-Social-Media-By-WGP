import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import TenantSwitcher from './TenantSwitcher'
import Icon from './Icon'

// Navigasi utama. Dikelompokkan per kategori, bukan daftar datar, supaya
// gampang nambah modul baru tanpa bikin sidebar berantakan.
//
// `path: null` berarti halamannya belum dibangun — item tetap tampil (biar
// kelihatan arah roadmap-nya) tapi tidak bisa diklik dan diredupkan.
// `adminOnly: true` berarti item hanya muncul untuk anggota ber-role admin
// di workspace yang sedang aktif.
//
// Ikon memakai penamaan Ionicons v7 (https://ionic.io/ionicons).

const NAV_GROUPS = [
  {
    label: 'Utama',
    items: [
      { icon: 'grid-outline', label: 'Dashboard', path: '/' },
      { icon: 'albums-outline', label: 'Project tracker', path: '/kanban' },
      { icon: 'calendar-outline', label: 'Content calendar', path: '/content-calendar' },
    ],
  },
  {
    label: 'Konten',
    items: [
      { icon: 'bulb-outline', label: 'Bank ide konten', path: '/content-bank' },
      { icon: 'layers-outline', label: 'Content pillar', path: '/content-pillar' },
      { icon: 'chatbubble-ellipses-outline', label: 'Caption formula', path: '/caption-formula' },
      { icon: 'fish-outline', label: 'Hook library', path: '/hook-library' },
      { icon: 'megaphone-outline', label: 'CTA library', path: '/cta-library' },
    ],
  },
  {
    label: 'Analitik',
    items: [
      { icon: 'bar-chart-outline', label: 'Performance tracker', path: '/performance-tracker' },
      { icon: 'speedometer-outline', label: 'KPI', path: '/kpi' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { icon: 'people-outline', label: 'Tim', path: '/team' },
      { icon: 'settings-outline', label: 'Pengaturan', path: '/settings', adminOnly: true },
    ],
  },
  {
    label: 'AI Asisten',
    items: [
      { icon: 'sparkles-outline', label: 'Chat asisten', path: null, badge: 'Segera' },
    ],
  },
]

function Badge({ text }) {
  return (
    <span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
      {text}
    </span>
  )
}

export default function Sidebar() {
  const { user, signOut, isMock } = useAuth()
  const { isAdmin, role } = useTenantContext()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div
      className="sidebar-scroll"
      style={{
        // Menempel di tempatnya dan punya scrollbar sendiri. Sebelumnya sidebar
        // ikut memanjang ke bawah, jadi untuk menjangkau menu paling bawah
        // seluruh halaman harus di-scroll dulu.
        background: 'var(--surface-2)', border: '0.5px solid var(--border)', borderRadius: 16,
        padding: '16px 12px', width: 190,
        position: 'sticky', top: 16,
        maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', overscrollBehavior: 'contain',
        display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)',
      }}
    >
      <TenantSwitcher />

      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.adminOnly || isAdmin)
        if (items.length === 0) return null

        return (
          <div key={group.label}>
            <p className="sidebar-group-label">{group.label.toUpperCase()}</p>
            {items.map((item) =>
              item.path ? (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                  {item.badge && <Badge text={item.badge} />}
                </NavLink>
              ) : (
                <span key={item.label} className="sidebar-item" style={{ opacity: 0.45, cursor: 'default' }}>
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                  {item.badge && <Badge text={item.badge} />}
                </span>
              )
            )}
          </div>
        )
      })}

      {user && (
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', marginBottom: 8 }}>
            <div
              style={{
                width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-bg)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10.5, fontWeight: 600, flexShrink: 0,
              }}
            >
              {(user.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
              <p style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>
                {isMock ? 'Mode preview' : role === 'admin' ? 'Admin' : role === 'staff' ? 'Staff' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-item"
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Icon name="log-out-outline" size={16} />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </div>
  )
}
