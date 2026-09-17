import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTenantContext } from '../context/TenantContext'

// Dua lapis penjagaan sebelum halaman aplikasi boleh tampil:
//
// 1. Belum login          → lempar ke /login, sambil menyimpan tujuan awal di
//                           query ?next= supaya bisa dikembalikan setelah masuk
//                           (penting untuk alur link undangan).
// 2. Login tapi belum punya workspace → lempar ke wizard /onboarding. Tanpa ini
//    user baru akan mendarat di dashboard kosong yang semua query-nya gagal
//    karena tidak ada tenant_id.
export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { loading: tenantLoading, needsOnboarding } = useTenantContext()
  const location = useLocation()

  if (authLoading) return <Loading />

  if (!user) {
    const next = location.pathname + location.search
    const suffix = next && next !== '/' ? `?next=${encodeURIComponent(next)}` : ''
    return <Navigate to={`/login${suffix}`} replace />
  }

  if (tenantLoading) return <Loading />
  if (needsOnboarding) return <Navigate to="/onboarding" replace />

  return children
}

function Loading() {
  return <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat...</p>
}
