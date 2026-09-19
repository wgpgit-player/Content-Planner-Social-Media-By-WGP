import { useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomNav from './BottomNav'
import Icon from './Icon'
import { useTenantContext } from '../context/TenantContext'
import { TenantAvatar } from './TenantSwitcher'

// Kerangka semua halaman yang sudah login.
//
// DUA BENTUK, SATU KOMPONEN
//
// Di layar lebar ini tetap aplikasi web: sidebar berdiri sebagai kolom di
// sebelah kiri, konten di sebelahnya. Tidak ada yang berubah di sana.
//
// Di ponsel bentuknya berbeda sama sekali. Sidebar disembunyikan dan
// digantikan tab bar di bawah layar (components/BottomNav.jsx), bilah atas
// hanya membawa nama ruang kerja, dan judul halaman tampil besar di bawahnya
// seperti judul besar di aplikasi iOS. Keputusan bentuk itu seluruhnya ada di
// index.css lewat media query, bukan di JavaScript, supaya tidak ada
// kemungkinan dua versi tampilan ini berbeda perilaku.
//
// Laci hamburger yang dulu ada di sini sudah dilepas. Alasannya ada di
// BottomNav.jsx.
//
// MODE `bare`
//
// Beberapa halaman — Composer adalah yang pertama — perlu jadi ruang kerja
// yang fokus penuh: tanpa sidebar, tanpa daftar menu di kiri, supaya layar
// yang tersedia dipakai untuk menyusun dan melihat pratinjau, bukan
// navigasi. Plann melakukan ini juga di halaman Create-nya. `bare` menukar
// sidebar+topbar dengan satu bilah tipis berisi tombol kembali dan nama
// ruang kerja saja — bukan halaman terpisah, supaya AppShell tetap satu-
// satunya kerangka dan tidak ada CSS yang harus diduplikasi.
export default function AppShell({ title, description, actions, children, maxWidth = 860, bare = false }) {
  const { tenant } = useTenantContext()
  const navigate = useNavigate()

  if (bare) {
    return (
      <div className="app-shell-bare">
        <div className="bare-topbar">
          <button type="button" className="bare-kembali" onClick={() => navigate(-1)} aria-label="Kembali">
            <Icon name="chevron-back-outline" size={18} />
          </button>
          <div className="bare-judul">
            {title && <p className="bare-judul-teks">{title}</p>}
            {description && <p className="bare-judul-sub">{description}</p>}
          </div>
          <div className="bare-aksi">{actions}</div>
        </div>
        <div className="bare-main">{children}</div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Hanya tampil di layar sempit. Di ponsel, nama ruang kerja tidak
          terlihat di mana pun lagi karena sidebar disembunyikan, dan tanpa
          penanda itu orang yang mengelola beberapa klien tidak tahu sedang
          berada di ruang kerja siapa. */}
      <div className="app-topbar">
        <TenantAvatar tenant={tenant} size={26} />
        <span className="app-topbar-nama">{tenant?.name ?? 'plannersm.co'}</span>
      </div>

      {/* Hanya tampil di layar lebar — lihat komentar di Topbar.jsx. Di
          ponsel bilah atas yang dipakai tetap yang di atas (.app-topbar). */}
      <div className="topbar-desktop-wrap">
        <Topbar />
      </div>

      <div className="app-sidebar-wrap">
        <Sidebar />
      </div>

      <div className="app-main" style={{ maxWidth, width: '100%' }}>
        {(title || actions) && (
          <div className="app-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <h1 className="page-title">{title}</h1>}
              {description && <p className="page-subtitle" style={{ marginTop: 3 }}>{description}</p>}
            </div>
            {actions}
          </div>
        )}
        {children}
      </div>

      <BottomNav />
    </div>
  )
}
