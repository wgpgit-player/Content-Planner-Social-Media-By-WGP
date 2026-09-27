import BrandLogo from './BrandLogo'
import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import TenantSwitcher from './TenantSwitcher'
import CreatePostModal from './CreatePostModal'
import Icon from './Icon'
import { useOperator } from '../lib/useOperator'

// Shared navigation keeps desktop and mobile destinations consistent.
export const NAV_GROUPS = [
  { label: 'Utama', items: [
    {icon:'home-outline',label:'Home',path:'/home'},
    {icon:'create-outline',label:'Susun konten',path:'/compose'},
    {icon:'calendar-outline',label:'Kalender konten',path:'/content-calendar'},
    {icon:'apps-outline',label:'Pratinjau feed',path:'/grid'},
  ]},
  { label: 'Alat kreatif', items: [
    {icon:'bulb-outline',label:'Ide konten',path:'/content-bank'},
    {icon:'compass-outline',label:'Template & strategi',path:'/strategy'},
    {icon:'images-outline',label:'Koleksi media',path:'/media'},
  ]},
  { label: 'Pustaka konten', items: [
    {icon:'layers-outline',label:'Pilar konten',path:'/content-pillar'},
    {icon:'chatbubble-ellipses-outline',label:'Formula caption',path:'/caption-formula'},
    {icon:'fish-outline',label:'Pustaka hook',path:'/hook-library'},
    {icon:'megaphone-outline',label:'Pustaka CTA',path:'/cta-library'},
    {icon:'pricetags-outline',label:'Set hashtag',path:'/hashtag-sets'},
  ]},
  { label: 'Kolaborasi', items: [
    {icon:'shield-checkmark-outline',label:'Persetujuan',path:'/approvals'},
    {icon:'albums-outline',label:'Progres produksi',path:'/kanban'},
    {icon:'people-outline',label:'Tim',path:'/team'},
    {icon:'link-outline',label:'Tautan klien',path:'/client-links',adminOnly:true},
  ]},
  { label: 'Laporan & pengaturan', items: [
    {icon:'grid-outline',label:'Dashboard',path:'/dashboard'},
    {icon:'bar-chart-outline',label:'Performa konten',path:'/performance-tracker'},
    {icon:'speedometer-outline',label:'KPI',path:'/kpi'},
    {icon:'notifications-outline',label:'Pengingat',path:'/reminders'},
    {icon:'settings-outline',label:'Pengaturan',path:'/settings',adminOnly:true},
  ]},
]

function Badge({ text }) {
  return (
    <span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
      {text}
    </span>
  )
}

// Sidebar hanya dipakai di layar lebar. Di ponsel navigasinya diambil alih
// oleh tab bar bawah, jadi tidak ada lagi mode laci di sini.
export default function Sidebar() {
  const { user, signOut, isMock } = useAuth()
  const { isAdmin, role } = useTenantContext()
  const { isOperator } = useOperator()
  const navigate = useNavigate()
  const location = useLocation()
  const [modalBuat, setModalBuat] = useState(false)

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="sidebar-scroll app-sidebar">
      <div className="sidebar-brand"><BrandLogo/><span className="sidebar-brand-caption">Ruang gerak tim kreatif</span></div>
      <TenantSwitcher />

      {/* Satu keputusan besar, satu tombol besar — ala Plann. Membuka
          pop-in pemilih platform dulu (CreatePostModal), baru melempar ke
          Composer, supaya orang tidak mendarat di halaman kosong. */}
      <button type="button" className="btn btn-primary btn-block sidebar-tombol-buat" onClick={() => setModalBuat(true)}>
        <Icon name="add-circle-outline" size={16} />
        Buat konten
      </button>

      <CreatePostModal open={modalBuat} onClose={() => setModalBuat(false)} />

      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.adminOnly || isAdmin)
        const compact = !['Utama', 'Alat kreatif'].includes(group.label)
        const Group = compact ? 'details' : 'div'
        if (items.length === 0) return null

        return (
          <Group key={group.label + location.pathname} className="sidebar-group" {...(compact ? {open: items.some(i => i.path === location.pathname)} : {})}>
            {compact ? <summary className="sidebar-group-toggle">{group.label}<Icon name="chevron-down-outline" size={14} /></summary> : <p className="sidebar-group-label">{group.label}</p>}
            {items.map((item) =>
              item.path ? (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === '/dashboard'}
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
          </Group>
        )
      })}

      {/* Dashboard admin platform. Bukan bagian dari NAV_GROUPS karena ini
          bukan menu workspace — ia milik pemilik aplikasi, dan hanya
          terlihat oleh yang terdaftar di tabel platform_admins. */}
      {isOperator && (
        <div>
          <p className="sidebar-group-label">PLATFORM</p>
          <NavLink to="/operator" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Icon name="shield-outline" size={16} />
            <span>Konsol operator</span>
          </NavLink>
        </div>
      )}

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
