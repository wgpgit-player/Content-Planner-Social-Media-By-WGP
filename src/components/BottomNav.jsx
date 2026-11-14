import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import Sheet from './Sheet'
import { NAV_GROUPS } from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { TenantAvatar } from './TenantSwitcher'
import { useOperator } from '../lib/useOperator'

// Navigasi bawah untuk mobile.
//
// KENAPA LACI HAMBURGER DIGANTI
//
// Laci butuh dua ketukan untuk berpindah halaman: buka laci, lalu pilih menu.
// Dan selama lacinya tertutup, tidak ada satu pun petunjuk di layar tentang
// bagian apa saja yang ada di aplikasi ini. Tab bar bawah menyelesaikan
// keduanya: satu ketukan, dan tujuan utamanya selalu terlihat. Posisinya di
// bawah juga yang paling mudah dijangkau jempol pada ponsel berlayar besar.
//
// Lima slot adalah batas yang masuk akal untuk lebar ponsel — lebih dari itu
// labelnya mulai terpotong. Aplikasi ini punya empat belas halaman, jadi
// empat yang paling sering dipakai diberi slot sendiri, dan sisanya masuk ke
// sheet "Lainnya". Pembagiannya mengikuti kelompok "Utama" di sidebar
// ditambah Bank ide, yang jadi pintu masuk paling sering saat sedang
// merencanakan konten.
//
// Ikon versi terisi dipakai saat aktif dan versi garis saat tidak. Ini satu-
// satunya penanda yang tetap terbaca pada ikon sekecil 23 piksel, dan
// kebetulan juga kebiasaan yang sudah dikenal orang dari aplikasi lain.

const TAB_UTAMA = [
  { path: '/home', label: 'Home', ikon: 'home-outline', ikonAktif: 'home' },
  { path: '/worksheet', label: 'Tugas', ikon: 'reader-outline', ikonAktif: 'reader' },
  { path: '/content-calendar', label: 'Kalender', ikon: 'calendar-outline', ikonAktif: 'calendar' },
  { path: '/kanban', label: 'Tracker', ikon: 'albums-outline', ikonAktif: 'albums' },
]

const PATH_UTAMA = TAB_UTAMA.map((t) => t.path)

