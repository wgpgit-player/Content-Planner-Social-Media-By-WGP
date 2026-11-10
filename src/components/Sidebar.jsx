import BrandLogo from './BrandLogo'
import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { supabase } from '../lib/supabaseClient'
import TenantSwitcher from './TenantSwitcher'
import CreatePostModal from './CreatePostModal'
import Icon from './Icon'
import { useOperator } from '../lib/useOperator'

// Navigasi 3 Zona Ringkas: Ruang Kerja Harian, Studio Kreatif, dan Manajemen.
export const NAV_GROUPS = [
  { label: 'Ruang kerja harian', items: [
    { icon: 'home-outline', label: 'Home', path: '/home' },
    { icon: 'reader-outline', label: 'Lembar kerja tugas', path: '/worksheet', id: 'worksheet' },
    { icon: 'calendar-outline', label: 'Kalender konten', path: '/content-calendar' },
    { icon: 'albums-outline', label: 'Progres produksi', path: '/kanban' },
    { icon: 'shield-checkmark-outline', label: 'Persetujuan', path: '/approvals', id: 'approvals' },
  ]},
  { label: 'Studio kreatif', items: [
    { icon: 'create-outline', label: 'Susun brief & konten', path: '/compose' },
    { icon: 'bulb-outline', label: 'Bank ide', path: '/content-bank' },
    { icon: 'chatbubble-ellipses-outline', label: 'Pustaka copywriting', path: '/copywriting' },
    { icon: 'images-outline', label: 'Koleksi media', path: '/media' },
    { icon: 'apps-outline', label: 'Pratinjau feed', path: '/grid' },
  ]},
  { label: 'Manajemen & tim', items: [
    { icon: 'grid-outline', label: 'Dashboard', path: '/dashboard' },
    { icon: 'bar-chart-outline', label: 'Performa konten', path: '/performance-tracker' },
    { icon: 'people-outline', label: 'Tim', path: '/team' },
    { icon: 'link-outline', label: 'Tautan klien', path: '/client-links', adminOnly: true },
    { icon: 'settings-outline', label: 'Pengaturan', path: '/settings', adminOnly: true },
  ]},
]

function Badge({ text, color = 'var(--accent)', bg = 'var(--accent-bg)' }) {
  return (
    <span
      className="badge"
      style={{
        background: bg,
        color: color,
        marginLeft: 'auto',
        fontWeight: 700,
        fontSize: 10.5,
        padding: '2px 7px',
        borderRadius: 99,
      }}
    >
      {text}
    </span>
  )
}

// Sidebar hanya dipakai di layar lebar. Di ponsel navigasinya diambil alih
// oleh tab bar bawah, jadi tidak ada lagi mode laci di sini.
export default function Sidebar() {
  const { user, signOut, isMock } = useAuth()
  const { tenantId, isAdmin, role } = useTenantContext()
  const { isOperator } = useOperator()
  const navigate = useNavigate()
  const location = useLocation()
  const [modalBuat, setModalBuat] = useState(false)
  const [counts, setCounts] = useState({ tugasSaya: 0, perluReview: 0 })

  // Ambil data notifikasi real-time untuk badge sidebar
  useEffect(() => {
    if (!supabase || !tenantId || !user) return
    let batal = false

    async function muatBadge() {
      try {
        // 1. Tugas aktif milik user yang sedang login
        const { count: tugasCount } = await supabase
          .from('content_items')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('assignee_id', user.id)
          .in('status', ['idea', 'draft', 'review'])

        // 2. Konten yang sedang menunggu review persetujuan
        const { count: reviewCount } = await supabase
          .from('content_items')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'review')

        if (!batal) {
          setCounts({
            tugasSaya: tugasCount ?? 0,
            perluReview: reviewCount ?? 0,
          })
        }
      } catch (err) {
        // Abaikan jika tabel belum siap
      }
    }

    muatBadge()
    const timer = setInterval(muatBadge, 30000)
    return () => {
      batal = true
      clearInterval(timer)
    }
  }, [tenantId, user])

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="sidebar-scroll app-sidebar">
      <div className="sidebar-brand"><BrandLogo/><span className="sidebar-brand-caption">Ruang gerak tim kreatif</span></div>
      <TenantSwitcher />

      {/* Tombol Utama: Membuka Modal Pembuatan Brief & Mandat Jobdesk */}
      <button
        type="button"
        className="btn btn-primary btn-block sidebar-tombol-buat"
        onClick={() => setModalBuat(true)}
        title="Buat mandat brief & jobdesk untuk tim konten"
        style={{ fontWeight: 700, gap: 7 }}
      >
        <Icon name="document-text-outline" size={16} />
        Buat Brief / Jobdesk
      </button>

      <CreatePostModal open={modalBuat} onClose={() => setModalBuat(false)} />

      {NAV_GROUPS.map((group) => {
        const items = group.items
          .filter((i) => !i.adminOnly || isAdmin)
          .map((item) => {
            let badgeText = item.badge || null
            let badgeColor = 'var(--accent)'
            let badgeBg = 'var(--accent-bg)'

            if (item.id === 'worksheet' && counts.tugasSaya > 0) {
              badgeText = String(counts.tugasSaya)
              badgeColor = 'var(--accent, #5935d5)'
              badgeBg = 'var(--accent-bg, #f1eaff)'
            } else if (item.id === 'approvals' && counts.perluReview > 0) {
              badgeText = String(counts.perluReview)
              badgeColor = '#b45309'
              badgeBg = '#fef3c7'
            }

            return { ...item, badgeText, badgeColor, badgeBg }
          })

        const compact = group.label === 'Manajemen & tim'
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
                  {item.badgeText && <Badge text={item.badgeText} color={item.badgeColor} bg={item.badgeBg} />}
                </NavLink>
              ) : (
                <span key={item.label} className="sidebar-item" style={{ opacity: 0.45, cursor: 'default' }}>
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                  {item.badgeText && <Badge text={item.badgeText} color={item.badgeColor} bg={item.badgeBg} />}
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
