import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Gaya split-screen (ilustrasi + form card) mengikuti referensi Login
// Interface yang sudah dilihat sebelumnya di folder Referensi Design UI UX,
// disesuaikan ke palet ungu-pink yang dipakai di seluruh aplikasi ini
// (bukan biru seperti referensi aslinya).
export default function Login() {
  const { user, signIn, isMock } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Gagal masuk. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: 800, width: '100%', borderRadius: 20, overflow: 'hidden' }}>

        <div style={{
          background: 'linear-gradient(150deg,#7C6FF0,#B06FE0 55%,#EC5FA0)', padding: 32,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,0.25)' }} />
            <span style={{ fontWeight: 500, fontSize: 14 }}>Content Planner</span>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 500, margin: '0 0 8px', lineHeight: 1.3 }}>
              Satu tempat buat rencana, produksi, dan pantau performa konten ZISWAF CTARSA.
            </p>
            <p style={{ fontSize: 12.5, opacity: 0.85, margin: 0 }}>
              Kanban, content calendar, bank ide, dan analytics — semua nyambung jadi satu alur kerja.
            </p>
          </div>
          <p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>© 2026 ZISWAF CTARSA</p>
        </div>

        <div style={{ background: '#fff', padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontWeight: 500, fontSize: 17, margin: '0 0 4px' }}>Masuk</p>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 20px' }}>
            {isMock ? 'Mode preview — belum connect Supabase, sesi disimpan lokal di browser.' : 'Masuk pakai akun tim kamu.'}
          </p>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@ziswafctarsa.org"
              required
              style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '9px 10px', fontSize: 13, marginBottom: 12, boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              style={{ width: '100%', border: '0.5px solid var(--border)', borderRadius: 8, padding: '9px 10px', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }}
            />

            {error && (
              <p style={{ fontSize: 12, color: '#A32D2D', background: '#FCEBEB', padding: '8px 10px', borderRadius: 8, margin: '0 0 12px' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500,
                cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
