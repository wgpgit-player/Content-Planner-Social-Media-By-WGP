import { NavLink } from 'react-router-dom'
import { NAV_GROUPS } from './Sidebar'
import { useTenantContext } from '../context/TenantContext'
import { TenantAvatar } from './TenantSwitcher'
import Icon from './Icon'

// Bilah navigasi atas — hanya tampil di layar lebar (lihat index.css).
//
// Diadaptasi dari pola yang dipakai Plann: tujuan yang paling sering dibuka
// (Dashboard, Susun konten, Content calendar, Grid pratinjau, Persetujuan)
// tampil sebagai tab horizontal di atas, terlihat sepanjang waktu tanpa
// perlu melirik ke sidebar. Sidebar kiri (Sidebar.jsx) jadi murni kumpulan
// alat pendukung — Konten, Analitik, Workspace — bukan daftar dua kali
// untuk halaman yang sama.
//
// Sengaja TIDAK meniru ilustrasi atau aset visual Plann. Yang diambil cuma
// susunan dan pola interaksinya; warna dan bentuknya tetap gaya plannersm.co
// sendiri (--accent, sudut membulat khas komponen lain di aplikasi ini).
export default function Topbar() {
  const { tenant } = useTenantContext()

  // Item bilah atas diambil dari NAV_GROUPS supaya satu sumber data saja —
  // menambah `diBilahAtas: true` pada satu item di Sidebar.jsx otomatis
  // memunculkannya di sini juga, tanpa perlu menulis daftar kedua.
  const itemBilahAtas = NAV_GROUPS
    .flatMap((g) => g.items)
    .filter((i) => i.diBilahAtas && i.path)

  return (
    <header className="topbar-desktop">
      <div className="topbar-brand">
        <TenantAvatar tenant={tenant} size={26} />
        <span className="topbar-brand-nama">{tenant?.name ?? 'plannersm.co'}</span>
      </div>

      <nav className="topbar-nav" aria-label="Navigasi utama">
        {itemBilahAtas.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `topbar-tab${isActive ? ' aktif' : ''}`}
          >
            <Icon name={item.icon} size={15} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="topbar-kanan">
        <NavLink to="/reminders" className="topbar-ikon-bulat" title="Pengingat">
          <Icon name="notifications-outline" size={17} />
        </NavLink>
      </div>
    </header>
  )
}
