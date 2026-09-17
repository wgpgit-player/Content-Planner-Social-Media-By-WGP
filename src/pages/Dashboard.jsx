import { useTenantContext } from '../context/TenantContext'
import DashboardAdmin from './DashboardAdmin.jsx'
import DashboardStaff from './DashboardStaff.jsx'

// Pemilih dashboard.
//
// Manager dan pengeksekusi membuka aplikasi dengan pertanyaan yang berbeda,
// jadi keduanya mendapat halaman yang berbeda pula:
//
//   admin  bertindak sebagai manager. Ia perlu melihat kondisi tim: siapa
//          memegang berapa, apa yang belum ada pemiliknya, apa yang tersendat.
//   staff  mengerjakan konten. Ia perlu melihat bagiannya sendiri, diurutkan
//          menurut kemendesakan, tanpa statistik tim yang tidak ia gunakan.
//
// Pemisahan ini murni soal tampilan. Batas kewenangan yang sesungguhnya ada di
// database lewat RLS dan trigger penugasan, bukan di sini. Halaman yang
// disembunyikan bukan pengaman.
export default function Dashboard() {
  const { isAdmin, loading } = useTenantContext()

  if (loading) {
    return <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat...</p>
  }

  return isAdmin ? <DashboardAdmin /> : <DashboardStaff />
}
