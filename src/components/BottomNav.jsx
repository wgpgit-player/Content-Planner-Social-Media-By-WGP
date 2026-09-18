import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import Sheet from './Sheet'
import { NAV_GROUPS } from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'
import { TenantAvatar } from './TenantSwitcher'

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
  { path: '/dashboard', label: 'Beranda', ikon: 'grid-outline', ikonAktif: 'grid' },
  { path: '/kanban', label: 'Tracker', ikon: 'albums-outline', ikonAktif: 'albums' },
  { path: '/content-calendar', label: 'Kalender', ikon: 'calendar-outline', ikonAktif: 'calendar' },
  { path: '/content-bank', label: 'Bank ide', ikon: 'bulb-outline', ikonAktif: 'bulb' },
]

const PATH_UTAMA = TAB_UTAMA.map((t) => t.path)

export default function BottomNav() {
  const [sheetTerbuka, setSheetTerbuka] = useState(false)
  const { user, signOut, isMock } = useAuth()
  const { isAdmin, role, tenant } = useTenantContext()
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
            <div style={{ minWidth: 0 }}>
              <p className="sheet-tenant-nama">{tenant?.name ?? 'plannersm.co'}</p>
              <p className="sheet-tenant-peran">
                {isMock ? 'Mode preview' : role === 'admin' ? 'Admin' : role === 'staff' ? 'Staff' : ''}
                {user?.email ? ` · ${user.email}` : ''}
              </p>
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
