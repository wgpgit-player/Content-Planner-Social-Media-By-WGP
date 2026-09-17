import { useState } from 'react'
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import Icon from '../components/Icon'

// Pendaftaran mandiri. Ini yang mengubah aplikasi dari "dipasang untuk satu
// organisasi" jadi produk yang bisa dipakai siapa saja: user bikin akun
// sendiri, lalu langsung diarahkan ke wizard onboarding untuk membuat
// workspace pertamanya.

export default function Signup() {
  const { user, signUp, isMock } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentConfirmation, setSentConfirmation] = useState(false)

  if (user && !sentConfirmation) return <Navigate to={next || '/onboarding'} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    setLoading(true)
    try {
      const { needsEmailConfirmation } = await signUp(email, password)
      if (needsEmailConfirmation) {
        setSentConfirmation(true)
      } else {
        navigate(next || '/onboarding')
      }
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  if (sentConfirmation) {
    return (
      <AuthLayout title="Cek email kamu" subtitle="Satu langkah lagi sebelum bisa masuk.">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 42, height: 42, borderRadius: 12, background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="mail-outline" size={21} color="var(--accent)" />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Kami sudah mengirim link konfirmasi ke <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Buka link itu, lalu masuk untuk membuat workspace pertama kamu.
          </p>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textDecoration: 'none' }}>
            Ke halaman masuk
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Buat akun"
      subtitle={isMock ? 'Mode preview. Belum tersambung ke server, sesi hanya disimpan di browser ini.' : 'Gratis, dan ruang kerja pertama kamu jadi dalam satu menit.'}
      footer={
        <>
          Sudah punya akun?{' '}
          <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@perusahaan.com"
          autoComplete="email"
          required
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          required
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="signup-confirm">Ulangi password</label>
        <input
          id="signup-confirm"
          className="input"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ketik ulang password"
          autoComplete="new-password"
          required
          style={{ marginBottom: 18 }}
        />

        {error && <p className="alert alert-error" style={{ marginBottom: 14 }}>{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Membuat akun...' : 'Buat akun'}
        </button>
      </form>
    </AuthLayout>
  )
}