export default function BottomNav() {
  const { isOperator } = useOperator()
  const [sheetTerbuka, setSheetTerbuka] = useState(false)
  const { user, signOut, isMock } = useAuth()
  const { isAdmin, role, tenant, tenants, switchTenant } = useTenantContext()
  const lokasi = useLocation()
  const navigate = useNavigate()

  // Sheet menutup sendiri setiap kali halaman berganti. Tanpa ini, sheet tetap
  // menutupi halaman yang baru saja dipilih dari dalamnya.
  useEffect(() => { setSheetTerbuka(false) }, [lokasi.pathname])

  async function keluar() {
    setSheetTerbuka(false)
    await signOut()
    navigate('/login')
  }

  // Halaman yang tidak punya slot sendiri. Dihitung dari NAV_GROUPS supaya
  // menu baru di sidebar otomatis muncul di sini juga.
  const kelompokLain = NAV_GROUPS
    .map((g) => ({
      label: g.label,
      items: g.items.filter((i) => !PATH_UTAMA.includes(i.path) && (!i.adminOnly || isAdmin)),
    }))
    .filter((g) => g.items.length > 0)

  // Tab "Lainnya" ikut menyala kalau halaman yang sedang dibuka ada di
  // dalamnya. Tanpa ini, membuka halaman Tim membuat seluruh tab bar terlihat
  // mati dan pengguna kehilangan petunjuk posisinya.
  const diHalamanLain = !PATH_UTAMA.includes(lokasi.pathname) && lokasi.pathname !== '/'

  return (
    <>
      <nav className="tabbar" aria-label="Navigasi utama">
        {TAB_UTAMA.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/dashboard'}
            className={({ isActive }) => `tabbar-item${isActive ? ' aktif' : ''}`}
          >
            {({ isActive }) => (
              <>
                <Icon name={isActive ? tab.ikonAktif : tab.ikon} size={23} />
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <button
          type="button"
          className={`tabbar-item${diHalamanLain ? ' aktif' : ''}`}
          onClick={() => setSheetTerbuka(true)}
          aria-expanded={sheetTerbuka}
        >
          <Icon
            name={diHalamanLain ? 'ellipsis-horizontal-circle' : 'ellipsis-horizontal-circle-outline'}
            size={23}
          />
          <span>Lainnya</span>
        </button>
      </nav>

      {sheetTerbuka && (
        <Sheet open onClose={() => setSheetTerbuka(false)} lebar={420}>
          <div className="sheet-tenant">
            <TenantAvatar tenant={tenant} size={38} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="sheet-tenant-nama">{tenant?.name ?? 'plannersm.co'}</p>
              <p className="sheet-tenant-peran">
                {isMock ? 'Mode preview' : role === 'admin' ? 'Admin' : role === 'staff' ? 'Staff' : ''}
                {user?.email ? ` · ${user.email}` : ''}
              </p>
            </div>
          </div>

          {/* Pemilih Workspace Mobile (Beralih Akun Kerja & Akun Pribadi) */}
          <div className="sheet-grup" style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p className="sheet-grup-label" style={{ margin: 0 }}>GANTI WORKSPACE ({tenants.length})</p>
              <button
                type="button"
                onClick={() => {
                  setSheetTerbuka(false)
                  navigate('/onboarding?new=1')
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 11,
                  fontWeight: 650,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Icon name="add-outline" size={13} /> + Workspace Baru
              </button>
            </div>

            <div className="sheet-daftar">
              {tenants.map((t) => {
                const aktif = t.id === tenant?.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      switchTenant(t.id)
                      setSheetTerbuka(false)
                      navigate('/dashboard')
                    }}
                    className={`sheet-baris${aktif ? ' aktif' : ''}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: aktif ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                      background: aktif ? 'var(--accent-bg, rgba(99, 102, 241, 0.08))' : 'var(--surface-1)',
                      borderRadius: 10,
                      padding: '8px 10px',
                      marginBottom: 6,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <TenantAvatar tenant={t} size={26} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: aktif ? 650 : 500, margin: 0, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.name}
                      </p>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                        {t.role === 'admin' ? 'Akun Admin' : t.role === 'staff' ? 'Akun Staff' : 'Member'}
                      </span>
                    </div>
                    {aktif ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Icon name="checkmark-circle" size={16} /> Aktif
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Icon name="swap-horizontal-outline" size={13} /> Pilih
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {kelompokLain.map((g) => (
            <div key={g.label} className="sheet-grup">
              <p className="sheet-grup-label">{g.label.toUpperCase()}</p>
              <div className="sheet-daftar">
                {g.items.map((item) =>
                  item.path ? (
                    <NavLink
                      key={item.label}
                      to={item.path}
                      className={({ isActive }) => `sheet-baris${isActive ? ' aktif' : ''}`}
                      onClick={() => setSheetTerbuka(false)}
                    >
                      <span className="sheet-baris-ikon">
                        <Icon name={item.icon} size={17} />
                      </span>
                      <span className="sheet-baris-label">{item.label}</span>
                      {item.badge && <span className="sheet-baris-badge">{item.badge}</span>}
                      <Icon name="chevron-forward" size={15} color="var(--text-muted)" />
                    </NavLink>
                  ) : (
                    <span key={item.label} className="sheet-baris nonaktif">
                      <span className="sheet-baris-ikon">
                        <Icon name={item.icon} size={17} />
                      </span>
                      <span className="sheet-baris-label">{item.label}</span>
                      {item.badge && <span className="sheet-baris-badge">{item.badge}</span>}
                    </span>
                  )
                )}
              </div>
            </div>
          ))}

          {isOperator && <NavLink to="/operator" className="sheet-baris" onClick={() => setSheetTerbuka(false)}><Icon name="shield-checkmark-outline" size={18}/><span>Dashboard admin</span></NavLink>}
          {user && (
            <button type="button" onClick={keluar} className="sheet-keluar">
              <Icon name="log-out-outline" size={17} />
              <span>Keluar</span>
            </button>
          )}
        </Sheet>
      )}
    </>
  )
}
