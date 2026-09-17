import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'

// Penjaga halaman aplikasi. Tiga keadaan yang dibedakan, dan urutannya penting:
//
// 1. Belum login             → ke /login, tujuan awal disimpan di ?next=
// 2. Data belum jelas        → tunggu, jangan menyimpulkan apa pun
// 3. Sudah jelas tidak punya ruang kerja → ke wizard
//
// Langkah 2 yang dulu tidak ada, dan akibatnya mahal: aplikasi menyimpulkan
// "belum punya ruang kerja" pada saat data memang belum diambil, lalu melempar
// orang ke wizard yang kemudian membuat ruang kerja duplikat setiap login.
//
// Kegagalan mengambil data juga tidak lagi diperlakukan sebagai "tidak punya
// ruang kerja". Kalau jaringan bermasalah, yang tampil adalah pesan galat
// dengan tombol coba lagi, bukan formulir pembuatan ruang kerja baru.
export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { loading: tenantLoading, needsOnboarding, error, reloadTenants } = useTenantContext()
  const location = useLocation()

  if (authLoading) return <Memuat />

  if (!user) {
    const tujuan = location.pathname + location.search
    const akhiran = tujuan && tujuan !== '/' ? `?next=${encodeURIComponent(tujuan)}` : ''
    return <Navigate to={`/login${akhiran}`} replace />
  }

  if (error) return <GagalMemuat pesan={error.message} onCobaLagi={reloadTenants} />
  if (tenantLoading) return <Memuat />
  if (needsOnboarding) return <Navigate to="/onboarding" replace />

  return children
}

function Memuat() {
  return <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat...</p>
}

function GagalMemuat({ pesan, onCobaLagi }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Gagal memuat ruang kerja</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 16 }}>{pesan}</p>
        <button type="button" className="btn btn-primary" onClick={onCobaLagi}>Coba lagi</button>
      </div>
    </div>
  )
}
