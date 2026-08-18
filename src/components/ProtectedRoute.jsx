import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <p style={{ padding: 24, fontSize: 13, color: 'var(--text-muted)' }}>Memuat...</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}
